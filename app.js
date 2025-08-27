// Simple TPV Accesorios - LocalStorage based
const $ = (q,ctx=document)=>ctx.querySelector(q);
const $$ = (q,ctx=document)=>Array.from(ctx.querySelectorAll(q));
const LS_KEYS = {
  INVENTARIO: 'tpv_inv',
  HISTORIAL: 'tpv_hist',
  CONFIG: 'tpv_cfg'
};

const state = {
  inventario: [],
  carrito: [],
  historial: [],
  cfg: {
    nombre: 'Tienda Dinamita',
    direccion: 'Calle Ejemplo 123, Ciudad MX',
    telefono: '+52 5643195153',
    pie: 'Gracias por su compra 💥',
    logoDataUrl: 'assets/logo_default.svg'
  }
};

function money(n){ return (n || 0).toLocaleString('es-MX',{style:'currency',currency:'MXN'}); }
function saveAll(){
  localStorage.setItem(LS_KEYS.INVENTARIO, JSON.stringify(state.inventario));
  localStorage.setItem(LS_KEYS.HISTORIAL, JSON.stringify(state.historial));
  localStorage.setItem(LS_KEYS.CONFIG, JSON.stringify(state.cfg));
  toast('Datos guardados');
}
function loadAll(){
  const inv = JSON.parse(localStorage.getItem(LS_KEYS.INVENTARIO) || '[]');
  const hist = JSON.parse(localStorage.getItem(LS_KEYS.HISTORIAL) || '[]');
  const cfg = JSON.parse(localStorage.getItem(LS_KEYS.CONFIG) || 'null');
  if(inv.length) state.inventario = inv;
  if(hist.length) state.historial = hist;
  if(cfg) Object.assign(state.cfg, cfg);
}

function demoData(){
  state.inventario = [
    {nombre:'Gorra roja', sku:'GOR-001', categoria:'Gorras', precio:199, stock:12, foto:'assets/gorra.svg'},
    {nombre:'Playera negra', sku:'PLY-101', categoria:'Playeras', precio:249, stock:20, foto:'assets/playera.svg'},
    {nombre:'Mochila urbana', sku:'MOC-050', categoria:'Mochilas', precio:499, stock:8, foto:'assets/mochila.svg'},
    {nombre:'Cinturón deportivo', sku:'CIN-300', categoria:'Accesorios', precio:179, stock:15, foto:'assets/cinturon.svg'}
  ];
  renderInventario();
  renderProductos();
  fillCategorias();
}

function init(){
  loadAll();
  // Logo
  $('#logoPreview').src = state.cfg.logoDataUrl || 'assets/logo_default.svg';
  // Tabs
  $$('.tab').forEach(b=>b.addEventListener('click', ()=>switchTab(b.dataset.tab, b)));
  // Buttons
  $('#btnGuardar').addEventListener('click', saveAll);
  $('#btnRestaurarDemo').addEventListener('click', ()=>{ demoData(); toast('Se cargó el demo'); });
  // Ventas
  $('#searchProducto').addEventListener('input', renderProductos);
  $('#filterCategoria').addEventListener('change', renderProductos);
  $('#btnCobrar').addEventListener('click', cobrar);
  $('#btnVaciar').addEventListener('click', ()=>{ state.carrito=[]; renderCarrito();});
  $('#montoRecibido').addEventListener('input', calcCambio);
  $('#metodoPago').addEventListener('change', calcCambio);
  // Inventario
  $('#btnNuevoProd').addEventListener('click', ()=>openProductoDialog());
  $('#btnExportarJSON').addEventListener('click', exportJSON);
  $('#importJSON').addEventListener('change', importJSON);
  // Historial
  $('#btnExportarCSV').addEventListener('click', exportCSV);
  $('#btnBorrarHistorial').addEventListener('click', ()=>{ if(confirm('¿Borrar historial?')){ state.historial=[]; renderHistorial(); saveAll(); }});
  // Config
  $('#cfgNombre').value = state.cfg.nombre;
  $('#cfgDireccion').value = state.cfg.direccion;
  $('#cfgTelefono').value = state.cfg.telefono;
  $('#cfgPie').value = state.cfg.pie;
  $('#cfgLogo').addEventListener('change', handleLogo);
  $('#btnGuardarConfig').addEventListener('click', saveConfig);

  // Render
  if(!state.inventario.length) demoData();
  else { renderInventario(); renderProductos(); fillCategorias(); }
  renderHistorial();
}
document.addEventListener('DOMContentLoaded', init);

