# Insumos Críticos – Planta Cevil

Aplicación web para controlar el stock y el consumo de **Tarimas, Stretch, Gasoil y Cal** de Cerámica Marcos Paz – Planta Cevil.

- **Frontend:** `index.html`, `styles.css`, `datos.js` (lectura, cálculos y KPI), `app.js` (interfaz), `config.js` e `img/logo-cmp.png`. Se publica en GitHub Pages. Usa el mismo sistema visual que Control de Tierra y Cronograma de Producción, con colores propios de cada insumo (madera para tarimas, film celeste para stretch, ámbar para gasoil, piedra caliza para cal): tipografía Plus Jakarta Sans, acento naranja, tema claro y oscuro, navegación inferior en el celular, ilustraciones de nivel de stock por insumo y emojis.
- **Backend:** `apps-script/Code.gs`. Es una aplicación web de Google Apps Script que lee y escribe las planillas existentes, sin migrar datos:
  - **Stock Insumos Criticos CEVIL** (`1_K4PKO4AyTwxDi5Wd0q01Zyl8ygfVwreZC3lxRXymb0`): tarimas, stretch, cal, necesidades y proveedores.
  - **Combustible CMP** (`1sTkNFSECHyJgY_-ZwaqZDWCF35-tUOajcSL1JFUINzU`): gasoil (DetalleCevil, Control_Diaro y Cargas_y_Ajustes).

## Funciones

| Pestaña | Contenido |
|---|---|
| Inicio | Tarjeta por insumo con stock, cobertura, curva de 60 días (al pasar el puntero muestra fecha y stock), consumo e ingresos promedio por semana (últimas 12 semanas). Cobertura contra SS/PP, últimos 30 días contra los 30 previos y alertas |
| Tarimas / Stretch / Gasoil / Cal | KPI por período (histórico, últimos 365 días, año en curso contra el mismo tramo del año anterior, último trimestre cerrado contra el mismo trimestre del año anterior y el trimestre previo), evolución del stock con SS y PP, consumo mensual y análisis propio de cada insumo |
| Informes | Informe A4 (o PDF) **General** o de **cada insumo**, con vista previa. Períodos: últimos 30 días, último trimestre cerrado, año en curso, últimos 365 días e histórico. También se imprime desde el botón «🖨️» de Inicio y de cada insumo (usa el período elegido en esa pantalla) |
| Movimientos | Historial filtrable (requiere sesión). Anular registros solo con rol administrador |
| Administración | Ingreso eligiendo el usuario de una lista. Operador: Registrar y Mi cuenta. Responsable de Compras: Mi cuenta. Administrador: además Reposición, Usuarios y Conexión |

En cada insumo se muestran pocos registros (6 movimientos, 5 proveedores, 3 unidades por departamento, 5 controles y 4 inventarios) y el botón **Ver todos** abre el listado completo en una ventana.

### Ayuda en pantalla

Cada tarjeta con KPI tiene un botón **?**: al pasar el puntero (o tocarlo) explica cómo se calcula el valor. El botón **Ayuda** (abajo a la derecha) activa el modo ayuda: al pasar el puntero por cualquier indicador muestra su explicación. El botón **❓ Glosario** (Inicio, cada insumo e Informes) lista todas las abreviaturas: SS, PP, P90, CV, L/h, km/L, etc. Los informes impresos incluyen al final las abreviaturas que usan.

### Usuarios y permisos

| Rol | Puede |
|---|---|
| Sin sesión | Inicio e insumos (sin ajustes ni inventarios) |
| Operador | Informes y movimientos; registrar movimientos, controles y cargas; cambiar su clave. Ajustes e inventarios solo si el admin lo autoriza |
| Responsable de Compras | Informes, movimientos, ajustes por control físico e inventario físico contra sistema. No registra ni modifica |
| Administrador | Todo: anular registros, parámetros de reposición, usuarios, conexión. Siempre ve ajustes e inventarios |

