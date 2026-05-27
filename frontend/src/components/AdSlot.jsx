/**
 * Marcador de posición para futuros anuncios (p. ej. Google AdSense).
 * Sustituye el contenido interno por el script de AdSense cuando esté listo.
 */
export function AdSlot({ slot, size = 'medium', className = '' }) {
  return (
    <aside
      className={`ad-slot ad-slot--${size} ${className}`.trim()}
      aria-label="Espacio publicitario"
      data-ad-slot={slot}
    >
      <span className="ad-slot__label">Publicidad</span>
      <span className="ad-slot__size">{size === 'tall' ? '160 × 600' : '300 × 250'}</span>
    </aside>
  );
}