function switchTab(tab, btn){
  $$('.tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  $$('.tab-panel').forEach(p=>p.classList.remove('show'));
  $('#'+tab).classList.add('show');
}
function renderProductos(){
  const grid = $('#gridProductos');
  grid.innerHTML='';
  const q = ($('#searchProducto').value || '').toLowerCase();
  const cat = $('#filterCategoria').value || '';
  let items = state.inventario;
  if(q) items = items.filter(p=> [p.nombre,p.sku,p.categoria].join(' ').toLowerCase().includes(q));
  if(cat) items = items.filter(p=> (p.categoria||'') === cat);
  if(!items.length){ grid.innerHTML = `<p class="muted">No hay productos.</p>`; return; }
  items.forEach((p,i)=>{
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <img src="${p.foto||''}" alt="${p.nombre}">
      <div class="info">
        <div class="tag">${p.categoria||'Sin categoría'}</div>
        <div class="name">${p.nombre}</div>
        <div class="price">${money(p.precio)}</div>
        <button class="btn add">Agregar</button>
      </div>`;
    el.querySelector('.add').addEventListener('click', ()=> addCarrito(i));
    grid.appendChild(el);
  });
}
function addCarrito(index){
  const prod = state.inventario[index];
  if(!prod) return;
  const found = state.carrito.find(it=>it.sku===prod.sku);
  if(found) found.cant += 1;
  else state.carrito.push({sku: prod.sku, nombre: prod.nombre, precio: prod.precio, cant: 1, idx: index});
  renderCarrito();
}
function renderCarrito(){
  const list = $('#listaCarrito');
  list.innerHTML='';
  state.carrito.forEach((it,ix)=>{
    const row = document.createElement('div');
    row.className='item';
    row.innerHTML = `
      <div class="name">${it.nombre}</div>
      <div class="qty">
        <button class="btn ghost minus">-</button>
        <input type="number" min="1" step="1" value="${it.cant}" class="q" />
        <button class="btn ghost plus">+</button>
      </div>
      <div class="price">${money(it.precio*it.cant)}</div>
      <div class="remove">✕</div>
    `;
    row.querySelector('.minus').addEventListener('click', ()=>{ it.cant = Math.max(1, it.cant-1); renderCarrito(); });
    row.querySelector('.plus').addEventListener('click', ()=>{ it.cant += 1; renderCarrito(); });
    row.querySelector('.q').addEventListener('input', (e)=>{ it.cant = Math.max(1, parseInt(e.target.value||'1',10)); renderCarrito(); });
    row.querySelector('.remove').addEventListener('click', ()=>{ state.carrito.splice(ix,1); renderCarrito();});
    list.appendChild(row);
  });
  const sub = state.carrito.reduce((s,it)=> s + it.precio*it.cant, 0);
  const iva = sub * 0.16;
  const total = sub + iva;
  $('#subTotal').textContent = money(sub);
  $('#iva').textContent = money(iva);
  $('#total').textContent = money(total);
  calcCambio();
}
function calcCambio(){
  const total = parseFloat($('#total').textContent.replace(/[^\d.,-]/g,'')) || 0;
  const recibido = parseFloat($('#montoRecibido').value || '0');
  const cambio = Math.max(0, recibido - total);
  $('#cambio').textContent = money(cambio);
}
function renderInventario(){
  const tbody = $('#tablaInventario tbody');
  tbody.innerHTML = '';
  state.inventario.forEach((p,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${p.foto||''}" alt=""></td>
      <td>${p.nombre}</td>
      <td>${p.sku||''}</td>
      <td>${p.categoria||''}</td>
      <td>${money(p.precio)}</td>
      <td>${p.stock}</td>
      <td>
        <button class="btn ghost edit">Editar</button>
        <button class="btn ghost del">Borrar</button>
      </td>
    `;
    tr.querySelector('.edit').addEventListener('click', ()=>openProductoDialog(p,i));
    tr.querySelector('.del').addEventListener('click', ()=>{ if(confirm('¿Borrar producto?')){ state.inventario.splice(i,1); renderInventario(); renderProductos(); saveAll(); }});
    tbody.appendChild(tr);
  });
}
function fillCategorias(){
  const sel = $('#filterCategoria');
  const cats = Array.from(new Set(state.inventario.map(p=>p.categoria).filter(Boolean))).sort();
  sel.innerHTML = '<option value="">Categorías</option>' + cats.map(c=>`<option value="${c}">${c}</option>`).join('');
}
function openProductoDialog(p=null, idx=null){
  $('#dlgTitle').textContent = p? 'Editar producto' : 'Nuevo producto';
  $('#pNombre').value = p?.nombre || '';
  $('#pSKU').value = p?.sku || '';
  $('#pCategoria').value = p?.categoria || '';
  $('#pPrecio').value = p?.precio || 0;
  $('#pStock').value = p?.stock || 0;
  $('#pFoto').value = '';
  $('#pIndex').value = idx!=null? String(idx) : '';
  $('#dlgProducto').showModal();
}
$('#btnGuardarProducto')?.addEventListener('click', (e)=>{
  e.preventDefault();
  const nombre = $('#pNombre').value.trim();
  const sku = $('#pSKU').value.trim();
  const categoria = $('#pCategoria').value.trim();
  const precio = parseFloat($('#pPrecio').value||'0');
  const stock = parseInt($('#pStock').value||'0',10);
  const idx = $('#pIndex').value ? parseInt($('#pIndex').value,10) : null;
  const file = $('#pFoto').files[0];
  const saveProduct = (foto)=>{
    const obj = {nombre, sku, categoria, precio, stock, foto};
    if(idx!=null){ state.inventario[idx] = obj; }
    else state.inventario.push(obj);
    renderInventario(); renderProductos(); fillCategorias(); saveAll();
    $('#dlgProducto').close();
  };
  if(file){
    const reader = new FileReader();
    reader.onload = ()=> saveProduct(reader.result);
    reader.readAsDataURL(file);
  } else {
    const foto = (idx!=null && state.inventario[idx]) ? state.inventario[idx].foto : '';
    saveProduct(foto);
  }
});

function exportJSON(){
  const data = JSON.stringify(state.inventario, null, 2);
  downloadFile('inventario.json', data, 'application/json');
}
function importJSON(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const arr = JSON.parse(reader.result);
      if(Array.isArray(arr)){ state.inventario = arr; renderInventario(); renderProductos(); fillCategorias(); saveAll(); toast('Inventario importado'); }
      else alert('JSON inválido');
    }catch(err){ alert('JSON inválido'); }
  };
  reader.readAsText(file);
}

