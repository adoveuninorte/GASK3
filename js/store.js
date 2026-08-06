/* ===== GASOLINA K3 — Almacenamiento (Supabase + caché local) ===== */

// Cliente Supabase (se inicializa con Store.conectar())
let supabase = null;

const Store = {
  // Claves de localStorage
  KEY_TANQUEOS_LOCALES: 'gasolinak3_tanqueos',     // Datos de la versión anterior (fuente de migración)
  KEY_ESTACIONES_LOCALES: 'gasolinak3_estaciones', // Datos de la versión anterior
  KEY_CACHE_TANQUEOS: 'gasolinak3_cache_tanqueos', // Caché local de datos sincronizados
  KEY_CACHE_ESTACIONES: 'gasolinak3_cache_estaciones',
  KEY_TEMA: 'gasolinak3_tema',

  config: null,
  conectado: false,
  ultimoError: null,

  /**
   * Conecta con Supabase usando la configuración guardada (localStorage) o js/config.js.
   * @returns {Promise<boolean>} true si hay configuración y se creó el cliente
   */
  async conectar() {
    this.config = (typeof cargarConfigSupabase === 'function') ? cargarConfigSupabase() : null;
    if (!this.config) {
      this.conectado = false;
      return false;
    }
    if (typeof createClient !== 'function') {
      console.error('No se encontró el cliente de Supabase (supabase-js).');
      this.conectado = false;
      this.ultimoError = new Error('No se cargó la librería de Supabase (supabase-js). Revisa tu conexión a internet o bloqueadores de scripts.');
      return false;
    }
    supabase = createClient(this.config.url, this.config.anonKey);
    this.conectado = true;
    this.ultimoError = null;
    return true;
  },

  /**
   * Verifica que se pueda consultar la base de datos.
   * @returns {Promise<boolean>}
   */
  async verificarConexion() {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('tanqueos').select('id').limit(1);
      if (error) throw error;
      this.ultimoError = null;
      return true;
    } catch (e) {
      console.error('Error de conexión con Supabase:', e);
      this.ultimoError = e;
      return false;
    }
  },

  // ===== Caché local (respaldo sin conexión) =====
  _cargarCache(clave) {
    try {
      const datos = localStorage.getItem(clave);
      return datos ? JSON.parse(datos) : null;
    } catch (e) {
      console.error('Error al leer caché local:', e);
      return null;
    }
  },

  _guardarCache(clave, valor) {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
    } catch (e) {
      console.error('Error al guardar caché local:', e);
    }
  },

  _guardarTanqueosLocales(lista) {
    this._guardarCache(this.KEY_TANQUEOS_LOCALES, this._ordenarTanqueos(lista));
  },

  _guardarEstacionesLocales(lista) {
    this._guardarCache(this.KEY_ESTACIONES_LOCALES, lista);
  },

  _ordenarTanqueos(lista) {
    return [...lista].sort((a, b) => {
      const fechaComp = (a.fecha || '').localeCompare(b.fecha || '');
      return fechaComp !== 0 ? fechaComp : (a.odometro || 0) - (b.odometro || 0);
    });
  },

  /** Convierte una fila de la tabla `tanqueos` al formato interno de la app */
  _mapearFilaSupabase(fila) {
    if (!fila) return null;
    return {
      id: fila.id,
      fecha: fila.fecha,
      estacion: fila.estacion,
      combustible: fila.combustible,
      precio: Number(fila.precio) || 0,
      galones: Number(fila.galones) || 0,
      costo: Number(fila.costo) || 0,
      odometro: Number(fila.odometro) || 0,
      tanqueLleno: Number(fila.tanque_lleno) || 1,
      notas: fila.notas || '',
      fechaCreacion: fila.created_at,
      fechaActualizacion: fila.updated_at
    };
  },

  /** Convierte un tanqueo interno al formato de la tabla `tanqueos` */
  _mapearTanqueoParaDB(t) {
    return {
      id: t.id,
      fecha: t.fecha,
      estacion: t.estacion,
      combustible: t.combustible,
      precio: Number(t.precio) || 0,
      galones: Number(t.galones) || 0,
      costo: Number(t.costo) || 0,
      odometro: Number(t.odometro) || 0,
      tanque_lleno: Number(t.tanqueLleno) || 1,
      notas: t.notas || ''
    };
  },

  /**
   * Carga todos los tanqueos desde Supabase.
   * Si Supabase no está disponible, usa la caché local como respaldo.
   * @returns {Promise<Array>}
   */
  async cargarTanqueos() {
    if (!supabase) {
      const cache = this._cargarCache(this.KEY_CACHE_TANQUEOS);
      return cache ? this._ordenarTanqueos(cache) : [];
    }
    try {
      const { data, error } = await supabase
        .from('tanqueos')
        .select('*')
        .order('fecha', { ascending: true })
        .order('odometro', { ascending: true });
      if (error) throw error;
      const tanqueos = (data || []).map(f => this._mapearFilaSupabase(f));
      this._guardarCache(this.KEY_CACHE_TANQUEOS, tanqueos);
      this.ultimoError = null;
      return tanqueos;
    } catch (e) {
      console.error('Error al cargar tanqueos desde Supabase:', e);
      this.ultimoError = e;
      const cache = this._cargarCache(this.KEY_CACHE_TANQUEOS);
      return cache ? this._ordenarTanqueos(cache) : [];
    }
  },

  /**
   * Agrega un tanqueo nuevo a Supabase.
   * @param {object} tanqueo - Datos del tanqueo (sin ID)
   * @returns {Promise<object>} El tanqueo guardado con su ID
   */
  async agregarTanqueo(tanqueo) {
    const nuevo = {
      id: tanqueo.id || generarId(),
      fecha: tanqueo.fecha,
      estacion: tanqueo.estacion,
      combustible: tanqueo.combustible,
      precio: Number(tanqueo.precio) || 0,
      galones: Number(tanqueo.galones) || 0,
      costo: Number(tanqueo.costo) || 0,
      odometro: Number(tanqueo.odometro) || 0,
      tanqueLleno: Number(tanqueo.tanqueLleno) || 1,
      notas: tanqueo.notas || ''
    };

    if (!supabase) {
      // Modo local (sin configuración de Supabase)
      const lista = this.leerTanqueosLocales();
      lista.push(nuevo);
      this._guardarTanqueosLocales(lista);
      this._guardarCache(this.KEY_CACHE_TANQUEOS, this._ordenarTanqueos(lista));
      return nuevo;
    }

    const { data, error } = await supabase
      .from('tanqueos')
      .insert(this._mapearTanqueoParaDB(nuevo))
      .select()
      .single();
    if (error) throw error;

    const cache = this._cargarCache(this.KEY_CACHE_TANQUEOS) || [];
    const fila = this._mapearFilaSupabase(data);
    cache.push(fila);
    this._guardarCache(this.KEY_CACHE_TANQUEOS, this._ordenarTanqueos(cache));
    return fila;
  },

  /**
   * Actualiza un tanqueo existente.
   * @param {string} id - ID del tanqueo
   * @param {object} cambios - Datos actualizados
   * @returns {Promise<object>} El tanqueo actualizado
   */
  async actualizarTanqueo(id, cambios) {
    if (!supabase) {
      // Modo local (sin configuración de Supabase)
      const lista = this.leerTanqueosLocales();
      const idx = lista.findIndex(t => t.id === id);
      if (idx === -1) throw new Error('No se encontró el tanqueo a actualizar');
      lista[idx] = { ...lista[idx], ...cambios };
      this._guardarTanqueosLocales(lista);
      this._guardarCache(this.KEY_CACHE_TANQUEOS, this._ordenarTanqueos(lista));
      return lista[idx];
    }
    const { data, error } = await supabase
      .from('tanqueos')
      .update({
        fecha: cambios.fecha,
        estacion: cambios.estacion,
        combustible: cambios.combustible,
        precio: Number(cambios.precio) || 0,
        galones: Number(cambios.galones) || 0,
        costo: Number(cambios.costo) || 0,
        odometro: Number(cambios.odometro) || 0,
        tanque_lleno: Number(cambios.tanqueLleno) || 1,
        notas: cambios.notas || ''
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    const actualizado = this._mapearFilaSupabase(data);
    const cache = this._cargarCache(this.KEY_CACHE_TANQUEOS) || [];
    const idx = cache.findIndex(t => t.id === id);
    if (idx !== -1) cache[idx] = actualizado; else cache.push(actualizado);
    this._guardarCache(this.KEY_CACHE_TANQUEOS, this._ordenarTanqueos(cache));
    return actualizado;
  },

  /**
   * Elimina un tanqueo por su ID.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async eliminarTanqueo(id) {
    if (!supabase) {
      // Modo local (sin configuración de Supabase)
      const lista = this.leerTanqueosLocales().filter(t => t.id !== id);
      this._guardarTanqueosLocales(lista);
      this._guardarCache(this.KEY_CACHE_TANQUEOS, this._ordenarTanqueos(lista));
      return true;
    }
    const { error } = await supabase.from('tanqueos').delete().eq('id', id);
    if (error) throw error;
    const cache = this._cargarCache(this.KEY_CACHE_TANQUEOS) || [];
    this._guardarCache(this.KEY_CACHE_TANQUEOS, this._ordenarTanqueos(cache.filter(t => t.id !== id)));
    return true;
  },

  // ===== Estaciones de servicio =====

  /**
   * Carga la lista de estaciones desde Supabase (con caché local).
   * @returns {Promise<Array>}
   */
  async cargarEstaciones() {
    if (!supabase) {
      const cache = this._cargarCache(this.KEY_CACHE_ESTACIONES);
      return cache || [];
    }
    try {
      const { data, error } = await supabase
        .from('estaciones')
        .select('nombre')
        .order('nombre', { ascending: true });
      if (error) throw error;
      const estaciones = (data || []).map(e => e.nombre).filter(Boolean);
      this._guardarCache(this.KEY_CACHE_ESTACIONES, estaciones);
      this.ultimoError = null;
      return estaciones;
    } catch (e) {
      console.error('Error al cargar estaciones desde Supabase:', e);
      this.ultimoError = e;
      const cache = this._cargarCache(this.KEY_CACHE_ESTACIONES);
      return cache || [];
    }
  },

  /**
   * Carga tanqueos y estaciones en una sola llamada.
   * Sin conexión usa la caché o los datos de la versión anterior (legacy).
   * @returns {Promise<{tanqueos: Array, estaciones: Array}>}
   */
  async cargarTodo() {
    const [tanqueos, estaciones] = await Promise.all([this.cargarTanqueos(), this.cargarEstaciones()]);
    const conEstacionInicial = [...new Set([...estaciones, 'Brio Melgar'])].sort();
    if (!supabase) {
      // Sin configuración/Supabase: usar los datos de la versión anterior
      const locales = this.leerTanqueosLocales();
      const estLocal = this.leerEstacionesLocales();
      return {
        tanqueos: locales.length > 0 ? locales : tanqueos,
        estaciones: [...new Set([...(estLocal.length > 0 ? estLocal : conEstacionInicial), 'Brio Melgar'])].sort()
      };
    }
    return { tanqueos, estaciones: conEstacionInicial };
  },

  /**
   * Agrega estaciones nuevas (si no existen).
   * @param {string|Array} estaciones
   */
  async agregarEstaciones(estaciones) {
    const nombres = Array.isArray(estaciones) ? estaciones : [estaciones];
    const actuales = supabase ? await this.cargarEstaciones() : this.leerEstacionesLocales();
    const nuevos = [];
    nombres.forEach(nombre => {
      const limpio = String(nombre || '').trim();
      if (limpio && !actuales.includes(limpio) && !nuevos.includes(limpio)) nuevos.push(limpio);
    });
    if (nuevos.length === 0) return;

    if (!supabase) {
      // Modo local (sin configuración de Supabase)
      const lista = [...new Set([...this.leerEstacionesLocales(), ...nuevos])].sort();
      this._guardarEstacionesLocales(lista);
      this._guardarCache(this.KEY_CACHE_ESTACIONES, lista);
      return;
    }

    const { error } = await supabase.from('estaciones').insert(nuevos.map(n => ({ nombre: n })));
    if (error) throw error;

    const cache = this._cargarCache(this.KEY_CACHE_ESTACIONES) || [];
    this._guardarCache(this.KEY_CACHE_ESTACIONES, [...new Set([...cache, ...nuevos])].sort());
  },

  /** Garantiza que exista al menos la estación "Brio Melgar". */
  async asegurarEstacionesIniciales() {
    const lista = await this.cargarEstaciones();
    if (lista.length === 0) {
      await this.agregarEstaciones('Brio Melgar');
    }
  },

  // ===== Tema (preferencia del dispositivo) =====
  cargarTema() {
    return localStorage.getItem(this.KEY_TEMA);
  },

  guardarTema(tema) {
    localStorage.setItem(this.KEY_TEMA, tema);
  },

  // ===== Exportar / Importar JSON =====

  /**
   * Exporta toda la base de datos como objeto JSON.
   * @returns {Promise<object>}
   */
  async exportarJSON() {
    const tanqueos = await this.cargarTanqueos();
    const estaciones = await this.cargarEstaciones();
    return {
      app: 'GASOLINA K3',
      version: 2,
      exportado: new Date().toISOString(),
      tanqueos: tanqueos,
      estaciones: estaciones,
      tema: this.cargarTema()
    };
  },

  /**
   * Restaura la base de datos desde un JSON exportado.
   * @param {object} datos
   * @returns {Promise<boolean>}
   */
  async importarJSON(datos) {
    try {
      if (!datos || typeof datos !== 'object') return false;
      const tanqueos = Array.isArray(datos.tanqueos) ? datos.tanqueos : [];
      const estaciones = Array.isArray(datos.estaciones) ? datos.estaciones : [];
      const tanqueosValidos = tanqueos.filter(t => t && typeof t === 'object' && t.fecha && t.estacion);

      const existentes = supabase ? await this.cargarTanqueos() : this.leerTanqueosLocales();
      const idsExistentes = new Set(existentes.map(t => t.id));
      const nuevos = tanqueosValidos
        .map(t => ({ ...t, id: t.id || generarId() }))
        .filter(t => !idsExistentes.has(t.id));

      if (nuevos.length > 0) {
        if (supabase) {
          const { error } = await supabase.from('tanqueos').insert(nuevos.map(t => this._mapearTanqueoParaDB(t)));
          if (error) throw error;
        } else {
          const lista = this.leerTanqueosLocales();
          this._guardarTanqueosLocales([...lista, ...nuevos]);
          this._guardarCache(this.KEY_CACHE_TANQUEOS, this._ordenarTanqueos([...lista, ...nuevos]));
        }
      }

      await this.agregarEstaciones(estaciones.concat(['Brio Melgar']));

      if (datos.tema === 'dark' || datos.tema === 'light') {
        this.guardarTema(datos.tema);
      }
      return true;
    } catch (e) {
      console.error('Error al importar JSON:', e);
      return false;
    }
  },

  // ===== Migración desde la versión anterior (localStorage) =====

  /** Lee los tanqueos de la versión anterior guardados en localStorage. */
  leerTanqueosLocales() {
    const cache = this._cargarCache(this.KEY_TANQUEOS_LOCALES);
    return cache ? this._ordenarTanqueos(cache) : [];
  },

  /** Lee las estaciones de la versión anterior guardadas en localStorage. */
  leerEstacionesLocales() {
    const cache = this._cargarCache(this.KEY_ESTACIONES_LOCALES);
    return cache || [];
  },

  /** Cuenta los tanqueos legacy que aún no existen en Supabase (para el botón "Migrar"). */
  contarLocalesPendientes() {
    const locales = this.leerTanqueosLocales();
    if (locales.length === 0) return 0;
    const existentes = this._cargarCache(this.KEY_CACHE_TANQUEOS) || [];
    const ids = new Set(existentes.map(t => t.id).filter(Boolean));
    return locales.filter(t => t && t.id && !ids.has(t.id)).length;
  },

  /**
   * Migra los datos de la versión anterior (localStorage) a Supabase.
   * No duplica registros: verifica por ID.
   * @returns {Promise<{migrados:number,total:number}>}
   */
  async migrarDatosLocales() {
    if (!supabase) throw new Error('Sin conexión a Supabase. Revisa la configuración (⚙️).');
    const locales = this.leerTanqueosLocales();
    const total = locales.length;
    let migrados = 0;

    if (total > 0) {
      const existentes = await this.cargarTanqueos();
      const idsExistentes = new Set(existentes.map(t => t.id));
      const nuevos = locales.filter(t => t && !idsExistentes.has(t.id));
      migrados = nuevos.length;
      if (migrados > 0) {
        const { error } = await supabase.from('tanqueos').insert(nuevos.map(t => this._mapearTanqueoParaDB(t)));
        if (error) throw error;
      }
    }

    const estLocal = this.leerEstacionesLocales();
    await this.agregarEstaciones(estLocal);

    return { migrados, total };
  },

};
