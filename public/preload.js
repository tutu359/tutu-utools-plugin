// preload.js —— uTools 插件的本地能力层。
// 规范：CommonJS；代码不能打包、压缩或混淆，必须保持清晰可读。
// 所有 require 都包在 try/catch 里：加载失败会记录到 preloadError，
// 并通过 window.services 暴露给页面诊断条，而不是让整个 preload 静默死掉。
let crypto;
let os;
let execFile;
let preloadError;

try {
  crypto = require("crypto");
  os = require("os");
  execFile = require("child_process").execFile;
} catch (error) {
  preloadError = String(error && error.message ? error.message : error);
}

const hashAlgorithms = [
  ["md5", "MD5"],
  ["sha1", "SHA-1"],
  ["sha224", "SHA-224"],
  ["sha256", "SHA-256"],
  ["sha384", "SHA-384"],
  ["sha512", "SHA-512"],
];

function hashText(text) {
  if (preloadError) {
    throw new Error(preloadError);
  }
  return hashAlgorithms.map(([id, label]) => ({
    id,
    label,
    value: crypto.createHash(id).update(String(text), "utf8").digest("hex"),
  }));
}

function executeShell(command) {
  if (preloadError) {
    return Promise.reject(new Error(preloadError));
  }
  const shell = process.env.SHELL || "/bin/sh";

  return new Promise((resolve) => {
    execFile(
      shell,
      ["-l", "-c", command],
      { cwd: os.homedir(), encoding: "utf8" },
      (error, stdout, stderr) => {
        const exitCode = error
          ? typeof error.code === "number"
            ? error.code
            : 1
          : 0;
        resolve({ stdout, stderr, exitCode });
      },
    );
  });
}

window.services = {
  hashText,
  executeShell,
  getPreloadError: () => preloadError,
};
