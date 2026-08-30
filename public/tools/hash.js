// hash.js —— 哈希计算工具：能力（hashText）与模板处理器同文件，自包含。
// 交互：输入实时列出六种哈希（小写 hex），回车复制收工；支持选中文字直达（over）。
// 平台 API 由 preload 装配时注入（工具模块作用域里没有 window 全局，不能直接摸 window.utools）。
const crypto = require("crypto");

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
    value: crypto.createHash(id).update(String(text), "utf8").digest("hex"),
  }));
}

function hashItems(text) {
  return hashText(text).map(({ label, value }) => ({
    title: label,
    description: value,
  }));
}

module.exports.meta = {
  title: "哈希计算",
  description: "实时计算 MD5 / SHA 哈希，回车复制",
};

module.exports = function createHashHandler({ utools }) {
  return {
    mode: "list",
    args: {
      placeholder: "输入文本，实时计算哈希",
      enter(_action, callbackSetList) {
        callbackSetList(hashItems(String(_action.payload ?? "")));
      },
      search(_action, searchWord, callbackSetList) {
        callbackSetList(hashItems(String(searchWord ?? "")));
      },
      select(_action, itemData) {
        utools().copyText(itemData.description);
        utools().outPlugin();
      },
    },
    meta: {
      title: "哈希计算",
      description: "实时计算 MD5 / SHA 哈希，回车复制",
    },
  };
};
