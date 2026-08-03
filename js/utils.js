/* ===== GASOLINA K3 — Utilidades ===== */

/**
 * Formatea un número como moneda COP.
 * @param {number} valor - Valor a formatear
 * @param {boolean} conCentavos - Si mostrar decimales
 * @returns {string} Ej: "$ 14.500"
 */
function formatearCOP(valor, conCentavos = false) {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return '--';
  }
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: conCentavos ? 2 : 0,
    maximumFractionDigits: conCentavos ? 2 : 0
  }).format(valor);
}

/**
 * Formatea un número con hasta 2 decimales.
 * @param {number} valor - Valor a formatear
 * @param {number} decimales - Número de decimales
 * @returns {string}
 */
function formatearNumero(valor, decimales = 2) {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return '--';
  }
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(valor);
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD) como fecha legible en español.
 * @param {string} fechaISO - Fecha en formato ISO
 * @returns {string} Ej: "8 mar 2026"
 */
function formatearFechaLegible(fechaISO) {
  if (!fechaISO) return '--';
  try {
    const fecha = new Date(fechaISO + (fechaISO.length === 10 ? 'T12:00:00' : ''));
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(fecha);
  } catch (e) {
    return fechaISO;
  }
}

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD (hora local).
 * @returns {string}
 */
function obtenerFechaHoy() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/**
 * Genera un ID único para un tanqueo.
 * @returns {string}
 */
function generarId() {
  return 't_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
}

/**
 * Calcula los rendimientos (km/gal) para una lista ordenada de tanqueos.
 * 
 * Lógica:
 * - Solo se calcula rendimiento en tanqueos marcados como "tanque lleno".
 * - Se busca el tanqueo completo anterior más cercano.
 * - Se suman los kilómetros desde ese tanqueo completo hasta el actual.
 * - Se suman los galones de los tanqueos posteriores al último lleno
 *   (incluyendo los parciales intermedios y el actual).
 * 
 * @param {Array} tanqueosOrdenados - Tanqueos ordenados cronológicamente
 * @returns {Array} Nuevo array con la propiedad `rendimiento` agregada
 */
function calcularTodosLosRendimientos(tanqueosOrdenados) {
  const resultado = [];
  let ultimoLlenoIndex = -1;

  tanqueosOrdenados.forEach((tanqueo, index) => {
    let rendimiento = null;

    if (tanqueo.tanqueLleno === 2 && ultimoLlenoIndex !== -1) {
      const tanqueoLlenoAnterior = tanqueosOrdenados[ultimoLlenoIndex];

      // Kilómetros recorridos desde el último tanqueo lleno
      const kmRecorridos = tanqueo.odometro - tanqueoLlenoAnterior.odometro;

      // Galones consumidos: suma de tanqueos después del último lleno (incluye el actual)
      let galonesConsumidos = 0;
      for (let i = ultimoLlenoIndex + 1; i <= index; i++) {
        galonesConsumidos += tanqueosOrdenados[i].galones || 0;
      }

      if (kmRecorridos > 0 && galonesConsumidos > 0) {
        rendimiento = kmRecorridos / galonesConsumidos;
      }
    }

    if (tanqueo.tanqueLleno === 2) {
      ultimoLlenoIndex = index;
    }

    resultado.push({ ...tanqueo, rendimiento });
  });

  return resultado;
}

/**
 * Escapa texto HTML para prevenir inyección XSS.
 * @param {string} texto - Texto a escapar
 * @returns {string}
 */
function escapeHTML(texto) {
  if (texto === null || texto === undefined) return '';
  const ampersand = String.fromCharCode(38);   // &
  const menorQue = String.fromCharCode(60);    // <
  const mayorQue = String.fromCharCode(62);    // >
  const comillaDoble = String.fromCharCode(34); // "
  return String(texto)
    .replace(new RegExp(ampersand, 'g'), String.fromCharCode(38) + 'amp;')
    .replace(new RegExp(menorQue, 'g'), String.fromCharCode(38) + 'lt;')
    .replace(new RegExp(mayorQue, 'g'), String.fromCharCode(38) + 'gt;')
    .replace(new RegExp(comillaDoble, 'g'), String.fromCharCode(38) + 'quot;')
    .replace(/'/g, String.fromCharCode(38) + '#039;');
}

/**
 * Muestra un mensaje tipo toast (notificación temporal).
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - 'success' | 'error' | 'info'
 */
function mostrarToast(mensaje, tipo = 'success') {
  // Eliminar toasts anteriores
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.textContent = mensaje;
  document.body.appendChild(toast);

  // Mostrar con animación
  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });

  // Ocultar después de 3 segundos
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Exporta datos a un archivo CSV y lo descarga.
 * @param {Array} encabezados - Array con los encabezados
 * @param {Array} filas - Array de arrays con los datos
 * @param {string} nombreArchivo - Nombre del archivo a descargar
 */
function exportarCSV(encabezados, filas, nombreArchivo) {
  // Escapar cada celda para CSV
  const escaparCelda = (celda) => {
    const valor = String(celda ?? '');
    if (valor.includes(',') || valor.includes('"') || valor.includes('\n')) {
      return '"' + valor.replace(/"/g, '""') + '"';
    }
    return valor;
  };

  const lineas = [
    encabezados.map(escaparCelda).join(','),
    ...filas.map(fila => fila.map(escaparCelda).join(','))
  ];

  const csv = '\uFEFF' + lineas.join('\n'); // BOM para Excel
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}