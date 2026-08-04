# 安装

## 安装 syncraft-server

（暂时没有构建发布到任何平台）

以下，让我们假设 syncraft-server 已经添加到您的系统，并可以用命令 `syncraft` 访问。

## 初始化工作区

切换到你的 Minecraft 目录下，在终端中运行：

```bash
syncraft init
```

这会进入交互式配置流程，syncraft 会推断出它能推断的信息，另有一些信息需要你自己填写。

如果初始化因某些原因失败，你可以添加 `--force` 来移除工作区并重新初始化。

```bash
syncraft init --force
```

syncraft 的初始化会在你的 Minecraft 服务器目录下创建 `syncraft.toml` 和 `syncraft/`，前者是 syncraft 的配置文件，后者是 syncraft 和 yggdrasil 的数据目录。

## 安装服务

syncraft-server 可以以系统服务的形式安装在系统中。在终端内运行：

```bash
syncraft serve install
```

软件将会写入服务并自动启动守护进程。你的机器重启时，syncraft-server 也会自动启动。你可以用以下命令管理守护进程：

关闭守护进程：
```bash
syncraft serve stop
```

启动守护进程：
```bash
syncraft serve start
```
或
```bash
syncraft serve
```

如果出于测试目的想让软件在前台运行，那么可以使用：
```bash
syncraft serve run
```

如果你想卸载服务，运行：
```bash
syncraft serve uninstall
```

::: tip
如果你不运行 `syncraft serve install` 安装服务，或者你的机器没有服务管理器，那么 syncraft 将会以内置守护线程实现的方式运行，这更加不稳定，但也可以用。
:::

## 安装 authlib-injector

authlib-injector 是一个 Java 代理，可以将原本写死在 Minecraft 中的验证服务器地址更换为社区提供的 Yggdrasil 服务。对于 syncraft 的账号管理功能是必要的。

在客户端，syncraft-core 会自动配置 authlib-injector。在服务端。syncraft-server 也提供了一个指令，在大多数情况下它可以帮您安装 authlib-injector。

在服务器目录下运行：

```bash
syncraft authlib inject
```

这个指令会自动下载 authlib-injector，并为你修改启动脚本（若原本有）或生成启动脚本（若原本没有）。

::: tip
这个指令会将 authlib-injector 的地址设置为 `http://127.0.0.1:<port>/yggdrasil`，因为一般情况下 syncraft-server 和你的 Minecraft 服务器应该是运行在同一台机器上的。
:::

::: info
你仍然需要自己启动服务器，syncraft-server 不负责 Minecraft 服务器的启动。
:::

如果你认为该指令错误地配置了你的服务器，运行以下指令卸载安装：

```bash
syncraft authlib restore
```

如果你想要手动安装，建议阅读 [Littleskin 的教程](https://manual.littlesk.in/yggdrasil/authlib-injector)。该教程中的链接配置为 `littleskin.cn`，请根据你配置 syncraft-server 的情况作出修改。
