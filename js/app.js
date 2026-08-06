/* ===== GASOLINA K3 — Lógica principal ===== */

// ===== Referencias al DOM =====
const $ = (id) => document.getElementById(id);

const formTanqueo = $('form-tanqueo');
const inputId = $('tanqueo-id');
const inputFecha = $('fecha');
const selectEstacion = $('estacion');
const inputCombustible = $('combustible');
const toggleCombustible = $('toggle-combustible');
const inputPrecio = $('precio');
const inputValorPagado = $('valorPagado');
const inputGalones = $('galones');
const inputOdometro = $('odometro');
const hiddenTanqueLleno = $('tanque-lleno');
const toggleTanqueLleno = $('toggle-tanque-lleno');
const inputNotas = $('notas');
const btnSubmit = $('btn-submit');
const btnReset = $('btn-reset');
const btnCancelEdit = $('btn-cancel-edit');
const btnNuevaEstacion = $('btn-nueva-estacion');
const modalNuevaEstacion = $('modal-nueva-estacion');
const inputNuevaEstacion = $('nueva-estacion-nombre');
const btnNuevaEstacionCancelar = $('btn-nueva-estacion-cancelar');
const btnNuevaEstacionGuardar = $('btn-nueva-estacion-guardar');
const btnExportJSON = $('btn-export-json');
const btnImportJSON = $('btn-import-json');
const inputImportJSON = $('input-import-json');
const btnMigrar = $('btn-migrar');
const btnConfig = $('btn-config');
const syncStatus = $('sync-status');
const btnMenu = $('btn-menu');
const menuAcciones = $('menu-acciones');
const loadingOverlay = $('loading-overlay');
const loadingMensaje = $('loading-mensaje');
const configOverlay = $('config-overlay');
const configError = $('config-error');
const configUrl = $('config-url');
const configKey = $('config-key');
const btnConfigGuardar = $('btn-config-guardar');
const btnConfigCerrar = $('btn-config-cerrar');
const btnConfigMasTarde = $('btn-config-mas-tarde');
const btnConfigReset = $('btn-config-reset');

const tablaBody = $('tabla-body');
const tablaVacia = $('tabla-vacia');
const historialCount = $('historial-count');

const filtroEstacion = $('filtro-estacion');
const filtroCombustible = $('filtro-combustible');
const selectorFiltros = $('filtros');

const ultimoRendimiento = $('ultimo-rendimiento');
const ultimoRendimientoValor = $('ultimo-rendimiento-valor');
const ultimoRendimientoDetalle = $('ultimo-rendimiento-detalle');

const modalConfirmar = $('modal-confirmar');
const btnModalCancelar = $('btn-modal-cancelar');
const btnModalEliminar = $('btn-modal-eliminar');
const modalMensaje = $('modal-mensaje');

// Dashboard
const dashRendidora = $('dash-rendidora');
const dashRendidoraDetalle = $('dash-rendidora-detalle');
const dashCosto = $('dash-costo');
const dashCostoDetalle = $('dash-costo-detalle');
const dashEconomico = $('dash-economico');
const dashEconomicoDetalle = $('dash-economico-detalle');
const tablaEstacionesBody = $('tabla-estaciones-body');

// Pestañas
const tabBtnRegistro = $('tab-btn-registro');
const tabBtnDashboard = $('tab-btn-dashboard');
const tabRegistro = $('tab-registro');
const tabDashboard = $('tab-dashboard');

// Variables de estado
let tanqueos = [];
let estaciones = [];
let tanqueoEnEdicion = null;
let tanqueoAEliminar = null;

// Gráfico
let chartRendimiento = null;
const graficoSection = $('grafico');
const fabAgregar = $('fab-agregar');

// ===== Inicialización =====
document.addEventListener('DOMContentLoaded', iniciar);

async function iniciar() {
  // Cargar datos con respaldo seguro: aunque falle la carga, la app siempre responde
  let datos = { tanqueos: [], estaciones: [] };
  try {
    datos = await Store.cargarTodo();
  } catch (e) {
    console.error('Error al cargar datos iniciales:', e);
    mostrarToast('No se pudieron cargar los datos guardados. Se muestran valores vacíos.', 'error');
  }
  tanqueos = datos.tanqueos || [];
  estaciones = datos.estaciones || [];

  // Fecha por defecto: hoy
  inputFecha.value = obtenerFechaHoy();

  // Configurar tema
  aplicarTemaGuardado();

  // Eventos
  registrarEventos();

  // Renderizar
  actualizarInterfaz();

  // Inicializar Supabase (migración, sincronización y verificación)
  await iniciarSupabase();
}

