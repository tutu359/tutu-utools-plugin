import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "../src/App.jsx";

let enterPlugin;
let copiedValues;
let expandedHeights;
let hiddenWindowCount;

function createRealServices() {
  const require = createRequire(import.meta.url);
  const source = fs.readFileSync(
    path.join(process.cwd(), "public/preload.js"),
    "utf8",
  );
  const pluginWindow = {};
  vm.runInNewContext(source, { window: pluginWindow, require, process });
  return pluginWindow.services;
}

beforeEach(() => {
  enterPlugin = undefined;
  copiedValues = [];
  expandedHeights = [];
  hiddenWindowCount = 0;
  window.utools = {
    onPluginEnter(callback) {
      enterPlugin = callback;
    },
    copyText(value) {
      copiedValues.push(value);
    },
    setExpendHeight(height) {
      expandedHeights.push(height);
    },
    hideMainWindow() {
      hiddenWindowCount += 1;
    },
  };
  window.services = createRealServices();
});

afterEach(() => {
  cleanup();
  delete window.utools;
  delete window.services;
});

describe("工具箱入口", () => {
  it("通过 toolbox 功能指令进入后列出全部已注册工具", () => {
    render(<App />);
    act(() => enterPlugin({ code: "hash", type: "text", payload: undefined }));
    act(() => enterPlugin({ code: "toolbox", type: "text", payload: "tutu" }));

    expect(screen.getByRole("heading", { name: "工具箱" })).toBeTruthy();
    expect(screen.getByText("哈希计算")).toBeTruthy();
    expect(screen.getByText("快速 Shell")).toBeTruthy();
  });

  it("从首页选择工具后显示对应界面", () => {
    render(<App />);
    act(() => enterPlugin({ code: "toolbox", type: "text", payload: "tutu" }));

    fireEvent.click(screen.getByRole("button", { name: /哈希计算/ }));

    expect(screen.getByRole("heading", { name: "哈希计算" })).toBeTruthy();
  });
});

describe("重复进入工具", () => {
  it("再次进入相同选中文字时重新填入并计算", () => {
    render(<App />);
    act(() => enterPlugin({ code: "hash", type: "over", payload: "abc" }));

    fireEvent.change(screen.getByLabelText("输入文本"), {
      target: { value: "changed" },
    });
    act(() => enterPlugin({ code: "hash", type: "over", payload: "abc" }));

    expect(screen.getByLabelText("输入文本").value).toBe("abc");
    expect(screen.getByText("900150983cd24fb0d6963f7d28e17f72")).toBeTruthy();
  });

  it("再次执行相同命令时重新展开结果", async () => {
    render(<App />);
    act(() =>
      enterPlugin({ code: "sh", type: "regex", payload: "sh echo hello" }),
    );
    await waitFor(() => expect(expandedHeights.length).toBe(1));

    act(() =>
      enterPlugin({ code: "sh", type: "regex", payload: "sh echo hello" }),
    );
    await waitFor(() => expect(expandedHeights.length).toBe(2));
  });
});

describe("plugin.json 入口声明", () => {
  it("匹配指令的正则必须是斜杠包裹的正则字面量格式", () => {
    const pluginJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "public/plugin.json"), "utf8"),
    );

    const matchValues = pluginJson.features.flatMap((feature) =>
      feature.cmds
        .filter((cmd) => typeof cmd === "object" && cmd.match)
        .map((cmd) => cmd.match),
    );

    expect(matchValues.length).toBeGreaterThan(0);
    for (const match of matchValues) {
      expect(match.startsWith("/")).toBe(true);
      expect(match.endsWith("/")).toBe(true);
    }
  });

  it("sh 功能同时具备关键字与正则匹配两种入口", () => {
    const pluginJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "public/plugin.json"), "utf8"),
    );

    const shFeature = pluginJson.features.find(
      (feature) => feature.code === "sh",
    );

    expect(shFeature).toBeTruthy();
    expect(shFeature.cmds).toContain("sh");
    expect(
      shFeature.cmds.some(
        (cmd) => typeof cmd === "object" && cmd.type === "regex",
      ),
    ).toBe(true);
  });

  it("over 匹配指令的 maxLength 不超过官方上限", () => {
    const pluginJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "public/plugin.json"), "utf8"),
    );

    for (const feature of pluginJson.features) {
      for (const cmd of feature.cmds) {
        if (typeof cmd === "object" && cmd.type === "over") {
          expect(cmd.maxLength).toBeLessThanOrEqual(10000);
        }
      }
    }
  });
});

