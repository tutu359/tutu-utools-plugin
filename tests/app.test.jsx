import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  const source = fs.readFileSync(path.join(process.cwd(), "public/preload.js"), "utf8");
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

    enterPlugin({ code: "toolbox", type: "text", payload: "tutu" });

    expect(screen.getByRole("heading", { name: "工具箱" })).toBeTruthy();
    expect(screen.getByText("哈希计算")).toBeTruthy();
    expect(screen.getByText("快速 Shell")).toBeTruthy();
  });

  it("从首页选择工具后显示对应界面", () => {
    render(<App />);
    enterPlugin({ code: "toolbox", type: "text", payload: "tutu" });

    fireEvent.click(screen.getByRole("button", { name: /哈希计算/ }));

    expect(screen.getByRole("heading", { name: "哈希计算" })).toBeTruthy();
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
    expect(screen.getByText("a9993e364706816aba3e25717850c26c9cd0d89d")).toBeTruthy();
    expect(screen.getByText("23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7")).toBeTruthy();
    expect(screen.getByText("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")).toBeTruthy();
    expect(screen.getByText("cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7")).toBeTruthy();
    expect(screen.getByText("ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f")).toBeTruthy();
  });

  it("点击结果行复制对应哈希，over 进入时自动填入选中文字", () => {
    render(<App />);
    act(() => enterPlugin({ code: "hash-over", type: "over", payload: "abc" }));

    expect(screen.getByLabelText("输入文本").value).toBe("abc");
    fireEvent.click(screen.getByRole("button", { name: /MD5/ }));

    expect(copiedValues).toEqual(["900150983cd24fb0d6963f7d28e17f72"]);
  });
});

describe("快速 Shell 工具", () => {
  it("执行带输出的命令后在搜索框下方展开标准输出", async () => {
    render(<App />);
    act(() => enterPlugin({ code: "sh", type: "regex", payload: "sh echo hello" }));

    await waitFor(() => expect(screen.getByText("hello")).toBeTruthy());

    expect(screen.getByText("标准输出")).toBeTruthy();
    expect(expandedHeights.length).toBe(1);
    expect(hiddenWindowCount).toBe(0);
  });

  it("从家目录执行 pwd，并在无输出命令结束后静默隐藏", async () => {
    render(<App />);
    act(() => enterPlugin({ code: "sh", type: "regex", payload: "sh pwd" }));

    await waitFor(() => expect(screen.getByLabelText("命令结果")).toBeTruthy());
    expect(screen.getByLabelText("命令结果").textContent).toContain(process.env.HOME);

    const expansionCount = expandedHeights.length;
    cleanup();
    render(<App />);
    act(() => enterPlugin({ code: "sh", type: "regex", payload: "sh true" }));
    await waitFor(() => expect(hiddenWindowCount).toBe(1));
    expect(expandedHeights.length).toBe(expansionCount);
  });

  it("按 Esc 或关闭动作隐藏快速 Shell", async () => {
    render(<App />);
    act(() => enterPlugin({ code: "sh", type: "regex", payload: "sh false" }));
    await waitFor(() => expect(hiddenWindowCount).toBe(1));

    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "关闭结果" }));

    expect(hiddenWindowCount).toBe(3);
  });
});
