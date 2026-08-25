const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ========== LOGIN SYSTEM ========== */

let currentUser = null;

function initLogin() {
  // Check if already logged in
  const savedUser = sessionStorage.getItem('currentUser');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      showMainApp();
      return;
    } catch (e) {
      sessionStorage.removeItem('currentUser');
    }
  }

  // Show login screen
  const loginScreen = $('#loginScreen');
  loginScreen.classList.remove('d-none');

  // Toggle password visibility
  const togglePassBtn = $('#togglePass');
  const passInput = $('#loginPass');

  togglePassBtn.addEventListener('click', () => {
    const isPassword = passInput.type === 'password';
    passInput.type = isPassword ? 'text' : 'password';
    togglePassBtn.innerHTML = isPassword 
      ? '<i class="bi bi-eye-slash"></i>' 
      : '<i class="bi bi-eye"></i>';
  });

  // Handle form submission
  const loginForm = $('#loginForm');
  loginForm.addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
  e.preventDefault();

  const username = $('#loginUser').value.trim();
  const password = $('#loginPass').value;
  const loginBtn = $('#loginBtn');
  const inputGroups = $$('.login-input-group');

  // Reset errors
  inputGroups.forEach(ig => ig.classList.remove('error'));

  // Validate
  if (!username || !password) {
    if (!username) inputGroups[0].classList.add('error');
    if (!password) inputGroups[1].classList.add('error');
    return;
  }

  // Show loading state
  loginBtn.disabled = true;
  loginBtn.querySelector('.login-btn-text').classList.add('d-none');
  loginBtn.querySelector('.login-btn-loading').classList.remove('d-none');

  try {
    // Call API for authentication
    const response = await api('/auth/login', {
      method: 'POST',
      body: { usuario: username, contrasena: password }
    });

    // Success - store user and show welcome animation
    currentUser = response.usuario;
    showWelcomeAnimation(username, currentUser.nombre_completo);
  } catch (err) {
    // Invalid credentials
    inputGroups.forEach(ig => ig.classList.add('error'));
    loginBtn.disabled = false;
    loginBtn.querySelector('.login-btn-text').classList.remove('d-none');
    loginBtn.querySelector('.login-btn-loading').classList.add('d-none');

    // Shake animation on the button
    loginBtn.style.animation = 'shake .4s ease-in-out';
    setTimeout(() => { loginBtn.style.animation = ''; }, 400);
  }
}

function showWelcomeAnimation(username, nombreCompleto) {
  const loginScreen = $('#loginScreen');
  const welcomeOverlay = $('#welcomeOverlay');
  const progressBar = $('#welcomeProgressBar');
  const welcomeText = $('#welcomeText');
  const welcomeSubtext = $('#welcomeSubtext');

  // Respect reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stepDuration = prefersReducedMotion ? 5 : 40;
  const progressIncrement = prefersReducedMotion ? 10 : 2;

  // Hide login with animation
  loginScreen.classList.add('hiding');

  setTimeout(() => {
    loginScreen.classList.add('d-none');
    welcomeOverlay.classList.remove('d-none');
    welcomeOverlay.removeAttribute('aria-hidden');

    // Animate progress bar with percentage and keywords
    let progress = 0;
    const steps = [
      { at: 10, text: 'Verificando credenciales...', sub: '' },
      { at: 25, text: 'Cargando recursos...', sub: '' },
      { at: 45, text: 'Preparando tu experiencia...', sub: '' },
      { at: 65, text: 'Conectando servicios...', sub: '' },
      { at: 82, text: 'Optimizando interfaz...', sub: '' },
      { at: 93, text: '¡Bienvenido de vuelta!', sub: '' },
      { at: 100, text: '¡Listo!', sub: '' }
    ];
    let stepIndex = 0;

    const interval = setInterval(() => {
      progress += progressIncrement;
      if (progress > 100) progress = 100;
      progressBar.style.width = progress + '%';
      welcomeSubtext.textContent = progress + '%';

      if (stepIndex < steps.length && progress >= steps[stepIndex].at) {
        welcomeText.textContent = steps[stepIndex].text;
        stepIndex++;
      }

      if (progress >= 100) {
        clearInterval(interval);
        // Create confetti (skip if reduced motion)
        if (!prefersReducedMotion) createParticles(welcomeOverlay);
        // Exit welcome
        setTimeout(() => {
          welcomeOverlay.classList.add('hiding');
          setTimeout(() => {
            welcomeOverlay.classList.add('d-none');
            welcomeOverlay.classList.remove('hiding');
            welcomeOverlay.setAttribute('aria-hidden', 'true');
            progressBar.style.width = '0%';
            welcomeText.textContent = 'Iniciando sistema...';
            welcomeSubtext.textContent = '0%';
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            showMainApp();
          }, 600);
        }, prefersReducedMotion ? 100 : 400);
      }
    }, stepDuration);
  }, prefersReducedMotion ? 100 : 500);
}

