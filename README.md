# tutu-utools-plugin

基于 React、Vite 和 pnpm 的 uTools 插件项目。

## 目录结构

```text
.
├── public/
│   ├── plugin.json  # 会原样复制到 dist/，是 uTools 插件入口
│   ├── preload.js   # CommonJS，本地 Node.js 能力
│   └── logo.png
├── src/
│   ├── App.jsx      # React 页面组件
│   ├── index.css
│   ├── main.jsx     # React 挂载入口
│   └── tools/       # 工具界面、注册表与页面包装组件
├── tests/
│   └── app.test.jsx # 插件界面集成测试
├── CONTEXT.md       # 领域词汇与产品约定
├── index.html       # Vite HTML 入口
├── vite.config.js
└── package.json
```

## 安装与开发

```bash
pnpm install
pnpm dev
```

`pnpm dev` 会以 watch 模式构建到 `dist/`。首次完成构建后，在 uTools 开发者工具中选择本项目的 `dist/plugin.json`，点击「接入开发」即可调试；修改源码后，Vite 会重建产物。

生产构建：

```bash
pnpm build
```

打包或发布时只选择 `dist/` 目录。

## 关键约定

- `public/plugin.json` 中的所有路径相对于最终 `dist/` 目录。
- `public/preload.js` 必须使用 CommonJS，且不能打包、压缩或混淆。
- React 页面通过 `window.utools` 调用 uTools API，通过 `window.services` 调用 `preload.js` 暴露的本地能力。
- 新增 uTools 功能指令时，修改 `public/plugin.json` 的 `features`，每个 `code` 必须唯一。
- `dist/` 下必须带一个 `type: "commonjs"` 的 `package.json`（由 `public/package.json` 构建时复制），否则在部分 uTools 内核上 preload 会因最近的 package.json 声明为 ESM 而静默加载失败（页面表现为 `window.services` 不存在）。

## 官方文档

- 快速开始：<https://www.u-tools.cn/docs/developer/basic/getting-started.html>
- plugin.json：<https://www.u-tools.cn/docs/developer/information/plugin-json.html>
- preload：<https://www.u-tools.cn/docs/developer/information/preload.html>
- uTools API：<https://www.u-tools.cn/docs/developer/utools-api/>
