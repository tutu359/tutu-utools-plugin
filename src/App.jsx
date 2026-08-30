import { useEffect, useState } from "react";
import { getTool, toolRegistry } from "./tools/toolRegistry.js";

export default function App() {
  const [toolCode, setToolCode] = useState("toolbox");
  const [entry, setEntry] = useState({ type: "text", payload: undefined });

  useEffect(() => {
    window.utools?.onPluginEnter?.(({ code, type, payload }) => {
      setToolCode(code);
      setEntry({ type, payload });
    });
  }, []);

  const tool = getTool(toolCode);
  const ToolComponent = tool.component;

  return (
    <ToolComponent
      entryType={entry.type}
      payload={entry.payload}
      tools={toolRegistry}
      onSelect={setToolCode}
    />
  );
}
