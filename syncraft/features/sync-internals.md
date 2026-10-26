# 同步机制详解

这一页说明 Syncraft **版本管理**和**文件同步**的完整实现：数据来源、使用位置、客户端比对与下载、失败处理等。如果你不想了解复杂实现，[文件同步](./file-sync) 与 [配置文件](../quick-start/config-file) 就足够了。

> 如果你理解这一节，可能会有助于你的错误排查（我们也无法预知 Syncraft 会出什么乱子）。

## 1. 术语

| 术语 | 含义 |
|------|------|
| **version** | `syncraft.toml` 里的 `[info]`：显示名、稳定 ID、Minecraft 版本、加载器及版本 |
| **manifest** | 服务端生成的一份 JSON，描述"客户端应该有哪些文件、每个文件的哈希与同步模式" |
| **snapshot** | 一份被持久化的 manifest，用 `version_hash` 命名 |
| **`version_hash`** | manifest 内容的哈希，唯一标识"这一组文件" |
| **`commit`** | 生成该快照时的 git 提交，用于更新日志 |
| **状态文件** | 客户端上的 `.syncraft-state.json`，记录上次同步管理了哪些文件 |

::: info `version_hash` 不是 git 提交码（你不需要管这个）
manifest 会根据自己的状态生成一个 hash 。git 提交码无法与 manifest 一一对应。
:::

## 2. 数据模型

### 2.1 Manifest

```jsonc
{
  "schema": 3,                   // 协议版本
  "version_hash": "9f1c…",       // 内容哈希（64 位十六进制）
  "commit": "3a7d…",             // 生成时的 HEAD（可能为空）
  "version": {
    "name": "My Server",         // 显示名
    "id": "my-server",           // 稳定 ID（文件命名用）
    "vanilla_version": "1.21.1",
    "loader": { "Fabric": { "loader_version": "0.16.10" } }
  },
  "download_concurrency": 4,       // 建议的客户端下载并发（可选）
  "signature": {                    // 可选：Ed25519 签名
    "algorithm": "ed25519",
    "key": "a1b2…",                // hex，32 字节公钥
    "value": "9f0c…"               // hex，64 字节签名
  },
  "files": {                      // 客户端路径 → 文件状态
    "mods/create-1.21.1-6.0.10.jar": {
      "state": { "size": 1472593, "hash": "ab…" },  // blake3，十六进制
      "mode": "strict"
    },
    "mods/server-only.jar": { "state": null, "mode": "forbidden" }
  }
}
```

- `files` 是**有序映射**（BTreeMap），因此内容哈希稳定可复现。
- `state = null` 只出现在 `forbidden` 条目：它表示"这个路径不该存在"，不需要服务端有对应文件。
- `schema` 只增不减。客户端遇到比自己新的 `schema` 会拒绝并提示升级，避免悄悄按旧规则同步。

### 2.2 同步模式

| 模式（配置值） | 文件缺失 | 内容不一致 | 目录中的多余文件 | 典型用途 |
|---|---|---|---|---|
| `ifmissing` | 下载 | 保留本地 | 保留 | 服务器列表、默认配置 |
| `minimal` | 下载 | 覆盖 | 保留 | `mods` 等允许玩家自行添加（客户端 mod）的目录 |
| `strict` | 下载 | 覆盖 | **删除** | 必须完全一致的目录 |


有一种程序内部使用的同步模式：`forbidden`，用于**确保客户端没有某个文件**。如果你有这个需求，也可以手动配置：

```toml
# 这些是"客户端路径"，只要求相对路径，不要求服务端存在同名文件
forbid = [
  "mods/old-client-only-mod.jar",
  "config/bad-option.toml",
]
```

### 2.3 文件状态

代码中用 `FileState` 描述一个文件的状态，包含 `size` 与 `hash`（blake3）：

