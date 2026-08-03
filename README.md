# ⛽ GASOLINA K3

Aplicación web para registrar tus consumos de gasolina, calcular rendimiento (km/gal), costos en pesos colombianos (COP) y generar estadísticas — 100% en tu navegador.

## 🚀 Publicar en GitHub Pages

### Opción 1: Subir archivos manualmente

1. **Crea un repositorio** en GitHub (por ejemplo: `gasolinak3`).
2. **Sube los archivos** de este proyecto al repositorio:
   - `index.html`
   - `css/` (carpeta con `styles.css`)
   - `js/` (carpeta con `app.js`, `store.js`, `utils.js`)
   - `README.md` (opcional)
3. Ve a **Settings → Pages** en tu repositorio.
4. En **Branch**, selecciona la rama `main` y carpeta `/ (root)`.
5. Haz clic en **Save**.
6. Espera 1-2 minutos y tu app estará disponible en:

```
https://tu-usuario.github.io/gasolinak3/
```

### Opción 2: Usar Git (línea de comandos)

```bash
# 1. Inicializar repositorio
git init

# 2. Agregar todos los archivos
git add .

# 3. Crear el primer commit
git commit -m "GASOLINA K3 - Registro de consumo de gasolina"

# 4. Agregar el repositorio remoto (reemplaza con tu URL)
git remote add origin https://github.com/TU-USUARIO/gasolinak3.git

# 5. Subir a GitHub
git branch -M main
git push -u origin main

# 6. Activar GitHub Pages en Settings → Pages → Branch: main / (root)
```

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
6. **Diseño responsive**: la aplicación se adapta automáticamente a teléfonos y tablets.

## 📁 Estructura del Proyecto

```
├── index.html          → Estructura de la página
├── css/
│   └── styles.css      → Estilos (tema claro/oscuro, responsive)
├── js/
│   ├── app.js          → Lógica principal de la interfaz
│   ├── store.js        → Persistencia en localStorage
│   └── utils.js        → Utilidades (formato COP, cálculos, CSV)
└── README.md           → Este archivo
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

- Todos los datos se guardan **localmente en tu navegador** (localStorage).
- No se envía información a ningún servidor.
- Si borras los datos del navegador, se perderán los registros. Usa **Exportar CSV** para respaldarlos.

## 🛠️ Tecnologías

- HTML5 + CSS3 + JavaScript vanilla
- [Chart.js](https://www.chartjs.org/) para los gráficos (cargado desde CDN)
- localStorage para persistencia

---

⚠️ **Importante**: No se requiere servidor backend. GitHub Pages sirve los archivos estáticos sin configuración adicional.

Desarrollado con ❤️ para llevar el control de tu consumo de gasolina.