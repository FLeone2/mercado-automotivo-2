const fs = require('node:fs');
const assert = require('node:assert/strict');
const themeAPI = require('../src/theme-registry.js');
const html = fs.readFileSync('index.html', 'utf8');

// Registry runs against the real runtime source.
const values = new Map();
const root = {style: {setProperty: (k, v) => values.set(k, v), removeProperty: k => values.delete(k)}, dataset: {colorScheme: 'light'}};
const document = {documentElement: root, querySelector: () => null};
const registrySource = html.slice(html.indexOf('var C5='), html.indexOf('var k5='));
const api = new Function('document', 'getComputedStyle', registrySource + ';return {C5,T5,O5,E5};')(document, () => ({getPropertyValue: () => ''}));

assert.deepEqual(api.T5.map(t => t.id), ['original', 'petroleo', 'oliva', 'marinho', 'terra', 'ouro', 'apresentacao'], 'one theme, five accents, one presentation mode');
assert.equal(api.T5[0].tokens, undefined, 'original is painted from CSS');
themeAPI.installThemeRegistry(api.T5, api.C5);
assert.equal(api.T5.length, 7, 'idempotent');

// Removed theme ids stored in a browser fall back instead of crashing.
for (const legacy of ['liquid-blue', 'windows-95', 'sage', 'codex-classic']) {
  assert.equal(api.O5(legacy, 'light').id, 'original');
}

// Token arrays line up with the runtime keys and carry the validated chart palette.
const chartAt = i => api.C5.indexOf('chart-' + (i + 1));
for (const t of api.T5.filter(t => t.tokens)) {
  for (const set of [t.tokens, t.darkTokens].filter(Boolean)) {
    assert.equal(set.length, api.C5.length, t.id);
    assert(set.every(v => typeof v === 'string' && v.length), t.id + ' has empty tokens');
  }
  const light = t.darkOnly ? themeAPI.THEME_CHARTS.dark : themeAPI.THEME_CHARTS.light;
  light.forEach((c, i) => assert.equal(t.tokens[chartAt(i)], c, t.id + ' chart-' + (i + 1)));
}
const petroleo = api.O5('petroleo', 'light');
assert.equal(root.dataset.appTheme, 'petroleo');
assert.equal(values.get('--accent'), '#0f5f73');
api.O5('petroleo', 'dark');
assert.equal(values.get('--accent'), '#5fb3c6');
assert.ok(petroleo);

// Accent text contrast on its surface stays readable (WCAG AA for UI, 3:1).
const lum = hex => { const v = hex.slice(1).match(/../g).map(x => parseInt(x, 16) / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4); return v[0] * .2126 + v[1] * .7152 + v[2] * .0722; };
const contrast = (a, b) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);
for (const [id, t] of Object.entries(themeAPI.THEME_SURFACES)) {
  for (const s of [t.light, t.dark].filter(Boolean)) {
    assert(contrast(s[10], s[1]) >= 3, id + ' accent on surface');
    assert(contrast(s[6], s[0]) >= 7, id + ' text on background');
    assert(contrast(s[7], s[1]) >= 4.5, id + ' secondary text on surface');
    assert(contrast(s[11], s[1]) >= 4.5 && contrast(s[12], s[1]) >= 4.5, id + ' positive/negative readable');
    assert(contrast(s[0], s[1]) < 1.2 && contrast(s[9], s[1]) >= 1.4, id + ' border visible on surface');
  }
}

// The two palette themes keep the owner's swatches as accents and never use red (reserved for Mitsubishi).
const redHue = hex => { const [r, g, b] = hex.slice(1).match(/../g).map(x => parseInt(x, 16)); return r > 150 && r > g * 2.2 && r > b * 2.2; };
for (const id of ['terra', 'ouro']) for (const s of [themeAPI.THEME_SURFACES[id].light, themeAPI.THEME_SURFACES[id].dark]) assert(!redHue(s[10]), id + ' no red accent');
assert.equal(themeAPI.THEME_SURFACES.terra.light[10], '#7a4e47');assert.equal(themeAPI.THEME_SURFACES.ouro.light[10], '#31401a');assert.equal(themeAPI.THEME_SURFACES.ouro.dark[10], '#bf9a54');
api.O5('terra', 'light');assert.equal(root.dataset.appTheme, 'terra');api.O5('ouro', 'dark');assert.equal(values.get('--accent'), '#bf9a54');

// Runtime patches and the design-system layer are in place.
assert(html.includes('if(!n)n=T5[0];'));
assert(html.includes('rL=Array.from({length:nL.length},(e,t)=>tL[t%tL.length])'), 'no hue-rotated chart colors');
assert(!html.includes('calc(h + ${nL[t]*15})'));
assert(html.includes('/^(?:count|total|volume|registrations)$/iu.test(String(e)))return tL[0]'));
assert(!html.includes('<style id="catalog-themes-styles">') && !html.includes('<style id="market-blue-theme-styles">'));
const lastStyle = [...html.matchAll(/<style id="([^"]+)">/g)].pop()[1];
assert.equal(lastStyle, 'design-system-styles', 'design system is the last stylesheet');
assert(fs.existsSync('assets/fonts/Geist-Variable.woff2'));
console.log('theme registry: 7 entries, fallbacks, palette, contrast and runtime patches verified');
