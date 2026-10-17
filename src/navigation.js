// Registered leaf IDs are stable contracts for old links, favorites and history.
const marketTabs=[{id:'dashboard',label:'Panorama',previousLabels:['Visão geral']},{id:'history',label:'Evolução'},{id:'competition',label:'Marcas e modelos'},{id:'ranking',label:'Ranking'},{id:'segments',label:'Estrutura BD'},{id:'structure',label:'Pirâmide BD'},{id:'technology',label:'Propulsão'},{id:'origin',label:'Origem'},{id:'geography',label:'Territórios',previousLabels:['Mapa do mercado']},{id:'explore',label:'Explorar'},{id:'animations',label:'Animações'},{id:'models',label:'Economia',previousLabels:['Cenários','Modelos e cenários']},{id:'quality',label:'Dados e metodologia',previousLabels:['Dados e atualização']}];
const marketNavigation=[
 {id:'dashboard',label:'Panorama',routes:['dashboard']},
 {id:'history',label:'Evolução',routes:['history']},
 {id:'competition',label:'Concorrência',routes:['competition','ranking']},
 {id:'segments',label:'Segmentos',routes:['segments','structure','technology','origin']},
 {id:'geography',label:'Territórios',routes:['geography']},
 {id:'explore',label:'Explorar',routes:['explore']},
 {id:'models',label:'Economia',routes:['models']},
 {id:'animations',label:'Animações',routes:['animations']}
];
function navigationLocation(tab,explorationView){
 const leaf=tab==='explore'&&explorationView==='structure'?'structure':tab;
 return {leaf,group:marketNavigation.find(group=>group.routes.includes(leaf))??null,label:marketTabs.find(item=>item.id===leaf)?.label??'Panorama'};
}
const EVOLUTION_TABS=[{value:'executive',label:'Executiva'},{value:'composition',label:'Composição'},{value:'growth',label:'Crescimento'}];
function MarketNavigation({tab,explorationView,onNavigate}){
 const location=navigationLocation(tab,explorationView);
 return jsxRuntime.jsx('nav',{'aria-label':'Áreas do mercado',className:'am-primary-nav',children:marketNavigation.map(group=>jsxRuntime.jsx('button',{type:'button',className:'am-nav-link','aria-current':location.group?.id===group.id?'page':undefined,onClick:()=>onNavigate(group.id),children:group.label},group.id))});
}
// Every area uses the same second row, outside the shell's primary header.
// Leaf routes keep their URL contracts; analytical views keep their own state.
// The address bar already carries the area and the filters: copy it to share this exact view.
function CopyViewLink(){
 const [status,setStatus]=React.useState(''),timer=React.useRef(null);
 React.useEffect(()=>()=>clearTimeout(timer.current),[]);
 const copy=async()=>{const url=globalThis.location?.href??'';let ok=false;try{await navigator.clipboard.writeText(url);ok=true;}catch{const area=document.createElement('textarea');area.value=url;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();try{ok=document.execCommand('copy');}catch{}area.remove();}
  setStatus(ok?'Link copiado':'Copie o endereço do navegador');clearTimeout(timer.current);timer.current=setTimeout(()=>setStatus(''),2500);};
 return jsxRuntime.jsxs('button',{type:'button',className:'am-nav-link am-copy-link',onClick:copy,title:'Copia um link com esta área e estes filtros',children:[jsxRuntime.jsx('span',{'aria-hidden':true,children:'🔗 '}),jsxRuntime.jsx('span',{'aria-live':'polite',children:status||'Copiar link'})]});
}
function MarketSubnavigation({tab,explorationView,onNavigate,evolutionView='executive',onEvolutionView,scenarioView='diagnostic',onScenarioView}){
 const location=navigationLocation(tab,explorationView);
 const options=tab==='history'?EVOLUTION_TABS:tab==='models'?SCENARIO_TABS:(location.group?.routes??[tab]).map(id=>({value:id,label:marketTabs.find(item=>item.id===id)?.label??location.label}));
 const value=tab==='history'?evolutionView:tab==='models'?scenarioView:location.leaf;
 const choose=tab==='history'?onEvolutionView:tab==='models'?onScenarioView:onNavigate;
 return jsxRuntime.jsxs('div',{className:'am-subnavigation',children:[jsxRuntime.jsx('nav',{'aria-label':'Análises de '+(location.group?.label??location.label),className:'am-leaf-nav',children:options.map(item=>jsxRuntime.jsx('button',{type:'button',className:'am-nav-link','aria-current':value===item.value?'page':undefined,onClick:()=>choose?.(item.value),children:item.label},item.value))}),jsxRuntime.jsxs('nav',{'aria-label':'Compartilhar e documentação',className:'am-secondary-nav',children:[jsxRuntime.jsx(CopyViewLink,{}),typeof PrintButton==='function'&&jsxRuntime.jsx(PrintButton,{label:'Imprimir / PDF'}),jsxRuntime.jsx('button',{type:'button',className:'am-nav-link','aria-current':tab==='quality'?'page':undefined,onClick:()=>onNavigate('quality'),children:'Dados e metodologia'})]})]});
}

function MarketIdentity(){
 return jsxRuntime.jsxs('div',{className:'am-market-identity',children:[
  jsxRuntime.jsxs('svg',{className:'am-market-logo',viewBox:'0 0 64 64','aria-hidden':true,focusable:false,children:[
   jsxRuntime.jsx('rect',{x:1,y:1,width:62,height:62,rx:19,fill:'var(--surface)',stroke:'var(--border-strong)'}),
   jsxRuntime.jsx('path',{d:'M12 42 20 24h24l8 18M16 34h32M20 24l5-6h14l5 6',fill:'none',stroke:'var(--accent)',strokeWidth:3,strokeLinecap:'round',strokeLinejoin:'round'}),
   jsxRuntime.jsx('path',{d:'M18 45h28M25 39v-6m7 6V27m7 12v-9',fill:'none',stroke:'var(--accent)',strokeWidth:3,strokeLinecap:'round'}),
   jsxRuntime.jsx('circle',{cx:19,cy:46,r:4,fill:'var(--accent)'}),jsxRuntime.jsx('circle',{cx:45,cy:46,r:4,fill:'var(--accent)'})
  ]}),
  jsxRuntime.jsxs('div',{children:[jsxRuntime.jsx('span',{className:'am-market-eyebrow',children:'Inteligência de mercado'}),jsxRuntime.jsx('h1',{children:'Mercado Automotivo'})]})
 ]});
}
// Move the authored header into the existing shell topbar; keep a usable inline
// fallback while mounting and when the host is absent. React owns all controls.
function MarketHeader(props){
 const [host,setHost]=React.useState(null);
 React.useEffect(()=>{
  const target=document.querySelector('.dashboard-topbar-copy');
  if(!target)return;
  const node=document.createElement('div');node.className='am-header-host';target.appendChild(node);setHost(node);
  return ()=>{node.remove();};
 },[]);
 const content=jsxRuntime.jsxs('header',{className:'am-masthead',children:[jsxRuntime.jsx(MarketIdentity,{}),jsxRuntime.jsx(MarketNavigation,props)]});
 return host?require('react-dom').createPortal(content,host):content;
}
