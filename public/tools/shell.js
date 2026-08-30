// shell.js —— 快速 Shell 工具的模板处理器。
// 交互：框内输入命令回车执行；stdout/stderr/退出码以列表展示；
//       无输出成功静默收工，失败展示退出码；支持「sh <命令>」带参直达（regex 匹配指令）。
// 平台 API 由 preload 装配时注入（工具模块作用域里没有 window 全局，不能直接摸 window.utools）。
const { executeShell } = require("./services.js");

function commandFromPayload(payload) {
  return String(payload ?? "")
    .replace(/^\s*sh\s+/, "")
    .trim();
}

function shellHintItem() {
  return {
    title: "输入命令",
    description: "在上方输入 shell 命令，回车执行",
    command: "",
  };
}

function shellItems(command) {
  if (!command) {
    return [shellHintItem()];
  }
  return [{ title: `执行：${command}`, description: "回车执行", command }];
}

function runShellCommand(command, callbackSetList, utools) {
  return executeShell(command).then((shellResult) => {
    const lines = [];
    if (shellResult.stdout) {
      lines.push({ title: shellResult.stdout.trim(), description: "标准输出" });
    }
    if (shellResult.stderr) {
      lines.push({ title: shellResult.stderr.trim(), description: "错误输出" });
    }
    if (lines.length > 0) {
      // 有输出（stdout 或 stderr）：列出输出与退出码，展开展示
      lines.push({
        title: String(shellResult.exitCode),
        description: "退出码",
      });
      callbackSetList(lines);
      utools().setExpendHeight(260);
    } else if (shellResult.exitCode === 0) {
      // 无输出且成功：静默收工
      utools().hideMainWindow();
    } else {
      // 无输出但失败：只展示退出码，让失败可见
      callbackSetList([
        { title: String(shellResult.exitCode), description: "退出码" },
      ]);
      utools().setExpendHeight(260);
    }
  });
}

module.exports.meta = {
  title: "快速 Shell",
  description: "在搜索框内输入并执行 shell 命令",
};

module.exports = function createShellHandler({ utools }) {
  return {
    mode: "list",
    args: {
      placeholder: "输入 shell 命令，回车执行",
      enter(_action, callbackSetList) {
        const command = commandFromPayload(_action.payload);
        if (command) {
          runShellCommand(command, callbackSetList, utools);
        } else {
          callbackSetList([shellHintItem()]);
        }
      },
      search(_action, searchWord, callbackSetList) {
        callbackSetList(shellItems(String(searchWord ?? "").trim()));
      },
      select(_action, itemData, callbackSetList) {
        if (!itemData.command) {
          return;
        }
        return runShellCommand(itemData.command, callbackSetList, utools);
      },
    },
    meta: {
      title: "快速 Shell",
      description: "在搜索框内输入并执行 shell 命令",
    },
  };
};