// ===== Registro de eventos =====
function registrarEventos() {
  // Formulario
  formTanqueo.addEventListener('submit', manejarEnvioFormulario);
  btnReset.addEventListener('click', limpiarFormulario);
  btnCancelEdit.addEventListener('click', cancelarEdicion);

  // Calcular galones y costo en vivo
  inputPrecio.addEventListener('input', recalcularCampos);
  inputValorPagado.addEventListener('input', recalcularCampos);

  // Toggle Tanque Lleno / Parcial
  toggleTanqueLleno.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    setTanqueLlenoValor(Number(btn.dataset.valor));
  });

  // Toggle Tipo de Combustible (Corriente / Extra)
  toggleCombustible.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    setCombustibleValor(btn.dataset.valor);
  });

  // Filtros
  filtroEstacion.addEventListener('change', renderizarTabla);
  filtroCombustible.addEventListener('change', renderizarTabla);

  // Nueva estación
  btnNuevaEstacion.addEventListener('click', abrirModalNuevaEstacion);
  btnNuevaEstacionCancelar.addEventListener('click', cerrarModalNuevaEstacion);
  btnNuevaEstacionGuardar.addEventListener('click', guardarNuevaEstacion);
  modalNuevaEstacion.addEventListener('click', (e) => {
    if (e.target === modalNuevaEstacion) cerrarModalNuevaEstacion();
  });
  inputNuevaEstacion.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      guardarNuevaEstacion();
    }
  });

  // Exportar / Importar JSON
  btnExportJSON.addEventListener('click', exportarDatosJSON);
  btnImportJSON.addEventListener('click', () => inputImportJSON.click());
  inputImportJSON.addEventListener('change', importarDatosJSON);

  // Botones del header
  $('btn-theme').addEventListener('click', alternarTema);
  $('btn-export').addEventListener('click', exportarDatosCSV);

  // Menú hamburguesa (móvil): abre/cierra las acciones de datos
  btnMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    alternarMenuAcciones();
  });
  menuAcciones.addEventListener('click', (e) => {
    if (e.target.closest('button')) cerrarMenuAcciones();
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#btn-menu') && !e.target.closest('#menu-acciones')) {
      cerrarMenuAcciones();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarMenuAcciones();
  });

  // Supabase
  btnMigrar.addEventListener('click', migrarDatosLocales);
  btnConfig.addEventListener('click', abrirConfiguracionSupabase);
  btnConfigGuardar.addEventListener('click', guardarConfiguracionSupabase);
  btnConfigCerrar.addEventListener('click', cerrarConfiguracionSupabase);
  btnConfigMasTarde.addEventListener('click', cerrarConfiguracionSupabase);
  btnConfigReset.addEventListener('click', restablecerConfiguracionSupabase);
  configOverlay.addEventListener('click', (e) => {
    if (e.target === configOverlay) cerrarConfiguracionSupabase();
  });

  // Modal
  btnModalCancelar.addEventListener('click', cerrarModal);
  btnModalEliminar.addEventListener('click', confirmarEliminacion);
  modalConfirmar.addEventListener('click', (e) => {
    if (e.target === modalConfirmar) cerrarModal();
  });

  // FAB: agregar tanqueo (móvil)
  fabAgregar.addEventListener('click', () => {
    cambiarPestana('registro');
    $('registro').scrollIntoView({ behavior: 'smooth', block: 'start' });
    inputFecha.focus();
  });

  // Pestañas
  tabBtnRegistro.addEventListener('click', () => cambiarPestana('registro'));
  tabBtnDashboard.addEventListener('click', () => cambiarPestana('dashboard'));
}

// ===== Cambiar pestaña =====
function cambiarPestana(nombre) {
  const esRegistro = nombre === 'registro';

  tabBtnRegistro.classList.toggle('active', esRegistro);
  tabBtnDashboard.classList.toggle('active', !esRegistro);
  tabBtnRegistro.setAttribute('aria-selected', esRegistro ? 'true' : 'false');
  tabBtnDashboard.setAttribute('aria-selected', !esRegistro ? 'true' : 'false');

  tabRegistro.classList.toggle('active', esRegistro);
  tabDashboard.classList.toggle('active', !esRegistro);

  if (!esRegistro) {
    renderizarDashboard();
    // Re-renderizar gráfico al mostrarlo (por si cambió el tamaño del contenedor)
    renderizarGrafico();
  }
}

// ===== Modal: Nueva Estación =====
function abrirModalNuevaEstacion() {
  inputNuevaEstacion.value = '';
  modalNuevaEstacion.classList.remove('hidden');
  setTimeout(() => inputNuevaEstacion.focus(), 100);
}

function cerrarModalNuevaEstacion() {
  modalNuevaEstacion.classList.add('hidden');
  inputNuevaEstacion.value = '';
}

async function guardarNuevaEstacion() {
  const nombre = inputNuevaEstacion.value.trim();
  if (!nombre) {
    mostrarToast('Escribe el nombre de la estación', 'error');
    inputNuevaEstacion.focus();
    return;
  }

  await Store.agregarEstaciones(nombre);
  estaciones = await Store.cargarEstaciones();
  actualizarSelectEstaciones();
  actualizarFiltros();
  selectEstacion.value = nombre;
  cerrarModalNuevaEstacion();
  mostrarToast('Estación "' + nombre + '" agregada', 'success');
}

// ===== Select de estaciones =====
function actualizarSelectEstaciones() {
  const valorActual = selectEstacion.value;
  selectEstacion.innerHTML = '<option value="">Selecciona una estación…</option>';
  estaciones.forEach(est => {
    const option = document.createElement('option');
    option.value = est;
    option.textContent = est;
    selectEstacion.appendChild(option);
  });
  if (estaciones.includes(valorActual)) {
    selectEstacion.value = valorActual;
  }
}

