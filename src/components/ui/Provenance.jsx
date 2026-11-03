// Clave de procedencia: cada dato se marca como verificado, de fuente externa o sin dato

export const Verified = ({ label = 'Verificado · GBIF', className = '' }) => (
  <span className={`pill ${className}`.trim()}><span className="pill__dot" aria-hidden="true" />{label}</span>
);

export const External = ({ label = 'Fuente externa', className = '' }) => (
  <span className={`pill ${className}`.trim()}><span className="pill__ring" aria-hidden="true" />{label}</span>
);

export const NoData = ({ label = 'Sin dato' }) => (
  <span className="pill pill--outline"><span className="pill__dash" aria-hidden="true" />{label}</span>
);
