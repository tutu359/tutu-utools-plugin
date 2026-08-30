// preload.js —— uTools 插件的本地能力层。
// 规范：CommonJS；代码不能打包、压缩或混淆，必须保持清晰可读。
const crypto = require("crypto");
const os = require("os");
const { execFile } = require("child_process");

const hashAlgorithms = [
  ["md5", "MD5"],
  ["sha1", "SHA-1"],
  ["sha224", "SHA-224"],
  ["sha256", "SHA-256"],
  ["sha384", "SHA-384"],
  ["sha512", "SHA-512"],
];

function hashText(text) {
  return hashAlgorithms.map(([id, label]) => ({
    id,
    label,
    value: crypto
      .createHash(id)
      .update(String(text), "utf8")
      .digest("hex"),
  }));
}

function executeShell(command) {
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
};
