UTC Pick Sazón
Pide fácil, recoge con sabor.

Este documento es la fase de **Implementación** del círculo de innovación: el algoritmo concreto para construir todo lo que vive en la **Propuesta** (ver `algoritmo-circulo-innovacion.md`, §3).

Objetivo
Resolver el problema de congestión en la cooperativa escolar, principalmente en horarios donde los alumnos salen a desayunar, la solución debe poder ser aplicada en cualquier modalidad (Escolarizada | Ejecutiva), en cualquier horario y en cualquier sucursal o plantel.

¿Para quien va dirigido?
Para alumnos, maestros, personal escolar, cualquier persona que desee y pueda comprar en la cooperativa escolar, y a los dirigentes de la cooperativa para facilitar la gestión de la congestión del alumnado.

¿Cómo se va a dirigir?
A través de arquitecturas definidas, tecnologías concretas que permitirán la creación de una app movil.

Nota a considerar
Se estarán haciendo constante pruebas en el editor de texto elegido y en el framework a trabajar.

Algoritmo de ejecución
1.- Se definirá el alcancé de la aplicación a través de los 3 primeros flujos del proceso de innovación los cuales son:
Ocurrencia
Idea
Propuesta (Tocará tema de alcance, usuarios, auth, funcionalidades, tecnologías , arquitectura , distribución, etc.) Se explayará más al detalle en esta sección.

Cuando se tenga la propuesta se procederá a generar el diseño de la(s) pantalla(s) que tendrá la página web.