function exportCSV(){
  const rows = [['Folio','Fecha','Total','Método','Artículos']];
  state.historial.forEach(h=>{
    rows.push([h.folio, h.fecha, h.total, h.metodo, h.items.map(i=>`${i.nombre} x${i.cant}`).join('; ')]);
  });
  const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  downloadFile('historial.csv', csv, 'text/csv');
}

function handleLogo(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    state.cfg.logoDataUrl = reader.result;
    $('#logoPreview').src = reader.result;
  };
  reader.readAsDataURL(file);
}
function saveConfig(){
  state.cfg.nombre = $('#cfgNombre').value.trim() || 'Tienda Dinamita';
  state.cfg.direccion = $('#cfgDireccion').value.trim() || '';
  state.cfg.telefono = $('#cfgTelefono').value.trim() || '';
  state.cfg.pie = $('#cfgPie').value.trim() || 'Gracias por su compra 💥';
  saveAll();
  toast('Configuración guardada');
}

function cobrar(){
  if(!state.carrito.length){ alert('Agrega productos al carrito'); return; }
  // stock check
  for(const it of state.carrito){
    const prod = state.inventario.find(p=>p.sku===it.sku);
    if(!prod || prod.stock < it.cant){
      alert(`Stock insuficiente: ${it.nombre}`);
      return;
    }
  }
  const sub = state.carrito.reduce((s,it)=> s + it.precio*it.cant, 0);
  const iva = sub * 0.16;
  const total = sub + iva;
  const metodo = $('#metodoPago').value;
  const recibido = parseFloat($('#montoRecibido').value || '0');
  if(metodo==='efectivo' && recibido < total){
    if(!confirm('El monto recibido en efectivo es menor al total. ¿Continuar de todos modos?')) return;
  }
  // Descontar stock
  state.carrito.forEach(it=>{
    const prod = state.inventario.find(p=>p.sku===it.sku);
    prod.stock -= it.cant;
  });
  // Guardar venta
  const folio = 'F' + Date.now().toString().slice(-8);
  const venta = {
    folio,
    fecha: new Date().toLocaleString('es-MX'),
    total: money(total),
    metodo,
    items: state.carrito.map(it=>({nombre:it.nombre, cant:it.cant, precio: money(it.precio)}))
  };
  state.historial.unshift(venta);
  saveAll();
  renderInventario();
  renderHistorial();
  // Ticket
  imprimirTicket({folio, sub, iva, total, metodo, recibido, items: state.carrito});
  // Reset carrito
  state.carrito = [];
  renderCarrito();
  $('#montoRecibido').value = '';
}