function createParticles(container) {
  const colors = ['#4ade80', '#22c55e', '#a78bfa', '#c4b5fd', '#fbbf24', '#f472b6', '#60a5fa'];
  const shapes = ['circle', 'square'];

  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const size = 4 + Math.random() * 10;
    const goLeft = Math.random() > 0.5;
    particle.className = 'particle';
    particle.style.cssText = `
      left: ${Math.random() * 100}%;
      top: -20px;
      width: ${size}px;
      height: ${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${shape === 'circle' ? '50%' : '2px'};
      animation: ${goLeft ? 'particleFallLeft' : 'particleFall'} ${1.5 + Math.random() * 2.5}s linear ${Math.random() * 0.8}s forwards;
      opacity: ${0.7 + Math.random() * 0.3};
    `;
    container.appendChild(particle);
    setTimeout(() => particle.remove(), 5000);
  }
}

function showPendingOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'pending-overlay';
  overlay.innerHTML = `
    <div class="pending-content">
      <div class="pending-icon">
        <i class="bi bi-clock-history"></i>
      </div>
      <h2 class="pending-title">Cuenta pendiente de aprobación</h2>
      <p class="pending-text">Tu cuenta ha sido creada exitosamente.</p>
      <p class="pending-subtext">Un administrador debe activar tu cuenta para que puedas ingresar.</p>
      <button class="login-btn" onclick="this.closest('.pending-overlay').remove()">
        <i class="bi bi-check-lg me-2"></i>Entendido
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
}

function showMainApp() {
  $('#loginScreen').classList.add('d-none');
  $('#welcomeOverlay').classList.add('d-none');
  $('#welcomeOverlay').classList.remove('hiding');
  $('#mainApp').classList.remove('d-none');
  
  // Initialize main app
  initMainApp();
}

// Initialize login on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLogin);
} else {
  initLogin();
}

// Dismiss splash screen after DOM is ready
function dismissSplash() {
  const splash = document.getElementById('splashScreen');
  if (splash && !splash.classList.contains('hide')) {
    splash.classList.add('hide');
    splash.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      splash.remove();
      const styles = document.getElementById('splashStyles');
      if (styles) styles.remove();
    }, 600);
  }
}
// Remove splash once page is loaded
if (document.readyState === 'complete') {
  setTimeout(dismissSplash, 300);
} else {
  window.addEventListener('load', () => setTimeout(dismissSplash, 400));
}

/* ========== REGISTER ========== */

$('#btnShowRegister')?.addEventListener('click', () => {
  $('#formRegister').reset();
  $$('#registerOverlay .login-input-group').forEach(ig => ig.classList.remove('error'));
  $('#registerOverlay').classList.remove('d-none');
});

$('#btnCloseRegister')?.addEventListener('click', () => {
  $('#registerOverlay').classList.add('hiding');
  setTimeout(() => {
    $('#registerOverlay').classList.add('d-none');
    $('#registerOverlay').classList.remove('hiding');
  }, 400);
});

/* ========== LOGOUT ========== */

$('#btnLogout')?.addEventListener('click', () => {
  confirmar({
    titulo: '¿Cerrar sesión?',
    mensaje: 'Se cerrará tu sesión actual.',
    okText: 'Cerrar sesión',
    icon: 'bi-box-arrow-left',
    iconBg: 'linear-gradient(135deg,#ede9fe,#ddd6fe)',
    iconColor: '#7c3aed',
    btnClass: 'btn-gradient',
    onOk: () => showLogoutAnimation()
  });
});

function showLogoutAnimation() {
  const logoutOverlay = $('#logoutOverlay');
  const progressBar = $('#logoutProgressBar');
  const logoutText = $('#logoutText');
  const logoutSubtext = $('#logoutSubtext');

  // Respect reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stepDuration = prefersReducedMotion ? 3 : 35;
  const progressIncrement = prefersReducedMotion ? 10 : 3;

  // Hide main app
  $('#mainApp').classList.add('d-none');
  logoutOverlay.classList.remove('d-none');
  logoutOverlay.removeAttribute('aria-hidden');

  let progress = 0;
  const steps = [
    { at: 15, text: 'Guardando cambios...', sub: '' },
    { at: 35, text: 'Cerrando módulos...', sub: '' },
    { at: 55, text: 'Limpiando datos...', sub: '' },
    { at: 75, text: 'Protegiendo tu información...', sub: '' },
    { at: 90, text: '¡Hasta pronto!', sub: '' },
    { at: 100, text: 'Vuelve cuando quieras', sub: '' }
  ];
  let stepIndex = 0;

  const interval = setInterval(() => {
    progress += progressIncrement;
    if (progress > 100) progress = 100;
    progressBar.style.width = progress + '%';
    logoutSubtext.textContent = progress + '%';

    if (stepIndex < steps.length && progress >= steps[stepIndex].at) {
      logoutText.textContent = steps[stepIndex].text;
      stepIndex++;
    }

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        logoutOverlay.classList.add('hiding');
        setTimeout(() => {
          // Clean up
          logoutOverlay.classList.add('d-none');
          logoutOverlay.classList.remove('hiding');
          logoutOverlay.setAttribute('aria-hidden', 'true');
          progressBar.style.width = '0%';
          logoutText.textContent = 'Cerrando sesión...';
          logoutSubtext.textContent = '0%';
          currentUser = null;
          sessionStorage.removeItem('currentUser');
          // Remove pending overlays
          $$('.pending-overlay').forEach(el => el.remove());
          // Reset and show login
          $('#welcomeOverlay').classList.add('d-none');
          $('#welcomeOverlay').classList.remove('hiding');
          const loginScreen = $('#loginScreen');
          loginScreen.classList.remove('d-none', 'hiding');
          $('#loginUser').value = '';
          $('#loginPass').value = '';
          const loginBtn = $('#loginBtn');
          loginBtn.disabled = false;
          loginBtn.querySelector('.login-btn-text').classList.remove('d-none');
          loginBtn.querySelector('.login-btn-loading').classList.add('d-none');
          // Focus management: focus the login user input
          setTimeout(() => { $('#loginUser')?.focus(); }, 100);
          window.scrollTo({ top: 0 });
        }, 600);
      }, prefersReducedMotion ? 50 : 300);
    }
  }, stepDuration);
}

/* ========== CHANGE PASSWORD ========== */

$('#btnChangePass')?.addEventListener('click', () => {
  $('#formChangePass').reset();
  ['#inpNewPass', '#inpConfirmPass'].forEach(s => $(s).classList.remove('is-invalid'));
  bootstrap.Modal.getOrCreateInstance($('#modalChangePass')).show();
});

$('#btnSavePass')?.addEventListener('click', async () => {
  const newPass = $('#inpNewPass').value;
  const confirmPass = $('#inpConfirmPass').value;

  ['#inpNewPass', '#inpConfirmPass'].forEach(s => $(s).classList.remove('is-invalid'));

  let ok = true;
  if (newPass.length < 6) { $('#inpNewPass').classList.add('is-invalid'); ok = false; }
  if (newPass !== confirmPass) { $('#inpConfirmPass').classList.add('is-invalid'); ok = false; }
  if (!ok) { toast('Revisa los campos marcados', 'warning'); return; }

  const btn = $('#btnSavePass');
  btn.disabled = true;
  btn.querySelector('.spinner-border').classList.remove('d-none');

  try {
    await api(`/auth/usuarios/${currentUser.id}/contrasena`, {
      method: 'PUT',
      body: { contrasena: newPass }
    });
    toast('Contraseña actualizada correctamente');
    bootstrap.Modal.getOrCreateInstance($('#modalChangePass')).hide();
  } catch (err) {
    toast(err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.querySelector('.spinner-border').classList.add('d-none');
  }
});

$('#formRegister')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = $('#regNombre').value.trim();
  const usuario = $('#regUsuario').value.trim();
  const contrasena = $('#regPass').value;
  const inputGroups = $$('#registerOverlay .login-input-group');

  inputGroups.forEach(ig => ig.classList.remove('error'));

  if (!nombre || !usuario || contrasena.length < 6) {
    if (!nombre) inputGroups[0].classList.add('error');
    if (!usuario) inputGroups[1].classList.add('error');
    if (contrasena.length < 6) inputGroups[2].classList.add('error');
    return;
  }

  const btn = $('#registerBtn');
  btn.disabled = true;
  btn.querySelector('.login-btn-text').classList.add('d-none');
  btn.querySelector('.login-btn-loading').classList.remove('d-none');

  try {
    const response = await api('/auth/register', {
      method: 'POST',
      body: { usuario, contrasena, nombreCompleto: nombre }
    });

    // Success - show pending message
    $('#registerOverlay').classList.add('hiding');
    setTimeout(() => {
      $('#registerOverlay').classList.add('d-none');
      $('#registerOverlay').classList.remove('hiding');
      // Reset register form
      $('#formRegister').reset();
      // Show pending approval overlay
      showPendingOverlay();
    }, 400);
  } catch (err) {
    inputGroups.forEach(ig => ig.classList.add('error'));
    toast(err.message, 'danger');
    btn.disabled = false;
    btn.querySelector('.login-btn-text').classList.remove('d-none');
    btn.querySelector('.login-btn-loading').classList.add('d-none');
  }
});

/* ========== MAIN APP ========== */

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
  const roles = { success: 'status', danger: 'alert', warning: 'alert', info: 'status' };
  const el = document.createElement('div');
  el.className = `toast-app ${type}`;
  el.setAttribute('role', roles[type] || 'status');
  el.setAttribute('aria-live', type === 'danger' ? 'assertive' : 'polite');
  el.innerHTML = `<i class="bi bi-${iconos[type] || 'info-circle'}" aria-hidden="true"></i><span class="t-msg">${esc(msg)}</span>`;
  $('#toasts').appendChild(el);
  // Auto-dismiss
  const duration = 3400;
  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, duration);
  // Manual dismiss on click
  el.style.cursor = 'pointer';
  el.addEventListener('click', () => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, { once: true });
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
  // Sync sidebar nav
  $$('.nav-link-module').forEach(a => a.classList.toggle('active', a.dataset.view === view));
  // Sync mobile bottom nav
  $$('#mobileBottomNav .mbn-item').forEach(item => item.classList.toggle('active', item.dataset.view === view));
  // Switch views
  $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${view}`));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (view === 'dashboard') cargarDashboard();
  if (view === 'usuarios') cargarUsuarios();
}

