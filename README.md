# tutu-utools-plugin

「tutu 工具箱」—— uTools **模板插件**（列表模式），个人自用，逐步生长。
领域词汇见 [CONTEXT.md](CONTEXT.md)，架构决定见 [docs/adr/](docs/adr/)，真机踩坑与教训见 [docs/lessons-real-machine.md](docs/lessons-real-machine.md)（新会话上手与改代码前必读这三处）。

## 当前形态（ADR 0001：模板模式）

- 无 `main` 页面；每个工具是 `public/preload.js` 里 `window.exports` 的一个模板处理器
- 交互范式：关键字进入 → 搜索框挂标签页 → 框内继续输入 → 列表实时反馈 → 回车执行/复制
- 现有工具：
  - `tutu` 工具箱首页：列出全部工具，回车跳转；
  - `hash` 哈希计算：输入实时列出 MD5 / SHA-1 / SHA-224 / SHA-256 / SHA-384 / SHA-512（小写 hex），回车复制；支持选中文字直达（over 匹配指令）；
  - `sh` 快速 Shell：框内输入命令回车执行，stdout/stderr/退出码列在列表里；无输出成功即静默收工，失败展示退出码；登录 shell、家目录执行。

## 目录结构

```text
public/plugin.json    # uTools 入口声明（features；模板模式无 main 字段）
public/preload.js     # 装配层：加载能力层与工具处理器、注入平台依赖（utools 以懒函数注入）
public/tools/         # 每个工具一个文件（能力 + 处理器 + meta 自包含）：hash.js、shell.js、toolbox.js
public/package.json   # {"type":"commonjs"} —— preload 正常加载的前提，勿删
tests/app.test.jsx    # vitest：vm 加载 preload，直接驱动模板处理器，只断言外部行为
src/                  # 旧 React 自定义界面（模板模式改造后休眠，仅存档）
```

## 安装与开发

```bash
pnpm install
pnpm dev      # watch 构建到 dist/
pnpm build    # 产出 dist/
pnpm test
```

在 uTools 开发者工具中接入 `dist/plugin.json` 调试；修改源码后需在开发者工具重载（或卸载重接）。打包发布只选 `dist/`。

## 加一个新工具（流水线）

1. `public/tools/` 新建一个文件：导出 `create({ utools, getExports })` 工厂（返回模板处理器，`mode` 选 `list` / `none` / `doc`）并导出 `meta`（标题 + 描述，首页自动显示）——**能力函数写在同文件里**，只被一个工具用的能力不放公共层；
2. `public/preload.js`：`require` 并注册到 `window.exports`（code 与 plugin.json 一致）；
3. `public/plugin.json`：`features` 增加一条（`code` 唯一，关键字只用英文）。

首页列表自动从处理器 meta 派生，无需改 toolbox。

## 关键约定（真机踩坑实录，改动前必读）

- `preload.js` 必须 CommonJS，不能打包/压缩/混淆，保持每行可读；
- `dist/` 必须携带 `type: "commonjs"` 的 `package.json`：**uTools 7.8.0 真机验证**，preload 加载会参考最近的 `package.json` 的 `type` 字段，声明为 `module` 时 preload 静默加载失败（页面表现为 `window.services` 不存在、工具全部无反应）；
- 匹配指令的正则（regex 的 `match`、over 的 `exclude`）必须是**斜杠包裹**的正则字面量（如 `"/^sh\\s+\\S.*$/"`），裸模式不被解析、入口静默失效；
- 子输入框（`setSubInput`）**没有回车事件**；「回车选中条目」只有模板列表模式的 `select` 回调提供 —— 需要回车语义的工具必须走列表模式（完整论证见 ADR 0001）；
- `feature.code` 唯一且稳定，进入插件时 uTools 以 code 分发；关键字只用英文（`tutu` / `hash` / `sh`）；
- 模板模式与自定义界面（`main`）互斥；将来复杂工具的出路：`createBrowserWindow` 独立窗口（需真机验证）或第二个插件（ADR 0001）。

## 官方文档

- 快速开始：<https://www.u-tools.cn/docs/developer/basic/getting-started.html>
- plugin.json：<https://www.u-tools.cn/docs/developer/information/plugin-json.html>
- preload：<https://www.u-tools.cn/docs/developer/information/preload.html>
- 模板插件应用：<https://www.u-tools.cn/docs/developer/information/window-exports.html>
- uTools API：<https://www.u-tools.cn/docs/developer/utools-api/>
