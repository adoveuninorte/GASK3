/* ===== GASOLINA K3 — Almacenamiento (localStorage) ===== */

const Store = {
  // Claves para localStorage
  KEY_TANQUEOS: 'gasolinak3_tanqueos',
  KEY_ESTACIONES: 'gasolinak3_estaciones',
  KEY_TEMA: 'gasolinak3_tema',

  /**
   * Carga todos los tanqueos desde localStorage.
   * @returns {Array} Lista de tanqueos ordenados por fecha
   */
  cargarTanqueos() {
    try {
      const datos = localStorage.getItem(this.KEY_TANQUEOS);
      const tanqueos = datos ? JSON.parse(datos) : [];
      // Ordenar por fecha y luego por odómetro
      return tanqueos.sort((a, b) => {
        const fechaComp = (a.fecha || '').localeCompare(b.fecha || '');
        return fechaComp !== 0 ? fechaComp : (a.odometro || 0) - (b.odometro || 0);
      });
    } catch (e) {
      console.error('Error al cargar tanqueos:', e);
      return [];
    }
  },

  /**
   * Guarda todos los tanqueos en localStorage.
   * @param {Array} tanqueos - Lista de tanqueos a guardar
   */
  guardarTanqueos(tanqueos) {
    try {
      localStorage.setItem(this.KEY_TANQUEOS, JSON.stringify(tanqueos));
    } catch (e) {
      console.error('Error al guardar tanqueos:', e);
    }
  },

  /**
   * Agrega un tanqueo nuevo.
   * @param {object} tanqueo - Datos del tanqueo (sin ID)
   * @returns {object} El tanqueo con su ID asignado
   */
  agregarTanqueo(tanqueo) {
    const tanqueos = this.cargarTanqueos();
    const nuevoTanqueo = {
      id: generarId(),
      fecha: tanqueo.fecha,
      estacion: tanqueo.estacion,
      combustible: tanqueo.combustible,
      precio: Number(tanqueo.precio) || 0,
      galones: Number(tanqueo.galones) || 0,
      costo: Number(tanqueo.costo) || 0,
      odometro: Number(tanqueo.odometro) || 0,
      tanqueLleno: Number(tanqueo.tanqueLleno) || 1,
      notas: tanqueo.notas || '',
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    };
    tanqueos.push(nuevoTanqueo);
    this.guardarTanqueos(tanqueos);
    return nuevoTanqueo;
  },

  /**
   * Actualiza un tanqueo existente.
   * @param {string} id - ID del tanqueo a actualizar
   * @param {object} cambios - Datos actualizados
   * @returns {object|null} El tanqueo actualizado o null si no existe
   */
  actualizarTanqueo(id, cambios) {
    const tanqueos = this.cargarTanqueos();
    const index = tanqueos.findIndex(t => t.id === id);
    if (index === -1) return null;

    tanqueos[index] = {
      ...tanqueos[index],
      fecha: cambios.fecha,
      estacion: cambios.estacion,
      combustible: cambios.combustible,
      precio: Number(cambios.precio) || 0,
      galones: Number(cambios.galones) || 0,
      costo: Number(cambios.costo) || 0,
      odometro: Number(cambios.odometro) || 0,
      tanqueLleno: Number(cambios.tanqueLleno) || 1,
      notas: cambios.notas || '',
      fechaActualizacion: new Date().toISOString()
    };

    this.guardarTanqueos(tanqueos);
    return tanqueos[index];
  },

  /**
   * Elimina un tanqueo por su ID.
   * @param {string} id - ID del tanqueo a eliminar
   * @returns {boolean} true si se eliminó correctamente
   */
  eliminarTanqueo(id) {
    const tanqueos = this.cargarTanqueos();
    const nuevos = tanqueos.filter(t => t.id !== id);
    if (nuevos.length === tanqueos.length) return false;
    this.guardarTanqueos(nuevos);
    return true;
  },

  /**
   * Carga la lista de estaciones de servicio conocidas.
   * @returns {Array} Lista de nombres de estaciones
   */
  cargarEstaciones() {
    try {
      const datos = localStorage.getItem(this.KEY_ESTACIONES);
      return datos ? JSON.parse(datos) : [];
    } catch (e) {
      console.error('Error al cargar estaciones:', e);
      return [];
    }
  },

  /**
   * Agrega estaciones nuevas a la lista (si no existen).
   * @param {string|Array} estaciones - Nombre(s) de estación a agregar
   */
  agregarEstaciones(estaciones) {
    const lista = this.cargarEstaciones();
    const nombres = Array.isArray(estaciones) ? estaciones : [estaciones];
    let cambiado = false;

    nombres.forEach(nombre => {
      const limpio = String(nombre || '').trim();
      if (limpio && !lista.includes(limpio)) {
        lista.push(limpio);
        cambiado = true;
      }
    });

    if (cambiado) {
      localStorage.setItem(this.KEY_ESTACIONES, JSON.stringify(lista.sort()));
    }
  },

  /**
   * Carga el tema guardado.
   * @returns {string|null} 'dark' | 'light' | null
   */
  cargarTema() {
    return localStorage.getItem(this.KEY_TEMA);
  },

  /**
   * Guarda el tema seleccionado.
   * @param {string} tema - 'dark' | 'light'
   */
  guardarTema(tema) {
    localStorage.setItem(this.KEY_TEMA, tema);
  },

  /**
   * Carga los datos de demostración.
   * @returns {Array} Tanqueos de ejemplo
   */
  cargarDatosDemo() {
    const hoy = new Date();
    const hacerFecha = (diasAtras) => {
      const f = new Date(hoy);
      f.setDate(f.getDate() - diasAtras);
      return f.toISOString().split('T')[0];
    };

    return [
      {
        fecha: hacerFecha(28),
        estacion: 'Terpel - Autopista',
        combustible: 'Corriente',
        precio: 13200,
        galones: 8.5,
        costo: 112200,
        odometro: 45600,
        tanqueLleno: 2,
        notas: 'Tanqueo inicial — referencia de partida'
      },
      {
        fecha: hacerFecha(21),
        estacion: 'Primax - 7ma',
        combustible: 'Corriente',
        precio: 13450,
        galones: 9.2,
        costo: 123740,
        odometro: 46480,
        tanqueLleno: 2,
        notas: 'Rendimiento: ~103.3 km/gal — viaje Bogotá-Villavicencio'
      },
      {
        fecha: hacerFecha(14),
        estacion: 'Terpel - Centro',
        combustible: 'Extra',
        precio: 14900,
        galones: 10.0,
        costo: 149000,
        odometro: 47450,
        tanqueLleno: 2,
        notas: 'Cambio a Extra para comparar rendimiento'
      },
      {
        fecha: hacerFecha(7),
        estacion: 'Primax - Autopista Norte',
        combustible: 'Extra',
        precio: 14800,
        galones: 8.8,
        costo: 130240,
        odometro: 48350,
        tanqueLleno: 2,
        notas: 'Rendimiento: ~102.3 km/gal — ciudad mayormente'
      },
      {
        fecha: hacerFecha(2),
        estacion: 'Terpel - Aeropuerto',
        combustible: 'Corriente',
        precio: 13500,
        galones: 7.5,
        costo: 101250,
        odometro: 49100,
        tanqueLleno: 1,
        notas: 'Tanqueo parcial de emergencia'
      },
      {
        fecha: hacerFecha(0),
        estacion: 'Primax - 7ma',
        combustible: 'Corriente',
        precio: 13600,
        galones: 9.0,
        costo: 122400,
        odometro: 50000,
        tanqueLleno: 2,
        notas: 'Tanque lleno. Calcula rendimiento vs. el anterior parcial + el lleno previo'
      }
    ];
  }
};