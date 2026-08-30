import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "../src/App.jsx";

let enterPlugin;

beforeEach(() => {
  enterPlugin = undefined;
  window.utools = {
    onPluginEnter(callback) {
      enterPlugin = callback;
    },
  };
  window.services = {
    getSystemInfo: () => ({ platform: "test", arch: "test", release: "test" }),
  };
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