- Los usuarios se guardan en la hoja **UsuariosApp** (se crea sola). Las claves se guardan como hash SHA-256 con sal; las columnas de hash y sal quedan ocultas.
- **Ajustes e inventarios físicos vs. sistema** (controles de las 6:00 y hojas de inventario): el servidor solo los envía a administradores y a operadores con «Ver inventarios» activado. El permiso se revisa en cada consulta, así que quitarlo tiene efecto inmediato. Quien tenga acceso directo a la planilla igual puede ver esas hojas: restringí la planilla en Drive si hace falta.
- Un usuario desactivado no puede ingresar y su sesión abierta deja de funcionar.

### KPI por insumo

- **Todos:** consumo diario promedio (días calendario), consumo por día operativo, consumo total, P90 y pico diario, ingresos, entregas y promedio por entrega, stock promedio y mínimo, cobertura promedio, rotación, días bajo stock de seguridad.
- **Tarimas:** descarte (unidades y % de lo usado), diferencia entre inventario físico y sistema, ingresos por proveedor.
- **Stretch:** gramos de stretch por pallet, bobinas por día, kg por bobina recibida, diferencia entre inventario y sistema, ingresos por proveedor.
- **Gasoil:** comparativa de períodos, consumo por departamento y por unidad (L/día, L/día activo, días entre cargas, L/h o km/L estimados, variación), despachos y litros por despacho, unidades con consumo y concentración en 3 unidades, cargas de cisterna.
- **Cal:** consumo diario y del turno 1, ingresos.
- **Todos:** stock promedio junto con la cobertura promedio; ajustes por control físico para usuarios autorizados.

### Criterios

- **Consumo medio** (para SS, PP y cobertura): mediana de los días con consumo de los últimos 120 días para tarimas y stretch; promedio por día calendario de los últimos 21 días para cal y de los últimos 90 días para gasoil.
- **Cal:** StockDiarioCAL (fila 2 en adelante; consumo en E, control físico 6:00 en G, ajuste en J = G − I, stock en K) y MovimientosCal (ingresos). Los períodos sin datos de cal muestran «—» en lugar de cero.
- **SS** = días SS × consumo medio; **PP** = días PP × consumo medio. Si un insumo no tiene fila en «Necesidades», se usan valores por defecto: 3 y 7 días para gasoil y cal.
- **Stock de gasoil:** stock disponible de Control_Diaro, que descuenta la reserva de 1.100 L.
- **Períodos:** se calculan hasta el último día completo (ayer).

## Puesta en marcha

### 1. Backend (Apps Script)

1. Con una cuenta que tenga **permiso de edición en ambas planillas**, entrá a <https://script.google.com> y creá un proyecto nuevo: «Insumos Críticos – API».
2. Pegá el contenido de `apps-script/Code.gs`.
3. En *Configuración del proyecto*, marcá «Mostrar el archivo de manifiesto appsscript.json» y reemplazalo por `apps-script/appsscript.json`.
4. En *Configuración del proyecto → Propiedades de la secuencia de comandos* agregá:
   - `ADMIN_KEY`: **obligatoria**. Clave maestra que solo sirve para crear al **primer administrador**: mientras «UsuariosApp» esté vacía, el primer ingreso con cualquier usuario (ej. `ezequiel`) y esta clave crea ese usuario como administrador. Después se ingresa con usuario y clave propios y la clave maestra deja de servir. La sesión dura 8 horas y cada cambio queda en LogApp con el usuario.
   - `API_KEY`: opcional. Si la cargás, también hace falta para leer los datos.
5. Ejecutá una vez la función `doGet` desde el editor para autorizar el acceso a las planillas.
6. Elegí *Implementar → Nueva implementación → Aplicación web*:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
7. Copiá la URL que termina en `/exec`.

Cada vez que cambies `Code.gs`, hacé *Implementar → Administrar implementaciones → Editar → Nueva versión* para conservar la misma URL.

### 2. Frontend (GitHub Pages)

