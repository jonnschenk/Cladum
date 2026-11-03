// Loader de marca: un cladograma que se dibuja del tronco a las hojas; los nodos aparecen al final.
// Cada trazo lleva su orden en --step (el retraso se calcula en CSS).

const BRANCHES = [
  ['M2 12H7', 0],
  ['M7 6V18', 1],
  ['M7 6H13M7 18H13', 2],
  ['M13 3.5V8.5M13 15.5V20.5', 3],
  ['M13 3.5H21M13 8.5H21M13 15.5H21M13 20.5H21', 4],
];
const NODES = [3.5, 8.5, 15.5, 20.5];

export function BrandLoader({ size = 'sm' }) {
  return (
    <svg className={`loader loader--${size}`} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      {BRANCHES.map(([d, step]) => (
        <path key={d} className="loader__branch" d={d} pathLength="1" style={{ '--step': step }} />
      ))}
      {NODES.map((y, i) => (
        <circle key={y} className="loader__node" cx="21" cy={y} r="1.7" style={{ '--step': 5 + i * 0.5 }} />
      ))}
    </svg>
  );
}
