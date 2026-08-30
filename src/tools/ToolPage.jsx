export default function ToolPage({ children, labelledBy }) {
  return (
    <main className="tool-shell">
      <section className="tool-page" aria-labelledby={labelledBy}>
        {children}
      </section>
    </main>
  );
}
