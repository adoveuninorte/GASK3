# ⛽ GASOLINA K3

Aplicación web para registrar tus consumos de gasolina, calcular rendimiento (km/gal), costos en pesos colombianos (COP) y generar estadísticas. Los datos se sincronizan con **Supabase** (nube) y la app también funciona sin conexión.

## ☁️ Configurar Supabase (recomendado)

En el primer uso, la app te pide los datos de conexión (también puedes abrir la configuración con el botón **⚙️** de la cabecera):

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. En el **SQL Editor**, ejecuta el script [`supabase-schema.sql`](supabase-schema.sql) (crea las tablas `tanqueos` y `estaciones`, índices y políticas de acceso público).
3. En **Settings → API**, copia la *Project URL* y la *anon public key*.
4. Pégalas en la app y haz clic en **🔌 Conectar**.

La configuración queda guardada en tu navegador (localStorage). Si ya tenías datos de la versión anterior, la app mostrará el botón **📤 Migrar datos** para subirlos a la nube (sin duplicar registros).

> **¿Sin Supabase?** Puedes cerrar la pantalla con **"Más tarde"** y la app seguirá funcionando guardando los datos localmente en tu navegador.

## 🚀 Publicación en GitHub Pages

Esta app ya está publicada en:

```
https://adoveuninorte.github.io/GASK3/
```

El sitio se sirve desde la rama `main` (carpeta raíz). Para actualizar la versión publicada, sube los cambios al repositorio:

```bash
# 1. Agregar todos los cambios
git add .

# 2. Crear un commit
git commit -m "Migración a Supabase"

# 3. Subir a GitHub
git push origin main
```

GitHub Pages publica automáticamente en 1-2 minutos (Settings → Pages → Branch: `main` / `(root)`).

> **Nota**: todas las rutas del sitio son relativas (`css/`, `js/`), por lo que funciona correctamente bajo la subruta `/GASK3/`.

## 💡 Uso

1. **Registrar un tanqueo**: completa el formulario con fecha, estación, combustible (Corriente o Extra), precio por galón (COP), **valor pagado en pesos colombianos**, odómetro y si fue tanque lleno o parcial.
   - Los **galones** se calculan automáticamente: `Valor pagado ÷ Precio por galón`.
   - El **rendimiento (km/gal)** se calcula comparando tanqueos con "tanque lleno".
2. **Rendimiento**: se calcula automáticamente cuando hay dos tanqueos seguidos con "tanque lleno". Si hay tanqueos parciales entre tanqueos llenos, se suman los galones de todos los intermedios para un cálculo preciso.
3. **Estadísticas**: se actualizan en tiempo real:
   - Rendimiento promedio (km/gal)
   - Mejor rendimiento
   - Costo por kilómetro (COP/km)
   - Precio promedio por galón
   - Total gastado
   - Total galones
4. **Exportar CSV**: botón en la cabecera para descargar todos los registros (compatible con Excel).
5. **Tema oscuro**: botón 🌙/☀️ para alternar entre tema claro y oscuro.
6. **Respaldo JSON**: los botones **💾** (Exportar) y **📂** (Importar) se muestran solo con su icono en la cabecera; al pasar el cursor muestran su función. En móvil, el menú **☰** agrupa todas las acciones de datos.
7. **Diseño responsive minimalista**: la aplicación se adapta a teléfonos y tablets con una estética sobria — cabecera compacta en una sola fila, estadísticas en cuadrícula de 2 columnas, formulario de una sola columna en pantallas pequeñas, tablas convertidas en tarjetas, modal como bottom-sheet con asa de arrastre y botón flotante **+** para registrar.

## 📁 Estructura del Proyecto

```
├── index.html             → Estructura de la página
├── css/
│   └── styles.css         → Estilos (tema claro/oscuro, responsive)
├── js/
│   ├── app.js             → Lógica principal de la interfaz
│   ├── store.js           → Capa de datos (Supabase + caché local)
│   ├── config.js          → Configuración de Supabase (Project URL y anon key)
│   └── utils.js           → Utilidades (formato COP, cálculos, CSV)
├── supabase-schema.sql    → Esquema SQL para crear las tablas en Supabase
└── README.md              → Este archivo
```

## 📊 Cálculo del Rendimiento

La fórmula utilizada:

```
Rendimiento (km/gal) = Kilómetros recorridos ÷ Galones consumidos
```

Donde:
- **Kilómetros recorridos** = Odómetro actual − Odómetro del último tanqueo con tanque lleno.
- **Galones consumidos** = Suma de galones de todos los tanqueos posteriores al último lleno (incluyendo el actual).

Esto significa que puedes hacer tanqueos parciales sin que afecten la precisión del cálculo.

## 🔒 Privacidad

- Si configuras Supabase, los datos se guardan en tu **propio proyecto** de Supabase (tú controlas el proyecto; el esquema incluye políticas de acceso público para uso sin login).
- Si no configuras Supabase, los datos se guardan **localmente en tu navegador**.
- Usa el botón **💾** (Exportar JSON) de la cabecera para respaldar tus registros y **📂** (Importar JSON) para restaurarlos en cualquier momento.

## 🛠️ Tecnologías

- HTML5 + CSS3 + JavaScript vanilla
- [Chart.js](https://www.chartjs.org/) para los gráficos (cargado desde CDN)
- [Supabase](https://supabase.com) para la base de datos en la nube (PostgreSQL)
- localStorage para caché local y modo sin conexión

---

⚠️ **Importante**: No se requiere servidor backend. GitHub Pages sirve los archivos estáticos y Supabase actúa como base de datos. La *anon key* es pública por diseño y las políticas del esquema permiten lectura/escritura anónima.

Desarrollado con ❤️ para llevar el control de tu consumo de gasolina.