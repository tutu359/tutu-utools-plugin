import { useEffect, useRef, useState } from "react";
import { getTool, toolRegistry } from "./tools/toolRegistry.js";

export default function App() {
  const [toolCode, setToolCode] = useState("toolbox");
  const entrySequence = useRef(0);
  const [entry, setEntry] = useState({
    type: "text",
    payload: undefined,
    sequence: 0,
  });

  useEffect(() => {
    window.utools?.onPluginEnter?.(({ code, type, payload }) => {
      setToolCode(code);
      setEntry({ type, payload, sequence: ++entrySequence.current });
    });
  }, []);

  const tool = getTool(toolCode);
  const ToolComponent = tool.component;

  return (
    <ToolComponent
      entryType={entry.type}
      payload={entry.payload}
      entrySequence={entry.sequence}
      tools={toolRegistry}
      onSelect={setToolCode}
    />
  );
}