// ===== Exportar / Importar JSON =====
async function exportarDatosJSON() {
  const datos = await Store.exportarJSON();
  const contenido = JSON.stringify(datos, null, 2);
  const blob = new Blob([contenido], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gasolinak3_datos_' + obtenerFechaHoy() + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  mostrarToast('Base de datos exportada (JSON)', 'success');
}

function importarDatosJSON(e) {
  const archivo = e.target.files && e.target.files[0];
  if (!archivo) return;

  const lector = new FileReader();
  lector.onload = async (evento) => {
    try {
      const datos = JSON.parse(evento.target.result);
      const ok = await Store.importarJSON(datos);
      if (ok) {
        await refrecarDatos();
        aplicarTemaGuardado();
        mostrarToast('Datos importados correctamente (' + tanqueos.length + ' tanqueos)', 'success');
      } else {
        mostrarToast('El archivo JSON no es válido', 'error');
      }
    } catch (err) {
      console.error('Error al importar JSON:', err);
      mostrarToast('No se pudo leer el archivo JSON', 'error');
    }
  };
  lector.readAsText(archivo);
  e.target.value = '';
}

// ===== Actualizar interfaz para usar actualizarSelectEstaciones =====
// ===== Toggle Tanque Lleno =====
function setTanqueLlenoValor(valor) {
  hiddenTanqueLleno.value = String(valor);
  toggleTanqueLleno.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.valor) === valor);
  });
}

// ===== Toggle Tipo de Combustible =====
function setCombustibleValor(valor) {
  inputCombustible.value = valor;
  toggleCombustible.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.valor === valor);
  });
}

// ===== Cálculo automático de galones y costo =====
function recalcularCampos() {
  const precio = parseFloat(inputPrecio.value);
  const valorPagado = parseFloat(inputValorPagado.value);

  if (precio > 0 && valorPagado > 0) {
    const galones = valorPagado / precio;
    inputGalones.value = galones.toFixed(3);
  } else {
    inputGalones.value = '';
  }
}

// ===== Manejo del formulario =====
async function manejarEnvioFormulario(e) {
  e.preventDefault();

  // Validaciones
  const precio = parseFloat(inputPrecio.value);
  const valorPagado = parseFloat(inputValorPagado.value);
  const odometro = parseFloat(inputOdometro.value);

  if (!inputFecha.value) {
    mostrarToast('Debes seleccionar una fecha', 'error');
    return;
  }
  if (!selectEstacion.value.trim()) {
    mostrarToast('Debes escribir la estación de servicio', 'error');
    selectEstacion.focus();
    return;
  }
  if (!precio || precio <= 0) {
    mostrarToast('Debes ingresar un precio por galón válido', 'error');
    inputPrecio.focus();
    return;
  }
  if (!valorPagado || valorPagado <= 0) {
    mostrarToast('Debes ingresar el valor pagado en pesos', 'error');
    inputValorPagado.focus();
    return;
  }
  if (!odometro || odometro < 0) {
    mostrarToast('Debes ingresar el odómetro en kilómetros', 'error');
    inputOdometro.focus();
    return;
  }

  if (tanqueoEnEdicion) {
    // Actualizar tanqueo existente
    const actualizado = await Store.actualizarTanqueo(tanqueoEnEdicion.id, {
      fecha: inputFecha.value,
      estacion: selectEstacion.value.trim(),
      combustible: inputCombustible.value,
      precio: precio,
      galones: valorPagado / precio,
      costo: valorPagado,
      odometro: odometro,
      tanqueLleno: Number(hiddenTanqueLleno.value) || 1,
      notas: inputNotas.value.trim()
    });

    if (actualizado) {
      mostrarToast('Tanqueo actualizado correctamente', 'success');
      cancelarEdicion();
    } else {
      mostrarToast('No se encontró el tanqueo a actualizar', 'error');
    }
  } else {
    // Crear nuevo tanqueo
    await Store.agregarTanqueo({
      fecha: inputFecha.value,
      estacion: selectEstacion.value.trim(),
      combustible: inputCombustible.value,
      precio: precio,
      galones: valorPagado / precio,
      costo: valorPagado,
      odometro: odometro,
      tanqueLleno: Number(hiddenTanqueLleno.value) || 1,
      notas: inputNotas.value.trim()
    });

    mostrarToast('Tanqueo registrado correctamente', 'success');
    limpiarFormulario();
  }

  // Guardar estaciones nuevas
  await Store.agregarEstaciones(selectEstacion.value.trim());

  // Recargar interfaz completa
  await refrecarDatos();
}

// ===== Limpiar formulario =====
function limpiarFormulario() {
  formTanqueo.reset();
  inputFecha.value = obtenerFechaHoy();
  inputGalones.value = '';
  inputId.value = '';
  tanqueoEnEdicion = null;
  btnSubmit.innerHTML = '💾 Guardar Tanqueo';
  btnCancelEdit.classList.add('hidden');
  // Por defecto: tanque parcial y combustible corriente
  setTanqueLlenoValor(1);
  setCombustibleValor('Corriente');
}

// ===== Editar tanqueo =====
function comenzarEdicion(id) {
  const tanqueo = tanqueos.find(t => t.id === id);
  if (!tanqueo) return;

  tanqueoEnEdicion = tanqueo;
  inputId.value = tanqueo.id;
  inputFecha.value = tanqueo.fecha;
  selectEstacion.value = tanqueo.estacion;
  setCombustibleValor(tanqueo.combustible || 'Corriente');
  inputPrecio.value = tanqueo.precio;
  inputValorPagado.value = tanqueo.costo;
  inputGalones.value = tanqueo.galones.toFixed(3);
  inputOdometro.value = tanqueo.odometro;
  setTanqueLlenoValor(Number(tanqueo.tanqueLleno) || 1);
  inputNotas.value = tanqueo.notas || '';

  btnSubmit.innerHTML = '💾 Actualizar Tanqueo';
  btnCancelEdit.classList.remove('hidden');

  // Cambiar a pestaña de registro
  cambiarPestana('registro');
  // Desplazar al formulario
  $('registro').scrollIntoView({ behavior: 'smooth', block: 'start' });
  inputFecha.focus();
}

