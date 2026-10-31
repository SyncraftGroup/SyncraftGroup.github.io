# 自定义邮件模板

注册验证邮件默认使用一份英文模板。你可以在不修改代码的情况下替换它。

## 启用方式

把 HTML 文件命名为 `verify-email.html`，放在 `syncraft.toml` 所在的目录（Minecraft 服务器根目录），然后重启 `syncraft-server`。文件存在时使用它，删除后回到内置模板。

## 模板格式

- 模板是一段完整的 HTML，会被直接作为验证邮件的正文。
- 邮件标题取自 `<title>` 标签；没有 `<title>` 时使用默认标题 `Verify your Syncraft account`。
- 下列占位符会被替换，替换值会做 HTML 转义：

| 占位符 | 含义 |
| --- | --- |
| <code v-pre>{{link}}</code> | 验证链接，可放进 <code v-pre>&lt;a href="{{link}}"&gt;</code> |
| <code v-pre>{{email}}</code> | 收件邮箱 |
| <code v-pre>{{character_name}}</code> | 玩家角色名 |
| <code v-pre>{{server_name}}</code> | <code>yggdrasil.server_name</code>，未设置时为 <code>Syncraft</code> |

- 未知占位符会原样保留，不会报错。
- 模板在服务端启动时读取，修改后需要重启。
- 邮件客户端对 CSS 支持有限，建议使用内联样式；不要引用外部图片或字体。

## 示例

下面是一个完整的 `verify-email.html` 示例：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>验证你的 {{server_name}} 账号</title>
</head>
<body style="margin:0;padding:32px;background:#f5f5f5;font-family:system-ui,sans-serif;color:#111;">
  <div style="max-width:480px;margin:0 auto;background:#fff;padding:32px;border:1px solid #e5e5e5;">
    <h1 style="font-size:20px;margin:0 0 16px;">验证你的邮箱</h1>
    <p style="line-height:1.6;">{{character_name}} 你好，感谢注册 {{server_name}}。请点击下面的按钮验证 {{email}}。</p>
    <p style="margin:24px 0;">
      <a href="{{link}}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;">验证账号</a>
    </p>
    <p style="font-size:13px;color:#666;line-height:1.6;">
      如果按钮无法点击，请复制这个链接到浏览器：<br>
      <a href="{{link}}" style="color:#111;">{{link}}</a>
    </p>
    <p style="font-size:13px;color:#666;line-height:1.6;">如果不是你本人操作，忽略这封邮件即可。</p>
  </div>
</body>
</html>
```
