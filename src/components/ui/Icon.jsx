// Íconos de trazo (24×24). Siempre decorativos: el texto accesible va en el control que los contiene.

const ICONS = {
  arrow: { stroke: 2.2, d: 'M4 12h15M13 6l6 6-6 6' },
  back: { d: 'M15 6l-6 6 6 6' },
  chevron: { stroke: 2.2, d: 'M6 9l6 6 6-6' },
  check: { stroke: 2.6, d: 'M5 12.5l4.5 4.5L19 7.5' },
  search: { d: 'M20 20l-4-4', circle: [11, 11, 7] },
  noResults: { d: 'M20 20l-4-4M8.5 8.5l5 5M13.5 8.5l-5 5', circle: [11, 11, 7] },
  alert: { d: 'M12 7.5v5.5M12 16.5v.5', circle: [12, 12, 9] },
  warn: { d: 'M12 3l10 18H2zM12 10v5M12 18v.5' },
  shield: { d: 'M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6zM12 8v5M12 16v.5' },
  list: { d: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01' },
  map: { stroke: 1.8, d: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14' },
  bookmark: { stroke: 1.8, d: 'M6 3h12v18l-6-4-6 4z' },
  bookmarkFilled: { fill: true, d: 'M6 3h12v18l-6-4-6 4z' },
  image: { stroke: 1.8, d: 'M21 17l-5-5-9 8', rect: true, circle: [9, 10, 2] },
  moon: { stroke: 1.8, d: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z' },
  offline: {
    stroke: 1.8,
    d: 'M2 8.8a15 15 0 0 1 4.2-2.6M9.8 5.1A15 15 0 0 1 22 8.8M5 12.6a10 10 0 0 1 3.7-2.2M14.6 10.3A10 10 0 0 1 19 12.6M8.5 16.4a5 5 0 0 1 7 0M12 20h.01M3 3l18 18',
  },
  clock: { stroke: 1.8, d: 'M12 7v5l3 2', circle: [12, 12, 9] },
  spinner: { stroke: 2.2, d: 'M21 12a9 9 0 1 1-6.2-8.6' },
  sun: {
    stroke: 1.8,
    d: 'M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8',
    circle: [12, 12, 4.5],
  },
};

export function Icon({ name, size = 16 }) {
  const icon = ICONS[name];
  if (!icon) return null;
  const paint = icon.fill
    ? { fill: 'currentColor' }
    : {
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: icon.stroke ?? 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...paint}>
      {icon.rect && <rect x="3" y="4" width="18" height="16" rx="3" />}
      {icon.circle && <circle cx={icon.circle[0]} cy={icon.circle[1]} r={icon.circle[2]} />}
      <path d={icon.d} />
    </svg>
  );
}