$$('.nav-link-module').forEach(a => a.addEventListener('click', () => navigate(a.dataset.view)));

// Mobile bottom nav
$$('#mobileBottomNav .mbn-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    navigate(item.dataset.view);
  });
});

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
    // Desktop table
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
    // Mobile cards
    const existingMobile = $('#wrapTablaProductos').previousElementSibling;
    if (existingMobile && existingMobile.classList.contains('productos-mobile-cards')) existingMobile.remove();
    const mobileHTML = renderProductosMobile(lista);
    if (mobileHTML) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = mobileHTML;
      $('#wrapTablaProductos').parentNode.insertBefore(wrapper.firstElementChild, $('#wrapTablaProductos'));
    }
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

function confirmar({ titulo, mensaje, onOk, okText = 'Sí, eliminar', icon = 'bi-trash3', iconBg = 'linear-gradient(135deg,#fee2e2,#fecaca)', iconColor = '#dc2626', btnClass = 'btn-danger-app' }) {
  $('#confirmTitulo').textContent = titulo;
  $('#confirmMensaje').textContent = mensaje;
  $('#confirmOkText').textContent = okText;
  $('#confirmIcon').innerHTML = `<i class="bi ${icon}"></i>`;
  $('#confirmIcon').style.background = iconBg;
  $('#confirmIcon').style.color = iconColor;
  const okBtn = $('#btnConfirmOk');
  okBtn.className = `btn flex-fill ${btnClass}`;
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
    return [r.codigo, r.placa, r.producto_nombre, r.numero_guia].some(v =>
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
    // Desktop table
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
        <td><span class="badge badge-code">${esc(r.numero_guia)}</span></td>
        <td><span class="small text-muted-lila" style="white-space:nowrap">${fmtFecha(r.fecha_hora)}</span></td>
        <td class="text-end text-nowrap">
          <button class="btn-action" data-action="edit-registro" data-id="${r.id}" title="Editar"><i class="bi bi-pencil-square"></i></button>
          <button class="btn-action danger" data-action="del-registro" data-id="${r.id}" title="Eliminar"><i class="bi bi-trash3"></i></button>
        </td>
      </tr>`).join('');
    // Mobile cards - inject before the table
    const existingMobile = $('#wrapTablaRegistros').previousElementSibling;
    if (existingMobile && existingMobile.classList.contains('registros-mobile-cards')) existingMobile.remove();
    const mobileHTML = renderRegistrosMobile(lista);
    if (mobileHTML) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = mobileHTML;
      $('#wrapTablaRegistros').parentNode.insertBefore(wrapper.firstElementChild, $('#wrapTablaRegistros'));
    }
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

    ws.columns = [{ width: 17 }, { width: 13 }, { width: 34 }, { width: 10 }, { width: 10 }, { width: 11 }, { width: 20 }, { width: 21 }];

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
    headerRow.values = ['Código', 'Tipo', 'Producto', 'Cantidad', 'Unidad', 'Placa', 'N° Guía', 'Fecha y hora'];
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
        r.numero_guia || '',
        fmtFecha(r.fecha_hora)
      ]);
      row.getCell(4).alignment = { horizontal: 'center' };
      row.getCell(6).font = { name: 'Consolas', size: 10 };
      row.getCell(7).font = { name: 'Consolas', size: 10 };
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

function actualizarHintDevolucion() {
  const tipo = $('input[name="tipo"]:checked')?.value;
  if (tipo !== 'DEVOLUCION') return;
  const selProd = $('#selProducto');
  const productoId = parseInt(selProd.value, 10);
  const hint = $('#hintTipo');
  if (productoId) {
    const producto = state.productos.find(p => p.id === productoId);
    const stock = Number(producto?.stock || 0);
    hint.innerHTML = stock > 0
      ? `<i class="bi bi-exclamation-triangle text-warning"></i> Devolución — Stock disponible: <b>${stock}</b> unidades`
      : `<i class="bi bi-x-circle text-danger"></i> Sin stock — No se puede devolver este producto`;
    hint.style.color = stock <= 0 ? '#dc2626' : '';
  }
}

$$('input[name="tipo"]').forEach(r => r.addEventListener('change', () => {
  actualizarHintDevolucion();
}));

$('#selProducto').addEventListener('change', actualizarHintDevolucion);

function abrirRegistroNuevo() {
  ['#selProducto', '#inpCantidad', '#inpPlaca', '#inpGuia'].forEach(s => $(s).classList.remove('is-invalid'));
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

  const inpGuia = $('#inpGuia');
  const guia = inpGuia.value.replace(/[\s.-]/g, '');
  inpGuia.classList.remove('is-invalid');
  if (!/^\d{6,30}$/.test(guia)) { inpGuia.classList.add('is-invalid'); ok = false; }

  // Validar stock para devoluciones
  if (tipo === 'DEVOLUCION' && ok && productoId) {
    const producto = state.productos.find(p => p.id === productoId);
    if (producto && cantidad > Number(producto.stock || 0)) {
      selProducto.classList.add('is-invalid');
      toast(`No puedes devolver ${cantidad} unidades. Solo hay ${Number(producto.stock)} disponibles.`, 'danger');
      return;
    }
  }

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
        numero_guia: $('#inpGuia').value.replace(/[\s.-]/g, '')
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
    await cargarProductos();
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
  $('#editGuia').value = r.numero_guia || '';
  ['#editSelProducto', '#editCantidad', '#editPlaca', '#editGuia'].forEach(s => $(s).classList.remove('is-invalid'));
  bootstrap.Modal.getOrCreateInstance($('#modalRegistroEdit')).show();
}

$('#btnGuardarRegistroEdit').addEventListener('click', async () => {
  const r = state.registroEdit;
  if (!r) return;

  const productoId = parseInt($('#editSelProducto').value, 10);
  const cantidad = parseInt($('#editCantidad').value, 10);
  const placa = $('#editPlaca').value.trim().toUpperCase();

  let ok = true;
  ['#editSelProducto', '#editCantidad', '#editPlaca', '#editGuia'].forEach(s => $(s).classList.remove('is-invalid'));
  if (!productoId) { $('#editSelProducto').classList.add('is-invalid'); ok = false; }
  if (!(cantidad >= 1)) { $('#editCantidad').classList.add('is-invalid'); ok = false; }
  if (!validarPlaca(placa)) { $('#editPlaca').classList.add('is-invalid'); ok = false; }

  const editGuia = $('#editGuia').value.replace(/[\s.-]/g, '');
  if (!/^\d{6,30}$/.test(editGuia)) { $('#editGuia').classList.add('is-invalid'); ok = false; }

  // Validar stock para devoluciones (excluir el registro actual)
  const editTipo = $('#editTipo').value;
  if (editTipo === 'DEVOLUCION' && ok && productoId) {
    const producto = state.productos.find(p => p.id === productoId);
    let stockDisp = Number(producto?.stock || 0);
    // Si el registro actual era ENTREGA, sumar su cantidad de vuelta (porque ahora se resta)
    if (r.tipo === 'ENTREGA' && r.producto_id === productoId) {
      stockDisp += Number(r.cantidad);
    }
    // Si el registro actual era DEVOLUCION, restar su cantidad (porque ya se restó)
    if (r.tipo === 'DEVOLUCION' && r.producto_id === productoId) {
      stockDisp -= Number(r.cantidad);
    }
    if (cantidad > stockDisp) {
      toast(`No puedes devolver ${cantidad} unidades. Solo hay ${stockDisp} disponibles.`, 'danger');
      return;
    }
  }

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
        numero_guia: editGuia
      }
    });
    toast(`Registro ${r.codigo} actualizado`);
    bootstrap.Modal.getOrCreateInstance($('#modalRegistroEdit')).hide();
    await cargarRegistros();
    await cargarProductos();
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
        await cargarProductos();
      }
    });

  } else if (action === 'del-usuario') {
    const u = state.usuarios.find(x => x.id === id);
    if (!u) return;
    confirmar({
      titulo: `¿Eliminar usuario "${u.nombre_completo}"?`,
      mensaje: `El usuario ${u.usuario} será eliminado del sistema. Esta acción no se puede deshacer.`,
      onOk: async () => {
        await api(`/auth/usuarios/${id}`, { method: 'DELETE' });
        toast('Usuario eliminado correctamente');
        await cargarUsuarios();
      }
    });

  } else if (action === 'activar-usuario') {
    const u = state.usuarios.find(x => x.id === id);
    if (!u) return;
    state.usuarioAActivar = u;
    $('#activarUsuarioNombre').textContent = `${u.nombre_completo} (${u.usuario})`;
    $('#selActivarRol').value = u.rol || 'CONSULTA';
    bootstrap.Modal.getOrCreateInstance($('#modalActivar')).show();

  } else if (action === 'toggle-usuario') {
    const activo = Number(btn.dataset.activo);
    const u = state.usuarios.find(x => x.id === id);
    if (!u) return;
    const accion = activo ? 'activar' : 'desactivar';
    confirmar({
      titulo: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario?`,
      mensaje: `El usuario ${u.usuario} será ${accion === 'activar' ? 'activado' : 'desactivado'}.`,
      onOk: async () => {
        await api(`/auth/usuarios/${id}/estado`, { method: 'PUT', body: { activo: !!activo } });
        toast(`Usuario ${accion === 'activar' ? 'activado' : 'desactivado'}`);
        await cargarUsuarios();
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

    // Render product detail cards
    const productCardsEl = $('#productCards');
    const emptyProductCards = $('#emptyProductCards');
    if (productos.length === 0) {
      productCardsEl.innerHTML = '';
      emptyProductCards.classList.remove('d-none');
    } else {
      emptyProductCards.classList.add('d-none');
      productCardsEl.innerHTML = productos.map((p, i) => {
        const entregas = Number(p.entregas) || 0;
        const devoluciones = Number(p.devoluciones) || 0;
        const stock = Number(p.stock) || 0;
        const maxVal = Math.max(entregas, devoluciones, 1);
        const entPct = Math.round((entregas / maxVal) * 100);
        const devPct = Math.round((devoluciones / maxVal) * 100);
        const stockPct = Math.round((Math.abs(stock) / Math.max(entregas + devoluciones, 1)) * 100);
        return `
          <div class="col-12 col-md-6" style="animation-delay:${Math.min(i * .08, .5)}s">
            <div class="product-card">
              <div class="product-card-header">
                <div class="product-card-icon ent"><i class="bi bi-truck"></i></div>
                <div class="product-card-name">${esc(p.nombre)}</div>
                <span class="product-card-badge ent">${esc(p.codigo)}</span>
              </div>
              <div class="product-card-body">
                <div class="product-card-grid">
                  <div class="product-card-item">
                    <label>Entregas</label>
                    <span class="pos">+${entregas.toLocaleString('es-PE')} ${esc(p.unidad)}</span>
                  </div>
                  <div class="product-card-item">
                    <label>Devoluciones</label>
                    <span class="neg">−${devoluciones.toLocaleString('es-PE')} ${esc(p.unidad)}</span>
                  </div>
                  <div class="product-card-item">
                    <label>Stock actual</label>
                    <span>${stock.toLocaleString('es-PE')} ${esc(p.unidad)}</span>
                  </div>
                  <div class="product-card-item">
                    <label>Movimientos</label>
                    <span>${p.movimientos} registro${p.movimientos !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div class="product-card-bar">
                  <div class="product-card-bar-fill ent" style="width: ${entPct}%"></div>
                </div>
                <div class="product-card-bar mt-2">
                  <div class="product-card-bar-fill dev" style="width: ${devPct}%"></div>
                </div>
              </div>
            </div>
          </div>`;
      }).join('');
    }
  } catch (err) {
    toast(err.message, 'danger');
  }
}

$('#btnRefrescarDash').addEventListener('click', cargarDashboard);

/* ---------- animaciones ---------- */

// Tilt effect only on non-touch devices with fine pointer
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

// Keyboard shortcut: Escape to close modals
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const openModals = $$('.modal.show');
    if (openModals.length > 0) {
      const lastModal = openModals[openModals.length - 1];
      bootstrap.Modal.getOrCreateInstance(lastModal).hide();
    }
  }
});

