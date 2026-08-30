import { useEffect, useRef, useState } from "react";
import ToolPage from "./ToolPage.jsx";

function commandFromPayload(payload) {
  return String(payload ?? "")
    .replace(/^\s*sh\s+/, "")
    .trim();
}

export default function ShellCommand({ payload, entrySequence }) {
  const [result, setResult] = useState(null);
  const [draft, setDraft] = useState("");
  const draftRef = useRef(null);
  const disposedRef = useRef(false);

  function runCommand(command) {
    if (!command) return;
    setResult(null);
    const execution = window.services?.executeShell?.(command);
    if (!execution) return;

    execution.then((shellResult) => {
      if (disposedRef.current) return;
      setResult(shellResult);
      if (
        shellResult.stdout ||
        shellResult.stderr ||
        shellResult.exitCode !== 0
      ) {
        window.utools?.setExpendHeight?.(260);
      } else {
        window.utools?.hideMainWindow?.();
      }
    });
  }

  useEffect(() => {
    disposedRef.current = false;
    draftRef.current?.focus();
    const command = commandFromPayload(payload);
    if (command) {
      runCommand(command);
    }
    return () => {
      disposedRef.current = true;
    };
    // entrySequence 变化代表一次新的进入，payload 随之更新
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="shell-command-row">
        <input
          ref={draftRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              runCommand(draft.trim());
            }
          }}
          placeholder="输入 shell 命令，如 ls ~/Dev"
          aria-label="命令输入"
        />
        <button type="button" onClick={() => runCommand(draft.trim())}>
          执行
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
