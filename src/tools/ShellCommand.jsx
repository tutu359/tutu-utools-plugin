import { useEffect, useState } from "react";
import ToolPage from "./ToolPage.jsx";

function commandFromPayload(payload) {
  return String(payload ?? "").replace(/^\s*sh\s+/, "");
}

export default function ShellCommand({ entryType, payload, entrySequence }) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (entryType !== "regex") return undefined;

    let active = true;
    const command = commandFromPayload(payload);
    setResult(null);

    const execution = window.services?.executeShell?.(command);
    if (!execution) return undefined;

    execution.then((shellResult) => {
      if (!active) return;

      setResult(shellResult);
      if (shellResult.stdout || shellResult.stderr || shellResult.exitCode !== 0) {
        window.utools?.setExpendHeight?.(180);
      } else {
        window.utools?.hideMainWindow?.();
      }
    });

    return () => {
      active = false;
    };
  }, [entrySequence]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        window.utools?.hideMainWindow?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function close() {
    window.utools?.hideMainWindow?.();
  }

  const hasVisibleResult =
    result && (result.stdout || result.stderr || result.exitCode !== 0);

  return (
    <ToolPage labelledBy="shell-title">
      <div className="shell-heading">
        <h1 id="shell-title">快速 Shell</h1>
        <button type="button" onClick={close} aria-label="关闭结果">
          关闭
        </button>
      </div>
      {hasVisibleResult ? (
        <section className="shell-result" aria-label="命令结果">
          {result.stdout ? (
            <div>
              <h2>标准输出</h2>
              <pre>{result.stdout}</pre>
            </div>
          ) : null}
          {result.stderr ? (
            <div>
              <h2>错误输出</h2>
              <pre>{result.stderr}</pre>
            </div>
          ) : null}
          <p className="shell-status">退出码：{result.exitCode}</p>
        </section>
      ) : null}
    </ToolPage>
  );
}
