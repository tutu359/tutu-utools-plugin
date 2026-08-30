// preload.js —— uTools 插件的本地能力层 + 模板插件处理器。
// 规范：CommonJS；代码不能打包、压缩或混淆，必须保持清晰可读。
//
// 形态说明（见 docs/adr/0001）：本插件采用 uTools 模板插件模式，
// 所有工具的交互通过 window.exports 的列表模式处理器实现，
// 交互全部发生在搜索框与其下方的列表中。
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

// ---------------------------------------------------------------------------
// 本地能力层（window.services，供模板处理器使用）
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// 模板处理器（window.exports，键与 plugin.json 的 feature.code 一致）
// ---------------------------------------------------------------------------

function requireServices() {
  if (preloadError) {
    throw new Error(preloadError);
  }
}

// 哈希计算：输入即算，列表实时显示六种算法，回车复制
const hashHandler = {
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
      window.utools.copyText(itemData.description);
      window.utools.outPlugin();
    },
  },
};

function hashItems(text) {
  return hashText(text).map(({ label, value }) => ({
    title: label,
    description: value,
  }));
}

// 快速 Shell：输入命令，回车执行，结果以列表条目展示
const shellHandler = {
  mode: "list",
  args: {
    placeholder: "输入 shell 命令，回车执行",
    enter(_action, callbackSetList) {
      const command = commandFromPayload(_action.payload);
      if (command) {
        runShellCommand(command, callbackSetList);
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
      return runShellCommand(itemData.command, callbackSetList);
    },
  },
};

function commandFromPayload(payload) {
  return String(payload ?? "")
    .replace(/^\s*sh\s+/, "")
    .trim();
}

function shellHintItem() {
  return { title: "输入命令", description: "在上方输入 shell 命令，回车执行", command: "" };
}

function shellItems(command) {
  if (!command) {
    return [shellHintItem()];
  }
  return [{ title: `执行：${command}`, description: "回车执行", command }];
}

function runShellCommand(command, callbackSetList) {
  requireServices();
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
      window.utools.setExpendHeight(260);
    } else if (shellResult.exitCode === 0) {
      // 无输出且成功：静默收工
      window.utools.hideMainWindow();
    } else {
      // 无输出但失败：只展示退出码，让失败可见
      callbackSetList([
        { title: String(shellResult.exitCode), description: "退出码" },
      ]);
      window.utools.setExpendHeight(260);
    }
  });
}

// 工具箱首页：列出全部工具，回车跳转
// 工具箱首页：列出全部工具，回车直接进入目标工具的列表模式（无底座二次回车）
// 工具箱首页：列出全部工具，回车进入目标工具。
// 底座把子输入框的 search/select 事件固定派发给「进入时的 feature 处理器」——
// 因此 toolbox 扮演路由器：维护「当前激活工具」，把 search/select 委托给当前工具的处理器。
const state = { currentTool: "toolbox" };

const toolboxHandler = {
  mode: "list",
  args: {
    placeholder: "选择一个工具",
    enter(_action, callbackSetList) {
      state.currentTool = "toolbox";
      callbackSetList(toolboxItems());
    },
    search(_action, searchWord, callbackSetList) {
      const current = window.exports[state.currentTool];
      if (state.currentTool !== "toolbox" && current) {
        current.args.search(_action, searchWord, callbackSetList);
        return;
      }
      const word = String(searchWord ?? "").trim();
      callbackSetList(
        toolboxItems().filter((item) =>
          item.title.toLowerCase().includes(word.toLowerCase()),
        ),
      );
    },
    select(_action, itemData, callbackSetList) {
      const current = window.exports[state.currentTool];
      if (state.currentTool !== "toolbox") {
        // 已在某个工具内：把选中事件转发给当前工具
        return current.args.select(_action, itemData, callbackSetList);
      }
      // 首页态：条目携带 code，切换当前工具后原地呈现目标工具的列表
      const handler = window.exports[itemData.code];
      if (!handler) return;
      state.currentTool = itemData.code;
      window.utools.setSubInputValue("");
      handler.args.enter(
        { code: itemData.code, type: "text", payload: undefined },
        callbackSetList,
      );
    },
  },
};

function toolboxItems() {
  return [
    {
      title: "哈希计算",
      description: "实时计算 MD5 / SHA 哈希，回车复制",
      code: "hash",
    },
    {
      title: "快速 Shell",
      description: "在搜索框内输入并执行 shell 命令",
      code: "sh",
    },
  ];
}

window.services = {
  hashText,
  executeShell,
  getPreloadError: () => preloadError,
};

window.exports = {
  toolbox: toolboxHandler,
  hash: hashHandler,
  sh: shellHandler,
};
