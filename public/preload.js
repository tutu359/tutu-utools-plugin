// preload.js —— 运行在插件窗口加载前，可使用 Node.js 原生能力与 Electron 渲染进程 API。
// 规范：CommonJS；代码不能打包/压缩/混淆，必须保持清晰可读。
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");

// 挂到 window 上，前端页面即可直接访问 window.services
window.services = {
  // 系统信息示例
  getSystemInfo: () => {
    return {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      hostname: os.hostname(),
    };
  },

  // 读文件示例（utf-8）
  readFile: (filePath) => {
    return fs.readFileSync(filePath, { encoding: "utf-8" });
  },

  // 路径处理示例
  joinPath: (...parts) => path.join(...parts),
};