const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      en.target.classList.add('visible');
      io.unobserve(en.target);
    }
  });
}, { threshold: .1 });
$$('.reveal').forEach(el => io.observe(el));

/* ---------- usuarios ---------- */

state.usuarios = [];
state.usuarioAActivar = null;

async function cargarUsuarios() {
  state.usuarios = await api('/auth/usuarios');
  renderUsuarios();
}

function renderUsuarios() {
  const lista = state.usuarios;
  const hay = lista.length > 0;

  $('#contadorUsuarios').textContent = hay ? `${lista.length} usuario(s) registrado(s)` : 'Sin usuarios';
  $('#skeletonUsuarios').classList.add('d-none');

  $('#emptyUsuarios').classList.toggle('d-none', hay);
  $('#wrapTablaUsuarios').classList.toggle('d-none', !hay);

  if (!hay) return;

  // Desktop table
  $('#tbodyUsuarios').innerHTML = lista.map((u, i) => {
    const isAdmin = u.rol === 'ADMIN';
    const esMismoUsuario = currentUser && currentUser.id === u.id;
    const pendiente = !u.activo;
    return `
      <tr style="--d:${Math.min(i * .04, .35)}s" class="${pendiente ? 'row-pending' : ''}">
        <td>
          <span class="badge badge-code">${esc(u.usuario)}</span>
          ${pendiente ? '<span class="badge badge-warning ms-1">Pendiente</span>' : ''}
        </td>
        <td><span class="prod-name">${esc(u.nombre_completo)}</span></td>
        <td class="text-center">
          <span class="badge ${isAdmin ? 'badge-entrega' : 'badge-devolucion'}">${isAdmin ? 'Admin' : 'Consulta'}</span>
        </td>
        <td class="text-center">
          <span class="badge ${u.activo ? 'badge-activo' : 'badge-inactivo'}">${u.activo ? 'Activo' : 'Inactivo'}</span>
        </td>
        <td class="d-none d-md-table-cell"><span class="small text-muted-lila">${u.ultimo_acceso ? fmtFecha(u.ultimo_acceso) : 'Nunca'}</span></td>
        <td class="text-end text-nowrap">
          ${!esMismoUsuario ? `
            ${pendiente ? `
              <button class="btn-action" data-action="activar-usuario" data-id="${u.id}" data-nombre="${esc(u.nombre_completo)}" title="Activar usuario">
                <i class="bi bi-play-circle"></i>
              </button>
            ` : `
              <button class="btn-action" data-action="toggle-usuario" data-id="${u.id}" data-activo="0" title="Desactivar">
                <i class="bi bi-pause-circle"></i>
              </button>
            `}
            <button class="btn-action danger" data-action="del-usuario" data-id="${u.id}" title="Eliminar">
              <i class="bi bi-trash3"></i>
            </button>
          ` : '<span class="small text-muted-lila"><i class="bi bi-person-check me-1"></i>Tú</span>'}
        </td>
      </tr>`;
  }).join('');
  // Mobile cards
  const existingMobile = $('#wrapTablaUsuarios').previousElementSibling;
  if (existingMobile && existingMobile.classList.contains('usuarios-mobile-cards')) existingMobile.remove();
  const mobileHTML = renderUsuariosMobile(lista);
  if (mobileHTML) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = mobileHTML;
    $('#wrapTablaUsuarios').parentNode.insertBefore(wrapper.firstElementChild, $('#wrapTablaUsuarios'));
  }
}

