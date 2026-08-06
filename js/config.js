/* ===== GASOLINA K3 — Configuración de Supabase ===== */

// =====================================================================
// CONFIGURACIÓN DE SUPABASE
// ---------------------------------------------------------------------
// ✅ CONFIGURADA para producción (proyecto: vffysisnbhgkmprxzfii).
//   - Project URL:  https://vffysisnbhgkmprxzfii.supabase.co
//   - Anon Key:     sb_publishable_WuaTfItdvAbaIDhhxSYTRw_ssHXwQq9
//
// Cómo funciona la prioridad:
//   1) La configuración guardada en el navegador (menú ⚙️), si existe.
//   2) Si no hay guardada, se usa automáticamente la de este archivo.
//   - Para volver al valor predeterminado de este archivo desde la app,
//     usa el botón "♻️ Restablecer" de la pantalla de configuración.
//
// Los datos se encuentran en: Supabase Dashboard → tu proyecto →
//   Settings → API Keys.
// =====================================================================
const SUPABASE_CONFIG = {
  url: 'https://vffysisnbhgkmprxzfii.supabase.co',
  anonKey: 'sb_publishable_WuaTfItdvAbaIDhhxSYTRw_ssHXwQq9'
};

// Clave en localStorage donde se guarda la configuración escrita en la app
const STORE_CONFIG_KEY = 'gasolinak3_supabase_config';

/**
 * Normaliza la Project URL de Supabase:
 * - quita espacios, barra final y el sufijo "/rest/v1" (por si el usuario
 *   copió la URL de la API REST completa en vez de la Project URL).
 * @param {string} url
 * @returns {string}
 */
function normalizarUrlSupabase(url) {
  return String(url || '')
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
}

/**
 * Devuelve la configuración de Supabase válida (la guardada en la app
 * o la de este archivo) o null si no hay configuración.
 * @returns {{url: string, anonKey: string}|null}
 */
function cargarConfigSupabase() {
  // 1) Configuración guardada desde la app (prioridad)
  try {
    const guardada = localStorage.getItem(STORE_CONFIG_KEY);
    if (guardada) {
      const cfg = JSON.parse(guardada);
      if (cfg && cfg.url && cfg.anonKey) {
        return { url: normalizarUrlSupabase(cfg.url), anonKey: String(cfg.anonKey).trim() };
      }
    }
  } catch (e) {
    console.error('Error al leer la configuración de Supabase:', e);
  }

  // 2) Configuración escrita en este archivo (js/config.js)
  if (
    SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey &&
    !/TU-PROYECTO|TU_ANON|TU-ANON|your-project|your-anon|xxxx/i.test(SUPABASE_CONFIG.url + SUPABASE_CONFIG.anonKey)
  ) {
    return { url: normalizarUrlSupabase(SUPABASE_CONFIG.url), anonKey: SUPABASE_CONFIG.anonKey.trim() };
  }

  return null;
}

/** Guarda la configuración de Supabase escrita desde la app. */
function guardarConfigSupabase(url, anonKey) {
  localStorage.setItem(STORE_CONFIG_KEY, JSON.stringify({
    url: normalizarUrlSupabase(url),
    anonKey: String(anonKey).trim()
  }));
}

/** Borra la configuración guardada desde la app. */
function borrarConfigSupabase() {
  localStorage.removeItem(STORE_CONFIG_KEY);
}

// =====================================================================
// AppConfig — fachada que usa la interfaz (app.js) para leer, validar,
// guardar y aplicar la configuración de Supabase.
// =====================================================================
const AppConfig = {
  _ultimoError: null,

  /** Devuelve la configuración actual de Supabase o null si no hay. */
  obtenerCredenciales() {
    return cargarConfigSupabase();
  },

  /**
   * Valida y guarda las credenciales de Supabase en el navegador.
   * @param {string} url  Project URL (https://xxxx.supabase.co)
   * @param {string} anonKey  anon public key
   * @returns {boolean} true si se guardó correctamente
   */
  guardarCredenciales(url, anonKey) {
    const u = String(url || '').trim();
    const k = String(anonKey || '').trim();

    if (!u || !k) {
      this._ultimoError = 'Ingresa tanto la Project URL como la anon public key.';
      return false;
    }
    if (!/^https:\/\/[^/\s]+\.[^/\s]+/i.test(u)) {
      this._ultimoError = 'La Project URL debe ser una URL válida, por ejemplo: https://tuproyecto.supabase.co';
      return false;
    }
    if (k.length < 20) {
      this._ultimoError = 'La anon public key parece incompleta. Copia la clave completa (Settings → API).';
      return false;
    }

    try {
      guardarConfigSupabase(u, k);
      this._ultimoError = null;
      return true;
    } catch (e) {
      console.error('Error al guardar la configuración de Supabase:', e);
      this._ultimoError = 'No se pudo guardar la configuración en este navegador.';
      return false;
    }
  },

  /** Borra la configuración guardada desde la app. */
  borrarCredenciales() {
    borrarConfigSupabase();
  },

  /** Devuelve el último error de configuración (o null). */
  obtenerUltimoError() {
    return this._ultimoError;
  },

  /**
   * Conecta con Supabase y verifica que la base de datos responda.
   * @returns {Promise<boolean>}
   */
  async aplicarCredenciales() {
    const conectado = await Store.conectar();
    if (!conectado) {
      throw new Error('No hay configuración de Supabase válida.');
    }
    const verificado = await Store.verificarConexion();
    if (!verificado) {
      const detalle = Store.ultimoError
        ? (Store.ultimoError.message || String(Store.ultimoError))
        : 'No se pudo contactar Supabase.';
      throw new Error(detalle);
    }
    return true;
  }
};