function cancelarEdicion() {
  limpiarFormulario();
}

// ===== Eliminar tanqueo =====
function solicitarEliminacion(id) {
  const tanqueo = tanqueos.find(t => t.id === id);
  if (!tanqueo) return;

  tanqueoAEliminar = id;
  modalMensaje.textContent = `¿Eliminar el tanqueo de ${formatearFechaLegible(tanqueo.fecha)} en ${tanqueo.estacion}?`;
  modalConfirmar.classList.remove('hidden');
}

function cerrarModal() {
  modalConfirmar.classList.add('hidden');
  tanqueoAEliminar = null;
}

async function confirmarEliminacion() {
  if (!tanqueoAEliminar) return;

  const eliminado = await Store.eliminarTanqueo(tanqueoAEliminar);
  if (eliminado) {
    mostrarToast('Tanqueo eliminado', 'success');
    cerrarModal();
    await refrecarDatos();
    // Si estábamos editando ese tanqueo, cancelamos
    if (tanqueoEnEdicion && tanqueoEnEdicion.id === tanqueoAEliminar) {
      cancelarEdicion();
    }
  } else {
    mostrarToast('No se pudo eliminar el tanqueo', 'error');
    cerrarModal();
  }
}

// ===== Refrescar datos =====
async function refrecarDatos() {
  const datos = await Store.cargarTodo();
  tanqueos = datos.tanqueos;
  estaciones = datos.estaciones;
  actualizarInterfaz();
}

// ===== Actualizar toda la interfaz =====
function actualizarInterfaz() {
  actualizarSelectEstaciones();
  actualizarFiltros();
  actualizarEstadisticas();
  actualizarUltimoRendimiento();
  renderizarTabla();
  renderizarDashboard();
  renderizarGrafico();
  actualizarVisibilidadSecciones();
}



// ===== Actualizar filtros =====
function actualizarFiltros() {
  // Estaciones
  const valorActualEst = filtroEstacion.value;
  filtroEstacion.innerHTML = '<option value="">Todas</option>';
  estaciones.forEach(est => {
    const option = document.createElement('option');
    option.value = est;
    option.textContent = est;
    filtroEstacion.appendChild(option);
  });
  filtroEstacion.value = valorActualEst;
}

// ===== Calcular rendimientos =====
function calcularRendimientos() {
  return calcularTodosLosRendimientos(tanqueos);
}

// ===== Actualizar estadísticas =====
function actualizarEstadisticas() {
  const conRendimiento = calcularRendimientos();
  const rendimientos = conRendimiento
    .map(t => t.rendimiento)
    .filter(r => r !== null && r > 0);

  const totalGastado = tanqueos.reduce((sum, t) => sum + (t.costo || 0), 0);
  const totalGalones = tanqueos.reduce((sum, t) => sum + (t.galones || 0), 0);
  const precioPromedio = totalGalones > 0 ? totalGastado / totalGalones : 0;

  const kmTotales = tanqueos.length > 0
    ? Math.max(...tanqueos.map(t => t.odometro || 0)) - Math.min(...tanqueos.map(t => t.odometro || 0))
    : 0;

  const costoPorKm = kmTotales > 0 ? totalGastado / kmTotales : 0;

  // Rendimiento promedio
  const rendPromedio = rendimientos.length > 0
    ? rendimientos.reduce((a, b) => a + b, 0) / rendimientos.length
    : null;

  // Mejor rendimiento
  const mejorRendimiento = rendimientos.length > 0 ? Math.max(...rendimientos) : null;

  // Asignar valores
  const setStat = (id, valor, unitId, unidades) => {
    $('stat-' + id).querySelector('.stat-value').textContent = valor;
    $('stat-' + id).querySelector('.stat-unit').textContent = unidades;
  };

  setStat('rendimiento', rendPromedio !== null ? formatearNumero(rendPromedio, 1) : '--', null, 'km/gal');
  setStat('mejor', mejorRendimiento !== null ? formatearNumero(mejorRendimiento, 1) : '--', null, 'km/gal');
  setStat('costo-km', costoPorKm > 0 ? formatearCOP(costoPorKm) : '--', null, 'COP/km');
  setStat('precio-gal', precioPromedio > 0 ? formatearCOP(precioPromedio) : '--', null, 'COP');
  setStat('total', totalGastado > 0 ? formatearCOP(totalGastado) : '--', null, 'COP');
  setStat('galones', totalGalones > 0 ? formatearNumero(totalGalones, 2) : '--', null, 'gal');
  setStat('tanqueos', String(tanqueos.length), null, 'registros');

  // Mejor precio de gasolina registrado (el más bajo, con su estación)
  const conPrecioRegistrado = tanqueos.filter(t => (t.precio || 0) > 0);
  const mejorPrecio = conPrecioRegistrado.length > 0
    ? conPrecioRegistrado.reduce((a, b) => ((a.precio || 0) <= (b.precio || 0) ? a : b))
    : null;

  const statMejorPrecio = $('stat-mejor-precio');
  if (statMejorPrecio) {
    statMejorPrecio.querySelector('.stat-value').textContent =
      mejorPrecio ? formatearCOP(mejorPrecio.precio) : '--';
    const detalleMejorPrecio = $('mejor-precio-estacion');
    if (detalleMejorPrecio) {
      detalleMejorPrecio.textContent = mejorPrecio
        ? `En ${mejorPrecio.estacion} · ${formatearFechaLegible(mejorPrecio.fecha)}`
        : 'Sin registros';
    }
  }
}