function abrirModalUsuario() {
  $('#formUsuario').reset();
  ['#inpNombreUsuario', '#inpUsuario', '#inpContrasena'].forEach(s => $(s).classList.remove('is-invalid'));
  bootstrap.Modal.getOrCreateInstance($('#modalUsuario')).show();
}

$('#btnNuevoUsuario').addEventListener('click', abrirModalUsuario);

$('#btnActivarOk')?.addEventListener('click', async () => {
  const u = state.usuarioAActivar;
  if (!u) return;
  const rol = $('#selActivarRol').value;
  try {
    await api(`/auth/usuarios/${u.id}/activar`, { method: 'PUT', body: { rol } });
    toast(`Usuario ${u.nombre_completo} activado como ${rol}`);
    bootstrap.Modal.getOrCreateInstance($('#modalActivar')).hide();
    await cargarUsuarios();
  } catch (err) {
    toast(err.message, 'danger');
  }
});

$('#btnGuardarUsuario').addEventListener('click', async () => {
  const nombre = $('#inpNombreUsuario').value.trim();
  const usuario = $('#inpUsuario').value.trim();
  const contrasena = $('#inpContrasena').value;
  const rol = $('#selRol').value;

  let ok = true;
  ['#inpNombreUsuario', '#inpUsuario', '#inpContrasena'].forEach(s => $(s).classList.remove('is-invalid'));

  if (!nombre) { $('#inpNombreUsuario').classList.add('is-invalid'); ok = false; }
  if (!usuario) { $('#inpUsuario').classList.add('is-invalid'); ok = false; }
  if (contrasena.length < 6) { $('#inpContrasena').classList.add('is-invalid'); ok = false; }

  if (!ok) { toast('Revisa los campos marcados en rojo', 'warning'); return; }

  const btn = $('#btnGuardarUsuario');
  btn.disabled = true;
  btn.querySelector('.spinner-border').classList.remove('d-none');

  try {
    await api('/auth/usuarios', {
      method: 'POST',
      body: { usuario, contrasena, nombreCompleto: nombre, rol }
    });
    toast(`Usuario "${nombre}" creado correctamente`);
    bootstrap.Modal.getOrCreateInstance($('#modalUsuario')).hide();
    await cargarUsuarios();
  } catch (err) {
    toast(err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.querySelector('.spinner-border').classList.add('d-none');
  }
});

/* ---------- responsive utilities ---------- */

function isMobile() {
  return window.innerWidth < 768;
}

function isTouch() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Mobile card rendering for registros
function renderRegistrosMobile(lista) {
  if (!lista.length) return '';
  return `<div class="d-md-none registros-mobile-cards">${lista.map((r, i) => `
    <div class="registro-mobile-card ${r.tipo === 'DEVOLUCION' ? 'tipo-dev' : 'tipo-ent'}" style="animation-delay:${Math.min(i * .05, .4)}s">
      <div class="rmc-header">
        <div class="rmc-icon ${r.tipo === 'ENTREGA' ? 'ent' : 'dev'}">
          <i class="bi ${r.tipo === 'ENTREGA' ? 'bi-truck' : 'bi-arrow-return-left'}"></i>
        </div>
        <div class="rmc-title">
          <span class="rmc-producto">${esc(r.producto_nombre)}</span>
          <span class="rmc-codigo"><i class="bi bi-hash"></i>${esc(r.codigo)}</span>
        </div>
        <span class="badge ${r.tipo === 'ENTREGA' ? 'badge-entrega' : 'badge-devolucion'}">${r.tipo === 'ENTREGA' ? 'Entrega' : 'Devolución'}</span>
      </div>
      <div class="rmc-body">
        <div class="rmc-field"><label>Código</label><span>${esc(r.producto_codigo)}</span></div>
        <div class="rmc-field"><label>Cantidad</label><span class="cantidad-chip ${r.tipo === 'ENTREGA' ? 'pos' : 'neg'}">${r.tipo === 'ENTREGA' ? '+' : '−'}${r.cantidad} ${esc(r.unidad)}</span></div>
        <div class="rmc-field"><label>Placa</label><span>${esc(r.placa)}</span></div>
        <div class="rmc-field"><label>N° Guía</label><span>${esc(r.numero_guia)}</span></div>
        <div class="rmc-field"><label>Fecha</label><span>${fmtFecha(r.fecha_hora)}</span></div>
      </div>
      <div class="rmc-actions">
        <button class="btn-action" data-action="edit-registro" data-id="${r.id}" title="Editar"><i class="bi bi-pencil-square"></i></button>
        <button class="btn-action danger" data-action="del-registro" data-id="${r.id}" title="Eliminar"><i class="bi bi-trash3"></i></button>
      </div>
    </div>`).join('')}</div>`;
}

// Mobile card rendering for productos
function renderProductosMobile(lista) {
  if (!lista.length) return '';
  return `<div class="d-md-none productos-mobile-cards">${lista.map((p, i) => `
    <div class="producto-mobile-card" style="animation-delay:${Math.min(i * .05, .4)}s">
      <div class="pmc-header">
        <div class="pmc-icon"><i class="bi bi-box-seam"></i></div>
        <div class="pmc-info">
          <span class="pmc-name">${esc(p.nombre)}</span>
          <span class="pmc-code"><i class="bi bi-hash"></i>${esc(p.codigo)}</span>
        </div>
        <span class="badge ${p.activo ? 'badge-activo' : 'badge-inactivo'}">${p.activo ? 'Activo' : 'Inactivo'}</span>
      </div>
      <div class="pmc-body">
        <div class="pmc-field"><label>Descripción</label><span>${esc(p.descripcion || '—')}</span></div>
        <div class="pmc-field"><label>Unidad</label><span><span class="badge badge-placa">${esc(p.unidad)}</span></span></div>
        <div class="pmc-field"><label>Movimientos</label><span class="badge badge-count">${p.total_registros}</span></div>
      </div>
      <div class="pmc-actions">
        <button class="btn-action" data-action="edit-producto" data-id="${p.id}" title="Editar"><i class="bi bi-pencil-square"></i></button>
        <button class="btn-action danger" data-action="del-producto" data-id="${p.id}" title="Eliminar"><i class="bi bi-trash3"></i></button>
      </div>
    </div>`).join('')}</div>`;
}

// Mobile card rendering for usuarios
function renderUsuariosMobile(lista) {
  if (!lista.length) return '';
  return `<div class="d-md-none usuarios-mobile-cards">${lista.map((u, i) => {
    const isAdmin = u.rol === 'ADMIN';
    const esMismoUsuario = currentUser && currentUser.id === u.id;
    const pendiente = !u.activo;
    return `
    <div class="usuario-mobile-card ${pendiente ? 'card-pending' : ''}" style="animation-delay:${Math.min(i * .05, .4)}s">
      <div class="umc-header">
        <div class="umc-icon ${isAdmin ? 'admin' : 'consulta'}"><i class="bi bi-person"></i></div>
        <div class="umc-info">
          <span class="umc-name">${esc(u.nombre_completo)}</span>
          <span class="umc-usuario">@${esc(u.usuario)} ${pendiente ? '<span class="badge badge-warning ms-1">Pendiente</span>' : ''}</span>
        </div>
        <span class="badge ${isAdmin ? 'badge-entrega' : 'badge-devolucion'}">${isAdmin ? 'Admin' : 'Consulta'}</span>
      </div>
      <div class="umc-body">
        <div class="umc-field"><label>Estado</label><span class="badge ${u.activo ? 'badge-activo' : 'badge-inactivo'}">${u.activo ? 'Activo' : 'Inactivo'}</span></div>
        <div class="umc-field"><label>Último acceso</label><span>${u.ultimo_acceso ? fmtFecha(u.ultimo_acceso) : 'Nunca'}</span></div>
      </div>
      <div class="umc-actions">
        ${!esMismoUsuario ? `
          ${pendiente ? `<button class="btn-action" data-action="activar-usuario" data-id="${u.id}" title="Activar"><i class="bi bi-play-circle"></i></button>` : `<button class="btn-action" data-action="toggle-usuario" data-id="${u.id}" data-activo="0" title="Desactivar"><i class="bi bi-pause-circle"></i></button>`}
          <button class="btn-action danger" data-action="del-usuario" data-id="${u.id}" title="Eliminar"><i class="bi bi-trash3"></i></button>
        ` : '<span class="small text-muted-lila"><i class="bi bi-person-check me-1"></i>Tú</span>'}
      </div>
    </div>`;
  }).join('')}</div>`;
}

/* ---------- init ---------- */

function initMainApp() {
  tick();

  // Show user name in sidebar
  if (currentUser) {
    const sidebarUserName = $('#sidebarUserName');
    if (sidebarUserName) sidebarUserName.textContent = currentUser.nombre_completo || currentUser.usuario;
  }

  // Hide admin-only elements for CONSULTA role
  if (currentUser && currentUser.rol !== 'ADMIN') {
    const adminOnlyElements = $$('#btnNuevoUsuario, [data-action="del-usuario"], [data-action="toggle-usuario"]');
    adminOnlyElements.forEach(el => el.classList.add('d-none'));
  }

  // Re-observe reveal elements
  $$('.reveal').forEach(el => {
    el.classList.remove('visible');
    io.observe(el);
  });

  (async function init() {
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
}