function renderHistorial(){
  const tbody = $('#tablaHistorial tbody');
  tbody.innerHTML = '';
  state.historial.forEach(h=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${h.folio}</td><td>${h.fecha}</td><td>${h.total}</td><td>${h.metodo}</td><td>${h.items.map(i=>`${i.nombre} x${i.cant}`).join('; ')}</td>`;
    tbody.appendChild(tr);
  });
}

function imprimirTicket({folio, sub, iva, total, metodo, recibido, items}){
  const doc = `<!doctype html>
  <html><head><meta charset="utf-8"><title>Ticket</title>
  <link rel="stylesheet" href="style.css"></head>
  <body onload="window.print(); setTimeout(()=>window.close(), 500);">
    <div class="ticket">
      <div class="center">
        <img src="${state.cfg.logoDataUrl}" alt="Logo">
        <div class="bold">${state.cfg.nombre}</div>
        <small>${state.cfg.direccion || ''}</small><br/>
        <small>${state.cfg.telefono || ''}</small>
      </div>
      <div class="line"></div>
      <div>Folio: <span class="bold">${folio}</span></div>
      <div>Fecha: ${new Date().toLocaleString('es-MX')}</div>
      <div class="line"></div>
      ${items.map(i=>`<div>${i.nombre} x${i.cant} <span style="float:right">${money(i.precio*i.cant)}</span></div>`).join('')}
      <div class="line"></div>
      <div>Subtotal <span style="float:right">${money(sub)}</span></div>
      <div>IVA 16% <span style="float:right">${money(iva)}</span></div>
      <div class="bold">TOTAL <span style="float:right">${money(total)}</span></div>
      <div class="line"></div>
      <div>Método: ${metodo}</div>
      ${metodo==='efectivo' ? `<div>Recibido: ${money(recibido)}</div><div>Cambio: ${money(Math.max(0, recibido-total))}</div>`: ''}
      <div class="center"><small>${state.cfg.pie}</small></div>
    </div>
  </body></html>`;
  const frame = document.getElementById('ticketFrame');
  const blob = new Blob([doc], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  frame.src = url;
}

function downloadFile(name, content, mime){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], {type:mime}));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function toast(msg){
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, {
    position:'fixed', bottom:'16px', left:'50%', transform:'translateX(-50%)',
    background:'#111', color:'#fff', padding:'10px 14px', borderRadius:'12px', zIndex:9999
  });
  document.body.appendChild(t);
  setTimeout(()=> t.remove(), 1600);
}

// Fill config inputs when entering config tab
$('#cfgNombre')?.addEventListener('focus', ()=>{
  $('#cfgNombre').value = state.cfg.nombre;
  $('#cfgDireccion').value = state.cfg.direccion;
  $('#cfgTelefono').value = state.cfg.telefono;
  $('#cfgPie').value = state.cfg.pie;
});

