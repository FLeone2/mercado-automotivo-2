/* One theme, three accent colors, plus a dark presentation mode.
   Replaces the 14-theme catalog. Embedded in place of the old catalog block and
   called as installThemeRegistry(T5, C5) before the runtime's first theme use.
   `original` stays the default and carries no tokens: the runtime paints it from
   CSS (src/design-system.css defines the same Petróleo values), and the picker
   then shows `petroleo` as the active choice. Unknown stored ids fall back to
   `original` (runtime patch in scripts/build-design-system.py). */
var THEME_FONT = '"Geist", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"';
// Chart series: validated for color-vision deficiency (adjacent pairs; first three all-pairs).
var THEME_CHARTS = {
  light: ['#3a69ad', '#d78a3f', '#169b86', '#7f6cb4', '#afa851', '#a25089', '#5f8796', '#8a94a6'],
  dark: ['#587fc8', '#ca7e31', '#2fa284', '#917ec8', '#9c963e', '#ac5892', '#6fa3b3', '#6b7484']
};
// background, surface, surface-raised, muted, control, control-hover, text, secondary, border, border-strong, accent, positive, negative
var THEME_SURFACES = {
  petroleo: {label: 'Petróleo',
    light: ['#f7f8fa', '#ffffff', '#ffffff', '#f1f3f6', '#ffffff', '#eef1f5', '#101828', '#5d6676', '#e4e7ec', '#cfd5de', '#0f5f73', '#12805c', '#c2410c'],
    dark: ['#0b0d12', '#151821', '#1b1f2a', '#1b1f2a', '#1b1f2a', '#232836', '#e9ecf2', '#a0a8b6', '#262b36', '#363d4b', '#5fb3c6', '#4cc79a', '#f59e5b']},
  oliva: {label: 'Verde oliva',
    light: ['#f5f5ef', '#ffffff', '#ffffff', '#efefe6', '#ffffff', '#ebece2', '#1c1f14', '#62665a', '#e2e3d5', '#cfd1bf', '#556b2f', '#2f7d4a', '#c2410c'],
    dark: ['#12140d', '#1b1e15', '#22261a', '#22261a', '#22261a', '#2a2f20', '#eceee2', '#a3a690', '#2e3224', '#3d4230', '#a9c26b', '#6fd19a', '#f59e5b']},
  marinho: {label: 'Azul marinho',
    light: ['#f4f6fa', '#ffffff', '#ffffff', '#edf1f7', '#ffffff', '#e8edf5', '#0f1a2e', '#56637a', '#dfe4ee', '#c9d1e0', '#1b3a6b', '#12805c', '#c2410c'],
    dark: ['#0a1020', '#111a2e', '#16213a', '#16213a', '#16213a', '#1d2a47', '#e6ecf7', '#9aa8c2', '#22304a', '#31415f', '#7ea6e8', '#4cc79a', '#f59e5b']},
  apresentacao: {label: 'Apresentação (escuro)', darkOnly: true,
    dark: ['#0e1116', '#151a21', '#1b212a', '#1b212a', '#1b212a', '#232b36', '#e6edf3', '#8b96a5', '#252d38', '#34404e', '#3fc7d9', '#3fb98a', '#ffa657']}
};
function themeTokens(surfaces, dark, keys) {
  var names = ['background', 'surface', 'surface-raised', 'muted', 'control', 'control-hover', 'text', 'secondary', 'border', 'border-strong', 'accent', 'positive', 'negative'];
  var tokens = {'card-radius': '10px', 'control-radius': '8px', 'mark-radius': '4', 'card-shadow': 'none',
    shadow: dark ? '0 8px 24px rgb(0 0 0 / 40%)' : '0 8px 24px rgb(16 24 40 / 12%)', 'font-sans': THEME_FONT};
  names.forEach(function (name, i) { tokens[name] = surfaces[i]; });
  (dark ? THEME_CHARTS.dark : THEME_CHARTS.light).forEach(function (color, i) { tokens['chart-' + (i + 1)] = color; });
  return keys.map(function (key) { return tokens[key]; });
}
function installThemeRegistry(registry, keys) {
  registry.length = 0;
  registry.push({id: 'original', label: 'Petróleo'});
  Object.keys(THEME_SURFACES).forEach(function (id) {
    var t = THEME_SURFACES[id];
    var entry = {id: id, label: t.label};
    if (t.darkOnly) {
      entry.darkOnly = true;
      entry.tokens = themeTokens(t.dark, true, keys);
    } else {
      entry.tokens = themeTokens(t.light, false, keys);
      entry.darkTokens = themeTokens(t.dark, true, keys);
    }
    registry.push(entry);
  });
  return registry;
}
if (typeof module !== 'undefined' && module.exports) module.exports = {installThemeRegistry, themeTokens, THEME_SURFACES, THEME_CHARTS, THEME_FONT};
