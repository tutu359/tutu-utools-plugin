// preload.js —— uTools 插件的本地能力层。
// 规范：CommonJS；代码不能打包、压缩或混淆，必须保持清晰可读。
const crypto = require("node:crypto");
const os = require("node:os");
const { execFile } = require("node:child_process");

const hashAlgorithms = ["md5", "sha1", "sha224", "sha256", "sha384", "sha512"];

function hashText(text) {
  return Object.fromEntries(
    hashAlgorithms.map((algorithm) => [
      algorithm,
      crypto.createHash(algorithm).update(String(text), "utf8").digest("hex"),
    ]),
  );
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
