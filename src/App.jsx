import { useEffect, useState } from "react";

const entryTypeLabels = {
  text: "文本",
  img: "图片",
  files: "文件",
  window: "窗口",
  over: "任意文本",
  regex: "正则匹配",
};

function formatPayload(payload) {
  if (payload === undefined) return "无";

  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

export default function App() {
  const [entry, setEntry] = useState("等待 onPluginEnter 回调...");
  const [utoolsVersion, setUtoolsVersion] = useState("-");
  const [systemInfo, setSystemInfo] = useState("-");

  useEffect(() => {
    if (window.utools) {
      setUtoolsVersion(window.utools.getUtoolsVersion?.() || "未知");
      window.utools.onPluginEnter(({ code, type, payload }) => {
        const typeLabel = entryTypeLabels[type] || type || "未知";
        setEntry(
          `code=${code}, type=${typeLabel}, payload=${formatPayload(payload)}`,
        );
      });
    } else {
      setUtoolsVersion("未在 uTools 中运行（可用浏览器预览界面）");
    }

    if (window.services) {
      const info = window.services.getSystemInfo();
      setSystemInfo(`${info.platform} · ${info.arch} · ${info.release}`);
    }
  }, []);

  return (
    <main className="app-shell">
      <section className="welcome" aria-labelledby="page-title">
        <p className="eyebrow">React + Vite</p>
        <h1 id="page-title">Hello uTools</h1>
        <p className="subtitle">插件开发环境已经就绪。</p>
      </section>

      <section className="status-grid" aria-label="插件运行状态">
        <div className="status-row">
          <span>进入方式</span>
          <code>{entry}</code>
        </div>
        <div className="status-row">
          <span>系统信息</span>
          <code>{systemInfo}</code>
        </div>
        <div className="status-row">
          <span>uTools 版本</span>
          <code>{utoolsVersion}</code>
        </div>
      </section>

      <section className="next-steps" aria-label="开发入口">
        <p>
          在 <code>src/App.jsx</code> 中构建界面。
        </p>
        <p>
          在 <code>public/preload.js</code> 中扩展本地能力。
        </p>
        <p>
          在 <code>public/plugin.json</code> 中增加功能指令。
        </p>
      </section>
    </main>
  );
}
