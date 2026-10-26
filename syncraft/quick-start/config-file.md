# 配置文件

## syncraft.toml

位于你的 Minecraft 服务器根目录下，`syncraft serve` 启动时读取。

```toml
# 顶层键（必须写在第一个 [table] 之前）
# 可选：客户端上必须不存在的路径（不要求服务端也有同名文件）
forbid = ["mods/old-client-only-mod.jar"]

[info]
name = "MyServer"
# 稳定的版本标识，用于客户端缓存文件名。
# `syncraft init` 会自动生成；之后修改 name 不会影响它。
id = "myserver"
vanilla_version = "1.21.1"

[info.loader.Fabric]
loader_version = "0.16.10"

[network]
host = "127.0.0.1"
port = 3000
modrinth_api = "https://mod.mcimirror.top/modrinth/v2"
# 可选：为 manifest 签名（纯 HTTP 时建议开启，见下文）
sign_manifest = false

# 可选：启用 HTTPS 监听。不配置时仍为 HTTP；
# 若前面已有反向代理（如 nginx/Traefik）终止 TLS，保持注释即可。
# [network.tls]
# cert = "certs/fullchain.pem"
# key = "certs/privkey.pem"

# 可选：版本与服务端下发参数
[server]
snapshot_retention = 32   # 保留的 manifest 快照数；0 = 不限制
download_concurrency = 4   # 建议客户端并发下载数（1-16）

[[sync]]
source = "mods/"
target = "mods/"
mode = "minimal"
is_mod_dir = true

[yggdrasil]
base_url = "http://example.com/yggdrasil"
skin_domains = ["example.com", "littleskin.cn"]
identity_falsification = false

[yggdrasil.email]
smtp_host = "smtp.example.com"
smtp_port = 587
username = "noreply@example.com"
password = "your_password"
from_name = "QWQ"
```

### 游戏版本信息

| 字段 | 类型 | 说明 |
|------|------|------|
| `info.name` | string | 服务器名称（展示用） |
| `info.id` | string | 稳定的版本标识（`init` 自动生成）；修改 `name` 不影响它 |
| `info.vanilla_version` | string | Minecraft 版本 |
| `info.loader` | enum | 加载器类型及版本 |

Minecraft版本、加载器类型及版本通常能被 syncraft-server 自主推断出来。

支持下面的加载器：
  - `Vanilla`：原版服务器/插件端服务器
  - `Fabric { loader_version }`：Fabric 加载器。
  - `Forge { loader_version }`：Forge 加载器。
  - `NeoForge { loader_version }`：NeoForge 加载器。

### syncraft 网络配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `network.host` | string | 绑定地址 |
| `network.port` | u16 | 绑定端口 |
| `network.modrinth_api` | String | 用于 mod 过滤器，可选 |
| `network.sign_manifest` | bool | 可选，为 manifest 添加 Ed25519 签名，默认 `false` |
| `network.tls.cert` | path | 可选，HTTPS 证书链（PEM） |
| `network.tls.key` | path | 可选，HTTPS 私钥（PEM） |

`network.tls` 不配置时服务端仍使用 HTTP（适合内网或前面有 TLS 反向代理的情况）。

强烈建议配置 `network.modrinth_api` 为镜像站地址。默认将请求 modrinth 的官方 API，如果你在国内，可能会遇到网络问题。

使用 [MCIM 镜像站](https://www.mcimirror.top/) 地址：
```plain
https://mod.mcimirror.top/modrinth/v2
```

关于 mod 过滤器详情，见：[文件同步](../features/file-sync)。

### 服务端行为

| 字段 | 类型 | 说明 |
|------|------|------|
| `server.snapshot_retention` | uint | 保留的 manifest 快照数量，默认 `32`；`0` 表示不清理 |
| `server.download_concurrency` | u8 | 建议客户端同时下载数（1-16），默认 `4`；会随 manifest 下发 |

客户端可在 `.client.json` 中用 `download_concurrency` 覆盖此建议值。

传输安全（HTTPS 与签名、信任模型）见：[同步机制详解 · 传输安全](../features/sync-internals#transport-security)。

### 同步文件配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `sync[].source` | path | 服务端内需要同步的文件/目录路径 |
| `sync[].target` | path | 客户端对应存储路径 |
| `sync[].mode` | enum | 同步模式：`ifmissing` / `minimal` / `strict` / `forbidden`，可选，默认 `strict` |
| `sync[].is_mod_dir` | enum | 是否启用 mod 过滤器，可选，默认 `false` |
| `sync[].target_is_dir` | bool | 可选；`source` 是文件时，显式指定 `target` 是否为目录 |
| `forbid` | path[] | 可选，客户端上必须不存在的路径 |

见：[文件同步](../features/file-sync) 与 [同步机制详解](../features/sync-internals)。

### Yggdrasil 配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `yggdrasil.base_url` | string | Yggdrasil 验证服务公开地址 |
| `yggdrasil.skin_domains` | string[] | 允许的皮肤域名白名单 |
| `yggdrasil.identity_falsification` | bool | 是否允许伪造身份验证 |
| `yggdrasil.email` | object | 可选，SMTP 邮箱配置，用于注册验证 |

见：[账号管理](../features/account)。
