# 多服务器

Syncraft 采用**“单进程多租户”**模式：一台机器上只运行一个**守护进程（Daemon）**，同时服务多个 Minecraft 服务器目录。工作区、账号数据库、皮肤缓存、manifest 和邮件模板在各个 Minecraft 服务器间独立。

## 共享与隔离

| 整机共享 | 每个服务器独立 |
| --- | --- |
| 守护进程（可执行文件） | `syncraft.toml` |
| 注册表 `servers.toml` | `syncraft/` 工作区 |
| IPC socket / PID / 日志 | Yggdrasil 用户库 `syncraft/yggdrasil/users.db` |
| — | manifest 快照 `syncraft/data/manifests/` |
| — | 验证邮件模板 `verify-email.html` |
| — | HTTP/HTTPS 监听端口 |

守护进程自身的状态文件默认位于 `$XDG_DATA_HOME/syncraft`（一般是 `~/.local/share/syncraft`），与任何 Minecraft 目录无关；可以用环境变量 `SYNCRAFT_DATA_DIR` 覆盖（生成的 systemd 服务会记录该变量并固定）：

```text
~/.local/share/syncraft/
├── servers.toml      已注册的服务器列表
├── daemon.sock       控制 socket
├── daemon.pid
└── logs/latest.log
```

## 注册服务器

每个目录先初始化：

```bash
cd ./MyServerDir
syncraft init
```

然后注册到守护进程：

```bash
syncraft server add .
# 或指定 id
syncraft server add . --name my-server
```

id 默认取 `syncraft.toml` 中的 `info.id`。

注册服务器的查看与移除：

```bash
syncraft server list
syncraft server remove my-server
```

注册或移除会通知正在运行的守护进程，并立即生效；守护进程未运行时，改动在下次启动时生效。

## 启动守护进程

`daemon` 命令只管理守护进程，与当前目录无关。你可以在任何地方运行它们：

```bash
syncraft daemon install   # 安装为 systemd 用户服务（可选）
syncraft daemon start     # 后台启动
syncraft daemon status    # 查看当前 daemon 状态
syncraft daemon logs      # 流式连接到 daemon 的日志，ctrl+c 退出
syncraft daemon stop      # 关闭守护进程（不改变系统服务的自启行为）
syncraft daemon uninstall # 卸载系统服务
```

调试时可以用前台模式：

```bash
syncraft daemon foreground
```

一台机器只运行一个守护进程。注册的每个 Minecraft 服务器的 `network.port` 必须不同；端口冲突的实例会在日志中报错。

## 单服务器操作

`init`、`git`、`publish`、`account`、`authlib` 等命令仍然在具体的 Minecraft 目录里执行，只影响该目录对应的 Minecraft 服务器：

```bash
cd ./MyServerDir
syncraft publish
syncraft account list
syncraft authlib inject
```

`publish` 会通过全局 IPC 通知守护进程只重建该服务器的 manifest。

## 邮件模板

每个租户的验证邮件模板位于各自目录根部：`<Minecraft 目录>/verify-email.html`。没有该文件时使用内置英文模板。详见[自定义邮件模板](../examples/email-template)。

## 客户端

在设计上，由于不同 Minecraft 服务器的游戏文件一般并不互通，故一个 Syncraft 客户端仅为一个 Minecraft 服务器管理游戏。

多租户是**服务端**的能力：同一台机器上的一个守护进程可以同时服务多个 Minecraft 服务器目录；客户端仍然只连接其中的一个 Minecraft 服务器目录。
