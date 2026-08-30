import ToolPage from "./ToolPage.jsx";

export default function Toolbox({ tools, onSelect }) {
  return (
    <ToolPage labelledBy="toolbox-title">
      <div className="toolbox">
        <h1 id="toolbox-title">工具箱</h1>
        <p className="toolbox-subtitle">选择一个工具</p>
        <div className="tool-list" aria-label="已注册工具">
          {tools
            .filter((tool) => tool.code !== "toolbox")
            .map((tool) => (
              <button
                className="tool-item"
                key={tool.code}
                type="button"
                onClick={() => onSelect(tool.code)}
              >
                <strong>{tool.name}</strong>
                <span>{tool.keyword}</span>
              </button>
            ))}
        </div>
      </div>
    </ToolPage>
  );
}
