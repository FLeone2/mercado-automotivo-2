// "Baixar imagem" for the authored SVG charts: the chart is redrawn on a canvas with
// its computed colours (theme tokens resolved), the Geist font embedded, the HTML
// legend next to it, a title and the source line, and saved as PNG.
const EXPORT_STYLE_PROPS=['fill','fill-opacity','stroke','stroke-width','stroke-opacity','stroke-dasharray','stroke-linecap','stroke-linejoin','opacity','font-size','font-weight','font-family','text-anchor','dominant-baseline','paint-order','visibility','display','letter-spacing'];
let exportFontPromise=null;
function exportFontFace(){
 if(!exportFontPromise)exportFontPromise=fetch(new URL('assets/fonts/Geist-Variable.woff2',document.baseURI)).then(r=>r.ok?r.blob():null).then(blob=>blob?new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve('@font-face{font-family:"Geist";src:url('+reader.result+') format("woff2");font-weight:100 900}');reader.onerror=()=>resolve('');reader.readAsDataURL(blob);}):'').catch(()=>'');
 return exportFontPromise;
}
// Tokens use light-dark(); read them back as concrete colours through a probe element.
function exportResolveColor(token,fallback){const probe=document.createElement('span');probe.style.color='var('+token+')';probe.style.display='none';(document.querySelector('.am-app')??document.body).appendChild(probe);const value=getComputedStyle(probe).color;probe.remove();return value||fallback;}
function exportInlineStyles(source,clone){
 const a=[source,...source.querySelectorAll('*')],b=[clone,...clone.querySelectorAll('*')];
 for(let i=0;i<a.length&&i<b.length;i++){const cs=getComputedStyle(a[i]),style=EXPORT_STYLE_PROPS.map(p=>p+':'+cs.getPropertyValue(p)).join(';');b[i].setAttribute('style',style);b[i].removeAttribute('class');}
}
function exportLegend(root){
 return [...(root?.querySelectorAll('.cc-legend span,.tbm-legend span,.ac-legend span,[data-export-legend] span')??[])].map(item=>({label:item.textContent.trim(),color:getComputedStyle(item.querySelector('i,b,em')??item).backgroundColor})).filter(item=>item.label);
}
async function exportSvgToPng(svg,{filename='grafico',title='',legend=[]}={}){
 const box=svg.viewBox?.baseVal?.width?svg.viewBox.baseVal:svg.getBoundingClientRect(),w=Math.round(box.width),h=Math.round(box.height);
 const clone=svg.cloneNode(true);exportInlineStyles(svg,clone);
 clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.setAttribute('width',w);clone.setAttribute('height',h);
 const font=await exportFontFace();if(font){const style=document.createElementNS('http://www.w3.org/2000/svg','style');style.textContent=font;clone.insertBefore(style,clone.firstChild);}
 const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml'}));
 try{
  const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Não foi possível desenhar o gráfico.'));img.src=url;});
  const surface=exportResolveColor('--surface','#fff'),text=exportResolveColor('--text','#111'),muted=exportResolveColor('--secondary','#666');
  const scale=2,pad=24,titleH=title?34:0,legendRows=[],ctx0=document.createElement('canvas').getContext('2d');ctx0.font='13px Geist, sans-serif';
  let row=[],x=0;for(const item of legend){const iw=22+ctx0.measureText(item.label).width+18;if(x+iw>w&&row.length){legendRows.push(row);row=[];x=0;}row.push({...item,x});x+=iw;}if(row.length)legendRows.push(row);
  const legendH=legendRows.length*22,footH=26,W=w+pad*2,H=pad+titleH+h+(legendH?legendH+10:0)+footH+pad;
  const canvas=document.createElement('canvas');canvas.width=W*scale;canvas.height=H*scale;const ctx=canvas.getContext('2d');ctx.scale(scale,scale);
  ctx.fillStyle=surface;ctx.fillRect(0,0,W,H);
  if(title){ctx.fillStyle=text;ctx.font='600 17px Geist, sans-serif';ctx.fillText(title,pad,pad+18);}
  ctx.drawImage(image,pad,pad+titleH,w,h);
  let y=pad+titleH+h+10;ctx.font='13px Geist, sans-serif';
  for(const r of legendRows){for(const item of r){ctx.fillStyle=item.color;ctx.fillRect(pad+item.x,y+3,12,12);ctx.fillStyle=text;ctx.fillText(item.label,pad+item.x+18,y+13);}y+=22;}
  ctx.fillStyle=muted;ctx.font='11px Geist, sans-serif';ctx.fillText('Mercado Automotivo · emplacamentos de automóveis e comerciais leves · gerado em '+new Date().toLocaleDateString('pt-BR'),pad,H-pad+4);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=filename.replace(/[^\w.-]+/g,'-')+'.png';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),2000);
 }finally{URL.revokeObjectURL(url);}
}
// Place inside the chart container; it exports the first SVG of the nearest [data-export-root].
function ExportImageButton({name='grafico',title=''}){
 const [busy,setBusy]=React.useState(false);
 const run=async e=>{const root=e.currentTarget.closest('[data-export-root]'),svg=root?.querySelector('svg');if(!svg)return;setBusy(true);try{await exportSvgToPng(svg,{filename:name,title:title||root.getAttribute('data-export-title')||'',legend:exportLegend(root)});}catch(error){globalThis.alert?.(error.message);}finally{setBusy(false);}};
 return jsxRuntime.jsx('button',{type:'button',className:'export-image-button',onClick:run,disabled:busy,title:'Baixar este gráfico como imagem PNG','aria-label':'Baixar gráfico como imagem PNG',children:busy?'Gerando…':'Baixar PNG'});
}
// Print: the whole area with print styles, or a one-page summary of Panorama.
// A temporary header states the area, the filters (from the address bar) and the date.
function printFilterSummary(){
 const params=new URLSearchParams(globalThis.location?.search??''),parts=[];
 for(const [key,value] of params){if(!key.startsWith('f.'))continue;const field=key.slice(2),label=typeof HISTORY_FILTER_LABELS!=='undefined'&&HISTORY_FILTER_LABELS[field]?HISTORY_FILTER_LABELS[field]:field==='date'?'Período':field==='population'?'Universo':field;parts.push(label+': '+value.replace('..',' a ').replace(/,/g,', '));}
 const period=document.querySelector('.mp-strip[data-period]')?.getAttribute('data-period');if(period&&!params.has('f.date'))parts.unshift('Período: '+period);
 return parts.length?parts.join(' · '):'Sem filtros';
}
function printView(mode='area'){
 const root=document.documentElement,hidden=[],header=document.createElement('div');
 const area=document.querySelector('.am-primary-nav [aria-current=page]')?.textContent?.trim()??'Mercado Automotivo';
 header.className='print-header';header.innerHTML='';const strong=document.createElement('strong');strong.textContent='Mercado Automotivo · '+(mode==='summary'?'Resumo':area);const small=document.createElement('span');small.textContent=printFilterSummary()+' · gerado em '+new Date().toLocaleDateString('pt-BR');header.append(strong,small);document.body.prepend(header);
 if(mode==='summary'){
  const keep=[...document.querySelectorAll('.mp-strip,.oi-card,.mp-questions')],path=new Set();
  keep.push(header);for(const el of keep){let n=el;while(n&&n!==document.documentElement){path.add(n);n=n.parentElement;}}
  for(const el of path){if(keep.includes(el))continue;for(const child of el.children)if(!path.has(child)){child.setAttribute('data-print-hide','');hidden.push(child);}}
  root.classList.add('print-summary');
 }
 let finished=false;const done=()=>{if(finished)return;finished=true;for(const el of hidden)el.removeAttribute('data-print-hide');root.classList.remove('print-summary');header.remove();globalThis.removeEventListener('afterprint',done);};
 globalThis.addEventListener('afterprint',done);globalThis.print();setTimeout(done,1500);
}
function PrintButton({mode='area',label='Imprimir ou salvar PDF',className='am-nav-link'}){
 return jsxRuntime.jsxs('button',{type:'button',className,onClick:()=>printView(mode),title:mode==='summary'?'Resumo de uma página: pulso, o que mudou e perguntas rápidas':'Imprime a área atual (ou salve como PDF na janela de impressão)',children:[jsxRuntime.jsx('span',{'aria-hidden':true,children:'⎙ '}),label]});
}
if(typeof module!=='undefined'&&module.exports)module.exports={EXPORT_STYLE_PROPS,exportLegend};
