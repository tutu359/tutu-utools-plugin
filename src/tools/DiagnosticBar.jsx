export default function DiagnosticBar() {
  const servicesLoaded = Boolean(window.services?.hashText);
  const utoolsConnected = Boolean(window.utools);
  const version = window.utools?.getUtoolsVersion?.() ?? "未知";

  return (
    <p className="diagnostic-bar">
      {`本地服务层：${servicesLoaded ? "已加载 ✓" : "未加载 ✗"} · uTools 接口：${
        utoolsConnected ? "已连接 ✓" : "未检测到 ✗"
      } · uTools 版本：${version}`}
    </p>
  );
}