// ===== Actualizar último rendimiento =====
function actualizarUltimoRendimiento() {
  if (tanqueos.length === 0) {
    ultimoRendimiento.classList.add('hidden');
    return;
  }

  const conRendimiento = calcularRendimientos();
  const ultimoConRendimiento = [...conRendimiento].reverse().find(t => t.rendimiento !== null);

  if (ultimoConRendimiento) {
    ultimoRendimiento.classList.remove('hidden');
    ultimoRendimientoValor.textContent = formatearNumero(ultimoConRendimiento.rendimiento, 1) + ' km/gal';

    // Encontrar el tanqueo lleno anterior para el detalle
    const idx = conRendimiento.findIndex(c => c.id === ultimoConRendimiento.id);
    let kmRecorridos = 0;
    let galonesConsumidos = ultimoConRendimiento.galones || 0;
    let fechaInicio = ultimoConRendimiento.fecha;

    // Sumar desde el último tanqueo lleno anterior
    for (let i = idx - 1; i >= 0; i--) {
      const t = conRendimiento[i];
      if (t.tanqueLleno === 2) {
        kmRecorridos = (ultimoConRendimiento.odometro || 0) - (t.odometro || 0);
        fechaInicio = t.fecha;
        break;
      }
      galonesConsumidos += t.galones || 0;
    }

    ultimoRendimientoDetalle.textContent =
      `${kmRecorridos} km recorridos desde ${formatearFechaLegible(fechaInicio)} · ${formatearNumero(galonesConsumidos, 2)} galones consumidos`;
  } else {
    ultimoRendimiento.classList.add('hidden');
  }
}