- 客户端先比对 `size`，不同则直接判定需要下载，避免每次启动都读全量文件；
- 当 `size` 相同，计算并比对哈希；
- 服务端同样用 `(路径, size, mtime)` 做哈希缓存，见 [3.2](#snapshot)。

## 3. 服务端

### 3.1 从配置到清单

```
syncraft.toml
   │  Config::load
   ▼
SyncObject{source,target,mode,is_mod_dir} + forbid[]
   │  paths.resolve()  ← 相对路径一律相对"服务器根目录"，与进程 cwd 无关
   ▼
文件列表（跳过符号链接）
   │  哈希缓存命中？（path+size+mtime）
   ▼
FileState(size, blake3)
   │  is_mod_dir → 按内容哈希查 mod 过滤缓存
   ▼
files: BTreeMap<客户端路径, SyncFile>
   │
   ├─ Manifest::content_hash(schema, version, files) → version_hash
   ├─ repository.latest_hash()                        → commit
   └─ 写入 syncraft/data/manifests/<version_hash>.json
```

- **路径解析**：配置文件的 `[sync]` 中，`source` 相对于服务器根目录；`target` 是客户端路径，保持原样。两者都不允许 `..`和绝对路径（`forbid` 会被校验，非法值只记录警告并忽略）。
- **哈希缓存**：`syncraft/data/hash_cache.json`，键为绝对路径，值为 `{size, modified_ns, hash}`。只 stat 不读文件，daemon 重启不重新哈希所有文件。
- **mod 过滤缓存**：`syncraft/data/mod_type_cache.json`，键是 **jar 的 blake3**，值为 `sync` / `ignore` / `unknown`。

### 3.2 快照 {#snapshot}

每次 manifest 重建（启动、配置热加载、`git publish`）会进行以下操作：

1. 生成 `version_hash`；
2. 把完整 manifest 写入 `syncraft/data/manifests/<version_hash>.json`；
3. 更新 `index.json`（hash / commit / 创建时间 / 文件数），保留数量由 `[server].snapshot_retention` 控制（默认 **32**，`0` 表示不清理）。

这是为了实现下面这些能力：

- `GET /manifest?version=<hash>` 可以取回历史 manifest；
- `GET /versions` 可列出所有 snapshot ；
- `version_hash` 与文件列表一一对应，可复现、可审计。

snapshot 中只保存 manifest， **不复制具体文件**。要回滚文件内容，仍需 `git checkout <commit> -- .` 后重新 `publish`。

### 3.3 发布流程（`syncraft git publish`）

:::mermaid
sequenceDiagram
    participant Admin as 管理员
    participant Publish as git publish
    participant Mod as Modrinth
    participant Daemon as daemon
    participant Disk as syncraft/data

    Admin->>Publish: 编辑提交信息并确认
    Publish->>Publish: commit（工作区 → HEAD）
    Publish->>Publish: 扫描 is_mod_dir 下的 jar，计算 blake3
    alt 若缓存中没有该内容哈希
        Publish->>Mod: 查询 client_side
        Mod-->>Publish: required / optional / unsupported
        Publish->>Disk: 写入 mod_type_cache.json（键=blake3）
    end
    Publish->>Daemon: IPC update
    Daemon->>Daemon: file_mapping + 快照
    Daemon->>Disk: manifests/<version_hash>.json
    Daemon-->>Publish: OK
    Publish-->>Admin: Published <commit>
:::

### 3.4 HTTP 接口

| 接口 | 说明 |
|---|---|
| `GET /manifest` | 当前清单；带 `ETag: "<version_hash>"`，支持 `If-None-Match` → `304`（客户端会缓存上一份清单并利用这一点） |
| `GET /manifest?version=<hash>` | 指定快照（回滚/固定版本）；未知或非法 hash → `404` |
| `GET /versions` | 快照列表，最新在前 |
| `GET /download/{blake3}` | 文件内容；**发送前会重新校验哈希**，不一致返回 `409` |
| `GET /updateInfo/{commit}` | 该提交之后的更新日志（最多 100 条）；未知提交 → `404` |

`/download` 的 `409` 是"服务端正在发布/文件被改动"的信号，客户端会提示稍后重试。

### 3.5 传输安全：HTTPS 与签名 {#transport-security}

两者都是**可选**的，默认保持最简部署：直接 HTTP。

**HTTPS 监听**

```toml
[network.tls]
cert = "certs/fullchain.pem"
key = "certs/privkey.pem"
```

配置后服务端直接以 TLS 提供服务（证书/私钥读取失败会拒绝启动）。客户端填写的链接也要改成 `https://`；如果 `yggdrasil.base_url` 仍是默认占位值，会自动按 `https` 生成。如果前面已经有 nginx/Traefik 等反向代理终止 TLS，就不要开启，保持 HTTP 即可。

**manifest 签名**

```toml
[network]
sign_manifest = true
```

- 密钥：首次启用时自动生成在 `syncraft/data/manifest_key.hex`（权限 `0600`），启动日志会打印 16 位指纹；
- 签名范围：`manifest_signing_payload(version_hash)`（域分隔 + 内容哈希），因此**任何文件/版本变动都会使签名失效**，而性能/并发等不参与哈希的字段不影响；
- 客户端行为：
  1. 首次收到带签名的 manifest 时，把公钥**固定**到 `.client.json` 的 `server_key`（TOFU）；
  2. 之后每次启动，用固定的公钥验证签名，失败则中止同步；
  3. 服务端公钥变化 → 报错并提示手动清除 `server_key`；

::: warning 局限
- 签名不加密内容，只用于确保 manifest 未被篡改。
- 首次连接时中间人可以同时替换清单、签名和公钥（TOFU 的固有弱点）。如果你能拿到服务端指纹（启动日志），可以提前手动写进 `.client.json` 的 `server_key` 来消除这一窗口。
- 需要保密性与身份认证时，请使用 HTTPS（或反向代理）。

获取指纹：服务端启动日志中的 `Manifest signing enabled (ed25519 key fingerprint …)`，或对 `server_key`（hex 公钥）做 blake3 后取前 16 位。
::: 

## 4. 客户端

### 4.1 启动流程

:::mermaid
flowchart TD
    A[读取 .core.json / .client.json] --> B[GET /manifest]
    B --> C{schema 一致?}
    C -- 否 --> X[提示升级客户端]
    C -- 是 --> D[显示版本信息 / 更新日志]
    D --> E[安装/校验 MC + 加载器]
    E --> F[登录]
    F --> G[plan_sync]
    G --> H[并发下载 + 原子写入]
    H --> I[执行删除 + 清理空目录]
    I --> J[写入 .syncraft-state.json]
    J --> K[启动游戏]
:::

### 4.2 `plan_sync` 的判定规则

**应用同步模式**

对 manifest 中描述的每个文件：

| 同步模式 | 存在时操作 | 不存在时操作 |
|---|---|---|
| `forbidden` | **删除** | - |
| `strict` / `minimal` | 校验 | 下载 |
| `ifmissing` | - | 下载 |

校验时将比对客户端文件和 manifest 描述中的 `size` 和 `hash`（blake3），若不匹配则重新下载。

**减量删除**

将 manifest 与 `.syncraft-state.json` 的缓存比较并删除减量。服务端的删除文件操作会以这种形式同步到客户端。

**`strict` 模式下的多余文件删除**

扫描游戏目录，位于某个 strict 目录（含子目录）下、又不在清单中的文件将被删除。

::: info
Syncraft 在删除文件后会自底向上清理空目录（不会删除游戏根目录）。
:::

### 4.3 下载

- 同一 `hash` 只下载一次，可同时满足多个目标路径（内容去重）。
- 下载并发由服务端 `[server].download_concurrency` 下发，客户端可在 `.client.json` 中覆盖（范围 1-16，默认 4）。
- 先写入 `<文件名>.syncraft-part` 缓存文件，完成后再重命名。
- 下载完成后校验 `hash` ，不匹配立即失败。
- 全部成功后再生成状态文件。

### 4.4 客户端状态文件

`<game_dir>/.syncraft-state.json`：

```json
{
  "version_hash": "9f1c…",
  "managed": ["mods/a.jar", "config/x.toml"],
  "manifest": { "schema": 3, "…": "上一份完整清单（用于条件请求）" }
}
```

- `managed` 记录由 Syncraft 控制的路径；
- `manifest` 缓存项用于发送 `If-None-Match`：没有更新的版本时服务端将返回 `304`，客户端复用本地清单，不重新下载；
- 状态文件缺失或损坏时退化为"只按清单同步"，不会误删。

## 5. 版本管理与回滚

### 5.1 标识

| 字段 | 来源 | 用途 |
|---|---|---|
| `version.id` | 初始化时由显示名生成，此后固定 | 客户端版本文件名 |
| `version.name` | 配置 | 展示、更新公告 |
| `version_hash` | 清单内容 | 判断客户端是否已同步、快照寻址 |
| `commit` | git HEAD | 更新日志 |

客户端缓存文件名为 `{id}-{mc}-{loader}-{loader_version}`（非法字符替换为 `_`）。因此：

- 改显示名不会导致客户端重新下载 MC/加载器；
- 改 MC 或加载器版本会使用新的缓存文件，不会误用旧元数据。

### 5.2 服务端回滚

```bash
git checkout <old-commit> -- .
syncraft git publish    # 产生一份新快照
```

## 6. 失败模式速查

| 现象 | 原因 | 处理 |
|---|---|---|
| `/download` 返回 `409` | 清单生成后文件又被修改 | 稍后重试；必要时 `git publish` 或重启 daemon |
| 客户端报 hash mismatch | 服务端内容已变但清单未更新 | 同上 |
| 客户端报 schema 过新 | 服务端协议升级 | 更新客户端 |
| 服务端启动慢 | 首次为所有文件计算哈希 | 之后会命中 `hash_cache.json` |
| 某个服务端 mod 出现在客户端 | mod 过滤缓存里是 `unknown`/`sync` | `git publish` 重新分析，或手动改缓存 |
| 服务端删除的 mod 仍在客户端 | 客户端状态文件被删/不完整 | 重新同步一次即可（状态会重建） |
| 改了服务器名，客户端重下版本 | 未配置稳定的 `info.id` | 在配置中显式设置 `id` |

## 7. 安全边界

- 默认使用 HTTP。需要保密/身份认证时，可以开启 `[network.tls]`，或在前面放一个 TLS 反向代理。
- 纯 HTTP 下可开启 `network.sign_manifest`：客户端会固定公钥并验签，能发现被代理篡改或替换的清单（首次连接的 TOFU 窗口除外，见 §3.5）。
- 客户端只接受相对路径、拒绝 `..`/绝对路径/盘符，所有写入与删除都限制在游戏目录内。
- 服务端 `key.pem`、`users.db`、`manifest_key.hex`、IPC socket 权限为 `0600`。
- `mswrapper` 的控制接口没有鉴权，**不要**把它的 host 设为 `0.0.0.0`。
