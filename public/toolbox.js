// toolbox.js —— 工具箱首页的模板处理器（不属于 tools/ —— tools/ 只放具体工具）。
// 底座把子输入框的 search/select 事件固定派发给「进入时的 feature 处理器」——
// 因此 toolbox 扮演路由器：维护「当前激活工具」，把 search/select 委托给当前工具的处理器。
// （教训详见 docs/lessons-real-machine.md §1.3）
// 工具清单从 window.exports 的处理器上读取 meta，新工具无需改本文件。
function toolboxItems(exportsMap) {
  return Object.entries(exportsMap)
    .filter(([code]) => code !== "toolbox")
    .map(([code, handler]) => ({
      title: handler.meta.title,
      description: handler.meta.description,
      code,
    }));
}

module.exports = function createToolboxHandler({ utools, getExports }) {
  const state = { currentTool: "toolbox" };

  return {
    mode: "list",
    args: {
      placeholder: "选择一个工具",
      enter(_action, callbackSetList) {
        state.currentTool = "toolbox";
        callbackSetList(toolboxItems(getExports()));
      },
      search(_action, searchWord, callbackSetList) {
        const current = getExports()[state.currentTool];
        if (state.currentTool !== "toolbox" && current) {
          current.args.search(_action, searchWord, callbackSetList);
          return;
        }
        const word = String(searchWord ?? "").trim();
        callbackSetList(
          toolboxItems(getExports()).filter((item) =>
            item.title.toLowerCase().includes(word.toLowerCase()),
          ),
        );
      },
      select(_action, itemData, callbackSetList) {
        const exportsMap = getExports();
        const current = exportsMap[state.currentTool];
        if (state.currentTool !== "toolbox") {
          // 已在某个工具内：把选中事件转发给当前工具
          return current.args.select(_action, itemData, callbackSetList);
        }
        // 首页态：条目携带 code，切换当前工具后原地呈现目标工具的列表
        const handler = exportsMap[itemData.code];
        if (!handler) return;
        state.currentTool = itemData.code;
        utools().setSubInputValue("");
        handler.args.enter(
          { code: itemData.code, type: "text", payload: undefined },
          callbackSetList,
        );
      },
    },
  };
};
