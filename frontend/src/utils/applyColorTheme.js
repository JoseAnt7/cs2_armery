const VALID_THEMES = new Set(['orange', 'blue']);

export function resolveColorTheme(value) {
  const theme = String(value || 'orange').toLowerCase();
  return VALID_THEMES.has(theme) ? theme : 'orange';
}

/** Aplica data-theme en <html> para que las variables CSS cambien en todo el sitio. */
export function applyColorTheme(theme) {
  const resolved = resolveColorTheme(theme);
  document.documentElement.setAttribute('data-theme', resolved);
  return resolved;
}
