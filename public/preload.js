// preload.js —— uTools 插件的装配层。
// 规范：CommonJS；代码不能打包、压缩或混淆，必须保持清晰可读。
//
// 职责（见 docs/adr/0001）：本插件采用 uTools 模板插件模式，
// 这里只做装配：加载各工具（能力与处理器同文件）+ 平台依赖注入。
// 每个工具一个文件，位于 tools/ 目录；加新工具 = tools/ 加一个文件 + plugin.json 一条 feature。
// 注意：工具模块经 Node require 加载，作用域里没有 window 全局，
// 平台 API（utools）以懒函数注入，事件触发时才解引用 window.utools。

try {
  const createToolbox = require("./toolbox.js");
  const createHash = require("./tools/hash.js");
  const createShell = require("./tools/shell.js");

  const context = {
    // 懒取用：事件触发时才解引用 window.utools，兼容底座注入时机
    utools: () => window.utools,
    getExports: () => window.exports,
  };

  window.exports = {
    toolbox: createToolbox(context),
    hash: createHash(context),
    sh: createShell(context),
  };
} catch (error) {
  console.error("[tutu] preload 加载失败", error);
}