// ===== Renderizar tabla =====
function renderizarTabla() {
  const filtroEst = filtroEstacion.value;
  const filtroComb = filtroCombustible.value;

  const conRendimiento = calcularRendimientos();

  // Filtrar
  const filtrados = conRendimiento.filter(t => {
    const okEst = !filtroEst || t.estacion === filtroEst;
    const okComb = !filtroComb || t.combustible === filtroComb;
    return okEst && okComb;
  });

  // Mostrar contador
  historialCount.textContent = `${filtrados.length} registro${filtrados.length !== 1 ? 's' : ''}`;

  // Estado vacío
  tablaVacia.classList.toggle('hidden', filtrados.length > 0);
  tablaBody.classList.toggle('hidden', filtrados.length === 0);

  if (filtrados.length === 0) {
    tablaBody.innerHTML = '';
    return;
  }

  tablaBody.innerHTML = filtrados.map(t => {
    const tagClass = {
      'Corriente': 'tag-corriente',
      'Extra': 'tag-extra'
    }[t.combustible] || 'tag-corriente';

    const rendimientoHTML = t.rendimiento !== null
      ? `<strong>${formatearNumero(t.rendimiento, 1)}</strong> <small>km/gal</small>`
      : t.tanqueLleno === 2
        ? '<small class="text-muted">pendiente</small>'
        : '<small class="text-muted">parcial</small>';

    return `
      <tr>
        <td data-label="Fecha">${formatearFechaLegible(t.fecha)}</td>
        <td data-label="Estación">${escapeHTML(t.estacion)}</td>
        <td data-label="Combustible"><span class="tag-combustible ${tagClass}">${escapeHTML(t.combustible)}</span></td>
        <td data-label="Galones">${formatearNumero(t.galones, 2)}</td>
        <td data-label="Valor Pagado">${formatearCOP(t.costo)}</td>
        <td data-label="Odómetro">${formatearNumero(t.odometro, 0)} km</td>
        <td data-label="Rendimiento">${rendimientoHTML}</td>
        <td class="acciones" data-label="">
          <button class="btn btn-sm btn-edit" onclick="App.editar('${t.id}')" title="Editar">✏️</button>
          <button class="btn btn-sm btn-del" onclick="App.eliminar('${t.id}')" title="Eliminar">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ===== Renderizar Dashboard (análisis por estación) =====
function renderizarDashboard() {
  const conRendimiento = calcularRendimientos();

  if (tanqueos.length === 0) {
    dashRendidora.textContent = '--';
    dashRendidoraDetalle.textContent = 'Registra 2+ tanqueos llenos';
    dashCosto.textContent = '--';
    dashCostoDetalle.textContent = 'Sin datos suficientes';
    dashEconomico.textContent = '--';
    dashEconomicoDetalle.textContent = 'Sin datos suficientes';
    tablaEstacionesBody.innerHTML = '';
    return;
  }

  // Agrupar por estación
  const estacionesDatos = {};

  tanqueos.forEach(t => {
    const nombre = t.estacion;
    if (!estacionesDatos[nombre]) {
      estacionesDatos[nombre] = {
        nombre,
        tanqueos: 0,
        llenos: 0,
        rendimientos: [],
        totalCosto: 0,
        totalKm: 0,
        totalGalones: 0,
        precios: [],
        costoPorKm: null,
        kmPor10000: null
      };
    }
    const e = estacionesDatos[nombre];
    e.tanqueos++;
    if (t.tanqueLleno === 2) e.llenos++;
    e.totalCosto += t.costo || 0;
    e.totalGalones += t.galones || 0;
    e.precios.push(t.precio || 0);
  });

  // Calcular km totales por estación
  Object.values(estacionesDatos).forEach(e => {
    const tanqueosEst = tanqueos.filter(t => t.estacion === e.nombre);
    if (tanqueosEst.length > 0) {
      const odos = tanqueosEst.map(t => t.odometro || 0);
      e.totalKm = Math.max(...odos) - Math.min(...odos);
      if (e.totalKm > 0) {
        e.costoPorKm = e.totalCosto / e.totalKm;
        e.kmPor10000 = (10000 / e.costoPorKm);
      }
    }
  });

  // Agregar rendimientos por estación
  const conRend = calcularRendimientos();
  conRend.forEach(t => {
    if (t.rendimiento !== null && estacionesDatos[t.estacion]) {
      estacionesDatos[t.estacion].rendimientos.push(t.rendimiento);
    }
  });

  const estacionesArr = Object.values(estacionesDatos).map(e => {
    e.rendPromedio = e.rendimientos.length > 0
      ? e.rendimientos.reduce((a, b) => a + b, 0) / e.rendimientos.length
      : null;
    e.precioPromedio = e.precios.length > 0
      ? e.precios.reduce((a, b) => a + b, 0) / e.precios.length
      : 0;
    return e;
  });

  // --- Card 1: Estación más rendidora (mejor rendimiento promedio, requiere 2+ llenos) ---
  const conRendProm = estacionesArr.filter(e => e.rendPromedio !== null && e.llenos >= 2);
  if (conRendProm.length > 0) {
    const mejor = conRendProm.sort((a, b) => b.rendPromedio - a.rendPromedio)[0];
    dashRendidora.textContent = mejor.nombre;
    dashRendidoraDetalle.textContent =
      `${formatearNumero(mejor.rendPromedio, 1)} km/gal promedio · ${mejor.llenos} tanqueos llenos`;
  } else {
    dashRendidora.textContent = '--';
    dashRendidoraDetalle.textContent = 'Necesitas 2 tanqueos llenos en una misma estación';
  }

  // --- Card 2: Mejor costo-beneficio (más km por $10.000) ---
  const conKmPor10000 = estacionesArr.filter(e => e.kmPor10000 !== null && e.tanqueos >= 2);
  if (conKmPor10000.length > 0) {
    const mejorCosto = conKmPor10000.sort((a, b) => b.kmPor10000 - a.kmPor10000)[0];
    dashCosto.textContent = mejorCosto.nombre;
    dashCostoDetalle.textContent =
      `${formatearNumero(mejorCosto.kmPor10000, 1)} km por cada $10.000 · promedio $${Math.round(mejorCosto.costoPorKm * 1000) / 1000} /km`;
  } else {
    dashCosto.textContent = '--';
    dashCostoDetalle.textContent = 'Necesitas 2+ registros en una misma estación';
  }

  // --- Card 3: Galón más económico (menor precio promedio) ---
  const conPrecio = estacionesArr.filter(e => e.tanqueos >= 1);
  if (conPrecio.length > 0) {
    const economico = conPrecio.sort((a, b) => a.precioPromedio - b.precioPromedio)[0];
    dashEconomico.textContent = economico.nombre;
    dashEconomicoDetalle.textContent =
      `${formatearCOP(economico.precioPromedio)} por galón en promedio`;
  } else {
    dashEconomico.textContent = '--';
    dashEconomicoDetalle.textContent = 'Sin datos suficientes';
  }

  // --- Tabla comparativa ---
  const filasHTML = estacionesArr
    .sort((a, b) => (b.rendPromedio || 0) - (a.rendPromedio || 0))
    .map(e => {
      const rend = e.rendPromedio !== null
        ? `${formatearNumero(e.rendPromedio, 1)} km/gal`
        : e.llenos >= 1
          ? '<small class="text-muted">pendiente</small>'
          : '<small class="text-muted">--</small>';
      const km10000 = e.kmPor10000 !== null
        ? formatearNumero(e.kmPor10000, 1)
        : '--';
      const precio = e.precioPromedio > 0
        ? formatearCOP(e.precioPromedio)
        : '--';
      return `
        <tr>
          <td data-label="Estación">${escapeHTML(e.nombre)}</td>
          <td data-label="Tanqueos">${e.tanqueos}</td>
          <td data-label="Rend. Promedio">${rend}</td>
          <td data-label="km / $10.000">${km10000}</td>
          <td data-label="Precio Promedio">${precio}</td>
        </tr>
      `;
    })
    .join('');

  tablaEstacionesBody.innerHTML = filasHTML || '<tr><td colspan="5" class="empty-state">Sin datos para mostrar</td></tr>';
}

// ===== Gráfico =====
function renderizarGrafico() {
  const conRendimiento = calcularRendimientos();
  const puntos = conRendimiento
    .map((t, i) => ({
      fecha: t.fecha,
      rendimiento: t.rendimiento,
      etiqueta: i + 1,
      estacion: t.estacion
    }))
    .filter(p => p.rendimiento !== null);

  if (puntos.length === 0) {
    if (chartRendimiento) {
      chartRendimiento.destroy();
      chartRendimiento = null;
    }
    // Ocultar/título vacío
    graficoSection.querySelector('.card').innerHTML = `
      <div class="card-header"><h2>📈 Evolución del Rendimiento</h2></div>
      <div class="empty-state">
        <p>📊 Aún no hay datos suficientes para mostrar gráficos.</p>
        <p>Registra al menos un tanqueo con "tanque lleno" después de otro.</p>
      </div>
    `;
    return;
  }

  // Si el chart-container fue reemplazado, recrearlo
  if (!graficoSection.querySelector('#chart-rendimiento')) {
    graficoSection.querySelector('.card').innerHTML = `
      <div class="card-header"><h2>📈 Evolución del Rendimiento</h2></div>
      <div class="chart-container">
        <canvas id="chart-rendimiento"></canvas>
      </div>
    `;
  }

  const canvas = $('chart-rendimiento');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Destruir gráfico anterior
  if (chartRendimiento) {
    chartRendimiento.destroy();
  }

  const labels = puntos.map(p => {
    const fecha = new Date(p.fecha + 'T12:00:00');
    return `${fecha.getDate()}/${fecha.getMonth() + 1}`;
  });

  const datos = puntos.map(p => p.rendimiento);

  const esOscuro = document.documentElement.getAttribute('data-theme') === 'dark';
  const colorTexto = esOscuro ? '#a0a8b8' : '#7f8c8d';
  const colorBorde = esOscuro ? '#2a3a5c' : '#e0e6ed';

  chartRendimiento = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Rendimiento (km/gal)',
        data: datos,
        borderColor: '#f39c12',
        backgroundColor: 'rgba(243, 156, 18, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#e67e22',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: colorTexto,
            font: { size: 13 }
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.parsed.y.toFixed(1)} km/gal`
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Tanqueo N°',
            color: colorTexto
          },
          ticks: { color: colorTexto },
          grid: { color: colorBorde }
        },
        y: {
          title: {
            display: true,
            text: 'km/gal',
            color: colorTexto
          },
          ticks: { color: colorTexto },
          grid: { color: colorBorde }
        }
      }
    }
  });
}