describe("诊断条", () => {
  it("页面底部显示服务层、uTools 接口与版本状态", () => {
    window.utools.getUtoolsVersion = () => "6.1.0";
    render(<App />);
    act(() => enterPlugin({ code: "toolbox", type: "text", payload: "tutu" }));

    expect(screen.getByText(/本地服务层：已加载/)).toBeTruthy();
    expect(screen.getByText(/uTools 接口：已连接/)).toBeTruthy();
    expect(screen.getByText(/uTools 版本：6\.1\.0/)).toBeTruthy();
  });

  it("服务层未加载时诊断条明确标出", () => {
    delete window.services;
    render(<App />);
    act(() => enterPlugin({ code: "toolbox", type: "text", payload: "tutu" }));

    expect(screen.getByText(/本地服务层：未加载/)).toBeTruthy();
  });

  it("服务层自带错误信息时诊断条显示错误详情", () => {
    window.services.getPreloadError = () => "require is not defined";
    render(<App />);
    act(() => enterPlugin({ code: "toolbox", type: "text", payload: "tutu" }));

    expect(screen.getByText(/未加载 ✗（require is not defined）/)).toBeTruthy();
  });
});

describe("哈希计算工具", () => {
  it("输入 abc 后实时展示六种小写十六进制哈希", () => {
    render(<App />);
    act(() => enterPlugin({ code: "hash", type: "text", payload: undefined }));

    fireEvent.change(screen.getByLabelText("输入文本"), {
      target: { value: "abc" },
    });

    expect(screen.getByText("900150983cd24fb0d6963f7d28e17f72")).toBeTruthy();
    expect(
      screen.getByText("a9993e364706816aba3e25717850c26c9cd0d89d"),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
      ),
    ).toBeTruthy();
  });

  it("进入后自动聚焦输入框，可直接打字", () => {
    render(<App />);
    act(() => enterPlugin({ code: "hash", type: "text", payload: undefined }));

    expect(document.activeElement).toBe(screen.getByLabelText("输入文本"));
  });

  it("点击结果行复制对应哈希，over 进入时自动填入选中文字", () => {
    render(<App />);
    act(() => enterPlugin({ code: "hash", type: "over", payload: "abc" }));

    expect(screen.getByLabelText("输入文本").value).toBe("abc");
    fireEvent.click(screen.getByRole("button", { name: /MD5/ }));

    expect(copiedValues).toEqual(["900150983cd24fb0d6963f7d28e17f72"]);
  });
});

describe("快速 Shell 工具", () => {
  it("执行带输出的命令后在搜索框下方展开标准输出", async () => {
    render(<App />);
    act(() =>
      enterPlugin({ code: "sh", type: "regex", payload: "sh echo hello" }),
    );

    await waitFor(() => expect(screen.getByText("hello")).toBeTruthy());

    expect(screen.getByText("标准输出")).toBeTruthy();
    expect(expandedHeights.length).toBe(1);
    expect(hiddenWindowCount).toBe(0);
  });

  it("从家目录执行 pwd，并在无输出命令结束后静默隐藏", async () => {
    render(<App />);
    act(() => enterPlugin({ code: "sh", type: "regex", payload: "sh pwd" }));

    await waitFor(() => expect(screen.getByLabelText("命令结果")).toBeTruthy());
    expect(screen.getByLabelText("命令结果").textContent).toContain(
      process.env.HOME,
    );

    const expansionCount = expandedHeights.length;
    cleanup();
    render(<App />);
    act(() => enterPlugin({ code: "sh", type: "regex", payload: "sh true" }));
    await waitFor(() => expect(hiddenWindowCount).toBe(1));
    expect(expandedHeights.length).toBe(expansionCount);
  });

  it("失败命令即使没有输出也显示失败状态", async () => {
    render(<App />);
    act(() => enterPlugin({ code: "sh", type: "regex", payload: "sh false" }));

    await waitFor(() => expect(screen.getByText("退出码：1")).toBeTruthy());
    expect(hiddenWindowCount).toBe(0);
  });

  it("通过 sh 关键字带参数进入时直接执行命令", async () => {
    render(<App />);
    act(() =>
      enterPlugin({ code: "sh", type: "text", payload: "echo hello" }),
    );

    await waitFor(() => expect(screen.getByText("hello")).toBeTruthy());
    expect(expandedHeights.length).toBe(1);
  });

  it("空参数进入快速 Shell 不执行也不隐藏", () => {
    render(<App />);
    act(() =>
      enterPlugin({ code: "sh", type: "text", payload: undefined }),
    );

    expect(screen.getByRole("heading", { name: "快速 Shell" })).toBeTruthy();
    expect(screen.queryByLabelText("命令结果")).toBeNull();
    expect(hiddenWindowCount).toBe(0);
  });

  it("在页面命令输入框内执行命令", async () => {
    render(<App />);
    act(() => enterPlugin({ code: "sh", type: "text", payload: undefined }));

    fireEvent.change(screen.getByLabelText("命令输入"), {
      target: { value: "echo page" },
    });
    fireEvent.click(screen.getByRole("button", { name: "执行" }));

    await waitFor(() => expect(screen.getByText("page")).toBeTruthy());
  });

  it("按 Esc 或关闭动作隐藏快速 Shell", async () => {
    render(<App />);
    act(() => enterPlugin({ code: "sh", type: "regex", payload: "sh true" }));
    await waitFor(() => expect(hiddenWindowCount).toBe(1));

    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "关闭结果" }));

    expect(hiddenWindowCount).toBe(3);
  });
});
