import { useEffect, useState } from "react";

const hashAlgorithms = [
  ["md5", "MD5"],
  ["sha1", "SHA-1"],
  ["sha224", "SHA-224"],
  ["sha256", "SHA-256"],
  ["sha384", "SHA-384"],
  ["sha512", "SHA-512"],
];

export default function HashCalculator({ entryType, payload }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (entryType === "over") {
      setText(String(payload ?? ""));
    }
  }, [entryType, payload]);

  const hashes = window.services?.hashText?.(text) ?? {};

  function copyHash(value) {
    window.utools?.copyText?.(value);
  }

  return (
    <main className="app-shell">
      <section className="tool-page" aria-labelledby="hash-title">
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
            {hashAlgorithms.map(([algorithm, label]) => (
              <button
                className="hash-result"
                key={algorithm}
                type="button"
                onClick={() => copyHash(hashes[algorithm])}
              >
                <span>{label}</span>
                <code>{hashes[algorithm]}</code>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
