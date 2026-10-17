const fs = require('node:fs');
const assert = require('node:assert/strict');
const {overviewInsights} = require('../src/overview-insights.js');
const html = fs.readFileSync('index.html', 'utf8');

const model = {total: 268721, changeRate: .0215, yearChangeRate: .1614, groups: {marca: [
  {name: 'FIAT', count: 53586, shareChange: .012, changeRate: .105},
  {name: 'VW', count: 42372, shareChange: -.0004, changeRate: .023},
  {name: 'GM', count: 27526, shareChange: -.002},
  {name: 'BYD', count: 22218, shareChange: -.0103, changeRate: -.092},
  {name: 'MITSUBISHI', count: 1729, shareChange: -.0008, changeRate: -.099},
  {name: 'TINY', count: 10, shareChange: .5}
]}};
const items = overviewInsights(model), by = Object.fromEntries(items.map(i => [i.id, i]));
assert.equal(by.total.text, '268.721 emplacamentos no recorte, +2,2% sobre o período anterior e +16,1% sobre o mesmo período do ano anterior.');
assert.equal(by.leader.text, 'Fiat lidera com 19,9% do mercado, 4,2 p.p. à frente de VW.');
assert.equal(by.gain.text, 'Fiat foi quem mais ganhou participação: +1,2 p.p. sobre o período anterior, para 19,9%.', 'tiny brands are ignored');
assert.equal(by.loss.text, 'BYD foi quem mais perdeu participação: −1,0 p.p., para 8,3%.');
assert.match(by.mitsubishi.text, /^Mitsubishi: 1\.729 emplacamentos, 0,64% do mercado, 5ª marca, −9,9%/);

// Unavailable comparisons produce no claim.
const bare = overviewInsights({total: 100, changeRate: null, yearChangeRate: null, groups: {marca: [{name: 'FIAT', count: 60}, {name: 'VW', count: 40}]}});
assert.equal(bare.find(i => i.id === 'total').text, '100 emplacamentos no recorte.');
assert(!bare.some(i => i.id === 'gain' || i.id === 'loss'));
assert.deepEqual(overviewInsights(null), []);
assert.deepEqual(overviewInsights({total: 0}), []);

// Panorama shows insights first and no longer embeds the primary map.
assert(html.includes('jsxRuntime.jsx(OverviewInsights,{model,period:titlePeriod})'));
assert(html.includes("useMarketData(overviewMapFilters,tab==='geography'&&mapReady,'primary-map',false)"));
console.log('overview insights: sentences, guards and Panorama embedding verified');
