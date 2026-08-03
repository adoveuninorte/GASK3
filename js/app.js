/* ===== GASOLINA K3 — Lógica principal ===== */

// ===== Referencias al DOM =====
const $ = (id) => document.getElementById(id);

const formTanqueo = $('form-tanqueo');
const inputId = $('tanqueo-id');
const inputFecha = $('fecha');
const inputEstacion = $('estacion');
const inputCombustible = $('combustible');
const inputPrecio = $('precio');
const inputValorPagado = $('valorPagado');
const inputGalones = $('galones');
const inputOdometro = $('odometro');
const selectTanqueLleno = $('tanque-lleno');
const inputNotas = $('notas');
const btnSubmit = $('btn-submit');
const btnReset = $('btn-reset');
const btnCancelEdit = $('btn-cancel-edit');

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

// Variables de estado
let tanqueos = [];
let estaciones = [];
let tanqueoEnEdicion = null;
let tanqueoAEliminar = null;

// Gráfico
let chartRendimiento = null;
const graficoSection = $('grafico');

// ===== Inicialización =====
document.addEventListener('DOMContentLoaded', iniciar);

function iniciar() {
  // Cargar datos
  tanqueos = Store.cargarTanqueos();
  estaciones = Store.cargarEstaciones();

  // Fecha por defecto: hoy
  inputFecha.value = obtenerFechaHoy();

  // Configurar tema
  aplicarTemaGuardado();

  // Eventos
  registrarEventos();

  // Renderizar
  actualizarInterfaz();
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

  // Filtros
  filtroEstacion.addEventListener('change', renderizarTabla);
  filtroCombustible.addEventListener('change', renderizarTabla);

  // Botones del header
  $('btn-theme').addEventListener('click', alternarTema);
  $('btn-export').addEventListener('click', exportarDatosCSV);
  $('btn-demo').addEventListener('click', cargarDatosDemo);

  // Modal
  btnModalCancelar.addEventListener('click', cerrarModal);
  btnModalEliminar.addEventListener('click', confirmarEliminacion);
  modalConfirmar.addEventListener('click', (e) => {
    if (e.target === modalConfirmar) cerrarModal();
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
function manejarEnvioFormulario(e) {
  e.preventDefault();

  // Validaciones
  const precio = parseFloat(inputPrecio.value);
  const valorPagado = parseFloat(inputValorPagado.value);
  const odometro = parseFloat(inputOdometro.value);

  if (!inputFecha.value) {
    mostrarToast('Debes seleccionar una fecha', 'error');
    return;
  }
  if (!inputEstacion.value.trim()) {
    mostrarToast('Debes escribir la estación de servicio', 'error');
    inputEstacion.focus();
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
    const actualizado = Store.actualizarTanqueo(tanqueoEnEdicion.id, {
      fecha: inputFecha.value,
      estacion: inputEstacion.value.trim(),
      combustible: inputCombustible.value,
      precio: precio,
      galones: valorPagado / precio,
      costo: valorPagado,
      odometro: odometro,
      tanqueLleno: Number(selectTanqueLleno.value),
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
    Store.agregarTanqueo({
      fecha: inputFecha.value,
      estacion: inputEstacion.value.trim(),
      combustible: inputCombustible.value,
      precio: precio,
      galones: valorPagado / precio,
      costo: valorPagado,
      odometro: odometro,
      tanqueLleno: Number(selectTanqueLleno.value),
      notas: inputNotas.value.trim()
    });

    mostrarToast('Tanqueo registrado correctamente', 'success');
    limpiarFormulario();
  }

  // Guardar estaciones nuevas
  Store.agregarEstaciones(inputEstacion.value.trim());

  // Recargar interfaz completa
  refrecarDatos();
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
}

// ===== Editar tanqueo =====
function comenzarEdicion(id) {
  const tanqueo = tanqueos.find(t => t.id === id);
  if (!tanqueo) return;

  tanqueoEnEdicion = tanqueo;
  inputId.value = tanqueo.id;
  inputFecha.value = tanqueo.fecha;
  inputEstacion.value = tanqueo.estacion;
  inputCombustible.value = tanqueo.combustible;
  inputPrecio.value = tanqueo.precio;
  inputValorPagado.value = tanqueo.costo;
  inputGalones.value = tanqueo.galones.toFixed(3);
  inputOdometro.value = tanqueo.odometro;
  selectTanqueLleno.value = String(tanqueo.tanqueLleno);
  inputNotas.value = tanqueo.notas || '';

  btnSubmit.innerHTML = '💾 Actualizar Tanqueo';
  btnCancelEdit.classList.remove('hidden');

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
  // Restaurar el texto del botón si estaba en modo demo
  btnModalEliminar.textContent = 'Eliminar';
}

function confirmarEliminacion() {
  if (!tanqueoAEliminar) return;

  // Modo demo: cargar datos de ejemplo
  if (tanqueoAEliminar === '__DEMO_CONFIRM__') {
    cerrarModal();
    btnModalEliminar.textContent = 'Eliminar';
    ejecutarCargaDemo();
    return;
  }

  const eliminado = Store.eliminarTanqueo(tanqueoAEliminar);
  if (eliminado) {
    mostrarToast('Tanqueo eliminado', 'success');
    cerrarModal();
    refrecarDatos();
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
function refrecarDatos() {
  tanqueos = Store.cargarTanqueos();
  estaciones = Store.cargarEstaciones();
  actualizarInterfaz();
}

// ===== Actualizar toda la interfaz =====
function actualizarInterfaz() {
  actualizarDatalistEstaciones();
  actualizarFiltros();
  actualizarEstadisticas();
  actualizarUltimoRendimiento();
  renderizarTabla();
  renderizarGrafico();
  actualizarVisibilidadSecciones();
}

// ===== Actualizar datalist de estaciones =====
function actualizarDatalistEstaciones() {
  const datalist = $('lista-estaciones');
  datalist.innerHTML = '';
  estaciones.forEach(est => {
    const option = document.createElement('option');
    option.value = est;
    datalist.appendChild(option);
  });
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
      'Extra': 'tag-extra',
      'Diesel': 'tag-diesel'
    }[t.combustible] || 'tag-corriente';

    const rendimientoHTML = t.rendimiento !== null
      ? `<strong>${formatearNumero(t.rendimiento, 1)}</strong> <small>km/gal</small>`
      : t.tanqueLleno === 2
        ? '<small class="text-muted">pendiente</small>'
        : '<small class="text-muted">parcial</small>';

    return `
      <tr>
        <td>${formatearFechaLegible(t.fecha)}</td>
        <td>${escapeHTML(t.estacion)}</td>
        <td><span class="tag-combustible ${tagClass}">${escapeHTML(t.combustible)}</span></td>
        <td>${formatearNumero(t.galones, 2)}</td>
        <td>${formatearCOP(t.costo)}</td>
        <td>${formatearNumero(t.odometro, 0)} km</td>
        <td>${rendimientoHTML}</td>
        <td class="acciones">
          <button class="btn btn-sm btn-edit" onclick="App.editar('${t.id}')" title="Editar">✏️</button>
          <button class="btn btn-sm btn-del" onclick="App.eliminar('${t.id}')" title="Eliminar">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
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

// ===== Datos de demostración =====
function cargarDatosDemo() {
  if (tanqueos.length > 0) {
    modalMensaje.textContent = '¿Cargar datos de ejemplo? Esto reemplazará todos tus registros actuales.';
    tanqueoAEliminar = '__DEMO_CONFIRM__';
    modalConfirmar.classList.remove('hidden');
    btnModalEliminar.textContent = 'Cargar';
    return;
  }

  ejecutarCargaDemo();
}

function ejecutarCargaDemo() {
  const datosDemo = Store.cargarDatosDemo();
  Store.guardarTanqueos(datosDemo);
  // Agregar estaciones de la demo
  const estacionesDemo = [...new Set(datosDemo.map(t => t.estacion))];
  Store.agregarEstaciones(estacionesDemo);
  mostrarToast('Datos de ejemplo cargados', 'success');
  refrecarDatos();
}

// ===== Tema =====
function aplicarTemaGuardado() {
  const tema = Store.cargarTema();
  if (tema === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    $('btn-theme').textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    $('btn-theme').textContent = '🌙';
  }
}

function alternarTema() {
  const esOscuro = document.documentElement.getAttribute('data-theme') === 'dark';
  if (esOscuro) {
    document.documentElement.removeAttribute('data-theme');
    $('btn-theme').textContent = '🌙';
    Store.guardarTema('light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    $('btn-theme').textContent = '☀️';
    Store.guardarTema('dark');
  }
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
  if (e.key === 'Escape' && !modalConfirmar.classList.contains('hidden')) {
    cerrarModal();
  }
});