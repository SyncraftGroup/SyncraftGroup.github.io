# 技术栈

## 编写概况

Syncraft 全部后端代码采用 **Rust**，AI 参与度很低，基本所有代码都是我手写的。这期间经历了各种复杂 API 和微软、麻将遗留问题的折磨，其中辛酸，在这个大 AI 时代似乎是一种宝贵的经验了。

## 内部 Crate 依赖关系

| Crate | 依赖关系 |
|-------|----------|
| `syncraft-protocol` | 无内部依赖，纯类型定义 |
| `console_info` | 被 core、server、mswrapper 共同引用，提供终端 UI |
| `java_detect` | 被 core 引用，查找系统 Java |
| `syncraft-core` | 依赖 protocol + console_info + java_detect |
| `syncraft-server` | 依赖 protocol + console_info + mswrapper |
| `mswrapper` | 依赖 console_info，可独立运行 |

## 主要依赖库

| 库 | 用途 |
|----|------|
| Axum | HTTP 服务框架，提供文件同步 API 与 Yggdrasil 验证路由 |
| Tokio | 异步运行时，贯穿所有网络与文件 I/O |
| Reqwest | HTTP 客户端，拉取 Mojang 资源、加载器安装包与同步清单 |
| Serde | JSON / TOML 序列化，协议层与配置文件解析 |
| SQLx | SQLite 数据库操作 |
| Clap | CLI 参数解析，客户端与服务端均使用 |
| BLAKE3 | 文件完整性哈希校验 |
| Git2 | libgit2 绑定，服务端用 Git 管理游戏文件版本 |
| Argon2 | 密码哈希，用于 Yggdrasil 用户凭证存储 |
| RSA | Yggdrasil 令牌签名与验证 |
| Lettre | SMTP 邮件发送，支持注册邮箱验证 |
| Inquire | 交互式终端提示，客户端的选项选择与输入 |
| Indicatif | 进度条，下载与安装过程的视觉反馈 |

## 文档

| 工具 | 用途 |
|------|------|
| VitePress 2 | 静态站点生成，Vue 3 驱动 |
| Bun | 包管理与脚本运行 |
