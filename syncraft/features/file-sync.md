# 文件同步

**文件同步**可以让你以发布更新的形式向客户端同步文件。

## 配置文件同步列表

::: warning
syncraft-server 会在你的服务器目录中生成 `.gitignore` 文件，这个文件是动态生成的，**请不要手动修改它**。
:::

应该在 `syncraft.toml` 中配置要同步的文件。

::: details 如果你有编程经验，那么这些有关代码能帮你理解：
```rust
pub struct Config {
    pub sync: Vec<SyncObject>,
    ..
}

pub struct SyncObject {
    pub source: PathBuf,
    pub target: PathBuf,
    #[serde(default)] // SyncMode::Strict
    pub mode: SyncMode,
    #[serde(default)] // false
    pub is_mod_dir: bool,
}

#[serde(rename_all = "snake_case")]
pub enum SyncMode {
    Default, // Sync the file if not exists at client
    Strict, // Totally match
    Forbidden // Delete the file at client
}
```
:::

在你初始化工作区后，`syncraft.toml` 中应该会出现：

```toml
sync = []
```

删掉它，用 TOML 的语法向 `sync` 内添加内容：

```toml
# 将 `mods` 目录同步到客户端 `mods` 目录
[[sync]]
source = "mods/"
target = "mods/"
mode = "minimal"
is_mod_dir = true

# 将 `my_files/my_server_dat.dat` 同步到客户端 `servers.dat` （服务器列表文件）
[[sync]]
source = "my_files/my_server_dat.dat"
target = "servers.dat"
mode = "default"
```
  - `source` 是要同步的文件/目录在您服务端的位置，相对于您的 Minecraft 服务器根目录。如果是目录，在后面添加 `/` 是规范的行为。
  - `target` 是您要同步到客户端的文件位置，可以与 `source` 不同。
  - `mode` 表示文件同步模式。见：[文件同步模式](#文件同步模式)。这是可选的，默认是 `strict`。
  - `is_mod_dir` 标记一个模组文件夹。该文件夹不必须是 `mods` 文件夹。当这个标记启用时，syncraft-server 会尝试分析每一个 jar 文件，并排除仅服务端的 mod。这是可选的，默认是 `false`。

:::tip
当 `source` 和 `target` 均为文件时，同步文件；当 `source` 和 `target` 均为目录时，递归同步目录中的所有内容；当 `source` 是文件，而 `target` 是目录时，表示将文件同步到该目录内。
:::

### 文件同步模式

文件同步模式定义了同步时的行为。它是一个小写的字符串，可选的模式如下：

  - `strict`：默认行为，要求被同步的目录内不能有别的文件，并且要求所有被同步文件的哈希值匹配。
  - `minimal`：允许被同步目录内有别的文件，但要求被同步文件的哈希值匹配。
  - `default`：当客户端不存在该文件时，使用服务端的文件作为默认。不要求被同步文件的哈希值匹配。
  - `forbidden`：禁止客户端存在该文件，若有则会自动删除。该模式被 syncraft-server 内部的更新同步系统使用。

## 使用 Git

syncraft-server 内置了 Git 来管理服务端更新。在服务器目录下运行：

```bash
syncraft git status
```

你可以在输出中看到当前的文件修改状况。在确认无误后，运行：

```bash
syncraft git publish
```

syncraft-server 将会打开编辑器，你需要在其中编辑提交信息，也是此次更新的通告。

:::info
如果你能够使用 syncraft-server，那么 vim 大概率也已经预装在你的系统中了。

你也可以修改环境变量 `SYNCRAFT_EDITOR` 来配置你想使用的编辑器。
:::
  
**如果想取消提交，将提交信息留空。**关闭编辑器时，所有以 `#` 开头的行将被作为注释忽略，余下内容若非空，syncraft-server 将执行提交操作。

提交后，本次更新将在客户端启动游戏时自动同步到客户端。

## 使用 mod 过滤器

在 `syncraft.toml` 内，将某个同步文件夹的 `is_mod_dir` 设为 `true` 以使用 mod 过滤器：

```toml
[[sync]]
source = "mods/"
target = "mods/"
mode = "minimal"
is_mod_dir = true
```

同时，国内环境需配置镜像站地址：

```toml
[network]
modrinth_api = "https://mod.mcimirror.top/modrinth/v2"
```

当启用时，syncraft-server 可以在一定程度上识别 Minecraft mod 的运行环境，若认为其能在客户端运行，才会将其同步至客户端。

识别运行环境的过程发生在每次 `syncraft pubish` 时。当 syncraft-server 无法推断某个 mod 的运行环境，则会向你询问。