1. En el repositorio `produccion-CMP/Insumos-Criticos` subí `index.html`, `styles.css`, `datos.js`, `app.js`, `config.js`, `README.md` y la carpeta `img/`. **No subas datos ni claves.**
2. **Rendimiento (v6):** en el editor de Apps Script elegí la función `instalar` y tocá **Ejecutar** una vez (pide autorizar «ejecutar en segundo plano»). Crea un activador que cada 5 minutos relee las planillas y guarda los datos comprimidos en caché; la app los sirve desde ahí en menos de 2 s. Cada registro hecho desde la app actualiza la caché al instante y el botón ⟳ fuerza una relectura.
3. Si venías de una versión anterior: reemplazá `Code.gs`, publicá una **nueva versión** de la implementación y entrá con usuario + `ADMIN_KEY` para crear el primer administrador.
4. En `config.js` (obligatorio para que cualquier navegador, incluso en modo incógnito, entre ya conectado) completá `SCRIPT_URL` con la URL `/exec`. Si definiste la propiedad `API_KEY`, copiala también en `API_KEY` de `config.js`: el repositorio es público, así que esa clave solo filtra accesos casuales. La protección real son los usuarios y roles (escrituras, inventarios y ajustes).
5. En *Settings → Pages*, elegí *Deploy from a branch*, rama `main` y carpeta `/ (root)`.

## Qué escribe la aplicación en las planillas

| Operación | Hoja | Columnas |
|---|---|---|
| Ingreso, envío de tarimas | MovimientosTarimas | Fecha, Cantidad, Proveedor («Envío» en envíos), fórmula Balance, Remito, Obs. |
| Descarte de tarimas | DescarteTarimas | Fecha, Cantidad, Proveedor, Obs. |
| Ingreso, envío de stretch | MovimientosStretch | Fecha, Kg, Bobinas (o fórmula kg/15), fórmulas Kg/Bob y Balance, Proveedor, Remito, Obs. |
| Consumo de stretch | StockDiarioStretch | Columna H de la fila de la fecha. Si ya tiene valor, pide confirmación. |
| Ingreso de cal | MovimientosCal | Fecha, Bolsas, fórmula Balance, Obs. (proveedor y remito) |
| Control físico 6:00 | StockDiarioTarimas (I), StockDiarioStretch (L, bobinas), StockDiarioCAL (G) | Celda de la fila de la fecha |
| Inventario físico | 🪵InventarioVsSistema, 🔄️StretchInventarioVsSistema | Fecha, Inventario físico y fórmulas copiadas de la fila anterior |
| Carga de cisterna, medición de sonda | Cargas_y_Ajustes (Combustible CMP) | Fecha, Hora, Tipo, Valor, fórmula Litros disponibles, Observaciones |
| Parámetros | Necesidades | Días SS (B) y días PP (D). Agrega la fila del insumo si no existe. |
| Usuarios | UsuariosApp (se crea sola) | Usuario, Nombre, Rol, VerInventario, Activo, hash y sal de la clave, Creado, Último ingreso |
| Todas | LogApp (se crea sola) | Fecha y hora, usuario, acción y detalle (sin claves ni tokens) |

Las columnas calculadas de las hojas `StockDiario*` (ingresos, envíos, consumos importados del Informe de Producción y stock) no se tocan: siguen funcionando con sus fórmulas.


## Rendimiento y caché (v6)

| Qué | Cómo |
|---|---|
| Lectura de datos | El servidor arma los datos una vez, los comprime (gzip) y los guarda en la caché del script por partes. Cada consulta los devuelve sin abrir las planillas. Hay dos versiones: pública y con inventarios/ajustes |
| Renovación | Activador `precalentar` cada 5 minutos, después de cada registro desde la app y con ⟳ (relectura forzada) |
| Usuarios | Lista en caché (se invalida al crear, editar o cambiar clave). La lista viaja con los datos, así que el selector de usuario aparece al instante |
| Inicio de sesión | Sin bloqueo ni escrituras en la planilla: el «último ingreso» y el registro en LogApp se guardan en cola y se vuelcan en el activador |
| Conexión | `config.js` tiene prioridad sobre lo guardado en cada navegador |
