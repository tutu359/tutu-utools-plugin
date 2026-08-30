import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const copiedValues = [];
const expandedHeights = [];
let hiddenWindowCount;
let subInputValues;

function loadPlugin() {
  // require 基准必须是 preload.js 所在目录：preload 内部用相对路径 require("./tools/...")，
  // 相对的是它自己的位置 —— 与 uTools 真机加载语义一致
  const require = createRequire(
    path.join(process.cwd(), "public/preload.js"),
  );
  const source = fs.readFileSync(
    path.join(process.cwd(), "public/preload.js"),
    "utf8",
  );
  const pluginWindow = {
    utools: {
      copyText(value) {
        copiedValues.push(value);
      },
      setExpendHeight(height) {
        expandedHeights.push(height);
      },
      hideMainWindow() {
        hiddenWindowCount += 1;
      },
      setSubInputValue(value) {
        subInputValues.push(value);
      },
      outPlugin() {
        hiddenWindowCount += 1;
      },
      redirect() {
        return true;
      },
    },
  };
  vm.runInNewContext(source, {
    window: pluginWindow,
    require,
    process,
    console,
  });
  return pluginWindow;
}

function shellHintItem() {
  return {
    title: "输入命令",
    description: "在上方输入 shell 命令，回车执行",
    command: "",
  };
}

let pluginWindow;

function enterHash(
  action = { code: "hash", type: "text", payload: undefined },
) {
  let listed = [];
  pluginWindow.exports.hash.args.enter(action, (items) => {
    listed = items;
  });
  return {
    get listed() {
      return listed;
    },
    search(word) {
      pluginWindow.exports.hash.args.search(action, word, (items) => {
        listed = items;
      });
    },
    select(item) {
      pluginWindow.exports.hash.args.select(action, item, () => {});
    },
  };
}

function enterShell(action = { code: "sh", type: "text", payload: undefined }) {
  let listed = [];
  pluginWindow.exports.sh.args.enter(action, (items) => {
    listed = items;
  });
  return {
    get listed() {
      return listed;
    },
    async search(word) {
      let resolve;
      const done = new Promise((r) => {
        resolve = r;
      });
      pluginWindow.exports.sh.args.search(action, word, (items) => {
        listed = items;
        resolve();
      });
      await done;
    },
    async select(item) {
      await pluginWindow.exports.sh.args.select(action, item, (items) => {
        listed = items;
      });
    },
  };
}

beforeEach(() => {
  copiedValues.length = 0;
  expandedHeights.length = 0;
  hiddenWindowCount = 0;
  subInputValues = [];
  pluginWindow = loadPlugin();
});

afterEach(() => {
  pluginWindow = undefined;
});

describe("模板插件形态", () => {
  it("preload 暴露与 plugin.json feature code 一致的模板处理器", () => {
    const pluginJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "public/plugin.json"), "utf8"),
    );

    expect(pluginJson.main).toBeUndefined();
    for (const feature of pluginJson.features) {
      expect(pluginWindow.exports[feature.code]).toBeTruthy();
      expect(["list", "none", "doc"]).toContain(
        pluginWindow.exports[feature.code].mode,
      );
    }
  });
});

describe("哈希计算", () => {
  it("输入 abc 实时列出六种小写十六进制哈希", async () => {
    const session = enterHash();
    session.search("abc");

    const values = session.listed.map((item) => item.description);
    expect(session.listed.map((item) => item.title)).toEqual([
      "MD5",
      "SHA-1",
      "SHA-224",
      "SHA-256",
      "SHA-384",
      "SHA-512",
    ]);
    expect(values[0]).toBe("900150983cd24fb0d6963f7d28e17f72");
    expect(values[3]).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    for (const value of values) {
      expect(value).toBe(value.toLowerCase());
    }
  });

  it("回车选择某条结果即复制该哈希并收工", () => {
    const session = enterHash();
    session.search("abc");

    session.select(session.listed[0]);

    expect(copiedValues).toEqual(["900150983cd24fb0d6963f7d28e17f72"]);
    expect(hiddenWindowCount).toBe(1);
  });

  it("以选中文字进入时立即列出该文字的哈希", () => {
    const session = enterHash({
      code: "hash",
      type: "over",
      payload: "abc",
    });

    expect(session.listed[0].description).toBe(
      "900150983cd24fb0d6963f7d28e17f72",
    );
  });
});

describe("快速 Shell", () => {
  it("输入命令时实时给出可执行的条目", async () => {
    const session = enterShell();
    await session.search("echo hello");

    expect(session.listed.length).toBeGreaterThan(0);
    expect(session.listed[0].title).toContain("echo hello");
  });

  it("回车执行有输出的命令后结果列在列表中", async () => {
    const session = enterShell();
    await session.search("echo hello");

    await session.select(session.listed[0]);

    const outputItem = session.listed.find((item) =>
      item.title.includes("hello"),
    );
    expect(outputItem).toBeTruthy();
    expect(expandedHeights.length).toBe(1);
    expect(hiddenWindowCount).toBe(0);
  });

  it("从家目录执行 pwd", async () => {
    const session = enterShell();
    await session.search("pwd");

    await session.select(session.listed[0]);

    const outputItem = session.listed.find((item) =>
      item.title.includes(process.env.HOME),
    );
    expect(outputItem).toBeTruthy();
  });

  it("无输出的命令执行后静默收工", async () => {
    const session = enterShell();
    await session.search("true");

    await session.select(session.listed[0]);

    expect(hiddenWindowCount).toBe(1);
    expect(expandedHeights.length).toBe(0);
  });

  it("失败的命令展示错误输出与退出码", async () => {
    const session = enterShell();
    await session.search("false");

    await session.select(session.listed[0]);

    const statusItem = session.listed.find(
      (item) => item.description === "退出码",
    );
    expect(statusItem).toBeTruthy();
    expect(statusItem.title).toBe("1");
    expect(hiddenWindowCount).toBe(0);
  });

  it("空输入时只给引导条目，不含可执行命令", async () => {
    const session = enterShell();
    await session.search("   ");

    expect(session.listed).toEqual([shellHintItem()]);
    expect(session.listed[0].command).toBe("");
  });
});

describe("工具箱首页", () => {
  it("列出除自身以外的全部工具", () => {
    let listed = [];
    pluginWindow.exports.toolbox.args.enter(
      { code: "toolbox", type: "text", payload: undefined },
      (items) => {
        listed = items;
      },
    );

    const names = listed.map((item) => item.title);
    expect(names).toContain("哈希计算");
    expect(names).toContain("快速 Shell");
    expect(names).not.toContain("工具箱");
  });

  it("回车选择工具后原地切换为目标工具的列表，无需二次回车", () => {
    let listed = [];
    pluginWindow.exports.toolbox.args.enter(
      { code: "toolbox", type: "text", payload: undefined },
      (items) => {
        listed = items;
      },
    );

    // 选「哈希计算」：列表原地变为六种哈希行
    pluginWindow.exports.toolbox.args.select({}, listed[0], (items) => {
      listed = items;
    });

    expect(listed.map((item) => item.title)).toEqual([
      "MD5",
      "SHA-1",
      "SHA-224",
      "SHA-256",
      "SHA-384",
      "SHA-512",
    ]);

    // 选「快速 Shell」：列表出现引导条目（等待输入命令），而不是空白或再跳一层
    let shellListed = [];
    pluginWindow.exports.sh.args.enter(
      { code: "sh", type: "text", payload: undefined },
      (items) => {
        shellListed = items;
      },
    );
    expect(shellListed).toEqual([shellHintItem()]);
  });
});
