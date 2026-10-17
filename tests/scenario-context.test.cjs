const fs = require('node:fs');
const assert = require('node:assert/strict');
const source = fs.readFileSync('src/scenarios.js', 'utf8');
const api = new Function('React', 'jsxRuntime', 'dataApp', 'column', 'monthLabel', 'FooterAction', 'download', source + ';return {contextCard,contextIndexed,contextSeries};')({}, {}, {}, () => ({}), String, null, () => {});
const html = fs.readFileSync('index.html', 'utf8');
const sources = JSON.parse(fs.readFileSync('data/scenarios/external_sources.json', 'utf8'));
const monthly = JSON.parse(fs.readFileSync('data/scenarios/monthly.json', 'utf8'));

// Cards read the official series and compare with the same month a year earlier.
const selic = api.contextCard(api.contextSeries(sources, 'selic_target'), {kind: 'rate', digits: 2});
assert.equal(selic.month, 'set/26');
assert.equal(selic.value, '13,75');
assert.match(selic.change.text, /p\.p\. em 12 meses$/);
const credit = api.contextCard(api.contextSeries(sources, 'vehicle_credit_concessions'), {kind: 'level', scale: 1 / 1000, digits: 1});
assert.equal(credit.month, 'ago/26', 'credit ends one month earlier and says so');
assert.equal(credit.value, '22,6');
assert.equal(credit.spark.length, 24);

// Indexed comparison uses only common months and starts both series at 100.
const regs = monthly.rows.map(r => ({month: r.month, value: r.registrations}));
const rows = api.contextIndexed(regs, api.contextSeries(sources, 'vehicle_credit_concessions'));
assert.equal(rows.length, 36);
assert.equal(rows[0].registrations, 100);
assert.equal(rows[0].credit, 100);
assert.equal(rows.at(-1).month, '2026-08');
assert.equal(rows.at(-1).rawRegistrations, 263054);
assert.equal(api.contextIndexed([{month: '2026-01', value: 1}], []), null);

// Economia opens on the plain view; every technical sub-view is still listed.
assert(html.includes("const SCENARIO_TABS=[{value:'context',label:'Contexto econômico'},{value:'diagnostic',label:'Diagnóstico'},{value:'economy',label:'Economia e mercado'},{value:'regional',label:'Potencial regional'},{value:'forecasts',label:'Previsões'},{value:'simulations',label:'Simulações'}]"));
assert(html.includes("scenarioSaved.tab:'context'"));
assert(html.includes("{id:'models',label:'Economia',routes:['models']}"));
console.log('scenario context: cards, indexed chart and Economia defaults verified');
