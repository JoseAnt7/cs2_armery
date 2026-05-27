/** Colores oficiales aproximados de rareza CS2 */
export const RARITY_COLORS = {
  'Consumer Grade': '#b0c3d9',
  'Industrial Grade': '#5e98d9',
  'Mil-Spec Grade': '#4b69ff',
  Restricted: '#8847ff',
  Classified: '#d32ce6',
  Covert: '#eb4b4b',
  Contraband: '#e4ae39',
  Extraordinary: '#eb4b4b',
  Master: '#eb4b4b',
  Superior: '#d32ce6',
  Exceptional: '#8847ff',
  Distinguished: '#4b69ff',
  'High Grade': '#4b69ff',
  Remarkable: '#8847ff',
  Exotic: '#d32ce6',
  'Base Grade': '#b0c3d9',
};

export function getRarityColor(name) {
  return RARITY_COLORS[name] || '#b0c3d9';
}

export function normalizeRarityOptions(options) {
  if (!options?.length) return [];
  if (typeof options[0] === 'string') {
    return options.map((name) => ({ name, color: getRarityColor(name) }));
  }
  return options.map((opt) => ({
    name: opt.name,
    color: opt.color || getRarityColor(opt.name),
  }));
}
