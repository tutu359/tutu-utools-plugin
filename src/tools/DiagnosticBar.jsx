export default function DiagnosticBar() {
  const preloadError = window.services?.getPreloadError?.();
  const servicesLoaded = Boolean(window.services?.hashText) && !preloadError;
  const utoolsConnected = Boolean(window.utools);
  const version = window.utools?.getUtoolsVersion?.() ?? "未知";

  const servicesLabel = servicesLoaded
    ? "已加载 ✓"
    : preloadError
      ? `未加载 ✗（${preloadError}）`
      : "未加载 ✗";
  return (
    <p className="diagnostic-bar">
      {`本地服务层：${servicesLabel} · uTools 接口：${
        utoolsConnected ? "已连接 ✓" : "未检测到 ✗"
      } · uTools 版本：${version}`}
    </p>
  );
}
