// hash.js —— 哈希计算工具的模板处理器。
// 交互：输入实时列出六种哈希（小写 hex），回车复制收工；支持选中文字直达（over）。
// 平台依赖由 preload 装配时注入（context.utools 是取 window.utools 的懒函数），
// 工具模块经 Node require 加载，作用域里没有 window 全局，不能直接摸 window.utools。
const { hashText } = require("./services.js");

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
    meta: { title: "哈希计算", description: "实时计算 MD5 / SHA 哈希，回车复制" },
  };
};
