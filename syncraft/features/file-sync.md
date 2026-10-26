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
    pub forbid: Vec<PathBuf>, // 客户端上必须不存在的路径
    ..
}

pub struct SyncObject {
    pub source: PathBuf,
    pub target: PathBuf,
    #[serde(default)] // SyncMode::Strict
    pub mode: SyncMode,
    #[serde(default)] // false
    pub is_mod_dir: bool,
    #[serde(default)] // 可选：显式指定 target 是目录
    pub target_is_dir: Option<bool>,
}

#[serde(rename_all = "snake_case")]
pub enum SyncMode {
    #[serde(rename = "ifmissing")]
    IfMissing, // 只在客户端缺少该文件时提供
    Minimal,   // 更新已有文件，但保留目录里的其他文件
    Strict,    // 完全匹配，并删除目录里的多余文件
    Forbidden, // 客户端不得存在该文件
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
[[sync]]
source = "my_files/my_server_dat.dat"
target = "servers.dat"
mode = "ifmissing"
```
  - `source` 是要同步的文件/目录在您服务端的位置，相对于您的 Minecraft 服务器根目录。如果是目录，在后面添加 `/` 是规范的行为。
  - `target` 是您要同步到客户端的文件位置，可以与 `source` 不同。
  - `mode` 表示文件同步模式。见：[文件同步模式](#文件同步模式)。这是可选的，默认是 `strict`。
  - `is_mod_dir` 标记一个模组文件夹。该文件夹不必须是 `mods` 文件夹。当这个标记启用时，syncraft-server 会尝试分析每一个 jar 文件，并排除仅服务端的 mod。这是可选的，默认是 `false`。

:::tip
当 `source` 和 `target` 均为文件时，同步文件；当 `source` 和 `target` 均为目录时，递归同步目录中的所有内容；当 `source` 是文件，而 `target` 是目录时，表示将文件同步到该目录内。

最后一种情况默认由服务端路径推测（`target` 在服务端是目录，或没有扩展名）。如果推测不符合预期，可以显式指定：

```toml
[[sync]]
source = "my_files/list.txt"
target = "config"          # 名字没有扩展名，但本意是文件
target_is_dir = false
```
:::

### 文件同步模式

文件同步模式定义了同步时的行为。它是一个小写的字符串，可选的模式如下：

  - `strict`：默认行为，要求被同步的目录内不能有别的文件，并且要求所有被同步文件的哈希值匹配。
  - `minimal`：允许被同步目录内有别的文件，但要求被同步文件的哈希值匹配。
  - `ifmissing`：当客户端不存在该文件时，使用服务端的文件作为默认。不要求被同步文件的哈希值匹配。
  - `forbidden`：禁止客户端存在该文件，若有则会自动删除。该模式被 syncraft-server 内部的更新同步系统使用。

目录里服务端已经删掉的文件也会从客户端删除（包括 `minimal` / `ifmissing` 目录），这是靠客户端记录的“上次管理清单”实现的，不需要手动清理。

若要禁止客户端存在**服务端也没有**的文件，请使用顶层配置：

```toml
forbid = ["mods/old-client-only-mod.jar"]
```

实现细节（哈希、快照、删除规则、回滚、失败处理）见 [同步机制详解](./sync-internals)。

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

::: warning 不稳定的功能
mod 过滤器的实现依赖 [Modrinth API](https://docs.modrinth.com/api/) ，它在国内有时会很慢。并且，它提供的信息在极少情况下可能不正确或缺失，这可能是 mod 的特殊性质或是 mod 本身信息更新不及时所致。此外，很多 mod 并没有登录 Modrinth ，我们无法准确推断其运行环境。因为种种原因，如果你对自己的 mod 了解完善并希望稳健，你可以考虑不使用该功能。
:::

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

识别运行环境的过程发生在每次 `syncraft publish` 时。当 syncraft-server 无法推断某个 mod 的运行环境，则会向你询问。
