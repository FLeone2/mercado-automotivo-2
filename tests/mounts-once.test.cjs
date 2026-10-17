// Every module is mounted exactly once (a repeated mount patch once duplicated a whole section).
const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
for(const name of ['MarketPulse','QuickQuestions','OverviewInsights','CompetitiveReading','ShareDecomposition','ModelDuel','RhythmSeasonality','ElectrificationHistory','PenetrationMap','LeaderMap','FlowSankey','TerritoryBrandMaps','TrustGuide'])
 assert.equal((html.match(new RegExp('jsx\\('+name+',','g'))||[]).length,1,name+' must be mounted once');
console.log('PASS mounts: every section is mounted exactly once.');
