# 配置文件

## syncraft.toml

位于你的 Minecraft 服务器根目录下，`syncraft serve` 启动时读取。

```toml
[info]
name = "MyServer"
vanilla_version = "1.21.1"

[info.loader.Fabric]
loader_version = "0.16.10"

[network]
host = "127.0.0.1"
port = 3000
modrinth_api = "https://mod.mcimirror.top/modrinth/v2"

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
| `info.name` | string | 服务器名称 |
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

强烈建议配置 `network.modrinth_api` 为镜像站地址。默认将请求 modrinth 的官方 API，如果你在国内，可能会遇到网络问题。

使用 [MCIM 镜像站](https://www.mcimirror.top/) 地址：
```plain
https://mod.mcimirror.top/modrinth/v2
```

关于 mod 过滤器详情，见：[文件同步](../features/file-sync)。

### 同步文件配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `sync[].source` | path | 服务端内需要同步的文件/目录路径 |
| `sync[].target` | path | 客户端对应存储路径 |
| `sync[].mode` | enum | 同步模式，可选，默认 `strict` |
| `sync[].is_mod_dir` | enum | 是否启用 mod 过滤器，可选，默认 `false` |

见：[文件同步](../features/file-sync)。

### Yggdrasil 配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `yggdrasil.base_url` | string | Yggdrasil 验证服务公开地址 |
| `yggdrasil.skin_domains` | string[] | 允许的皮肤域名白名单 |
| `yggdrasil.identity_falsification` | bool | 是否允许伪造身份验证 |
| `yggdrasil.email` | object | 可选，SMTP 邮箱配置，用于注册验证 |

见：[账号管理](../features/account)。