// ===== Visibilidad de secciones =====
function actualizarVisibilidadSecciones() {
  selectorFiltros.classList.toggle('hidden', tanqueos.length === 0);
  if (tanqueos.length === 0 && filtroEstacion.value !== '') {
    filtroEstacion.value = '';
    filtroCombustible.value = '';
  }
}

// ===== Exportar CSV =====
function exportarDatosCSV() {
  if (tanqueos.length === 0) {
    mostrarToast('No hay datos para exportar', 'error');
    return;
  }

  const conRendimiento = calcularRendimientos();

  const encabezados = ['Fecha', 'Estación', 'Combustible', 'Precio/Galón (COP)', 'Galones', 'Valor Pagado (COP)', 'Odómetro (km)', 'Tanque Lleno', 'Rendimiento (km/gal)', 'Notas'];

  const filas = conRendimiento.map(t => [
    t.fecha,
    t.estacion,
    t.combustible,
    t.precio,
    t.galones.toFixed(3),
    t.costo,
    t.odometro,
    t.tanqueLleno === 2 ? 'Sí' : 'Parcial',
    t.rendimiento !== null ? t.rendimiento.toFixed(2) : '',
    t.notas || ''
  ]);

  const fechaHoy = obtenerFechaHoy();
  exportarCSV(encabezados, filas, `gasolinak3_tanqueos_${fechaHoy}.csv`);
  mostrarToast('CSV exportado correctamente', 'success');
}

// ===== Tema =====
function actualizarThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const oscuro = document.documentElement.getAttribute('data-theme') === 'dark';
  meta.setAttribute('content', oscuro ? '#16213e' : '#1a252f');
}

function aplicarTemaGuardado() {
  const tema = Store.cargarTema();
  if (tema === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    $('btn-theme').textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    $('btn-theme').textContent = '🌙';
  }
  actualizarThemeColor();
}

async function alternarTema() {
  const esOscuro = document.documentElement.getAttribute('data-theme') === 'dark';
  if (esOscuro) {
    document.documentElement.removeAttribute('data-theme');
    $('btn-theme').textContent = '🌙';
    await Store.guardarTema('light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    $('btn-theme').textContent = '☀️';
    await Store.guardarTema('dark');
  }
  actualizarThemeColor();
  // Re-renderizar gráfico con nuevo tema
  renderizarGrafico();
}

// ===== Exposición global para botones onclick en la tabla =====
window.App = {
  editar: comenzarEdicion,
  eliminar: solicitarEliminacion
};

// Escaper de teclado para cerrar modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!modalConfirmar.classList.contains('hidden')) {
      cerrarModal();
    }
    if (!modalNuevaEstacion.classList.contains('hidden')) {
      cerrarModalNuevaEstacion();
    }
    if (!configOverlay.classList.contains('hidden')) {
      cerrarConfiguracionSupabase();
    }
  }
});

// ===== Supabase: indicador, migración y configuración =====

function mostrarLoading(mensaje) {
  loadingMensaje.textContent = mensaje || 'Cargando…';
  loadingOverlay.classList.remove('hidden');
}

function ocultarLoading() {
  loadingOverlay.classList.add('hidden');
}

function setSyncStatus(estado, texto) {
  syncStatus.className = 'sync-status ' + estado;
  syncStatus.textContent = texto;
}

// ===== Menú de acciones (móvil) =====
function alternarMenuAcciones() {
  const abierto = !menuAcciones.classList.contains('open');
  menuAcciones.classList.toggle('open', abierto);
  btnMenu.setAttribute('aria-expanded', String(abierto));
}

function cerrarMenuAcciones() {
  menuAcciones.classList.remove('open');
  btnMenu.setAttribute('aria-expanded', 'false');
}

function aplicarConfiguracionSupabase(mostrarError) {
  const credenciales = AppConfig.obtenerCredenciales();
  if (credenciales) {
    setSyncStatus('', '☁️ Verificando…');
    AppConfig.aplicarCredenciales().then(() => {
      setSyncStatus('', '☁️ Conectado');
    }).catch(() => {
      setSyncStatus('sync-warning', '⚠️ Sin conexión');
    });
  } else {
    setSyncStatus('sync-warning', '⚙️ Configurar');
  }

  if (mostrarError) {
    configError.textContent = AppConfig.obtenerUltimoError() || '';
    configError.classList.toggle('hidden', !configError.textContent);
  }
}

