# 账号管理

Syncraft 内置了一个定制的 [Yggdrasil](https://yushijinhun.github.io/authlib-injector/en/yggdrasil-server-technical-specification.html) 服务，用于管理玩家账户。这使得 Syncraft 得以脱离各种登录方式混杂的状况，并将各种权利最大限度地留给腐竹。

## 配置 Yggdrasil

在 `syncraft.toml` 中，进行你的 yggdrasil 登录服务的配置：
```toml
[yggdrasil]
# 可选，yggdrasil 服务在其 meta 接口上显示的服务名
server_name = "syncraft-yggdrasil"
# yggdrasil 服务的外部访问链接，格式为 `<syncraft-server 链接>/yggdrasil`
base_url = "http://myserver.com/yggdrasil"
# 皮肤域名，必须将你 syncraft 服务的域名填入以使用 syncraft 的皮肤服务；
# 另外添加 "littleskin.cn" 将 Littleskin 作为皮肤 fallback 。
skin_domains = ["myserver.com", "littleskin.cn"]
# 身份伪造功能，开启后，玩家加入服务器不需要在 syncraft 登录。
# 开启时，syncraft 账号的皮肤和正版皮肤依然能在服务器里显示。
identity_falsification = false

# 可选，当无此项时，账号无需经过邮件验证即可注册。
# 如果你的服务器都是熟人玩，倒是可以不填。
# 在互联网上搜索你的邮件服务商 + smtp 学习如何配置该服务。
[yggdrasil.email]
smtp_host = "smtp.example.com"
smtp_port = 587
username = "noreply@example.com"
password = "your_smtp_password"
from_name = "WELCOME TO MY SERVER"
```
哪怕是正版账号来了，他们也得在 Syncraft 注册！但作为高贵的正版玩家，他们不需要特意配置皮肤，syncraft-server 会自动将正版皮肤转发到 Minecraft 服务器。

:::tip
如果你没有正版账户，或者你想临时使用别的皮肤，你可以在用 syncraft-core 启动游戏时，在它所在的目录中放置你的皮肤文件，并重命名为 `skin.png`， syncraft-core 将自动上传它。
:::

## 手动管理账户

syncraft-server提供了一系列指令来手动管理账户。如果你的服务器成员感到注册账号太麻烦了，你也可以帮他们注册。

列出当前有效的所有账户：

```bash
syncraft account list
```

添加账户，用法为 `syncraft account add` + 邮箱 + 角色名 + 密码：

```bash
syncraft account add email@example.com CharName my_strong_password
```

手动添加的账户将自动通过邮箱验证。

移除账户，用法为 `syncraft account remove` + 角色名：

```bash
syncraft account remove CharName
```
