const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const state = {
  productos: [],
  registros: [],
  filtroTipo: 'TODOS',
  busquedaReg: '',
  busquedaProd: '',
  productoEdit: null,
  registroEdit: null,
  confirmAction: null,
  exportando: false
};

/* ---------- helpers ---------- */

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function fmtFecha(dt) {
  if (!dt) return '—';
  const s = String(dt);
  const [d, t] = s.split(' ');
  if (!d) return esc(s);
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y} · ${(t || '').slice(0, 5)}`;
}

function toast(msg, type = 'success') {
  const iconos = { success: 'check-circle-fill', danger: 'x-circle-fill', warning: 'exclamation-triangle-fill', info: 'info-circle-fill' };
  const el = document.createElement('div');
  el.className = `toast-app ${type}`;
  el.innerHTML = `<i class="bi bi-${iconos[type] || 'info-circle'}"></i><span class="t-msg">${esc(msg)}</span>`;
  $('#toasts').appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, 3400);
}

function countUp(el, target, sufijo = '') {
  const dur = 900;
  const start = performance.now();
  const from = 0;
  const step = t => {
    const k = Math.min(1, (t - start) / dur);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(from + (target - from) * eased).toLocaleString('es-PE') + sufijo;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function validarPlaca(v) {
  return /^[A-Z]{3}-\d{3}$/.test(String(v || '').trim());
}

/* ---------- navegación ---------- */

function navigate(view) {
  $$('.nav-link-module').forEach(a => a.classList.toggle('active', a.dataset.view === view));
  $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${view}`));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (view === 'dashboard') cargarDashboard();
}

$$('.nav-link-module').forEach(a => a.addEventListener('click', () => navigate(a.dataset.view)));

/* ---------- reloj ---------- */

function tick() {
  const n = new Date();
  const fecha = n.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  const hora = n.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const chip = $('#chipReloj');
  if (chip) chip.textContent = `${fecha.charAt(0).toUpperCase() + fecha.slice(1)} · ${hora}`;
  const relojModal = $('#relojModal');
  if (relojModal) relojModal.textContent = hora;
}
setInterval(tick, 1000);

/* ---------- productos ---------- */

async function cargarProductos() {
  state.productos = await api('/productos');
  poblarSelects();
  renderProductos();
}

function poblarSelects() {
  const hay = state.productos.length > 0;
  const opciones = state.productos
    .filter(p => p.activo)
    .map(p => `<option value="${p.id}">${esc(p.nombre)} · ${esc(p.unidad)}</option>`)
    .join('');
  const base = `<option value="" selected disabled>${hay ? 'Selecciona un producto…' : 'No hay productos disponibles'}</option>`;
  $('#selProducto').innerHTML = base + opciones;
  $('#editSelProducto').innerHTML = base + opciones;
  $('#warnSinProductos').classList.toggle('d-none', hay);
}

function renderProductos() {
  const q = state.busquedaProd.toLowerCase();
  const lista = state.productos.filter(p =>
    !q || `${p.nombre} ${p.codigo}`.toLowerCase().includes(q)
  );

  $('#contadorProductos').textContent = `${lista.length} de ${state.productos.length}`;
  $('#skeletonProductos').classList.add('d-none');

  const vacio = lista.length === 0;
  $('#emptyProductos').classList.toggle('d-none', !vacio);
  $('#wrapTablaProductos').classList.toggle('d-none', vacio);
  $('#btnNuevoProductoEmpty').classList.toggle('d-none', state.productos.length > 0);
  $('#emptyProductosTitulo').textContent = state.productos.length === 0 ? 'No hay productos' : 'Sin resultados';
  $('.empty-state#emptyProductos p').textContent =
    state.productos.length === 0
      ? 'Crea tu primer producto para poder registrarlo en los movimientos.'
      : 'Prueba con otro término de búsqueda.';

  if (!vacio) {
    $('#tbodyProductos').innerHTML = lista.map((p, i) => `
      <tr style="--d:${Math.min(i * .04, .35)}s">
        <td><span class="badge badge-code">${esc(p.codigo)}</span></td>
        <td>
          <span class="prod-name">${esc(p.nombre)}</span><br>
          <span class="prod-meta d-md-none">${esc(p.descripcion || 'Sin descripción')}</span>
        </td>
        <td class="d-none d-md-table-cell"><span class="text-muted-lila small">${esc(p.descripcion || '—')}</span></td>
        <td><span class="badge badge-placa">${esc(p.unidad)}</span></td>
        <td class="text-center">
          <span class="badge ${p.activo ? 'badge-activo' : 'badge-inactivo'}">${p.activo ? 'Activo' : 'Inactivo'}</span>
        </td>
        <td class="d-none d-lg-table-cell text-center"><span class="badge badge-count">${p.total_registros}</span></td>
        <td class="text-end text-nowrap">
          <button class="btn-action" data-action="edit-producto" data-id="${p.id}" title="Editar"><i class="bi bi-pencil-square"></i></button>
          <button class="btn-action danger" data-action="del-producto" data-id="${p.id}" title="Eliminar"><i class="bi bi-trash3"></i></button>
        </td>
      </tr>`).join('');
  }
}

