// Provisional: marca las vistas que aún se están migrando desde legacy/

export function Pending({ title, children }) {
  return (
    <section className="u-fade-in">
      <h1 tabIndex={-1}>{title}</h1>
      <p>{children ?? 'Vista en migración a React.'}</p>
    </section>
  );
}