2.- Definir diseño y paleta de colores, la paleta de colores está definida con los siguientes códigos hexadecimales:
| Variante            |         Hex |
| ------------------- | ----------: |
| Azul institucional  | **#021E5E** |
| Azul alterno        | **#0A2E7A** |
| Naranja principal   | **#E34100** |
| Naranja alterno     | **#F26336** |
Se deben crear dos diseños diferentes para el posible usuario dependiendo del perfil
1 .- Pantalla de Colaborador de la cooperativa (dark kitchen
2 .- Pantalla de Usuario con próposito de usar la plataforma

3.- Una vez definido los estilos a elegir para
- Welcome Page
- Login Page
- Logo
- Nombre
- Eslogan

Procederemos a levantar los servicios necesarios como:
- Node.js
- Docker
- Puertos 5432 (PostgreSQL) y 8080 (Keycloak), etc.

Construiremos las imagenes de Postgre.sql y Keycloack, tecnologías determinadas desde la propuesta.

4.- Cuando se tenga el servicio en linea, vamos a establecer de forma concreta la distribición de las carpetas quedando de la siguiente forma:
UTC-Proyecto/
  frontend/        (la app Expo: pantallas del alumno)
  backend/         (NestJS: la lógica y la conexión a la base de datos)
  infra/           (Docker: PostgreSQL + Keycloak)
  brand/           (másters del logo; el sistema de diseño vive en frontend/src/shared/theme + ui)
  docs/            (este documento, la propuesta y las decisiones)

5.- Construir las pantallas del alumno (cliente):
- Welcome y Login con el correo institucional (@edu.utc.mx).
- Inicio: el menú con fotos, precios y el tiempo de espera de cada cosa, más el carril de "listos para llevar ya" y el buscador.
- Detalle del producto, carrito y checkout (pago con Mercado Pago, PayPal, tarjeta o efectivo al recoger).
- Seguimiento del pedido (con su código de recogida, que es un número de pedido secuencial tipo U-00001) y las pestañas de Pedidos y Perfil.

6.- Construir el panel del administrador (la cooperativa):
- Dar de alta y editar el menú (productos, precios, fotos y el stock de "Preparados"). El stock además **se mueve solo** con el ciclo del pedido (ver §18).
- Recibir los pedidos y marcarlos como "Listo" (eso dispara el aviso al alumno con su número de pedido).
- Ver el semáforo de congestión en vivo: menos de 5 = Verde, de 5 a 10 = Amarillo, más de 10 = Rojo (parámetros y visibilidad en §12).
- Manejar la reoferta / "Pon tu precio" para vender lo que ya está hecho.
- Cerrar sesión y ajustar su cuenta: accesibilidad (texto grande, alto contraste, reducir movimiento) y personalización funcional (nombre y horario de la cooperativa, y los umbrales del semáforo, que cambian el color de la cola al instante).
- Los pedidos son los mismos para el administrador y para el alumno: lo que el administrador marca le aparece al alumno en segundos (la app sondea el servidor cada ~15 s y al reenfocar; no es push en tiempo real), y los pedidos que el alumno envía entran solos a esta cola.

7.- Conectar todo con la base de datos:
- Guardar productos, pedidos, pagos y tiempos en PostgreSQL (las 6 tablas).
- Que el backend valide quién es quién (alumno o administrador) con Keycloak + JWT antes de dejar hacer nada.

8.- Sumar las funciones que de verdad descongestionan: número de pedido secuencial (U-00001), pedido programado (ver §13) y el semáforo, más las notificaciones de "tu pedido está listo" (llegan tanto en el teléfono como en el navegador; son avisos LOCALES del sistema que dispara la propia app al detectar el cambio, no push remota con la app cerrada).

9.- Probar con alumnos reales, corregir lo que confunda y dejar todo listo para la demo a la cooperativa. Tras el arranque se le da un periodo de adopción de 1 mes: si en ese mes una buena parte de los alumnos ya pide por la app y baja la congestión del recreo, se considera un éxito y se amplía.

10.- Cooperativa por geolocalización — pedido enrutado a la cooperativa correcta
La app trabaja con varias cooperativas UTC y NO precarga ninguna: detecta la más cercana y la asigna, y enruta el pedido a esa cooperativa.
- Ubicación del usuario con expo-location (permiso en primer plano).
- Cooperativa más cercana por distancia, asignada automáticamente (sin default precargado).
- Tocar el encabezado abre la lista para elegir a mano; es el respaldo si se niega el permiso. No se puede pedir sin cooperativa.
- El panel del administrador también detecta por geolocalización qué cooperativa opera (no viene fija).
- Cada pedido guarda su cooperativa (`orders.branch_id`) y la cola del administrador **puede filtrarse** por ella (`GET /orders/all?branchId=`).

> 🔴 **CORRECCIÓN (auditoría 2026-07-14).** Una versión anterior de esta línea afirmaba que *"pedir en una
> cooperativa y que responda otra **ya no pasa**"* — **y citaba como prueba del arreglo exactamente el
> parámetro que ES la vulnerabilidad.**
>
> **Sí pasa.** El `branchId` **lo manda el cliente** en el query string, y **el backend le cree**:
> ```ts
> // orders.controller.ts:52-58
> @Get('all') @Roles('admin')
> findAll(@Query('branchId') branchId?: string) { … }   // ← dato del CLIENTE
> // order.repository.ts:380
> where: branchId ? { branchId } : {}                   // ← SIN el parámetro: TODAS las cooperativas
> ```
> Y además **`create-order.dto.ts` acepta el `branchId` como texto libre**, sin catálogo: un pedido puede
> cobrarse y **quedar invisible para todas las cocinas**.
>
> **Lo cierra el [Plan 01](../superpowers/plans/2026-07-14-01-cimientos-roles-y-alcance.md)** — el alcance
> saldrá del **JWT**, nunca del request. **Hasta entonces, el defecto está abierto y así se declara.**

11.- Menú inicial de la cooperativa
La aplicación arranca con un menú base pensado para el recreo. La cooperativa puede cambiarlo cuando lo necesite (productos, precios y disponibilidad). Estos son los productos y sus precios:
- Quesadilla de tinga — $38 (se prepara en ~12 minutos)
- Combo estudiante — $50 (se prepara ~13 minutos)
- Hamburguesa de la casa — $65 (se prepara ~15 minutos)
- Papas con queso — $32 (se prepara ~8 minutos)
- Agua de jamaica — $18 (lista para llevar)
- Boneless BBQ — $58 (se prepara ~14 minutos)
- Papas a la francesa — $28 (se prepara ~7 minutos)
- Esquites en vaso — $22 (se prepara ~6 minutos)
- Gelatina de mosaico — $15 (lista para llevar)
- Agua de horchata — $18 (lista para llevar)
Las aguas frescas y la gelatina suelen estar listas para llevar de inmediato; los demás se preparan al momento mostrando su tiempo de espera. Cada producto lleva su foto, que arranca con una imagen provisional y se puede reemplazar.

12.- Semáforo de congestión (parámetros y visibilidad)
El semáforo mide en vivo qué tan cargada está la cooperativa. Lo calcula el backend (no el frontend) como el número de pedidos en cola: los pedidos en estado pending, preparing y ready. No cuentan ready_later, picked_up, not_picked_up ni cancelled.
Umbrales (parámetros ajustables, UMBRAL_AMARILLO = 5 y UMBRAL_ROJO = 10):
- Verde: menos de 5 pedidos en cola (n < 5).
- Amarillo: de 5 a 10 pedidos en cola (5 ≤ n ≤ 10).
- Rojo: más de 10 pedidos en cola (n > 10).
Lo ven los dos perfiles: el administrador con el conteo exacto (para decidir cuándo empujar los pedidos programados) y el cliente con el color y una etiqueta (tranquila / concurrida / llena) para decidir cuándo pedir o recoger. El cálculo usa la hora del servidor.

13.- Pedido programado (anticipación y aviso al negocio)
El cliente puede fijar la hora de recogida al momento de pagar. Reglas, validadas por el backend con la hora del servidor:
- Se programa con mínimo 30 minutos de anticipación y para el mismo día; si no cumple, el pedido se rechaza.
- El sistema calcula la hora de empezar a preparar = hora de recogida − el tiempo de preparación estimado del pedido.
- Cuando llega esa hora, se avisa al negocio (notificación en el dispositivo del administrador) para que empiece; en la cola del administrador esos pedidos suben de prioridad y se marcan con "Empezar ahora".
- Un pedido programado entra al semáforo de congestión solo cuando se abre su ventana (dentro de los ~20 minutos previos a la recogida), no antes, para no inflar la cola.
- Como cualquier pedido, lleva su número secuencial (U-00001) y se sigue en vivo hasta recogerlo.

14.- Número de pedido secuencial
Cada pedido recibe un número correlativo legible al crearse (el primero es U-00001, luego U-00002, y así). Ese número es el código de recogida que ve el cliente y con el que el administrador identifica el pedido en su cola. Lo genera la base de datos, de forma única y en orden.

15.- Inteligencia del negocio (panel del administrador)
En el dashboard del administrador hay una tarjeta "Inteligencia del negocio" con dos indicadores que calcula el servidor sobre los pedidos reales (no el teléfono), solo para el admin:
- Producto más vendido: el que suma más unidades vendidas en todos los pedidos; excluye los cancelados.
- Hora pico: la franja horaria del día con más pedidos (ej. 14:00–15:00), medida en la hora local de la cooperativa (no UTC); excluye cancelados.
Sirve para comprar mejor y reforzar la hora fuerte. Es distinto del semáforo (congestión ahorita, §12) y de los tiempos promedio de preparación (§7): esto es la demanda histórica (qué y cuándo se vende).

16.- Cierre de la propuesta (estado 2026-07-02)
Se completaron los detalles que faltaban para que la app haga TODO lo que dice la propuesta (decisiones D-027…D-034):
- Buscador del menú funcional; estado "Calentando tu alimento" y "preparado hace X min" visibles al alumno.
- La base de datos calcula el TIEMPO PROMEDIO de preparación (últimas 20 muestras; con menos de 3, usa el tiempo base) y la app lo usa para estimar.
- El SEMÁFORO se ajusta desde el panel del admin y ese ajuste se guarda en el servidor, así que también cambia el que ve el alumno.
- MÉTRICAS del negocio: producto más vendido y hora pico. AUTO-VENCIMIENTO de la ventana de recogida (pasa a "no recogido" solo).
- ACCESIBILIDAD que de verdad aplica (texto grande, alto contraste, reducir movimiento). FOTO del producto editable por URL.
- La SUCURSAL de recogida viaja con el pedido y se guarda. El acceso de ADMINISTRADOR exige MFA (TOTP) de forma obligatoria.
- PAGO CON TARJETA: formulario real (número, titular, expiración y CVV; solo guarda los últimos 4) con aprobación SIMULADA, protegida por un CIRCUIT BREAKER. En la demo el número valida el formato (13–19 dígitos), no el checksum de Luhn.

17.- Métodos de pago (qué es real en esta versión)
El checkout ofrece cinco métodos: Mercado Pago, PayPal, Tarjeta de crédito (TDC), Tarjeta de débito (TDD) y Efectivo al recoger. HONESTO: el cobro con tarjeta/online es SIMULADO — no hay integración real con Mercado Pago, PayPal ni procesador de tarjeta (no se mueve dinero de verdad).
- Tarjeta (TDC/TDD): formulario real, guarda solo los últimos 4, aprobación simulada + circuit breaker; se pueden guardar en "Mi cartera".
- Mercado Pago / PayPal: se registran como método (correo/titular + referencia); cobro real diferido.
- Efectivo al recoger: el único real — se cobra en el mostrador al entregar (hasta entonces el pago queda pendiente).
Las pasarelas reales quedan fuera del alcance de la demo (trabajo futuro; ver decisiones D-006/D-033).

18.- Inventario real — "stock de dark kitchen" (D-037)
El stock de cada producto son unidades físicas disponibles ahora (almacenadas o excedente ya preparado) y el ciclo del pedido lo mueve solo, en el servidor y transaccional (nunca baja de 0). Regla de dark kitchen: el 0 NO impide vender, porque la cooperativa no prepara sin orden y cocina al momento; el candado de venta es que el producto esté disponible (isAvailable), no el número.
- Al ACEPTAR (por preparar → preparando): aparta lo que haya, stock = máx(0, stock − cantidad); el faltante se cocina al momento.
- Al ENTREGAR (recogido): sin cambio (ya se apartó al aceptar).
- NO RECOGIDO (por el admin, o por vencimiento automático de un pedido LISTO que supera su ventana de ~20 min) y CANCELACIÓN de un pedido YA LISTO: devuelve como excedente reofertable, stock = stock + cantidad.
- Cancelar un pedido PENDIENTE: sin cambio (nunca se apartó).
Ejemplo: horchata almacenada 12 → aceptas 1 → 11 → entregado 11; si no se recoge vuelve a 12. Hamburguesa 0 (se cocina) → aceptada 0 → no recogida 1 (excedente) → reofertada y vendida 0, o queda 1 para mañana. Decisión honesta: el stock sube solo cuando una unidad preparada queda sin reclamar (no "al empezar a prepararla"), para no venderla dos veces; las transiciones se serializan con bloqueo de fila (FOR UPDATE) para que peticiones simultáneas no doble-cuenten. Matiz: el vencimiento automático solo alcanza pedidos LISTOS; un pedido EXTENDIDO (ready_later) libera su stock por acción del admin o por cancelación del cliente (barrido de fin de día = trabajo futuro). El min/máx siguen siendo etiquetas del admin (sin reorden automático todavía).

---

## 19. Implementación técnica (2026-06-24)

### 19.1 Infraestructura

- **Orquestación de contenedores:** Docker + Docker Compose. PostgreSQL 16 y Keycloak 26 se ejecutan como servicios containerizados en el entorno de desarrollo local; en producción se despliegan en infraestructura cloud o dedicada.
- **Base de datos:** PostgreSQL 16. Esquema: 6 tablas (`user_profile`, `products`, `orders`, `order_items`, `payments`, `preparation_times`) + 5 enumerados (`user_role`, `order_status`, `product_status`, `payment_method`, `payment_status`). Control de versión de esquema mediante **migraciones TypeORM** (`backend/src/infrastructure/database/migrations/1782168106072-Init.ts`), evitando sincronización automática (`synchronize: false`). Datos de demostración se cargan mediante script SQL (`seed-demo.sql`).
- **Servidor de identidad:** Keycloak 26. Realm: `utc-food`. Roles: `admin` (administrador de cooperativa), `user` (cliente/alumno). Autenticación del administrador: credenciales locales (sin federación externa), con MFA activado (TOTP). Autenticación del cliente: auto-registro restringido a dominio institucional (`@edu.utc.mx`), validación en backend.

### 19.2 Frontend — Expo + React Native

**Stack:**
- Expo SDK 56 (managed build, compatible con Expo Go para demostración).
- React Native 0.85.3, React 19.2.3.
- TypeScript (tipificación estática; verificación con `npx tsc --noEmit`).

**Arquitectura:** Feature-Sliced Design (FSD).
- `app/` — configuración global, navegación de alto nivel (`RootNavigator`).
- `pages/` — pantallas principales (Welcome, Login, Home, Orders, Profile, Admin Dashboard).
- `widgets/` — componentes de UI complejos reutilizables (`AuthScaffold`, etc.).
- `features/` — funcionalidad por caso de uso (auth, órdenes, carrito).
- `entities/` — modelos de datos del dominio.
- `shared/` — utilidades compartidas (API client, sistema de diseño, helpers).

**Librerías clave:**
- React Navigation 7 (navegación native-stack + bottom-tabs).
- Zustand (gestión de estado).
- expo-font (tipografías de marca).
- lucide-react-native (iconografía).
- react-native-safe-area-context (adaptación de insets de pantalla).

**Identidad visual:** Tipografías de marca (Bricolage Grotesque, Plus Jakarta Sans, Space Mono) gestionadas por `expo-font` con fallback resiliente (timeout 6 s). Sistema de tokens en `shared/theme/tokens.ts`; primitivas reutilizables en `shared/ui/Type.tsx` (Display, Heading, Title, Body, Label, Mono).

**Ejecución:**
```bash
cd frontend
npm install
npx expo start       # inicia Metro; QR para Expo Go o "w" para navegador
```

### 19.3 Backend — NestJS + TypeORM

**Stack:**
- NestJS 11 (framework backend con arquitectura modular).
- TypeORM 1.0 (ORM para PostgreSQL).
- TypeScript (tipificación estática).

**Arquitectura:** Clean Architecture (capas).
- `presentation/` — controllers, módulos NestJS, guards, decoradores.
- `application/` — servicios de negocio, DTOs.
- `infrastructure/` — acceso a datos (TypeORM repositories), Keycloak Admin API.
- `domain/` — tipos puros del dominio.

**Seguridad:**
- Validación de entrada: `class-validator` + `ValidationPipe` global (`whitelist: true`, `forbidNonWhitelisted: true`).
- Autenticación: JWT emitido por Keycloak, validado por `passport-jwt` + `jwks-rsa` (verificación de firma RS256).
- Autorización: guards globales `JwtAuthGuard` + `RolesGuard`. Decoradores `@Public()` (auth, health) y `@Roles()` para control de acceso.
- Rate limiting: 5 req/min en auth, 60 req/min default. Respuesta HTTP 429 cuando se excede.
- MFA: requerido para login del administrador (TOTP de Keycloak).

**Rutas principales:**
- `POST /auth/register` — registro de cliente (validación @edu.utc.mx).
- `POST /auth/login` — login de cliente.
- `POST /auth/admin/login` — login de administrador (exige TOTP).
- `GET /auth/me` — identidad del JWT (protegida).
- `GET /health` — estado del servicio y conexión a BD.
- Rutas CRUD (productos, órdenes) protegidas por rol.

**Ejecución:**
```bash
cd backend
npm install
cp .env.example .env
npm run migration:run      # aplicar esquema (idempotente)
npm run start:dev          # inicia en puerto 3002 (watch mode)
```

### 19.4 Orchestración local (desarrollo)

Secuencia de arranque:

1. **Infraestructura:** `cd infra && docker compose up -d && ./keycloak/seed-admin.sh`
   - Postgres y Keycloak en red interna; `seed-admin.sh` configura admin + service-account.
2. **Backend:** `cd backend && npm install && npm run migration:run && npm run start:dev`
   - Crea esquema; escucha en puerto 3002.
3. **Frontend:** `cd frontend && npm install && npx expo start`
   - Inicia Metro; disponible en Expo Go (QR) o navegador.

**Invariantes de configuración:**
- `infra/.env` y `backend/.env` deben ser consistentes en variables `DB_*` y `KEYCLOAK_*`.
- `KEYCLOAK_BACKEND_CLIENT_SECRET` en backend = `BACKEND_CLIENT_SECRET` en infra.
- Backend escucha en puerto 3002 (configurable en `backend/.env`).

### 19.5 Estructura del repositorio

Raíz oficial: `/home/emmanuel/projects/UTC` (contiene `.git`, `.gitignore`, `.githooks`).

```
UTC-Proyecto/
├─ frontend/            — Expo + React Native
├─ backend/             — NestJS + TypeORM
├─ infra/               — Docker Compose, inicialización
├─ brand/               — Activos de marca (logo HQ)
└─ docs/                — Documentación (organizada por temas)
    ├─ propuesta/       — círculo de innovación, ejecución
    ├─ arquitectura/    — especificación técnica, decisiones
    ├─ datos/           — esquema, datasets de demo
    ├─ operacion/       — runbooks
    ├─ historico/       — regresiones, reportes
    └─ superpowers/     — plans, specs, rules
```

**Gestión de secretos:** `.env` (valores reales) y `node_modules/`, `dist/`, `pgdata/` están en `.gitignore`. Solo se versionan `*.env.example` como referencias.

### 19.6 Distribución de la aplicación

**Desarrollo:** Expo Go (demostración interactiva via QR o USB+adb).

**APK de Android:**
```bash
npx expo prebuild --platform android
npx eas build --platform android       # requiere cuenta EAS
```
Alternativa: compilación local con Android SDK (`./gradlew assembleDebug`).

**Producción:** Google Play Store (fuera del alcance de esta versión).

**Web:** `npx expo start --web` — aproximación funcional para navegador, limitaciones en flujos OAuth y UI nativa.

### 19.7 Verificación pre-commit

Antes de cambios en ramas principales:
- **Frontend:** `npx tsc --noEmit` (sin errores de tipo), `npx expo export --platform android` (validar bundle).
- **Backend:** `npm run build`, `npm run lint` (verificar sintaxis y calidad).
- **Integración:** `curl http://localhost:3002/health` → respuesta `{status, db}`; login cliente/admin → tokens válidos.

---

**Puerto del backend:** 3002 (especificado en `backend/.env`; `PORT=3002`).

---

## 20. Ampliación del alcance (2026-07-14) — la cooperativa como negocio

Hasta la sección 19, la aplicación resolvía **la fila**: pedir sin moverse, recoger con turno, y que la
cooperativa cocine con orden. Esta ampliación resuelve una pregunta distinta y más difícil:
**¿la cooperativa está ganando dinero, y quién es responsable de cada peso?**

El detalle de cada frente vive en `docs/superpowers/`. Aquí va el algoritmo, en el orden en que se ejecuta.

### 20.1 Las cuatro personas de la cooperativa

Hasta ahora había **dos** roles (`user`, `admin`). Una cooperativa real la operan **tres personas más el
administrador**, y **cada una ve solo lo suyo**:

| Rol | Mueve el pedido | Ve el dinero | Ve al cliente | Ve los costos |
|---|---|---|---|---|
| 🍳 **cocina** | ✅ acepta y marca listo | ❌ | ❌ *(solo el código `#U-00042`)* | ❌ |
| 📦 **inventario** | ❌ | ❌ | ❌ | ✅ **es su trabajo** |
| 💵 **mostrador** | ✅ entrega | ✅ **cobra y da cambio** | ✅ | ❌ |
| 🛡️ **admin** | ✅ | ✅ | ✅ | ✅ *(de **su** cooperativa)* |

**El principio:** *cada transición la dispara quien tiene la información.* El cocinero es el único que sabe
que la hamburguesa ya salió; el de mostrador es el único que sabe que el cliente ya está enfrente con el
dinero.

**Y la regla dura:** cada persona está **anclada a UNA cooperativa**, y esa pertenencia **viaja dentro de
su credencial**. El servidor **jamás** le pregunta al dispositivo de qué sucursal viene.
*(Hoy sí lo hace — y eso permite que el mostrador de una sucursal lea los pedidos de otra. Es el primer
defecto que cierra esta ampliación.)*

### 20.2 Fuente única de la verdad (backend ↔ app)

Se detectaron **25 duplicaciones** de lógica entre el servidor y la aplicación — incluida **la fórmula del
precio a cobrar**, escrita en los dos lados. El carrito podía mostrar un total y la caja cobrar otro.

**La solución no es generar código:** es que la aplicación **lea los contratos del servidor
directamente**, de forma que **si el servidor cambia un campo, la aplicación deja de compilar**. No hay
paso de generación que alguien pueda olvidar, porque no hay nada que generar.

### 20.3 Seguridad a nivel de fila (RLS)

Se **probó experimentalmente** que activar Row Level Security con la configuración actual **no protegería
nada**: la política más restrictiva que existe seguía devolviendo todas las filas, porque la aplicación se
conecta a la base como **superusuario**.

**Por eso el orden importa más que la medida:** primero se cierra el defecto en la aplicación, después se
le quitan los privilegios de superusuario a la base, y **solo entonces** se escriben las políticas. Una
seguridad que miente es peor que no tenerla.

### 20.4 Inventario, costos y ganancia

El encargado registra **lo que compra con su costo real** (*"3 kg de carne, $150"*). El sistema deriva el
**costo por gramo** y, con la receta de cada producto, **cuánto cuesta cada platillo**. Tres piezas hacen
que el número sea verdad:

1. **El rendimiento.** 3 kg de carne **con hueso** no dan 3 kg útiles. Sin esto, **el costo siempre queda
   por debajo del real**.
2. **El IVA (16 %).** La comida preparada lo causa, *incluso para llevar*. De $65 de menú, la cooperativa
   **se queda con $56.03**.
3. **El costo se congela en el pedido.** Una compra de mañana **no puede cambiar el margen de ayer**.

**Y el menú se ajusta solo:** si se acaba el pan, **la hamburguesa sale del menú** — diciendo exactamente
qué falta.

### 20.5 Efectivo, caja y factura

El alumno **declara con qué billetes y monedas paga**; el servidor calcula el cambio y **apaga las
denominaciones imposibles**. Mostrador **abre la caja con un fondo**, el sistema registra cada pieza que
entra y sale, y **al cerrar hace el corte**: lo contado contra lo esperado, con la diferencia registrada y
**un responsable**.

Quien quiera factura lo indica **en su perfil** y llena una sola vez sus datos fiscales; el sistema produce
el **layout para timbrar un CFDI 4.0** (no lo timbra: eso lo hace un proveedor autorizado).

### 20.6 Orden de ejecución

```txt
1. CIMIENTOS   roles + alcance por cooperativa   ← cierra el defecto de autorización.
                                                    Vale aunque nada más se construya.
2. SSOT        matar las 25 duplicaciones        ← en buena parte, BORRA código
3. RLS         quitar el superusuario, y después las políticas
4. INVENTARIO  materia prima, costos, rendimiento, ganancia, disponibilidad derivada
5. EFECTIVO    desglose, caja, corte, ticket, layout CFDI
6. RECETAS     el panel por alimento + las alertas de inventario
```

**El paso 1 no se puede saltar:** el efectivo lo cobra *mostrador* y los costos los lleva *inventario*.
Sin los roles, los pasos 4 y 5 no tienen dueño y habría que construirlos dos veces.
