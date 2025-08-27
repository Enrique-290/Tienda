
const STORE_KEY = 'tpv_moda_demo';
const DEFAULT_STATE = {
  business: { name:'Tu Tienda', logo:'', address:'', phone:'' },
  products:[
    {id:'BAG001', name:'Bolsa Elegante Negra', cat:'Bolsas', price:899, stock:5, color:'Negro', talla:'', img:'https://picsum.photos/seed/bolsa/100'},
    {id:'PUL001', name:'Pulsera Dorada', cat:'Pulseras', price:199, stock:12, color:'Dorado', talla:'', img:'https://picsum.photos/seed/pulsera/100'},
    {id:'ANI001', name:'Anillo Plata 925', cat:'Anillos', price:349, stock:8, talla:'7', color:'Plata', img:'https://picsum.photos/seed/anillo/100'},
    {id:'CAM001', name:'Camisa Casual Blanca', cat:'Ropa', price:499, stock:10, talla:'M', color:'Blanco', img:'https://picsum.photos/seed/camisa/100'}
  ],
  sales:[]
};
let state = loadState();
function loadState(){ try{return JSON.parse(localStorage.getItem(STORE_KEY))||DEFAULT_STATE}catch{return DEFAULT_STATE}}
function saveState(){ localStorage.setItem(STORE_KEY,JSON.stringify(state))}

const drawer=document.getElementById('drawer');
const btnMenu=document.getElementById('btnMenu');
btnMenu.onclick=()=>drawer.classList.toggle('open');

const list=document.getElementById('list');
const search=document.getElementById('search');

function renderInventario(){
  list.innerHTML='';
  const q=(search.value||'').toLowerCase();
  state.products.filter(p=>!q||p.name.toLowerCase().includes(q)||p.id.toLowerCase().includes(q)).forEach(p=>{
    const card=document.createElement('div');card.className='card';
    card.innerHTML=`<div class='thumb'>${p.img?`<img src='${p.img}'/>`:p.name[0]}</div>
    <div><div class='name'>${p.name}</div><div class='sku'>${p.cat} · ${p.color||''} ${p.talla||''}</div></div>
    <div class='price'>$${p.price}</div>`;
    list.appendChild(card);
  });
}
search.oninput=renderInventario;
renderInventario();
