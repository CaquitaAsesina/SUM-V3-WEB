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
    await api('/auth/register', {
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
  exportando: false,
  fechaDesde: '',
  fechaHasta: '',
  dashboardPeriodo: 'all',
  dashboardTipo: 'TODOS',
  dashData: null
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
  if (view.startsWith('auditoria')) cargarAuditoria();
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
  const relojAudModal = $('#relojAudModal');
  if (relojAudModal) relojAudModal.textContent = hora;
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
          <span class="prod-meta d-md-none">${esc(p.observaciones || '—')}</span>
        </td>
        <td class="d-none d-md-table-cell"><span class="text-muted-lila small">${esc(p.observaciones || '—')}</span></td>
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
  $('#inpObservaciones').value = p?.observaciones || '';
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
  $('#inpNombreProd').classList.remove('is-invalid');
  
  let ok = true;
  if (!nombre) {
    $('#inpNombreProd').classList.add('is-invalid');
    ok = false;
  }
  if (!ok) {
    toast('Revisa los campos marcados en rojo', 'warning');
    return;
  }
  const btn = $('#btnGuardarProducto');
  btn.disabled = true;
  btn.querySelector('.spinner-border').classList.remove('d-none');
  try {
    const body = {
      nombre,
      unidad: $('#selUnidad').value,
      observaciones: $('#inpObservaciones').value.trim(),
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
  cargarProveedores();
}

async function cargarProveedores() {
  try {
    const proveedores = await api('/registros/proveedores');
    const datalist = $('#listaProveedores');
    const datalistEdit = $('#listaProveedoresEdit');
    if (datalist) {
      datalist.innerHTML = proveedores.map(p => `<option value="${esc(p)}">`).join('');
    }
    if (datalistEdit) {
      datalistEdit.innerHTML = proveedores.map(p => `<option value="${esc(p)}">`).join('');
    }
  } catch (err) {
    console.error('Error cargando proveedores:', err);
  }
}

function registrosFiltrados() {
  const q = state.busquedaReg.toLowerCase();
  const desde = state.fechaDesde;
  const hasta = state.fechaHasta;
  return state.registros.filter(r => {
    if (state.filtroTipo !== 'TODOS' && r.tipo !== state.filtroTipo) return false;
    // Date range filter
    if (desde || hasta) {
      const fechaReg = String(r.fecha_hora).slice(0, 10);
      if (desde && fechaReg < desde) return false;
      if (hasta && fechaReg > hasta) return false;
    }
    if (!q) return true;
    return [r.codigo, r.placa, r.producto_nombre, r.numero_guia, r.proveedor].some(v =>
      String(v ?? '').toLowerCase().includes(q)
    );
  });
}

/* ---------- view registro modal ---------- */

function abrirVerRegistro(r) {
  const esEnt = r.tipo === 'ENTREGA';
  $('#verRegistroIcon').innerHTML = `<i class="bi ${esEnt ? 'bi-truck' : 'bi-arrow-return-left'}"></i>`;
  $('#verRegistroIcon').className = `rh-icon ${esEnt ? 'ent' : 'dev'}`;
  $('#verRegistroTitle').textContent = esEnt ? 'Detalle de entrega' : 'Detalle de devolución';
  $('#verRegistroCodigo').textContent = `Código ${r.codigo}`;
  $('#verRegTipo').innerHTML = `<span class="badge ${esEnt ? 'badge-entrega' : 'badge-devolucion'}">${esEnt ? 'Entrega' : 'Devolución'}</span>`;
  $('#verRegTipo').querySelector('.badge').style.cssText = '';
  $('#verRegProducto').textContent = `${r.producto_nombre}`;
  $('#verRegProdCodigo').textContent = r.producto_codigo;
  $('#verRegUnidad').textContent = r.unidad;
  $('#verRegCantidad').innerHTML = `<span class="cantidad-chip ${esEnt ? 'pos' : 'neg'}" style="font-size:1.1rem">${esEnt ? '+' : '−'}${r.cantidad}</span>`;
  $('#verRegPlaca').textContent = r.placa;
  $('#verRegGuia').textContent = r.numero_guia || '—';
  $('#verRegProveedor').textContent = r.proveedor || 'Sin proveedor';
  $('#verRegFecha').textContent = fmtFecha(r.fecha_hora);
  // Store for edit button
  state.verRegistroId = r.id;
  bootstrap.Modal.getOrCreateInstance($('#modalVerRegistro')).show();
}

$('#btnVerRegistroEditar')?.addEventListener('click', () => {
  const r = state.registros.find(x => x.id === state.verRegistroId);
  if (!r) return;
  bootstrap.Modal.getOrCreateInstance($('#modalVerRegistro')).hide();
  setTimeout(() => abrirModalRegistro(r), 300);
});

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
          <span class="prod-name text-truncate-custom" title="${esc(r.producto_nombre)}">${esc(r.producto_nombre.length > 20 ? r.producto_nombre.slice(0, 18) + '…' : r.producto_nombre)}</span><br>
          <span class="prod-meta">${esc(r.producto_codigo)} · ${esc(r.unidad)}</span>
        </td>
        <td class="text-center">
          <span class="cantidad-chip ${r.tipo === 'ENTREGA' ? 'pos' : 'neg'}">${r.tipo === 'ENTREGA' ? '+' : '−'}${r.cantidad}</span>
        </td>
        <td><span class="badge badge-placa">${esc(r.placa)}</span></td>
        <td><span class="badge badge-code">${esc(r.numero_guia)}</span></td>
        <td class="d-none d-md-table-cell"><span class="text-muted-lila small">${esc(r.proveedor || '—')}</span></td>
        <td><span class="small text-muted-lila" style="white-space:nowrap">${fmtFecha(r.fecha_hora)}</span></td>
        <td class="text-end text-nowrap">
          <button class="btn-action btn-view-reg" data-action="view-registro" data-id="${r.id}" title="Ver detalle"><i class="bi bi-eye"></i></button>
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

// Date filter listeners
$('#inpFechaDesde')?.addEventListener('input', e => {
  state.fechaDesde = e.target.value;
  $('#btnClearDates').style.display = (state.fechaDesde || state.fechaHasta) ? '' : 'none';
  renderRegistros();
});
$('#inpFechaHasta')?.addEventListener('input', e => {
  state.fechaHasta = e.target.value;
  $('#btnClearDates').style.display = (state.fechaDesde || state.fechaHasta) ? '' : 'none';
  renderRegistros();
});
$('#btnClearDates')?.addEventListener('click', () => {
  state.fechaDesde = '';
  state.fechaHasta = '';
  $('#inpFechaDesde').value = '';
  $('#inpFechaHasta').value = '';
  $('#btnClearDates').style.display = 'none';
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
  ['#selProducto', '#inpCantidad', '#inpPlaca', '#inpGuia', '#inpProveedor'].forEach(s => $(s).classList.remove('is-invalid'));
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
  if (!/^\d{4,30}$/.test(guia)) { inpGuia.classList.add('is-invalid'); ok = false; }

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
        numero_guia: $('#inpGuia').value.replace(/[\s.-]/g, ''),
        proveedor: $('#inpProveedor').value.trim()
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
  $('#editProveedor').value = r.proveedor || '';
  ['#editSelProducto', '#editCantidad', '#editPlaca', '#editGuia', '#editProveedor'].forEach(s => $(s).classList.remove('is-invalid'));
  bootstrap.Modal.getOrCreateInstance($('#modalRegistroEdit')).show();
}

$('#btnGuardarRegistroEdit').addEventListener('click', async () => {
  const r = state.registroEdit;
  if (!r) return;

  const productoId = parseInt($('#editSelProducto').value, 10);
  const cantidad = parseInt($('#editCantidad').value, 10);
  const placa = $('#editPlaca').value.trim().toUpperCase();

  let ok = true;
  ['#editSelProducto', '#editCantidad', '#editPlaca', '#editGuia', '#editProveedor'].forEach(s => $(s).classList.remove('is-invalid'));
  if (!productoId) { $('#editSelProducto').classList.add('is-invalid'); ok = false; }
  if (!(cantidad >= 1)) { $('#editCantidad').classList.add('is-invalid'); ok = false; }
  if (!validarPlaca(placa)) { $('#editPlaca').classList.add('is-invalid'); ok = false; }

  const editGuia = $('#editGuia').value.replace(/[\s.-]/g, '');
  if (!/^\d{4,30}$/.test(editGuia)) { $('#editGuia').classList.add('is-invalid'); ok = false; }

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
        numero_guia: editGuia,
        proveedor: $('#editProveedor').value.trim()
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

  if (action === 'view-registro') {
    const r = state.registros.find(x => x.id === id);
    if (r) abrirVerRegistro(r);

  } else if (action === 'edit-producto') {
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

  } else if (action === 'aud-view-registro') {
    const r = state.audRegistros.find(x => x.id === id);
    if (r) abrirVerAudRegistro(r);

  } else if (action === 'aud-edit-registro') {
    if (!esAdmin()) {
      toast('Solo el administrador puede editar registros de auditoría', 'warning');
      return;
    }
    const r = state.audRegistros.find(x => x.id === id);
    if (r) abrirAudModalRegistroEdit(r);

  } else if (action === 'aud-del-registro') {
    if (!esAdmin()) {
      toast('Solo el administrador puede eliminar registros de auditoría', 'warning');
      return;
    }
    const r = state.audRegistros.find(x => x.id === id);
    if (!r) return;
    confirmar({
      titulo: '¿Eliminar registro de auditoría?',
      mensaje: `Se eliminará el registro ${r.codigo} (${r.area_nombre}). Esta acción no se puede deshacer.`,
      onOk: async () => {
        await api(`/auditoria/registros/${id}`, {
          method: 'DELETE',
          headers: { 'X-User-Rol': currentUser?.rol || '' }
        });
        toast('Registro eliminado correctamente');
        await cargarAuditoria();
      }
    });

  } else if (action === 'aud-edit-producto') {
    abrirAudModalProducto(state.audProductos.find(p => p.id === id));

  } else if (action === 'aud-del-producto') {
    const p = state.audProductos.find(x => x.id === id);
    if (!p) return;
    const n = p.total_registros ?? 0;
    confirmar({
      titulo: `¿Eliminar "${p.nombre}"?`,
      mensaje: n > 0
        ? `Este producto tiene ${n} registro(s) de auditoría asociados que también se eliminarán. Esta acción no se puede deshacer.`
        : 'Esta acción no se puede deshacer.',
      onOk: async () => {
        await api(`/auditoria/productos/${id}`, { method: 'DELETE' });
        toast('Producto eliminado correctamente');
        await cargarAuditoria();
      }
    });

  } else if (action === 'aud-edit-area') {
    abrirAudModalArea(state.audAreas.find(a => a.id === id));

  } else if (action === 'aud-del-area') {
    const a = state.audAreas.find(x => x.id === id);
    if (!a) return;
    const n = a.total_registros ?? 0;
    confirmar({
      titulo: `¿Eliminar área "${a.nombre}"?`,
      mensaje: n > 0
        ? `Esta área tiene ${n} registro(s) de auditoría asociados que también se eliminarán. Esta acción no se puede deshacer.`
        : 'Esta acción no se puede deshacer.',
      onOk: async () => {
        await api(`/auditoria/areas/${id}`, { method: 'DELETE' });
        toast('Área eliminada correctamente');
        await cargarAuditoria();
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

/* ================================================================
   MÓDULO AUDITORÍA — áreas, productos y registros
   ================================================================ */

state.audAreas = [];
state.audProductos = [];
state.audRegistros = [];
state.audFiltroArea = '';
state.audFechaDesde = '';
state.audFechaHasta = '';
state.audBusquedaCodigo = '';
state.audBusquedaProd = '';
state.audBusquedaArea = '';
state.audProductoEdit = null;
state.audAreaEdit = null;
state.audRegistroEdit = null;
state.audVerRegistroId = null;
state.audExportando = false;

function esAdmin() {
  return !!(currentUser && currentUser.rol === 'ADMIN');
}

function pad2(n) { return String(n).padStart(2, '0'); }

/** Primeras 3 letras del área: sin tildes, mayúsculas, A-Z0-9 */
function audSiglasArea(nombre) {
  return (nombre || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
}

function audCodigoPreview(siglas, correlativo) {
  const n = new Date();
  const num = correlativo != null ? String(correlativo).padStart(2, '0') : '··';
  return `AU-${siglas || '···'}-${n.getFullYear()}-${pad2(n.getMonth() + 1)}-${pad2(n.getDate())}-${num}`;
}

function audNombreCorto(nombre, max = 30) {
  const s = String(nombre ?? '');
  return s.length > max ? s.slice(0, Math.max(1, max - 1)) + '…' : s;
}

async function cargarAuditoria() {
  await Promise.all([cargarAudAreas(), cargarAudProductos(), cargarAudRegistros()]);
}

async function cargarAudAreas() {
  state.audAreas = await api('/auditoria/areas');
  poblarAudSelects();
  renderAudAreas();
}

async function cargarAudProductos() {
  state.audProductos = await api('/auditoria/productos');
  poblarAudSelects();
  renderAudProductos();
}

async function cargarAudRegistros() {
  $('#skeletonAudRegistros').classList.remove('d-none');
  $('#wrapTablaAudRegistros').classList.add('d-none');
  $('#emptyAudRegistros').classList.add('d-none');
  state.audRegistros = await api('/auditoria/registros');
  renderAudRegistros();
}

function poblarAudSelects() {
  const areas = state.audAreas;
  const prods = state.audProductos;
  const opcAreas = areas.map(a => `<option value="${a.id}">${esc(a.nombre)}</option>`).join('');
  const opcProds = prods.map(p => `<option value="${p.id}">${esc(p.codigo)} · ${esc(p.nombre)}</option>`).join('');

  const baseArea = `<option value="" selected disabled>${areas.length ? 'Selecciona un área…' : 'No hay áreas disponibles'}</option>`;
  $('#selAudArea').innerHTML = baseArea + opcAreas;
  $('#editSelAudArea').innerHTML = baseArea + opcAreas;
  $('#selAudFiltroArea').innerHTML = '<option value="">Todas las áreas</option>' + opcAreas;

  const baseProd = `<option value="" selected disabled>${prods.length ? 'Selecciona un producto…' : 'No hay productos disponibles'}</option>`;
  $('#selAudProducto').innerHTML = baseProd + opcProds;
  $('#editSelAudProducto').innerHTML = baseProd + opcProds;
  $('#audWarnSinProductos').classList.toggle('d-none', prods.length > 0);
}

/* ---------- registros: filtros y tabla ---------- */

function audRegistrosFiltrados() {
  const q = state.audBusquedaCodigo.trim().toLowerCase();
  const areaId = state.audFiltroArea;
  const desde = state.audFechaDesde;
  const hasta = state.audFechaHasta;
  return state.audRegistros.filter(r => {
    if (areaId && Number(r.area_id) !== Number(areaId)) return false;
    if (desde || hasta) {
      const fechaReg = String(r.fecha).slice(0, 10);
      if (desde && fechaReg < desde) return false;
      if (hasta && fechaReg > hasta) return false;
    }
    if (q && !String(r.producto_codigo || '').toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderAudRegistros() {
  const total = state.audRegistros.length;
  const lista = audRegistrosFiltrados();
  const hay = total > 0;

  $('#contadorAudRegistros').textContent = hay ? `${lista.length} de ${total} registros` : 'Sin registros';
  $('#skeletonAudRegistros').classList.add('d-none');

  const mostrarVacio = !hay || lista.length === 0;
  $('#wrapTablaAudRegistros').classList.toggle('d-none', mostrarVacio);
  $('#emptyAudRegistros').classList.toggle('d-none', !mostrarVacio);
  $('#btnNuevoAudRegistroEmpty').classList.toggle('d-none', !hay);
  $('#emptyAudRegistrosTitulo').textContent = !hay ? 'Sin registros todavía' : 'Sin resultados';
  $('#emptyAudRegistros p').textContent = !hay
    ? 'Cuando registres una auditoría aparecerá aquí.'
    : 'Ningún registro coincide con los filtros aplicados.';

  if (mostrarVacio) return;

  const admin = esAdmin();
  const acciones = r => admin
    ? `<button class="btn-action btn-view-reg" data-action="aud-view-registro" data-id="${r.id}" title="Ver detalle"><i class="bi bi-eye"></i></button>
       <button class="btn-action" data-action="aud-edit-registro" data-id="${r.id}" title="Editar"><i class="bi bi-pencil-square"></i></button>
       <button class="btn-action danger" data-action="aud-del-registro" data-id="${r.id}" title="Eliminar"><i class="bi bi-trash3"></i></button>`
    : `<button class="btn-action btn-view-reg" data-action="aud-view-registro" data-id="${r.id}" title="Ver detalle"><i class="bi bi-eye"></i></button>`;

  $('#tbodyAudRegistros').innerHTML = lista.map((r, i) => `
      <tr style="--d:${Math.min(i * .035, .4)}s">
        <td><span class="badge badge-code">${esc(r.codigo)}</span></td>
        <td><span class="badge badge-area">${esc(r.area_nombre)}</span></td>
        <td><span class="badge badge-placa">${esc(r.producto_codigo)}</span></td>
        <td>
          <span class="prod-name text-truncate-custom trunc-reg has-tip" data-tip="${esc(r.producto_nombre)}">${esc(audNombreCorto(r.producto_nombre, 16))}</span>
        </td>
        <td class="text-center"><span class="cantidad-chip pos">${r.cantidad}</span></td>
        <td><span class="small text-muted-lila" style="white-space:nowrap">${fmtFecha(r.fecha)}</span></td>
        <td><span class="small text-muted-lila" style="white-space:nowrap">${r.fecha_modifica ? fmtFecha(r.fecha_modifica) : '<span class="text-muted">—</span>'}</span></td>
        <td class="text-end text-nowrap">${acciones(r)}</td>
      </tr>`).join('');

  // Mobile cards
  const existingMobile = $('#wrapTablaAudRegistros').previousElementSibling;
  if (existingMobile && existingMobile.classList.contains('aud-registros-mobile-cards')) existingMobile.remove();
  const mobileHTML = renderAudRegistrosMobile(lista);
  if (mobileHTML) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = mobileHTML;
    $('#wrapTablaAudRegistros').parentNode.insertBefore(wrapper.firstElementChild, $('#wrapTablaAudRegistros'));
  }
}

function renderAudRegistrosMobile(lista) {
  if (!lista.length) return '';
  const admin = esAdmin();
  return `<div class="d-md-none aud-registros-mobile-cards">${lista.map((r, i) => `
    <div class="registro-mobile-card" style="animation-delay:${Math.min(i * .05, .4)}s">
      <div class="rmc-header">
        <div class="rmc-icon ent"><i class="bi bi-clipboard-check"></i></div>
        <div class="rmc-title">
          <span class="rmc-producto has-tip" data-tip="${esc(r.producto_nombre)}">${esc(audNombreCorto(r.producto_nombre, 14))}</span>
          <span class="rmc-codigo"><i class="bi bi-hash"></i>${esc(r.codigo)}</span>
        </div>
        <span class="badge badge-area">${esc(audNombreCorto(r.area_nombre, 14))}</span>
      </div>
      <div class="rmc-body">
        <div class="rmc-field"><label>Código producto</label><span>${esc(r.producto_codigo)}</span></div>
        <div class="rmc-field"><label>Cantidad</label><span class="cantidad-chip pos">${r.cantidad}</span></div>
        <div class="rmc-field"><label>Fecha</label><span>${fmtFecha(r.fecha)}</span></div>
        <div class="rmc-field"><label>Fecha modifica</label><span>${r.fecha_modifica ? fmtFecha(r.fecha_modifica) : '—'}</span></div>
      </div>
      <div class="rmc-actions">
        <button class="btn-action btn-view-reg" data-action="aud-view-registro" data-id="${r.id}" title="Ver detalle"><i class="bi bi-eye"></i></button>
        ${admin
          ? `<button class="btn-action" data-action="aud-edit-registro" data-id="${r.id}" title="Editar"><i class="bi bi-pencil-square"></i></button>
             <button class="btn-action danger" data-action="aud-del-registro" data-id="${r.id}" title="Eliminar"><i class="bi bi-trash3"></i></button>`
          : ''}
      </div>
    </div>`).join('')}</div>`;
}

/* ---------- registros: listeners de filtros ---------- */

$('#inpAudBuscarCodigo').addEventListener('input', e => {
  state.audBusquedaCodigo = e.target.value;
  renderAudRegistros();
});
$('#selAudFiltroArea').addEventListener('change', e => {
  state.audFiltroArea = e.target.value;
  renderAudRegistros();
});
$('#inpAudFechaDesde')?.addEventListener('input', e => {
  state.audFechaDesde = e.target.value;
  $('#btnAudClearDates').style.display = (state.audFechaDesde || state.audFechaHasta) ? '' : 'none';
  renderAudRegistros();
});
$('#inpAudFechaHasta')?.addEventListener('input', e => {
  state.audFechaHasta = e.target.value;
  $('#btnAudClearDates').style.display = (state.audFechaDesde || state.audFechaHasta) ? '' : 'none';
  renderAudRegistros();
});
$('#btnAudClearDates')?.addEventListener('click', () => {
  state.audFechaDesde = '';
  state.audFechaHasta = '';
  $('#inpAudFechaDesde').value = '';
  $('#inpAudFechaHasta').value = '';
  $('#btnAudClearDates').style.display = 'none';
  renderAudRegistros();
});
$('#btnAudRecargar')?.addEventListener('click', async () => {
  try {
    await cargarAuditoria();
    toast('Datos de auditoría actualizados', 'info');
  } catch (err) { toast(err.message, 'danger'); }
});

/* ---------- registros: modal nuevo ---------- */

function actualizarAudPreview() {
  const area = state.audAreas.find(a => a.id === Number($('#selAudArea').value));
  const n = new Date();
  const hoy = `${n.getFullYear()}-${pad2(n.getMonth() + 1)}-${pad2(n.getDate())}`;
  const delDia = area
    ? state.audRegistros.filter(r => Number(r.area_id) === Number(area.id) && String(r.fecha).slice(0, 10) === hoy).length
    : 0;
  $('#audPreviewCodigo').textContent = audCodigoPreview(audSiglasArea(area?.nombre), delDia + 1);
  const prod = state.audProductos.find(p => p.id === Number($('#selAudProducto').value));
  $('#inpAudProductoCodigo').value = prod ? prod.codigo : '';
}

function actualizarEditAudPreview() {
  const prod = state.audProductos.find(p => p.id === Number($('#editSelAudProducto').value));
  $('#editAudProductoCodigo').value = prod ? prod.codigo : '';
}

$('#selAudArea').addEventListener('change', actualizarAudPreview);
$('#selAudProducto').addEventListener('change', actualizarAudPreview);
$('#editSelAudArea').addEventListener('change', actualizarEditAudPreview);
$('#editSelAudProducto').addEventListener('change', actualizarEditAudPreview);

function abrirAudRegistroNuevo() {
  ['#selAudArea', '#selAudProducto', '#inpAudCantidad'].forEach(s => $(s).classList.remove('is-invalid'));
  $('#formAudRegistro').reset();
  $('#inpAudCantidad').value = 1;
  $('#selAudArea').selectedIndex = 0;
  $('#selAudProducto').selectedIndex = 0;
  $('#inpAudProductoCodigo').value = '';
  actualizarAudPreview();
  tick();
  bootstrap.Modal.getOrCreateInstance($('#modalAudRegistro')).show();
}

$('#btnAbrirAudRegistro').addEventListener('click', abrirAudRegistroNuevo);
$('#btnNuevoAudRegistroEmpty').addEventListener('click', abrirAudRegistroNuevo);

$('#formAudRegistro').addEventListener('submit', async e => {
  e.preventDefault();

  const areaId = parseInt($('#selAudArea').value, 10);
  const productoId = parseInt($('#selAudProducto').value, 10);
  const cantidad = parseInt($('#inpAudCantidad').value, 10);

  let ok = true;
  ['#selAudArea', '#selAudProducto', '#inpAudCantidad'].forEach(s => $(s).classList.remove('is-invalid'));
  if (!areaId) { $('#selAudArea').classList.add('is-invalid'); ok = false; }
  if (!productoId) { $('#selAudProducto').classList.add('is-invalid'); ok = false; }
  if (!(cantidad >= 1)) { $('#inpAudCantidad').classList.add('is-invalid'); ok = false; }
  if (!ok) { toast('Revisa los campos marcados en rojo', 'warning'); return; }

  const btn = $('#btnGuardarAudRegistro');
  btn.disabled = true;
  btn.querySelector('.spinner-border').classList.remove('d-none');

  try {
    const nuevo = await api('/auditoria/registros', {
      method: 'POST',
      body: { area_id: areaId, producto_id: productoId, cantidad }
    });
    toast(`Registro ${nuevo.codigo} guardado correctamente`);
    bootstrap.Modal.getOrCreateInstance($('#modalAudRegistro')).hide();
    await cargarAuditoria();
  } catch (err) {
    toast(err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.querySelector('.spinner-border').classList.add('d-none');
  }
});

/* ---------- registros: modal ver y editar ---------- */

function abrirVerAudRegistro(r) {
  $('#audVerRegistroCodigo').textContent = `Código ${r.codigo}`;
  $('#audVerRegArea').textContent = r.area_nombre;
  $('#audVerRegProducto').textContent = r.producto_nombre;
  $('#audVerRegProdCodigo').textContent = r.producto_codigo;
  $('#audVerRegCantidad').innerHTML = `<span class="cantidad-chip pos" style="font-size:1.1rem">${r.cantidad}</span>`;
  $('#audVerRegFecha').textContent = fmtFecha(r.fecha);
  $('#audVerRegFechaMod').textContent = r.fecha_modifica ? fmtFecha(r.fecha_modifica) : 'Sin modificaciones';
  $('#btnAudVerEditar').classList.toggle('d-none', !esAdmin());
  state.audVerRegistroId = r.id;
  bootstrap.Modal.getOrCreateInstance($('#modalAudVerRegistro')).show();
}

$('#btnAudVerEditar')?.addEventListener('click', () => {
  const r = state.audRegistros.find(x => x.id === state.audVerRegistroId);
  if (!r) return;
  bootstrap.Modal.getOrCreateInstance($('#modalAudVerRegistro')).hide();
  setTimeout(() => abrirAudModalRegistroEdit(r), 300);
});

function abrirAudModalRegistroEdit(r) {
  state.audRegistroEdit = r;
  $('#audEditCodigoChip').textContent = `Código ${r.codigo} · Registrado ${fmtFecha(r.fecha)}`;
  $('#editSelAudArea').value = r.area_id;
  $('#editSelAudProducto').value = r.producto_id;
  $('#editAudCantidad').value = r.cantidad;
  actualizarEditAudPreview();
  ['#editSelAudArea', '#editSelAudProducto', '#editAudCantidad'].forEach(s => $(s).classList.remove('is-invalid'));
  bootstrap.Modal.getOrCreateInstance($('#modalAudRegistroEdit')).show();
}

$('#btnGuardarAudRegistroEdit').addEventListener('click', async () => {
  const r = state.audRegistroEdit;
  if (!r) return;

  const areaId = parseInt($('#editSelAudArea').value, 10);
  const productoId = parseInt($('#editSelAudProducto').value, 10);
  const cantidad = parseInt($('#editAudCantidad').value, 10);

  let ok = true;
  ['#editSelAudArea', '#editSelAudProducto', '#editAudCantidad'].forEach(s => $(s).classList.remove('is-invalid'));
  if (!areaId) { $('#editSelAudArea').classList.add('is-invalid'); ok = false; }
  if (!productoId) { $('#editSelAudProducto').classList.add('is-invalid'); ok = false; }
  if (!(cantidad >= 1)) { $('#editAudCantidad').classList.add('is-invalid'); ok = false; }
  if (!ok) { toast('Revisa los campos marcados en rojo', 'warning'); return; }

  const btn = $('#btnGuardarAudRegistroEdit');
  btn.disabled = true;
  btn.querySelector('.spinner-border').classList.remove('d-none');

  try {
    await api(`/auditoria/registros/${r.id}`, {
      method: 'PUT',
      body: { area_id: areaId, producto_id: productoId, cantidad },
      headers: { 'X-User-Rol': currentUser?.rol || '' }
    });
    toast(`Registro ${r.codigo} actualizado`);
    bootstrap.Modal.getOrCreateInstance($('#modalAudRegistroEdit')).hide();
    await cargarAuditoria();
  } catch (err) {
    toast(err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.querySelector('.spinner-border').classList.add('d-none');
  }
});

/* ---------- productos ---------- */

function renderAudProductos() {
  const q = state.audBusquedaProd.toLowerCase();
  const lista = state.audProductos.filter(p =>
    !q || `${p.nombre} ${p.codigo}`.toLowerCase().includes(q)
  );
  const hay = state.audProductos.length > 0;

  $('#contadorAudProductos').textContent = `${lista.length} de ${state.audProductos.length}`;
  $('#skeletonAudProductos').classList.add('d-none');

  const vacio = lista.length === 0;
  $('#emptyAudProductos').classList.toggle('d-none', !vacio);
  $('#wrapTablaAudProductos').classList.toggle('d-none', vacio);
  $('#btnNuevoAudProductoEmpty').classList.toggle('d-none', hay);
  $('#emptyAudProductosTitulo').textContent = !hay ? 'No hay productos' : 'Sin resultados';
  $('#emptyAudProductos p').textContent = !hay
    ? 'Crea tu primer producto de auditoría para poder registrarlo.'
    : 'Prueba con otro término de búsqueda.';

  if (vacio) return;

  $('#tbodyAudProductos').innerHTML = lista.map((p, i) => `
      <tr style="--d:${Math.min(i * .04, .35)}s">
        <td><span class="badge badge-code">${esc(p.codigo)}</span></td>
        <td>
          <span class="prod-name text-truncate-custom trunc-long has-tip" data-tip="${esc(p.nombre)}">${esc(audNombreCorto(p.nombre, 40))}</span><br>
          <span class="prod-meta d-md-none">${p.total_registros} registro(s)</span>
        </td>
        <td class="text-end text-nowrap">
          <button class="btn-action" data-action="aud-edit-producto" data-id="${p.id}" title="Editar"><i class="bi bi-pencil-square"></i></button>
          <button class="btn-action danger" data-action="aud-del-producto" data-id="${p.id}" title="Eliminar"><i class="bi bi-trash3"></i></button>
        </td>
      </tr>`).join('');

  const existingMobile = $('#wrapTablaAudProductos').previousElementSibling;
  if (existingMobile && existingMobile.classList.contains('aud-productos-mobile-cards')) existingMobile.remove();
  const mobileHTML = renderAudProductosMobile(lista);
  if (mobileHTML) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = mobileHTML;
    $('#wrapTablaAudProductos').parentNode.insertBefore(wrapper.firstElementChild, $('#wrapTablaAudProductos'));
  }
}

function renderAudProductosMobile(lista) {
  if (!lista.length) return '';
  return `<div class="d-md-none aud-productos-mobile-cards">${lista.map((p, i) => `
    <div class="producto-mobile-card" style="animation-delay:${Math.min(i * .05, .4)}s">
      <div class="pmc-header">
        <div class="pmc-icon"><i class="bi bi-boxes"></i></div>
        <div class="pmc-info">
          <span class="pmc-name has-tip" data-tip="${esc(p.nombre)}">${esc(audNombreCorto(p.nombre, 26))}</span>
          <span class="pmc-code"><i class="bi bi-hash"></i>${esc(p.codigo)}</span>
        </div>
        <span class="badge badge-count">${p.total_registros}</span>
      </div>
      <div class="pmc-actions">
        <button class="btn-action" data-action="aud-edit-producto" data-id="${p.id}" title="Editar"><i class="bi bi-pencil-square"></i></button>
        <button class="btn-action danger" data-action="aud-del-producto" data-id="${p.id}" title="Eliminar"><i class="bi bi-trash3"></i></button>
      </div>
    </div>`).join('')}</div>`;
}

$('#inpBuscarAudProducto').addEventListener('input', e => {
  state.audBusquedaProd = e.target.value;
  renderAudProductos();
});

function abrirAudModalProducto(p = null) {
  state.audProductoEdit = p;
  $('#tituloModalAudProducto').textContent = p ? 'Editar producto de auditoría' : 'Nuevo producto de auditoría';
  $('#inpAudCodigoProd').value = p?.codigo || '';
  $('#inpAudNombreProd').value = p?.nombre || '';
  ['#inpAudCodigoProd', '#inpAudNombreProd'].forEach(s => $(s).classList.remove('is-invalid'));
  bootstrap.Modal.getOrCreateInstance($('#modalAudProducto')).show();
}

$('#btnNuevoAudProducto').addEventListener('click', () => abrirAudModalProducto());
$('#btnNuevoAudProductoEmpty').addEventListener('click', () => abrirAudModalProducto());

$('#btnGuardarAudProducto').addEventListener('click', async () => {
  const codigo = $('#inpAudCodigoProd').value.trim().toUpperCase();
  const nombre = $('#inpAudNombreProd').value.trim();

  let ok = true;
  ['#inpAudCodigoProd', '#inpAudNombreProd'].forEach(s => $(s).classList.remove('is-invalid'));
  if (!codigo) { $('#inpAudCodigoProd').classList.add('is-invalid'); ok = false; }
  if (!nombre) { $('#inpAudNombreProd').classList.add('is-invalid'); ok = false; }
  if (!ok) { toast('Revisa los campos marcados en rojo', 'warning'); return; }

  const btn = $('#btnGuardarAudProducto');
  btn.disabled = true;
  btn.querySelector('.spinner-border').classList.remove('d-none');

  try {
    const body = { codigo, nombre };
    if (state.audProductoEdit) {
      await api(`/auditoria/productos/${state.audProductoEdit.id}`, { method: 'PUT', body });
      toast(`Producto "${nombre}" actualizado`);
    } else {
      await api('/auditoria/productos', { method: 'POST', body });
      toast(`Producto "${nombre}" creado`);
    }
    bootstrap.Modal.getOrCreateInstance($('#modalAudProducto')).hide();
    await cargarAuditoria();
  } catch (err) {
    toast(err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.querySelector('.spinner-border').classList.add('d-none');
  }
});

/* ---------- áreas ---------- */

function renderAudAreas() {
  const q = state.audBusquedaArea.toLowerCase();
  const lista = state.audAreas.filter(a => !q || a.nombre.toLowerCase().includes(q));
  const hay = state.audAreas.length > 0;

  $('#contadorAudAreas').textContent = `${lista.length} de ${state.audAreas.length}`;
  $('#skeletonAudAreas').classList.add('d-none');

  const vacio = lista.length === 0;
  $('#emptyAudAreas').classList.toggle('d-none', !vacio);
  $('#wrapTablaAudAreas').classList.toggle('d-none', vacio);
  $('#btnNuevoAudAreaEmpty').classList.toggle('d-none', hay);
  $('#emptyAudAreasTitulo').textContent = !hay ? 'No hay áreas' : 'Sin resultados';
  $('#emptyAudAreas p').textContent = !hay
    ? 'Crea tu primera área para poder registrar auditorías.'
    : 'Prueba con otro término de búsqueda.';

  if (vacio) return;

  $('#tbodyAudAreas').innerHTML = lista.map((a, i) => `
      <tr style="--d:${Math.min(i * .04, .35)}s">
        <td>
          <span class="prod-name text-truncate-custom trunc-long has-tip" data-tip="${esc(a.nombre)}">${esc(a.nombre)}</span><br>
          <span class="prod-meta d-md-none">${a.total_registros} registro(s)</span>
        </td>
        <td class="text-end text-nowrap">
          <button class="btn-action" data-action="aud-edit-area" data-id="${a.id}" title="Editar"><i class="bi bi-pencil-square"></i></button>
          <button class="btn-action danger" data-action="aud-del-area" data-id="${a.id}" title="Eliminar"><i class="bi bi-trash3"></i></button>
        </td>
      </tr>`).join('');

  const existingMobile = $('#wrapTablaAudAreas').previousElementSibling;
  if (existingMobile && existingMobile.classList.contains('aud-areas-mobile-cards')) existingMobile.remove();
  const mobileHTML = renderAudAreasMobile(lista);
  if (mobileHTML) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = mobileHTML;
    $('#wrapTablaAudAreas').parentNode.insertBefore(wrapper.firstElementChild, $('#wrapTablaAudAreas'));
  }
}

function renderAudAreasMobile(lista) {
  if (!lista.length) return '';
  return `<div class="d-md-none aud-areas-mobile-cards">${lista.map((a, i) => `
    <div class="producto-mobile-card" style="animation-delay:${Math.min(i * .05, .4)}s">
      <div class="pmc-header">
        <div class="pmc-icon"><i class="bi bi-diagram-3"></i></div>
        <div class="pmc-info">
          <span class="pmc-name">${esc(a.nombre)}</span>
          <span class="pmc-code">${a.total_registros} registro(s)</span>
        </div>
      </div>
      <div class="pmc-actions">
        <button class="btn-action" data-action="aud-edit-area" data-id="${a.id}" title="Editar"><i class="bi bi-pencil-square"></i></button>
        <button class="btn-action danger" data-action="aud-del-area" data-id="${a.id}" title="Eliminar"><i class="bi bi-trash3"></i></button>
      </div>
    </div>`).join('')}</div>`;
}

$('#inpBuscarAudArea').addEventListener('input', e => {
  state.audBusquedaArea = e.target.value;
  renderAudAreas();
});

function abrirAudModalArea(a = null) {
  state.audAreaEdit = a;
  $('#tituloModalAudArea').textContent = a ? 'Editar área de auditoría' : 'Nueva área de auditoría';
  $('#inpAudNombreArea').value = a?.nombre || '';
  $('#inpAudNombreArea').classList.remove('is-invalid');
  bootstrap.Modal.getOrCreateInstance($('#modalAudArea')).show();
}

$('#btnNuevoAudArea').addEventListener('click', () => abrirAudModalArea());
$('#btnNuevoAudAreaEmpty').addEventListener('click', () => abrirAudModalArea());

$('#btnGuardarAudArea').addEventListener('click', async () => {
  const nombre = $('#inpAudNombreArea').value.trim();
  $('#inpAudNombreArea').classList.remove('is-invalid');
  if (!nombre) {
    $('#inpAudNombreArea').classList.add('is-invalid');
    toast('Revisa los campos marcados en rojo', 'warning');
    return;
  }

  const btn = $('#btnGuardarAudArea');
  btn.disabled = true;
  btn.querySelector('.spinner-border').classList.remove('d-none');

  try {
    const body = { nombre };
    if (state.audAreaEdit) {
      await api(`/auditoria/areas/${state.audAreaEdit.id}`, { method: 'PUT', body });
      toast(`Área "${nombre}" actualizada`);
    } else {
      await api('/auditoria/areas', { method: 'POST', body });
      toast(`Área "${nombre}" creada`);
    }
    bootstrap.Modal.getOrCreateInstance($('#modalAudArea')).hide();
    await cargarAuditoria();
  } catch (err) {
    toast(err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.querySelector('.spinner-border').classList.add('d-none');
  }
});

/* ---------- exportación a excel ---------- */

function resetBtnAudExport(ok = false) {
  const btn = $('#btnAudExportar');
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
      state.audExportando = false;
    }, 1600);
  } else {
    btn.querySelector('.be-label').textContent = 'Exportar';
    btn.disabled = false;
    state.audExportando = false;
  }
}

async function exportarAudExcel() {
  if (state.audExportando) return;

  const lista = audRegistrosFiltrados();
  if (!lista.length) {
    toast('No hay registros para exportar con los filtros actuales', 'warning');
    return;
  }

  state.audExportando = true;
  const btn = $('#btnAudExportar');
  btn.disabled = true;
  btn.classList.add('is-loading');
  btn.querySelector('.be-spinner').classList.remove('d-none');
  btn.querySelector('.be-ico').classList.add('d-none');
  btn.querySelector('.be-label').textContent = 'Generando…';

  try {
    await new Promise(r => setTimeout(r, 800));

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Auditoría', { views: [{ state: 'frozen', ySplit: 3 }] });

    ws.columns = [{ width: 24 }, { width: 22 }, { width: 16 }, { width: 38 }, { width: 10 }, { width: 20 }, { width: 20 }];

    ws.mergeCells('A1:G1');
    const titulo = ws.getCell('A1');
    titulo.value = 'Registros de auditoría · Suministros Farmacias Peruanas';
    titulo.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FF5B21B6' } };
    titulo.alignment = { vertical: 'middle' };
    ws.getRow(1).height = 26;

    ws.mergeCells('A2:G2');
    const sub = ws.getCell('A2');
    sub.value = `Exportado el ${new Date().toLocaleString('es-PE')} · ${lista.length} registro(s)`;
    sub.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF8A84A3' } };

    const headerRow = ws.getRow(3);
    headerRow.values = ['Código', 'Área', 'Código producto', 'Producto', 'Cantidad', 'Fecha', 'Fecha modifica'];
    headerRow.height = 22;
    headerRow.eachCell(c => {
      c.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
      c.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    lista.forEach((r, i) => {
      const row = ws.addRow([
        r.codigo,
        r.area_nombre,
        r.producto_codigo,
        r.producto_nombre,
        Number(r.cantidad),
        fmtFecha(r.fecha),
        r.fecha_modifica ? fmtFecha(r.fecha_modifica) : ''
      ]);
      row.getCell(5).alignment = { horizontal: 'center' };
      row.getCell(1).font = { name: 'Consolas', size: 10 };
      row.getCell(3).font = { name: 'Consolas', size: 10 };
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
    const stamp = `${f.getFullYear()}${pad2(f.getMonth() + 1)}${pad2(f.getDate())}_${pad2(f.getHours())}${pad2(f.getMinutes())}`;
    a.href = url;
    a.download = `Auditoria_Registros_${stamp}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    resetBtnAudExport(true);
    toast(`Excel generado con ${lista.length} registro(s)`);
  } catch (err) {
    toast(err.message, 'danger');
    resetBtnAudExport(false);
  }
}

$('#btnAudExportar').addEventListener('click', exportarAudExcel);

/* ---------- tooltip responsivo ---------- */

let appTipEl = null;

function mostrarAppTip(el) {
  const texto = el.getAttribute('data-tip') || '';
  if (!texto) return;
  if (!appTipEl) {
    appTipEl = document.createElement('div');
    appTipEl.className = 'app-tooltip';
    appTipEl.setAttribute('role', 'tooltip');
    document.body.appendChild(appTipEl);
  }
  appTipEl.textContent = texto;
  appTipEl.classList.add('show');
  const r = el.getBoundingClientRect();
  const tw = appTipEl.offsetWidth;
  const th = appTipEl.offsetHeight;
  let left = r.left + r.width / 2 - tw / 2;
  let top = r.bottom + 10;
  if (left < 10) left = 10;
  if (left + tw > window.innerWidth - 10) left = window.innerWidth - tw - 10;
  if (top + th > window.innerHeight - 10) top = r.top - th - 10;
  appTipEl.style.left = `${left}px`;
  appTipEl.style.top = `${top}px`;
}

function ocultarAppTip() {
  if (appTipEl) appTipEl.classList.remove('show');
}

document.addEventListener('mouseover', e => {
  const el = e.target.closest('.has-tip');
  if (el) mostrarAppTip(el);
});
document.addEventListener('mouseout', e => {
  if (e.target.closest('.has-tip')) ocultarAppTip();
});

/* ================================================================
   DASHBOARD DE PRODUCCIÓN — Chart.js
   ================================================================ */

/* ── Referencias persistentes a las instancias Chart ──────────── */
let _chartTendencia   = null;
let _chartDonut       = null;
let _chartTop         = null;
let _chartDiaSemana   = null;
let _chartProveedores = null;

/* ── Paleta consistente ───────────────────────────────────────── */
const C = {
  purple:  '#7c3aed',
  purpleL: 'rgba(124,58,237,.18)',
  pink:    '#f472b6',
  pinkL:   'rgba(244,114,182,.18)',
  green:   '#10b981',
  greenL:  'rgba(16,185,129,.18)',
  red:     '#ef4444',
  redL:    'rgba(239,68,68,.18)',
  amber:   '#f59e0b',
  amberL:  'rgba(245,158,11,.18)',
  blue:    '#3b82f6',
  blueL:   'rgba(59,130,246,.18)',
  gray100: '#f3f4f6',
  gray300: '#d1d5db',
  gray500: '#6b7280',
  ink:     '#241b3a',
};

/* ── Chart.js defaults globales ───────────────────────────────── */
if (window.Chart) {
  Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.color = C.gray500;
  Chart.defaults.plugins.legend.display = false;
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(36,27,58,.88)';
  Chart.defaults.plugins.tooltip.titleFont = { weight: '600', size: 13 };
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 10;
  Chart.defaults.plugins.tooltip.displayColors = true;
  Chart.defaults.plugins.tooltip.boxPadding = 4;
  Chart.defaults.elements.bar.borderRadius = 6;
  Chart.defaults.elements.point.radius = 3;
  Chart.defaults.elements.point.hoverRadius = 6;
  Chart.defaults.elements.line.tension = .35;
}

/* ── Helpers ──────────────────────────────────────────────────── */
const _ctx = id => document.getElementById(id)?.getContext('2d');
const _destroy = chart => { if (chart) { chart.destroy(); return null; } return null; };
const _num = v => Number(v) || 0;
const _shortDate = iso => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
};

/* ── Dashboard filter listeners ───────────────────────────────── */
$$('.chip-filtro-dash[data-periodo]').forEach(chip => {
  chip.addEventListener('click', () => {
    $$('.chip-filtro-dash[data-periodo]').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.dashboardPeriodo = chip.dataset.periodo;
    if (state.dashData) renderDashboardFromData(state.dashData);
  });
});
$$('.chip-filtro-dash[data-dash-tipo]').forEach(chip => {
  chip.addEventListener('click', () => {
    $$('.chip-filtro-dash[data-dash-tipo]').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.dashboardTipo = chip.dataset.dashTipo;
    if (state.dashData) renderDashboardFromData(state.dashData);
  });
});

/* ── Filtrar registros por período ────────────────────────────── */
function filtrarDashPorPeriodo(registros) {
  if (state.dashboardPeriodo === 'all') return registros;
  const hoy = new Date();
  const isoHoy = hoy.toISOString().slice(0, 10);
  let desde;
  switch (state.dashboardPeriodo) {
    case 'hoy':
      desde = isoHoy;
      break;
    case '7d':
      desde = new Date(hoy.getTime() - 7 * 86400000).toISOString().slice(0, 10);
      break;
    case '30d':
      desde = new Date(hoy.getTime() - 30 * 86400000).toISOString().slice(0, 10);
      break;
    case 'mes':
      desde = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
      break;
    default:
      return registros;
  }
  return registros.filter(r => String(r.fecha_hora).slice(0, 10) >= desde);
}

/* ── Función principal ────────────────────────────────────────── */
async function cargarDashboard() {
  try {
    /* skeleton loading */
    $('#listaStock').innerHTML = `
      <div class="skeleton-group">
        <div class="skel-row"><span class="skeleton w-25"></span><span class="skeleton flex-fill"></span><span class="skeleton w-15"></span></div>
        <div class="skel-row"><span class="skeleton w-25"></span><span class="skeleton flex-fill"></span><span class="skeleton w-15"></span></div>
      </div>`;

    const data = await api('/dashboard');
    state.dashData = data;
    renderDashboardFromData(data);
  } catch (err) {
    toast(err.message, 'danger');
  }
}

/* ── Render dashboard from data with filters ─────────────────── */
function renderDashboardFromData(data) {
  try {
    const { stats, productos, movimientosPorDia, topProductos, ultimosRegistros, topProveedores, movimientosPorDiaSemana, alertas } = data;

    /* ── Filter registros by period for derived KPIs ────────────── */
    const registrosRaw = state.registros || [];
    const registrosPeriodo = filtrarDashPorPeriodo(registrosRaw);
    const tipoFilter = state.dashboardTipo;

    const ent = registrosPeriodo.filter(r => r.tipo === 'ENTREGA' && (tipoFilter === 'TODOS' || r.tipo === tipoFilter)).reduce((s, r) => s + Number(r.cantidad), 0);
    const dev = registrosPeriodo.filter(r => r.tipo === 'DEVOLUCION' && (tipoFilter === 'TODOS' || r.tipo === tipoFilter)).reduce((s, r) => s + Number(r.cantidad), 0);
    const totalMovimientos = registrosPeriodo.filter(r => tipoFilter === 'TODOS' || r.tipo === tipoFilter).length;

    const totalHoy = _num(stats.entregasHoy) + _num(stats.devolucionesHoy);
    const stockTotal = productos.reduce((s, p) => s + _num(p.stock), 0);
    const tasaDev = (ent + dev) > 0 ? Math.round((dev / (ent + dev)) * 100) : 0;
    const eficiencia = ent > 0 ? Math.round(((ent - dev) / ent) * 100) : 0;
    const numAlertas = alertas ? alertas.length : 0;

    /* ── KPI cards ────────────────────────────────────────────── */
    countUp($('#statProductos'), _num(stats.totalProductos));
    countUp($('#statHoy'), totalHoy);
    countUp($('#statEntregadas'), ent);
    countUp($('#statDevueltas'), dev);
    countUp($('#kpiStockTotal'), stockTotal);
    $('#kpiEficiencia').textContent = eficiencia + '%';
    $('#kpiDevolucionPct').textContent = tasaDev + '%';
    countUp($('#kpiAlertas'), numAlertas);

    /* ── Filter movimientosPorDia by period ──────────────────── */
    const hoyISO = new Date().toISOString().slice(0, 10);
    let movFiltrados = movimientosPorDia || [];
    if (state.dashboardPeriodo !== 'all') {
      let desde;
      switch (state.dashboardPeriodo) {
        case 'hoy': desde = hoyISO; break;
        case '7d': desde = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10); break;
        case '30d': desde = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10); break;
        case 'mes': desde = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`; break;
        default: desde = null;
      }
      if (desde) movFiltrados = movFiltrados.filter(d => d.fecha >= desde);
    }
    // Apply type filter to daily data
    if (tipoFilter !== 'TODOS') {
      movFiltrados = movFiltrados.map(d => ({
        ...d,
        entregas: tipoFilter === 'ENTREGA' ? _num(d.entregas) : 0,
        devoluciones: tipoFilter === 'DEVOLUCION' ? _num(d.devoluciones) : 0
      }));
    }

    /* ── 1. Tendencia (Área + Línea) ──────────────────────────── */
    _chartTendencia = _destroy(_chartTendencia);
    const tendenciaEmpty = !movFiltrados || movFiltrados.length === 0;
    $('#emptyTendencia')?.classList.toggle('d-none', !tendenciaEmpty);
    const canvasT = $('#chartTendencia');
    if (canvasT) canvasT.parentElement.style.display = tendenciaEmpty ? 'none' : '';

    if (!tendenciaEmpty) {
      const labels = movFiltrados.map(d => _shortDate(d.fecha));
      _chartTendencia = new Chart(_ctx('chartTendencia'), {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Entregas',
              data: movFiltrados.map(d => _num(d.entregas)),
              borderColor: C.purple,
              backgroundColor: C.purpleL,
              fill: true,
              borderWidth: 2.5,
            },
            {
              label: 'Devoluciones',
              data: movFiltrados.map(d => _num(d.devoluciones)),
              borderColor: C.pink,
              backgroundColor: C.pinkL,
              fill: true,
              borderWidth: 2.5,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: true, position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, font: { weight: '600', size: 12 } } },
            tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y} uds` } }
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 } } },
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.04)' }, ticks: { precision: 0, font: { size: 11 } } }
          }
        }
      });
    }

    /* ── 2. Donut Entregas vs Devoluciones ────────────────────── */
    _chartDonut = _destroy(_chartDonut);
    if (ent + dev > 0) {
      _chartDonut = new Chart(_ctx('chartDonut'), {
        type: 'doughnut',
        data: {
          labels: ['Entregas', 'Devoluciones'],
          datasets: [{
            data: [ent, dev],
            backgroundColor: [C.purple, C.pink],
            borderWidth: 0,
            hoverOffset: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed.toLocaleString('es-PE')} uds` } }
          }
        },
        plugins: [{
          id: 'donutCenter',
          afterDraw(chart) {
            const { ctx: c, chartArea: { width, height, top } } = chart;
            const total = ent + dev;
            const pct = total > 0 ? Math.round((ent / total) * 100) : 0;
            c.save();
            c.font = "700 26px 'Space Grotesk', sans-serif";
            c.fillStyle = C.purple;
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText(pct + '%', width / 2, top + height / 2 - 8);
            c.font = "500 11px 'Inter', sans-serif";
            c.fillStyle = C.gray500;
            c.fillText('en entregas', width / 2, top + height / 2 + 16);
            c.restore();
          }
        }]
      });
    }
    $('#legEntregas').textContent = ent.toLocaleString('es-PE');
    $('#legDevoluciones').textContent = dev.toLocaleString('es-PE');

    /* ── 3. Top 5 productos más movidos (Horizontal Bar) ──────── */
    _chartTop = _destroy(_chartTop);
    // Apply type filter to top products
    let topProdsFiltered = topProductos || [];
    if (tipoFilter === 'ENTREGA') {
      topProdsFiltered = topProdsFiltered.filter(p => _num(p.entregas) > 0).map(p => ({ ...p, totalMovido: _num(p.entregas), devoluciones: 0 }));
    } else if (tipoFilter === 'DEVOLUCION') {
      topProdsFiltered = topProdsFiltered.filter(p => _num(p.devoluciones) > 0).map(p => ({ ...p, totalMovido: _num(p.devoluciones), entregas: 0 }));
    }
    const topEmpty = topProdsFiltered.length === 0;
    $('#emptyTop')?.classList.toggle('d-none', !topEmpty);
    const canvasTop = $('#chartTopProductos');
    if (canvasTop) canvasTop.parentElement.style.display = topEmpty ? 'none' : '';

    if (!topEmpty) {
      _chartTop = new Chart(_ctx('chartTopProductos'), {
        type: 'bar',
        data: {
          labels: topProdsFiltered.map(p => p.nombre.length > 18 ? p.nombre.slice(0, 16) + '…' : p.nombre),
          datasets: [
            {
              label: 'Entregas',
              data: topProdsFiltered.map(p => _num(p.entregas)),
              backgroundColor: C.purple,
              borderRadius: 6,
            },
            {
              label: 'Devoluciones',
              data: topProdsFiltered.map(p => _num(p.devoluciones)),
              backgroundColor: C.pink,
              borderRadius: 6,
            }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'top', labels: { usePointStyle: true, pointStyle: 'rect', padding: 16, font: { weight: '600', size: 12 } } },
            tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.x} uds` } }
          },
          scales: {
            x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.04)' }, ticks: { precision: 0, font: { size: 11 } } },
            y: { grid: { display: false }, ticks: { font: { size: 11, weight: '600' } } }
          }
        }
      });
    }

    /* ── 4. Actividad por día de semana (Bar) ─────────────────── */
    _chartDiaSemana = _destroy(_chartDiaSemana);
    let diasSemData = movimientosPorDiaSemana || [];
    if (tipoFilter === 'ENTREGA') {
      diasSemData = diasSemData.map(d => ({ ...d, devoluciones: 0 }));
    } else if (tipoFilter === 'DEVOLUCION') {
      diasSemData = diasSemData.map(d => ({ ...d, entregas: 0 }));
    }
    const diasSemanaEmpty = diasSemData.length < 2;
    $('#emptyDiaSemana')?.classList.toggle('d-none', !diasSemanaEmpty);
    const canvasDia = $('#chartDiaSemana');
    if (canvasDia) canvasDia.parentElement.style.display = diasSemanaEmpty ? 'none' : '';

    if (!diasSemanaEmpty) {
      const diasOrder = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const diasData = diasOrder.map(dia => {
        const found = diasSemData.find(d => d.dia === dia);
        return found || { dia, entregas: 0, devoluciones: 0 };
      });
      _chartDiaSemana = new Chart(_ctx('chartDiaSemana'), {
        type: 'bar',
        data: {
          labels: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
          datasets: [
            {
              label: 'Entregas',
              data: diasData.map(d => _num(d.entregas)),
              backgroundColor: C.purple,
              borderRadius: 4,
            },
            {
              label: 'Devoluciones',
              data: diasData.map(d => _num(d.devoluciones)),
              backgroundColor: C.pink,
              borderRadius: 4,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'top', labels: { usePointStyle: true, pointStyle: 'rect', padding: 16, font: { weight: '600', size: 12 } } },
            tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y} uds` } }
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11, weight: '600' } } },
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.04)' }, ticks: { precision: 0, font: { size: 11 } } }
          }
        }
      });
    }

    /* ── 5. Top proveedores (Doughnut) ─────────────────────────── */
    _chartProveedores = _destroy(_chartProveedores);
    let provFiltered = topProveedores || [];
    if (tipoFilter === 'ENTREGA') {
      provFiltered = provFiltered.filter(p => _num(p.entregas) > 0).map(p => ({ ...p, volumenTotal: _num(p.entregas), devoluciones: 0 }));
    } else if (tipoFilter === 'DEVOLUCION') {
      provFiltered = provFiltered.filter(p => _num(p.devoluciones) > 0).map(p => ({ ...p, volumenTotal: _num(p.devoluciones), entregas: 0 }));
    }
    const provEmpty = provFiltered.length === 0;
    $('#emptyProveedores')?.classList.toggle('d-none', !provEmpty);
    const canvasProv = $('#chartProveedores');
    if (canvasProv) canvasProv.parentElement.style.display = provEmpty ? 'none' : '';

    if (!provEmpty) {
      const provColors = [C.purple, C.pink, C.green, C.amber, C.blue, C.red];
      _chartProveedores = new Chart(_ctx('chartProveedores'), {
        type: 'doughnut',
        data: {
          labels: provFiltered.map(p => p.proveedor.length > 15 ? p.proveedor.slice(0, 13) + '…' : p.proveedor),
          datasets: [{
            data: provFiltered.map(p => _num(p.volumenTotal)),
            backgroundColor: provFiltered.map((_, i) => provColors[i % provColors.length]),
            borderWidth: 0,
            hoverOffset: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '55%',
          plugins: {
            legend: { display: true, position: 'right', labels: { usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11, weight: '600' } } },
            tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed.toLocaleString('es-PE')} uds` } }
          }
        }
      });
    }

    /* ── 6. Alertas de stock bajo ──────────────────────────────── */
    $('#rowAlertas').classList.toggle('d-none', numAlertas === 0);
    if (numAlertas > 0) {
      $('#listaAlertas').innerHTML = alertas.map((a, i) => {
        const stock = _num(a.stock);
        const clase = stock === 0 ? 'zero' : 'low';
        return `
          <div class="stock-row" style="--d:${Math.min(i * .05, .45)}s">
            <div>
              <span class="stock-name">${esc(a.nombre)}</span>
              <span class="stock-meta">${esc(a.codigo)} · ${esc(a.unidad)}</span>
            </div>
            <div class="stock-nums">
              <span class="num-total ${clase}" style="font-weight:700;font-size:1rem">${stock} <small>unidades</small></span>
            </div>
          </div>`;
      }).join('');
    }

    /* ── 7. Stock por producto (barras animadas) ───────────────── */
    $('#emptyDash').classList.toggle('d-none', productos.length > 0);
    $('#listaStock').classList.toggle('d-none', productos.length === 0);

    if (productos.length > 0) {
      const maxStock = Math.max(1, ...productos.map(p => Math.abs(_num(p.stock))));
      $('#listaStock').innerHTML = productos.map((p, i) => {
        const stock = _num(p.stock);
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
              <span class="num-pos" title="Entregas">+${_num(p.entregas).toLocaleString('es-PE')}</span>
              <span class="num-neg" title="Devoluciones">−${_num(p.devoluciones).toLocaleString('es-PE')}</span>
              <span class="num-total">${stock.toLocaleString('es-PE')} <small>stock</small></span>
            </div>
          </div>`;
      }).join('');

      requestAnimationFrame(() => requestAnimationFrame(() => {
        $$('#listaStock .stock-bar').forEach(b => { b.style.width = `${b.dataset.w}%`; });
      }));
    }

    /* ── 6. Últimos movimientos (timeline) ────────────────────── */
    let actFiltrada = ultimosRegistros || [];
    if (state.dashboardPeriodo !== 'all') {
      let desdeAct;
      switch (state.dashboardPeriodo) {
        case 'hoy': desdeAct = hoyISO; break;
        case '7d': desdeAct = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10); break;
        case '30d': desdeAct = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10); break;
        case 'mes': desdeAct = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`; break;
        default: desdeAct = null;
      }
      // recent activity comes formatted, parse date from DD/MM/YYYY · HH:MM format
      if (desdeAct) {
        actFiltrada = actFiltrada.filter(r => {
          // We need the raw date from the underlying registros
          const raw = registrosPeriodo.find(rp => rp.codigo === r.codigo);
          return raw && String(raw.fecha_hora).slice(0, 10) >= desdeAct;
        });
      }
    }
    if (tipoFilter !== 'TODOS') {
      actFiltrada = actFiltrada.filter(r => r.tipo === tipoFilter);
    }
    $('#emptyActividad').classList.toggle('d-none', actFiltrada.length > 0);
    $('#listaActividad').classList.toggle('d-none', actFiltrada.length === 0);

    if (actFiltrada.length > 0) {
      $('#listaActividad').innerHTML = actFiltrada.map((r, i) => {
        const isEnt = r.tipo === 'ENTREGA';
        return `
          <div class="activity-row" style="--d:${Math.min(i * .04, .35)}s">
            <div class="activity-dot ${isEnt ? 'ent' : 'dev'}"></div>
            <div class="activity-body">
              <div class="activity-top">
                <span class="activity-badge ${isEnt ? 'ent' : 'dev'}">${isEnt ? 'Entrega' : 'Devolución'}</span>
                <span class="activity-cant ${isEnt ? 'pos' : 'neg'}">${isEnt ? '+' : '−'}${r.cantidad}</span>
              </div>
              <div class="activity-producto">${esc(r.producto)}</div>
              <div class="activity-meta">
                <span><i class="bi bi-hash"></i>${esc(r.codigo)}</span>
                <span><i class="bi bi-truck"></i>${esc(r.placa)}</span>
                <span><i class="bi bi-clock"></i>${esc(r.fecha)}</span>
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

/* ---------- mobile cards ---------- */

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
          <span class="rmc-producto" title="${esc(r.producto_nombre)}">${esc(r.producto_nombre.length > 20 ? r.producto_nombre.slice(0, 18) + '…' : r.producto_nombre)}</span>
          <span class="rmc-codigo"><i class="bi bi-hash"></i>${esc(r.codigo)}</span>
        </div>
        <span class="badge ${r.tipo === 'ENTREGA' ? 'badge-entrega' : 'badge-devolucion'}">${r.tipo === 'ENTREGA' ? 'Entrega' : 'Devolución'}</span>
      </div>
      <div class="rmc-body">
        <div class="rmc-field"><label>Código</label><span>${esc(r.producto_codigo)}</span></div>
        <div class="rmc-field"><label>Cantidad</label><span class="cantidad-chip ${r.tipo === 'ENTREGA' ? 'pos' : 'neg'}">${r.tipo === 'ENTREGA' ? '+' : '−'}${r.cantidad} ${esc(r.unidad)}</span></div>
        <div class="rmc-field"><label>Placa</label><span>${esc(r.placa)}</span></div>
        <div class="rmc-field"><label>N° Guía</label><span>${esc(r.numero_guia)}</span></div>
        <div class="rmc-field"><label>Proveedor</label><span>${esc(r.proveedor || '—')}</span></div>
        <div class="rmc-field"><label>Fecha</label><span>${fmtFecha(r.fecha_hora)}</span></div>
      </div>
      <div class="rmc-actions">
        <button class="btn-action btn-view-reg" data-action="view-registro" data-id="${r.id}" title="Ver detalle"><i class="bi bi-eye"></i></button>
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
          <span class="pmc-name" title="${esc(p.nombre)}">${esc(p.nombre.length > 20 ? p.nombre.slice(0, 18) + '…' : p.nombre)}</span>
          <span class="pmc-code"><i class="bi bi-hash"></i>${esc(p.codigo)}</span>
        </div>
        <span class="badge ${p.activo ? 'badge-activo' : 'badge-inactivo'}">${p.activo ? 'Activo' : 'Inactivo'}</span>
      </div>
      <div class="pmc-body">
        <div class="pmc-field"><label>Observaciones</label><span>${esc(p.observaciones || '—')}</span></div>
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
      await Promise.all([cargarProductos(), cargarRegistros(), cargarAuditoria()]);
    } catch (err) {
      toast(err.message, 'danger');
      $('#skeletonRegistros').classList.add('d-none');
      $('#skeletonProductos').classList.add('d-none');
      $('#skeletonAudRegistros').classList.add('d-none');
      $('#contadorRegistros').textContent = 'Error de conexión';
      $('#contadorProductos').textContent = 'Error';
      $('#contadorAudRegistros').textContent = 'Error';
    }
  })();
}