$('#inpBuscarProducto').addEventListener('input', e => {
  state.busquedaProd = e.target.value;
  renderProductos();
});

function abrirModalProducto(p = null) {
  state.productoEdit = p;
  $('#tituloModalProducto').textContent = p ? 'Editar producto' : 'Nuevo producto';
  $('#inpNombreProd').value = p?.nombre || '';
  $('#selUnidad').value = p?.unidad || 'Unidad';
  $('#txtDescProd').value = p?.descripcion || '';
  $('#chkActivo').checked = p ? !!p.activo : true;
  $('#lblActivo').textContent = (p ? !!p.activo : true) ? 'Activo' : 'Inactivo';
  $('#inpNombreProd').classList.remove('is-invalid');
  bootstrap.Modal.getOrCreateInstance($('#modalProducto')).show();
}

$('#chkActivo').addEventListener('change', () => {
  $('#lblActivo').textContent = $('#chkActivo').checked ? 'Activo' : 'Inactivo';
});

$('#btnNuevoProducto').addEventListener('click', () => abrirModalProducto());
$('#btnNuevoProductoEmpty').addEventListener('click', () => abrirModalProducto());

$('#btnGuardarProducto').addEventListener('click', async () => {
  const nombre = $('#inpNombreProd').value.trim();
  if (!nombre) {
    $('#inpNombreProd').classList.add('is-invalid');
    toast('El nombre del producto es obligatorio', 'warning');
    return;
  }
  const btn = $('#btnGuardarProducto');
  btn.disabled = true;
  btn.querySelector('.spinner-border').classList.remove('d-none');
  try {
    const body = {
      nombre,
      unidad: $('#selUnidad').value,
      descripcion: $('#txtDescProd').value.trim(),
      activo: $('#chkActivo').checked
    };
    if (state.productoEdit) {
      await api(`/productos/${state.productoEdit.id}`, { method: 'PUT', body });
      toast(`Producto "${nombre}" actualizado`);
    } else {
      await api('/productos', { method: 'POST', body });
      toast(`Producto "${nombre}" creado`);
    }
    bootstrap.Modal.getOrCreateInstance($('#modalProducto')).hide();
    await cargarProductos();
  } catch (err) {
    toast(err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.querySelector('.spinner-border').classList.add('d-none');
  }
});

function confirmar({ titulo, mensaje, onOk }) {
  $('#confirmTitulo').textContent = titulo;
  $('#confirmMensaje').textContent = mensaje;
  state.confirmAction = onOk;
  bootstrap.Modal.getOrCreateInstance($('#modalConfirm')).show();
}

$('#btnConfirmOk').addEventListener('click', async () => {
  if (!state.confirmAction) return;
  const fn = state.confirmAction;
  state.confirmAction = null;
  bootstrap.Modal.getOrCreateInstance($('#modalConfirm')).hide();
  try { await fn(); } catch (err) { toast(err.message, 'danger'); }
});

/* ---------- registros ---------- */

async function cargarRegistros() {
  $('#skeletonRegistros').classList.remove('d-none');
  $('#wrapTablaRegistros').classList.add('d-none');
  $('#emptyRegistros').classList.add('d-none');
  state.registros = await api('/registros');
  renderRegistros();
}

function registrosFiltrados() {
  const q = state.busquedaReg.toLowerCase();
  return state.registros.filter(r => {
    if (state.filtroTipo !== 'TODOS' && r.tipo !== state.filtroTipo) return false;
    if (!q) return true;
    return [r.codigo, r.placa, r.producto_nombre].some(v =>
      String(v ?? '').toLowerCase().includes(q)
    );
  });
}

function renderRegistros() {
  const total = state.registros.length;
  const lista = registrosFiltrados();
  const hay = total > 0;

  const n = new Date();
  const isoHoy = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  const deHoy = state.registros.filter(r => String(r.fecha_hora).slice(0, 10) === isoHoy);
  $('#chipHoyTotal').textContent = deHoy.length;
  $('#chipHoyEnt').textContent = deHoy.filter(r => r.tipo === 'ENTREGA').length;
  $('#chipHoyDev').textContent = deHoy.filter(r => r.tipo === 'DEVOLUCION').length;

  $('#contadorRegistros').textContent = hay ? `${lista.length} de ${total} registros` : 'Sin registros';
  $('#skeletonRegistros').classList.add('d-none');

  const mostrarVacio = !hay || lista.length === 0;
  $('#wrapTablaRegistros').classList.toggle('d-none', mostrarVacio);
  $('#emptyRegistros').classList.toggle('d-none', !mostrarVacio);
  $('#btnNuevoRegistroEmpty').classList.toggle('d-none', !hay);
  $('#emptyRegistrosTitulo').textContent = !hay ? 'Sin registros todavía' : 'Sin resultados';
  $('.empty-state#emptyRegistros p').textContent = !hay
    ? 'Cuando registres una entrega o devolución aparecerá aquí.'
    : 'Ningún registro coincide con el filtro aplicado.';

  if (!mostrarVacio) {
    $('#tbodyRegistros').innerHTML = lista.map((r, i) => `
      <tr style="--d:${Math.min(i * .035, .4)}s">
        <td><span class="badge badge-code">${esc(r.codigo)}</span></td>
        <td><span class="badge ${r.tipo === 'ENTREGA' ? 'badge-entrega' : 'badge-devolucion'}">${r.tipo === 'ENTREGA' ? 'Entrega' : 'Devolución'}</span></td>
        <td>
          <span class="prod-name">${esc(r.producto_nombre)}</span><br>
          <span class="prod-meta">${esc(r.producto_codigo)} · ${esc(r.unidad)}</span>
        </td>
        <td class="text-center">
          <span class="cantidad-chip ${r.tipo === 'ENTREGA' ? 'pos' : 'neg'}">${r.tipo === 'ENTREGA' ? '+' : '−'}${r.cantidad}</span>
        </td>
        <td><span class="badge badge-placa">${esc(r.placa)}</span></td>
        <td><span class="small text-muted-lila" style="white-space:nowrap">${fmtFecha(r.fecha_hora)}</span></td>
        <td class="text-end text-nowrap">
          <button class="btn-action" data-action="edit-registro" data-id="${r.id}" title="Editar"><i class="bi bi-pencil-square"></i></button>
          <button class="btn-action danger" data-action="del-registro" data-id="${r.id}" title="Eliminar"><i class="bi bi-trash3"></i></button>
        </td>
      </tr>`).join('');
  }
}

$('#inpBuscarRegistro').addEventListener('input', e => {
  state.busquedaReg = e.target.value;
  renderRegistros();
});

$$('.chip-filtro').forEach(ch => ch.addEventListener('click', () => {
  $$('.chip-filtro').forEach(c => c.classList.remove('active'));
  ch.classList.add('active');
  state.filtroTipo = ch.dataset.filtro;
  renderRegistros();
}));

$('#btnRecargarRegistros').addEventListener('click', async () => {
  try {
    await cargarRegistros();
    toast('Historial actualizado', 'info');
  } catch (err) { toast(err.message, 'danger'); }
});

/* ---------- exportación a excel ---------- */

function resetBtnExport(ok = false) {
  const btn = $('#btnExportar');
  btn.classList.remove('is-loading');
  btn.querySelector('.be-spinner').classList.add('d-none');
  if (ok) {
    btn.classList.add('is-ok');
    btn.querySelector('.be-ico').classList.add('d-none');
    btn.querySelector('.be-done').classList.remove('d-none');
    btn.querySelector('.be-label').textContent = '¡Exportado!';
    setTimeout(() => {
      btn.classList.remove('is-ok');
      btn.querySelector('.be-done').classList.add('d-none');
      btn.querySelector('.be-ico').classList.remove('d-none');
      btn.querySelector('.be-label').textContent = 'Exportar';
      btn.disabled = false;
      state.exportando = false;
    }, 1600);
  } else {
    btn.querySelector('.be-label').textContent = 'Exportar';
    btn.disabled = false;
    state.exportando = false;
  }
}

async function exportarRegistrosExcel() {
  if (state.exportando) return;

  const lista = registrosFiltrados();
  if (!lista.length) {
    toast('No hay registros para exportar con los filtros actuales', 'warning');
    return;
  }

  state.exportando = true;
  const btn = $('#btnExportar');
  btn.disabled = true;
  btn.classList.add('is-loading');
  btn.querySelector('.be-spinner').classList.remove('d-none');
  btn.querySelector('.be-ico').classList.add('d-none');
  btn.querySelector('.be-label').textContent = 'Generando…';

  try {
    await new Promise(r => setTimeout(r, 800));

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Registros', { views: [{ state: 'frozen', ySplit: 3 }] });

    ws.columns = [{ width: 17 }, { width: 13 }, { width: 34 }, { width: 10 }, { width: 10 }, { width: 11 }, { width: 21 }, { width: 32 }];

    ws.mergeCells('A1:H1');
    const titulo = ws.getCell('A1');
    titulo.value = `Historial de movimientos · Suministros Farmacias Peruanas`;
    titulo.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FF5B21B6' } };
    titulo.alignment = { vertical: 'middle' };
    ws.getRow(1).height = 26;

    ws.mergeCells('A2:H2');
    const sub = ws.getCell('A2');
    sub.value = `Exportado el ${new Date().toLocaleString('es-PE')} · ${lista.length} registro(s)`;
    sub.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF8A84A3' } };

    const headerRow = ws.getRow(3);
    headerRow.values = ['Código', 'Tipo', 'Producto', 'Cantidad', 'Unidad', 'Placa', 'Fecha y hora', 'Observación'];
    headerRow.height = 22;
    headerRow.eachCell(c => {
      c.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
      c.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    lista.forEach((r, i) => {
      const row = ws.addRow([
        r.codigo,
        r.tipo === 'ENTREGA' ? 'Entrega' : 'Devolución',
        r.producto_nombre,
        Number(r.cantidad),
        r.unidad,
        r.placa,
        fmtFecha(r.fecha_hora),
        r.observacion || ''
      ]);
      row.getCell(4).alignment = { horizontal: 'center' };
      row.getCell(6).font = { name: 'Consolas', size: 10 };
      row.getCell(2).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: r.tipo === 'ENTREGA' ? 'FF0F9D63' : 'FFD6336C' } };
      if (i % 2 === 0) {
        row.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F5FF' } }; });
      }
      row.eachCell(c => { c.border = { bottom: { style: 'hair', color: { argb: 'FFECE7F8' } } }; });
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const f = new Date();
    const stamp = `${f.getFullYear()}${String(f.getMonth() + 1).padStart(2, '0')}${String(f.getDate()).padStart(2, '0')}_${String(f.getHours()).padStart(2, '0')}${String(f.getMinutes()).padStart(2, '0')}`;
    a.href = url;
    a.download = `Registros_${stamp}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    resetBtnExport(true);
    toast(`Excel generado con ${lista.length} registro(s)`);
  } catch (err) {
    toast(err.message, 'danger');
    resetBtnExport(false);
  }
}

$('#btnExportar').addEventListener('click', exportarRegistrosExcel);

/* máscara automática de placa ABC-123 */
function actualizarPreviewCodigo() {
  const el = $('#previewCodigo');
  if (!el) return;
  const placa = $('#inpPlaca').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const pid = $('#selProducto').value;
  const cantidad = parseInt($('#inpCantidad').value, 10);
  if (!placa || placa.length < 6 || !pid || !(cantidad >= 1)) {
    el.textContent = `${placa || '···'}-····`;
    return;
  }
  el.textContent = `${placa}-${fnvBase36(`${placa}|${pid}|${cantidad}`)}`;
}

function fnvBase36(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).toUpperCase().padStart(4, '0').slice(0, 4);
}

$('#inpPlaca').addEventListener('input', e => {
  let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  if (v.length > 3) v = `${v.slice(0, 3)}-${v.slice(3)}`;
  e.target.value = v;
  actualizarPreviewCodigo();
});
$('#selProducto').addEventListener('change', actualizarPreviewCodigo);
$('#inpCantidad').addEventListener('input', actualizarPreviewCodigo);
$('#editPlaca').addEventListener('input', e => {
  let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  if (v.length > 3) v = `${v.slice(0, 3)}-${v.slice(3)}`;
  e.target.value = v;
});

const hintsTipo = {
  ENTREGA: '<i class="bi bi-info-circle"></i> La entrega <b>suma</b> stock al producto.',
  DEVOLUCION: '<i class="bi bi-info-circle"></i> La devolución <b>resta</b> stock al producto.'
};
$$('input[name="tipo"]').forEach(r => r.addEventListener('change', () => {
  $('#hintTipo').innerHTML = hintsTipo[r.value];
}));

function abrirRegistroNuevo() {
  ['#selProducto', '#inpCantidad', '#inpPlaca'].forEach(s => $(s).classList.remove('is-invalid'));
  $('#formRegistro').reset();
  $('#tipoEntrega').checked = true;
  $('#hintTipo').innerHTML = hintsTipo.ENTREGA;
  $('#inpCantidad').value = 1;
  $('#selProducto').selectedIndex = 0;
  actualizarPreviewCodigo();
  tick();
  bootstrap.Modal.getOrCreateInstance($('#modalNuevoRegistro')).show();
}

$('#btnAbrirRegistro').addEventListener('click', abrirRegistroNuevo);
$('#btnNuevoRegistroEmpty').addEventListener('click', abrirRegistroNuevo);

$('#formRegistro').addEventListener('submit', async e => {
  e.preventDefault();

  const tipo = $('input[name="tipo"]:checked').value;
  const selProducto = $('#selProducto');
  const inpCantidad = $('#inpCantidad');
  const inpPlaca = $('#inpPlaca');
  const productoId = parseInt(selProducto.value, 10);
  const cantidad = parseInt(inpCantidad.value, 10);
  const placa = inpPlaca.value.trim().toUpperCase();

  let ok = true;
  selProducto.classList.remove('is-invalid');
  inpCantidad.classList.remove('is-invalid');
  inpPlaca.classList.remove('is-invalid');

  if (!productoId) { selProducto.classList.add('is-invalid'); ok = false; }
  if (!(cantidad >= 1)) { inpCantidad.classList.add('is-invalid'); ok = false; }
  if (!validarPlaca(placa)) { inpPlaca.classList.add('is-invalid'); ok = false; }

  if (!ok) { toast('Revisa los campos marcados en rojo', 'warning'); return; }

  const btn = $('#btnGuardarRegistro');
  btn.disabled = true;
  btn.querySelector('.spinner-border').classList.remove('d-none');

  try {
    const nuevo = await api('/registros', {
      method: 'POST',
      body: {
        tipo,
        producto_id: productoId,
        cantidad,
        placa,
        observacion: $('#inpObs').value.trim()
      }
    });
    toast(`Registro ${nuevo.codigo} guardado correctamente`);
    e.target.reset();
    $('#tipoEntrega').checked = true;
    $('#hintTipo').innerHTML = hintsTipo.ENTREGA;
    selProducto.selectedIndex = 0;
    actualizarPreviewCodigo();
    bootstrap.Modal.getOrCreateInstance($('#modalNuevoRegistro')).hide();
    await cargarRegistros();
    poblarSelects();
  } catch (err) {
    toast(err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.querySelector('.spinner-border').classList.add('d-none');
  }
});

function abrirModalRegistro(r) {
  state.registroEdit = r;
  $('#editCodigoChip').textContent = `Código ${r.codigo} · ${fmtFecha(r.fecha_hora)}`;
  $('#editTipo').value = r.tipo;
  $('#editSelProducto').value = r.producto_id;
  $('#editCantidad').value = r.cantidad;
  $('#editPlaca').value = r.placa;
  $('#editObs').value = r.observacion || '';
  ['#editSelProducto', '#editCantidad', '#editPlaca'].forEach(s => $(s).classList.remove('is-invalid'));
  bootstrap.Modal.getOrCreateInstance($('#modalRegistroEdit')).show();
}

$('#btnGuardarRegistroEdit').addEventListener('click', async () => {
  const r = state.registroEdit;
  if (!r) return;

  const productoId = parseInt($('#editSelProducto').value, 10);
  const cantidad = parseInt($('#editCantidad').value, 10);
  const placa = $('#editPlaca').value.trim().toUpperCase();

  let ok = true;
  ['#editSelProducto', '#editCantidad', '#editPlaca'].forEach(s => $(s).classList.remove('is-invalid'));
  if (!productoId) { $('#editSelProducto').classList.add('is-invalid'); ok = false; }
  if (!(cantidad >= 1)) { $('#editCantidad').classList.add('is-invalid'); ok = false; }
  if (!validarPlaca(placa)) { $('#editPlaca').classList.add('is-invalid'); ok = false; }
  if (!ok) { toast('Revisa los campos marcados en rojo', 'warning'); return; }

  const btn = $('#btnGuardarRegistroEdit');
  btn.disabled = true;
  btn.querySelector('.spinner-border').classList.remove('d-none');
  try {
    await api(`/registros/${r.id}`, {
      method: 'PUT',
      body: {
        tipo: $('#editTipo').value,
        producto_id: productoId,
        cantidad,
        placa,
        observacion: $('#editObs').value.trim()
      }
    });
    toast(`Registro ${r.codigo} actualizado`);
    bootstrap.Modal.getOrCreateInstance($('#modalRegistroEdit')).hide();
    await cargarRegistros();
  } catch (err) {
    toast(err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.querySelector('.spinner-border').classList.add('d-none');
  }
});

/* ---------- acciones delegadas ---------- */

document.addEventListener('click', async e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;

  if (action === 'edit-producto') {
    abrirModalProducto(state.productos.find(p => p.id === id));

  } else if (action === 'del-producto') {
    const p = state.productos.find(x => x.id === id);
    if (!p) return;
    const n = p.total_registros ?? 0;
    confirmar({
      titulo: `¿Eliminar "${p.nombre}"?`,
      mensaje: n > 0
        ? `Este producto tiene ${n} registro(s) asociados que también se eliminarán. Esta acción no se puede deshacer.`
        : 'Esta acción no se puede deshacer.',
      onOk: async () => {
        await api(`/productos/${id}`, { method: 'DELETE' });
        toast('Producto eliminado correctamente');
        await cargarProductos();
        await cargarRegistros();
      }
    });

  } else if (action === 'edit-registro') {
    const r = state.registros.find(x => x.id === id);
    if (r) abrirModalRegistro(r);

  } else if (action === 'del-registro') {
    const r = state.registros.find(x => x.id === id);
    if (!r) return;
    confirmar({
      titulo: `¿Eliminar registro?`,
      mensaje: `Se eliminará el movimiento ${r.codigo} (${r.tipo}). Esta acción no se puede deshacer.`,
      onOk: async () => {
        await api(`/registros/${id}`, { method: 'DELETE' });
        toast('Registro eliminado correctamente');
        await cargarRegistros();
      }
    });
  }
});

/* ---------- dashboard ---------- */

async function cargarDashboard() {
  try {
    $('#listaStock').innerHTML = `
      <div class="skeleton-group">
        <div class="skel-row"><span class="skeleton w-25"></span><span class="skeleton flex-fill"></span><span class="skeleton w-15"></span></div>
        <div class="skel-row"><span class="skeleton w-25"></span><span class="skeleton flex-fill"></span><span class="skeleton w-15"></span></div>
      </div>`;

    const { stats, productos } = await api('/dashboard');

    const ent = Number(stats.unidadesEntregadas) || 0;
    const dev = Number(stats.unidadesDevueltas) || 0;

    countUp($('#statProductos'), Number(stats.totalProductos));
    countUp($('#statHoy'), Number(stats.entregasHoy) + Number(stats.devolucionesHoy));
    countUp($('#statEntregadas'), ent);
    countUp($('#statDevueltas'), dev);

    const totalU = ent + dev;
    const pctEnt = totalU > 0 ? Math.round((ent / totalU) * 100) : 0;
    $('#donutMov').style.setProperty('--p', pctEnt);
    $('#donutPct').textContent = totalU > 0 ? `${pctEnt}%` : '—';
    $('#legEntregas').textContent = ent.toLocaleString('es-PE');
    $('#legDevoluciones').textContent = dev.toLocaleString('es-PE');

    $('#emptyDash').classList.toggle('d-none', productos.length > 0);
    $('#listaStock').classList.toggle('d-none', productos.length === 0);

    if (productos.length > 0) {
      const maxStock = Math.max(1, ...productos.map(p => Math.abs(Number(p.stock))));
      $('#listaStock').innerHTML = productos.map((p, i) => {
        const stock = Number(p.stock);
        const clase = stock === 0 ? 'zero' : stock > 0 ? 'pos' : 'neg';
        const ancho = stock === 0 ? 100 : Math.max(4, (Math.abs(stock) / maxStock) * 100);
        return `
          <div class="stock-row" style="--d:${Math.min(i * .05, .45)}s">
            <div>
              <span class="stock-name">${esc(p.nombre)}</span>
              <span class="stock-meta">${esc(p.codigo)} · ${esc(p.unidad)} · ${p.movimientos} mov.</span>
            </div>
            <div class="stock-bar-wrap">
              <div class="stock-bar ${clase}" data-w="${ancho.toFixed(1)}"></div>
            </div>
            <div class="stock-nums">
              <span class="num-pos" title="Entregas">+${Number(p.entregas).toLocaleString('es-PE')}</span>
              <span class="num-neg" title="Devoluciones">−${Number(p.devoluciones).toLocaleString('es-PE')}</span>
              <span class="num-total">${stock.toLocaleString('es-PE')} <small>stock</small></span>
            </div>
          </div>`;
      }).join('');

      requestAnimationFrame(() => requestAnimationFrame(() => {
        $$('#listaStock .stock-bar').forEach(b => { b.style.width = `${b.dataset.w}%`; });
      }));
    }
  } catch (err) {
    toast(err.message, 'danger');
  }
}

$('#btnRefrescarDash').addEventListener('click', cargarDashboard);

/* ---------- animaciones ---------- */

if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
  $$('.tilt-card').forEach(card => {
    card.addEventListener('pointermove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - .5;
      const y = (e.clientY - rect.top) / rect.height - .5;
      card.style.transform = `perspective(950px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg) translateY(-3px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      en.target.classList.add('visible');
      io.unobserve(en.target);
    }
  });
}, { threshold: .1 });
$$('.reveal').forEach(el => io.observe(el));

/* ---------- init ---------- */

(async function init() {
  tick();
  try {
    await Promise.all([cargarProductos(), cargarRegistros()]);
  } catch (err) {
    toast(err.message, 'danger');
    $('#skeletonRegistros').classList.add('d-none');
    $('#skeletonProductos').classList.add('d-none');
    $('#contadorRegistros').textContent = 'Error de conexión';
    $('#contadorProductos').textContent = 'Error';
  }
})();