async function iniciarSupabase() {
  const credenciales = AppConfig.obtenerCredenciales();

  if (credenciales) {
    // Configuración guardada: cargar datos desde Supabase
    console.info('GASOLINA K3 → conectando a Supabase:', credenciales.url);
    mostrarLoading('Cargando datos desde Supabase…');
    try {
      await AppConfig.aplicarCredenciales();
      const datos = await Store.cargarTodo();
      tanqueos = datos.tanqueos;
      estaciones = datos.estaciones;
      actualizarInterfaz();
      setSyncStatus('', '☁️ Conectado');
    } catch (err) {
      console.error('Error al cargar datos desde Supabase:', err);
      setSyncStatus('sync-warning', '⚠️ Sin conexión');
      // Mostrar el error real y ofrecer corregir la configuración
      const detalle = (err && err.message)
        ? err.message
        : (Store.ultimoError && (Store.ultimoError.message || String(Store.ultimoError))) || 'No se pudo contactar Supabase.';
      configError.textContent = 'No se pudo conectar: ' + detalle;
      configError.classList.remove('hidden');
      btnConfigCerrar.classList.remove('hidden');
      btnConfigMasTarde.classList.add('hidden');
      configOverlay.classList.remove('hidden');
    } finally {
      ocultarLoading();
    }

    // Si hay datos locales que aún no están en Supabase, ofrecer migrar
    const pendientes = Store.contarLocalesPendientes();
    if (pendientes > 0) {
      btnMigrar.textContent = '📤 Migrar ' + pendientes;
      btnMigrar.classList.remove('hidden');
    }
  } else {
    // Sin configuración: usar datos locales legacy y mostrar pantalla de setup
    setSyncStatus('sync-warning', '⚙️ Configurar');
    abrirConfiguracionSupabase();
  }
}

async function migrarDatosLocales() {
  mostrarLoading('Migrando tus datos a Supabase…');
  try {
    const migrados = await Store.migrarDatosLocales();
    const datos = await Store.cargarTodo();
    tanqueos = datos.tanqueos;
    estaciones = datos.estaciones;
    actualizarInterfaz();
    btnMigrar.classList.add('hidden');
    setSyncStatus('', '☁️ Conectado');
    mostrarToast('Migrados ' + migrados.migrados + ' tanqueos a Supabase', 'success');
  } catch (err) {
    console.error('Error al migrar datos:', err);
    mostrarToast('No se pudo migrar. Revisa la configuración.', 'error');
    setSyncStatus('sync-offline', '⚠️ Sin conexión');
  } finally {
    ocultarLoading();
  }
}

function abrirConfiguracionSupabase() {
  // Si hay una carga en curso, ocultarla para que no tape la pantalla de configuración
  ocultarLoading();
  const credenciales = AppConfig.obtenerCredenciales();
  if (credenciales) {
    configUrl.value = credenciales.url || '';
    configKey.value = credenciales.anonKey || '';
    btnConfigCerrar.classList.remove('hidden');
    btnConfigMasTarde.classList.add('hidden');
  } else {
    btnConfigCerrar.classList.add('hidden');
    btnConfigMasTarde.classList.remove('hidden');
  }
  configError.classList.add('hidden');
  configOverlay.classList.remove('hidden');
  configUrl.focus();
}

function cerrarConfiguracionSupabase() {
  configOverlay.classList.add('hidden');
}

function restablecerConfiguracionSupabase() {
  AppConfig.borrarCredenciales();
  configUrl.value = '';
  configKey.value = '';
  configError.classList.add('hidden');
  configOverlay.classList.add('hidden');
  mostrarToast('Configuración restablecida. Conectando a la predeterminada…', 'info');
  iniciarSupabase();
}

async function guardarConfiguracionSupabase() {
  const url = configUrl.value.trim();
  const key = configKey.value.trim();

  if (!url || !key) {
    const falta = !url && !key ? 'Project URL y anon public key'
      : (!url ? 'la Project URL' : 'la anon public key');
    configError.textContent = 'Falta ' + falta + '. Ambos datos están en Supabase Dashboard → Settings → API Keys.';
    configError.classList.remove('hidden');
    return;
  }

  const ok = AppConfig.guardarCredenciales(url, key);
  if (!ok) {
    configError.textContent = AppConfig.obtenerUltimoError() || 'URL o clave inválida.';
    configError.classList.remove('hidden');
    return;
  }

  configOverlay.classList.add('hidden');
  setSyncStatus('', '☁️ Verificando…');

  mostrarLoading('Conectando con Supabase…');
  try {
    await AppConfig.aplicarCredenciales();
    setSyncStatus('', '☁️ Conectado');
    await iniciarSupabase();
  } catch (err) {
    console.error('Error al conectar:', err);
    setSyncStatus('sync-offline', '⚠️ Sin conexión');
    // Reabrir la configuración mostrando el error real para que el usuario pueda corregirla
    const detalle = (err && err.message)
      ? err.message
      : (Store.ultimoError && (Store.ultimoError.message || String(Store.ultimoError))) || 'No se pudo contactar Supabase.';
    configError.textContent = 'No se pudo conectar: ' + detalle;
    configError.classList.remove('hidden');
    btnConfigCerrar.classList.remove('hidden');
    btnConfigMasTarde.classList.add('hidden');
    configOverlay.classList.remove('hidden');
  } finally {
    ocultarLoading();
  }
}