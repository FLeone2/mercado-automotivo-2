// Visual/layout check of every area in the built site (dist/), light and dark,
// desktop and phone. Fails on page errors and horizontal page overflow; lists
// clipped text as warnings. Screenshots go to tests/visual/output/ for review.
//   bash scripts/build-dist.sh && node tests/visual/run.cjs [--quick]
// Needs Playwright (set PLAYWRIGHT_MODULE if it is not resolvable from here).
const path=require('node:path'),fs=require('node:fs'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||(fs.existsSync('/opt/node-tools/node_modules/playwright')?'/opt/node-tools/node_modules/playwright':'playwright'));
const root=path.join(__dirname,'..','..'),dist=path.join(root,'dist'),out=path.join(__dirname,'output');
const quick=process.argv.includes('--quick');
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.gz':'application/gzip','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png'};
function serve(){return new Promise(resolve=>{const server=http.createServer((req,res)=>{let file=path.join(dist,decodeURIComponent(new URL(req.url,'http://x').pathname));if(file.endsWith('/'))file+='index.html';if(!file.startsWith(dist)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}res.writeHead(200,{'content-type':TYPES[path.extname(file)]??'application/octet-stream'});fs.createReadStream(file).pipe(res);}).listen(0,()=>resolve(server));});}
const AREAS=[['Panorama'],['Evolução',['Executiva','Composição','Crescimento']],['Concorrência',['Marcas e modelos','Ranking']],['Segmentos',['Estrutura BD','Pirâmide BD','Propulsão','Origem']],['Territórios'],['Explorar'],['Economia'],['Animações']];
const settle=async page=>{await page.waitForLoadState('networkidle').catch(()=>{});const t=Date.now();while(Date.now()-t<45000){const busy=await page.evaluate(()=>document.querySelectorAll('[aria-busy=true]').length+[...document.querySelectorAll('[role=status]')].filter(e=>/Preparando|Carregando|Calculando/.test(e.textContent)).length);if(!busy)break;await page.waitForTimeout(500);}await page.waitForTimeout(800);};
const inspect=page=>page.evaluate(()=>{
 const overflow=document.documentElement.scrollWidth-innerWidth;
 const clipped=[];
 for(const el of document.querySelectorAll('h1,h2,h3,h4,button,label,th,.am-nav-link')){const cs=getComputedStyle(el);if(!el.offsetParent||cs.textOverflow==='ellipsis')continue;if((cs.overflowX==='hidden'||cs.overflowX==='clip')&&el.scrollWidth>el.clientWidth+2)clipped.push(el.tagName.toLowerCase()+': '+el.textContent.trim().slice(0,60));}
 for(const svg of document.querySelectorAll('svg')){const box=svg.getBoundingClientRect();if(!box.width||getComputedStyle(svg).overflow==='visible')continue;for(const t of svg.querySelectorAll('text')){if(getComputedStyle(t).visibility==='hidden'||t.closest('[aria-hidden=true]'))continue;const r=t.getBoundingClientRect();if(r.width&&(r.left<box.left-2||r.right>box.right+2||r.top<box.top-2||r.bottom>box.bottom+2))clipped.push('svg text: '+t.textContent.trim().slice(0,60));}}
 return {overflow,clipped:[...new Set(clipped)].slice(0,20)};
});
(async()=>{
 if(!fs.existsSync(path.join(dist,'index.html'))){console.error('dist/ ausente: rode bash scripts/build-dist.sh');process.exit(2);}
 fs.mkdirSync(out,{recursive:true});const server=await serve(),url='http://localhost:'+server.address().port+'/';
 const browser=await chromium.launch(),failures=[],warnings=[];
 const modes=quick?[['light',1440]]:[['light',1440],['dark',1440],['light',390],['dark',390]];
 for(const [scheme,width] of modes){
  const page=await browser.newPage({viewport:{width,height:width<500?844:1000},colorScheme:scheme}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'networkidle'});await settle(page);
  for(const [area,subs] of AREAS){
   for(const sub of subs??[null]){
    const tag=[scheme,width,area,sub].filter(Boolean).join('-').replace(/\s+/g,'_');
    const clicked=await page.evaluate(([area,sub])=>{const nav=[...document.querySelectorAll('.am-primary-nav .am-nav-link')].find(b=>b.textContent.trim()===area);if(!nav)return 'no area';nav.click();return 'ok';},[area,sub]);
    if(clicked!=='ok'){failures.push(tag+': área não encontrada');continue;}
    await settle(page);
    if(sub){const ok=await page.evaluate(sub=>{const b=[...document.querySelectorAll('.am-subnavigation button,.am-subnavigation a')].find(b=>b.textContent.trim()===sub);if(!b)return false;b.click();return true;},sub);if(!ok){failures.push(tag+': subárea não encontrada');continue;}await settle(page);}
    const r=await inspect(page);
    if(r.overflow>1)failures.push(tag+': rolagem horizontal de '+r.overflow+'px');
    for(const c of r.clipped)warnings.push(tag+': '+c);
    await page.screenshot({path:path.join(out,tag+'.png'),fullPage:true});
   }
  }
  for(const e of errors)failures.push(scheme+'-'+width+': erro na página: '+e);
  await page.close();
 }
 await browser.close();server.close();
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({failures,warnings},null,1));
 for(const w of warnings)console.log('AVISO',w);
 for(const f of failures)console.log('FALHA',f);
 console.log((failures.length?'FAIL':'PASS')+' visual: '+failures.length+' falha(s), '+warnings.length+' aviso(s); capturas em tests/visual/output/');
 process.exit(failures.length?1:0);
})();
