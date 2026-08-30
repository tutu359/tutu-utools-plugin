import { useEffect, useState } from "react";
import ToolPage from "./ToolPage.jsx";

export default function HashCalculator({ entryType, payload, entrySequence }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (entryType === "over") {
      setText(String(payload ?? ""));
    }
  }, [entrySequence]);

  const hashes = window.services?.hashText?.(text) ?? [];

  function copyHash(value) {
    window.utools?.copyText?.(value);
  }

  return (
    <ToolPage labelledBy="hash-title">
      <h1 id="hash-title">哈希计算</h1>
      <p className="tool-description">输入文本，实时查看六种哈希值</p>
      <div className="hash-layout">
        <label className="hash-input-label" htmlFor="hash-input">
          输入文本
        </label>
        <textarea
          id="hash-input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="请输入文本"
          rows={8}
          maxLength={100000}
        />
        <div className="hash-results" aria-label="哈希结果">
          {hashes.map(({ id, label, value }) => (
            <button
              className="hash-result"
              key={id}
              type="button"
              onClick={() => copyHash(value)}
            >
              <span>{label}</span>
              <code>{value}</code>
            </button>
          ))}
        </div>
      </div>
    </ToolPage>
  );
}
