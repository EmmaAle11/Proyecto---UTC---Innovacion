# Círculo de innovación — UTC Pick Sazón

> **Pide fácil, recoge con sabor.** Documento **fuente** del círculo de innovación de la app de cooperativa / dark kitchen escolar UTC, modalidad **Pick Up** (sin envíos). Recorre las fases: **Ocurrencia → Idea → Propuesta → Implementación → Valor agregado → Adopción**.
>
> - Aquí viven el **alcance** y las **reglas de negocio**. El **algoritmo de implementación** está en [`Algoritmo-ejecucion.md`](Algoritmo-ejecucion.md); el detalle técnico en [`architecture-propuesta.md`](../arquitectura/architecture-propuesta.md); las decisiones en [`decisiones.md`](../arquitectura/decisiones.md).
> - La **Propuesta consolidada** (§3.1) reúne, en cortito, todo lo que tendrá la app (lado alumno + panel de admin).

---

## 1. Ocurrencia

### 1.1. Primera vuelta *(2026-06)* — "hay que matar la fila"

- Resolver el problema de **congestión** en la cooperativa.
- Implementar **tecnologías** en la cooperativa.
- Crear una **app móvil intuitiva**.
- Agregar una **fila por turnos**.
- **Semáforo de congestión** / pedir para después.
- **Programar tu pedido**.

### 1.2. Segunda vuelta *(2026-07)* — "¿y la cooperativa, gana o no gana?"

> **Un círculo de innovación da vueltas.** Con la primera ya resuelta y funcionando, al ver la cooperativa
> operando aparecieron **ocurrencias nuevas** — y todas nacen de la misma pregunta incómoda: *la app ya
> ordena la fila… pero **¿la cooperativa está ganando dinero, y quién responde por cada peso?***
>
> *Ocurrencias del equipo realizador.*

- **¿Y si el alumno arma su comida a su gusto?** Que le quite la lechuga, que le ponga el aderezo que
  quiera — y que **lo que pida llegue tal cual a la cocina**, sin que nadie tenga que gritar nada.
- **¿Y si el que paga en efectivo dice de antemano con cuánto va a pagar?** *"Voy con 2 billetes de $50,
  2 de $20 y 2 monedas de $5."* Así **el del mostrador ya tiene el cambio listo** antes de que el alumno
  llegue — y eso también es fila que se mata.
- **¿Y si el sistema supiera cuánto GANA la cooperativa, y no solo cuánto vende?** Vender mucho y ganar
  poco es el error clásico de una cooperativa escolar. **Vender ≠ ganar.**
- **¿Y si el inventario se llevara con el costo real de lo que se compra?** *"3 kilos de carne, $150"* —
  y de ahí el sistema saca **cuánto cuesta cada hamburguesa**.
- **¿Y si el propio sistema quitara del menú lo que ya no se puede preparar?** Si se acabó el pan, que la
  hamburguesa **desaparezca sola**, en vez de que el alumno la pida y se lleve el chasco.
- **¿Y si la caja cuadrara al final del día?** Que se sepa **cuánto debería haber** en el cajón, cuánto
  hay de verdad, y **quién responde por la diferencia**.
- **¿Y si cada persona de la cooperativa viera solo lo suyo?** Porque **no la opera una persona: la operan
  tres.** El que cocina no tiene por qué ver el dinero; el que cobra no tiene por qué ver los costos.
- **¿Y si se pudiera facturar?** Para el maestro o el trabajador que necesita comprobante.
- **¿Y si supiéramos qué insumo subió de precio esta semana?** Para negociar con el proveedor **antes** de
  que el margen se caiga solo.

---

## 2. Idea

Crear una aplicación web/móvil amigable (p. ej. con Expo Go o framework similar) para una empresa tipo **dark kitchen** que permita pagos con tarjeta. La empresa mantiene un **mínimo y máximo** de productos con la etiqueta **"Preparados"**.

- Pagos con tarjeta mediante plataformas como **PayPal** y **Mercado Pago** *(en esta versión el cobro es **simulado**; integración real diferida — ver §3.17)*.
- La aplicación se enfoca **únicamente en la compra** de productos — **no** es un sistema de envíos.
- Funciona bajo modalidad **Pick Up**: recoger en tienda.
- Cada producto indica un **tiempo de espera** preestablecido.
- **PostgreSQL** para almacenar información y calcular **tiempos promedio** de preparación.
- Campos mínimos indispensables con estructura primaria usando **Primary Key** y **Foreign Key**.
- **Pop-ups** y **notificaciones** sobre el estado de preparación del pedido *(notificaciones **locales** del sistema, disparadas por la app al detectar el cambio — no push remota con la app cerrada; detalle y alcance en §3.4)*.
- Una vez listo, el pedido debe recogerse en ~**10 a 20 minutos**; de lo contrario podrá volver a ofertarse con la tag "Preparados".
- Estados de producto: *por preparar* (con tiempo estimado de espera) y *preparado* (listo para recoger).
- Mostrar **cuánto tiempo lleva preparado** cada producto.
- **Número de pedido** — cada pedido trae un **número secuencial** (el primero es **U-00001**, el siguiente U-00002, y así) que es a la vez tu **código de recogida**. Con ese número en tu celular **no te acercas antes de tiempo**, evitando la congestión en la ventanilla.
- **Programar tu pedido** — pides con anticipación y recoges a la hora justa, tomando desde antes tu número de pedido. 
- **Semáforo de congestión** — aunque existan los turnos, siempre habrá muchos pedidos, así que un semáforo en vivo detecta cuántos hay en cola: **menos de 5 = Verde**, **de 5 a 10 = Amarillo**, **más de 10 = Rojo** (se detalla en §3.14).

### 2.2. Segunda vuelta *(2026-07)* — la cooperativa como negocio

Cada ocurrencia de §1.2, ya aterrizada. *(Ideas del equipo realizador; el detalle técnico, en §3.17-bis–§3.23.)*

**Personalizar el alimento** — *de la ocurrencia "que arme su comida a su gusto"*
- Cada producto se descompone en sus **"ramas"**: los insumos que lo forman.
- Tres clases: **BASE** (el pan, la carne — no se quitan), **ESTÁNDAR** (la lechuga, la mayonesa — vienen, pero se pueden quitar) y **EXTRA** (el tocino, el aderezo — no vienen, pero se pueden poner).
- Más una **nota libre** para lo que ninguna casilla cubre.
- Lo que el alumno elige **se congela en el pedido**: si mañana se renombra un insumo, **el ticket viejo no cambia**.

**Stock de insumos — el menú se cuida solo** — *de "que quite del menú lo que ya no se puede hacer"*
- El insumo **no es una porción: es una cantidad con unidad** (gramos, mililitros, piezas). **Nunca kilos ni litros** — esas son unidades de *compra*, no de medida.
- La receta guarda **cuánto gasta** de cada insumo (130 g de carne), no un "sí lleva carne".
- El sistema calcula **cuántas unidades puede preparar** de cada producto, y **le dice al encargado qué falta**: *"Te quedan 4 hamburguesas — te falta pan."*
- **Alertas** cuando un insumo baja de su mínimo, se agota, o está por caducar.

**Fuente de ingreso — saber cuánto se gana, no cuánto se vende** — *de "vender ≠ ganar"*
- El encargado registra **la compra con su costo real** ("3 kg, $150") → el sistema saca **el costo por gramo**.
- **El rendimiento**: 3 kg de carne **con hueso** no dan 3 kg útiles. Lo que se tira **se paga igual**, y si no se cuenta, **el costo siempre sale por debajo del real**.
- **El IVA**: la comida preparada causa **16 %**, incluso para llevar. De $65 de menú, **la cooperativa se queda con $56.03**; el resto es del SAT. **La ganancia se mide contra los $56.03.**
- **El costo se congela en el pedido**: una compra de mañana **no puede cambiar el margen de ayer**.
- **Histórico de precios**: qué subió y qué bajó, semana a semana — ordenado **por impacto**, no por porcentaje. *(Que la nuez suba 40 % da igual si gastas 5 g al mes. Que el pan suba 8 % sí duele.)*

**Reoferta — rescatar, no rematar** — *replanteo de la reoferta ya existente (§3.11)*
- Cuando algo **ya preparado** no se recoge, **los insumos ya se gastaron**. La alternativa **no es venderlo a precio normal** — esa venta ya fracasó. **La alternativa es la basura.**
- Por eso el panel se lo dice a mostrador así: *"Recuperaste $43 que se iban a la basura."*
- **Pero con un piso**, y no es el costo: es **no enseñarle al alumno a esperar el descuento**.

**Efectivo con desglose y caja** — *de "que diga con cuánto va a pagar"*
- El alumno elige **los billetes y las monedas** con los que va a pagar; el sistema **calcula el cambio** y **apaga las denominaciones imposibles**.
- Mostrador **abre el día con un fondo**, el sistema **registra cada pieza que entra y sale**, y al cerrar **hace el corte**: lo contado contra lo esperado, con la diferencia registrada.

**Roles — tres personas, no una** — *de "que cada quien vea solo lo suyo"*
- 🍳 **cocina** (acepta y termina) · 📦 **inventario** (materia prima, costos, ganancia) · 💵 **mostrador** (cobra, caja, entrega, reoferta, factura) · 🛡️ **admin** del plantel.
- **Cada transición la dispara quien tiene la información**: el cocinero es el único que sabe que la hamburguesa salió; el de mostrador, el único que sabe que el alumno ya está enfrente con el dinero.
- **Cada persona pertenece a UNA cooperativa**, y eso **lo decide el servidor, no el teléfono**.

**Facturación** — *de "que se pueda facturar"*
- El alumno dice **en su perfil** si quiere factura y llena **una sola vez** sus datos fiscales.
- El sistema arma **el paquete de datos para timbrar un CFDI**; **no timbra** — eso lo hace un proveedor autorizado.

---

## 3. Propuesta

### 3.1. Propuesta consolidada

Todo lo que hará, **todo lo que hará UTC Pick Sazón** — juntando la idea original con las mejoras que se nos ocurrieron para de verdad acabar con las filas del recreo.

**Para el alumno:**

- Entrará con su **correo institucional** (`@edu.utc.mx`), sino tiene cuenta registrada en la app deberá crear una, cuando acceda verá el **menú con fotos**, precios y, lo mejor, **cuánto vas a esperar** por cada cosa. Lo que ya está hecho aparece como *Listo para llevar*.
- Arma su pedido, elige cómo pagar (Mercado Pago, PayPal, tarjeta (TDC o TDD) o **efectivo al recoger**) y lo manda a la cocina **sin moverse de tu lugar**.
- Puede **programar su pedido** para que esté listo justo cuando salga (ej. "lo quiero a las 10:00") — así llega y ya está.
- Cuando esté listo llega una **notificación** (en el teléfono o en el navegador) con su **número de pedido**: con ese número en el celular **no se acerca antes de tiempo**, y se acaba el amontonamiento en la ventanilla.
- Sigue su pedido en vivo (Pagado → En preparación → Listo → Recogido) y lo recoge mostrando su **código de recogida** (el número secuencial, ej. **U-00001**).
- Antes de pedir puede echarle un ojo al **semáforo de la cooperativa**: 🟢 verde = hay poca fila, 🟡 amarillo = va concurrido, 🔴 rojo = está a tope. Así decide si pide ya o se espera un toque (ver §3.14).
- ¿No alcanzaste a recogerlo? Puede **cancelar** o **extender para después**; si lo dejas, el alimento se puede **reofertar** como *Preparado | Sin tiempo de espera*.

- **Personaliza su comida** (nuevo, §3.18): quita la lechuga, quita el jitomate, agrega el aderezo mango habanero — y deja una **nota** si hace falta ("no quiero ningún aderezo"). Lo que elija llega tal cual a la cocina.
- **Si paga en efectivo, dice con qué va a pagar** (nuevo, §3.19): elige los billetes y las monedas ("2 de $50, 2 de $20 y 2 monedas de $5"). El sistema le dice **cuánto cambio va a recibir**, y quien está en el mostrador ya lo sabe antes de que llegue.
- **Si quiere factura, lo dice en su perfil** (nuevo, §3.21) y llena sus datos fiscales una sola vez.

**Para la cooperativa — ahora son CUATRO personas, no una (§3.17-bis):**

Una cooperativa la operan **tres personas más el administrador**, y cada una ve **solo lo suyo**:

- 🍳 **Cocina** — acepta los pedidos y los marca listos. Ve **qué preparar**, con las personalizaciones y las notas. **No ve dinero, ni precios, ni el nombre del cliente** (BR-014).
- 📦 **Inventario** — registra la **materia prima** con su **costo real** ("3 kg de carne, $150"), lleva las recetas, las mermas y el conteo físico. **El sistema deriva del stock qué productos se pueden vender**: si se acaba la carne, la hamburguesa sale del menú sola.
- 💵 **Mostrador** — cobra, **da el cambio contra una caja real**, entrega, re-oferta lo que no se recogió, genera el **layout de la factura** y **hace el corte del día**.
- 🛡️ **Administrador del plantel** — todo lo de su cooperativa: menú, precios, métricas y personal. **Nunca otra cooperativa.**

**Para la cooperativa (panel de admin):**

- Da de alta y edita el **menú** (productos, precios, fotos, stock mínimo/máximo de "Preparados").
- Marca los pedidos como **listos**, y eso dispara el **aviso** al alumno (con su número de pedido).
- Ve el **semáforo de congestión en vivo** según la cola (pedidos pendientes + en preparación + listos esperando): 🟢 **Verde (menos de 5)**, 🟡 **Amarillo (de 5 a 10)**, 🔴 **Rojo (más de 10)** — con el **número exacto** para leer cómo viene el recreo y, si hace falta, empujar el **pedido programado** para repartir la llegada. Ese mismo semáforo lo ve también el alumno (ver §3.14).
- Aprovecha la **reoferta / "Pon tu precio"** para vender lo que ya está hecho antes de perderlo.
- Con el tiempo, ve **qué se vende más y a qué hora pega el pico** en el panel **"Inteligencia del negocio"** (ver §3.16), para comprar mejor y reforzar la hora fuerte.
- Trabaja sobre **los mismos pedidos que el alumno**: lo que marca (En preparación, Listo, Entregado) le aparece al alumno **en segundos** (la app **sondea** el servidor cada ~15 s y al reenfocar la pantalla; no es push en tiempo real), y los pedidos que el alumno manda caen solos en su cola. Nadie ve cosas distintas.
- Maneja su **cuenta**: puede **cerrar sesión** y ajustar opciones de **accesibilidad** (texto más grande, más contraste) y de **personalización** (su sucursal, los números del semáforo, su horario).

En una frase: **pides desde tu lugar, te avisan con tu turno y recoges sin fila** — y la cooperativa cocina con orden y vende mejor.

### 3.2. Tecnologías a utilizar

| Capa | Tecnologías |
| --- | --- |
| **Frontend** | Expo Go · TypeScript · Tailwind / NativeWind · Arquitectura **FSD** |
| **Backend** | NestJS · TypeScript · Controllers · Services · **TypeORM** |
| **Base de datos** | PostgreSQL · Docker (corre **local** vía Docker) |
| **Autenticación** | Keycloak · Docker (corre **local** vía Docker) |

> **Cómo se prueba en teléfono (Expo) — versión de prueba solo Android.** La app corre en **Expo Go** (desarrollo) y en **web**, pero **Expo Go SDK 53+ removió las notificaciones del SO**; para que salgan las notificaciones se genera un **development build** propio con EAS. Ese build de prueba es un **APK de Android**, así que la versión instalable de prueba es **solo para Android** (un **iPhone no instala APKs**). Para iPhone haría falta un **build de iOS** distribuido por **TestFlight** (o ad-hoc por UDID), que requiere **cuenta de Apple Developer (~$99/año)**; alternativamente el iPhone puede correr la app por **Expo Go** (túnel) para ver el flujo, pero **sin notificaciones** (misma limitación). Nota: el **túnel** (cloudflared/Expo) funciona igual en Android e iOS — la restricción es de **formato/distribución del instalable**, no del túnel.

**Tablas principales:** `users` · `products` · `orders` · `order_items` · `payments` · `preparation_times`.

**Seguridad — medidas principales:**

- **JWT** para autenticación.
- **Roles** para permisos.
- **DTO Validation** para validar inputs.
- **Rate limiting** para evitar abuso.
- **MFA** para administradores.
- **Circuit breaker** para pagos.

### 3.3. Flujo general del sistema

```txt
Usuario → App Expo Go / Panel usuario → Backend NestJS → PostgreSQL
Admin   → App Expo Go / Panel Admin   → Keycloak (con MFA) → Backend NestJS → PostgreSQL
```

### 3.4. Flujo de pedido

```txt
Usuario inicia sesión
  → selecciona producto (Preparado o con tiempo de espera)
  → revisa tiempo estimado
  → confirma pedido
  → realiza pago
  → backend registra el pedido (le asigna su número secuencial, ej. U-00001)
  → la dark kitchen prepara el producto
  → admin cambia estado a "Listo para recoger" (y se dispara el aviso al alumno)
  → usuario recibe notificación con su número de pedido
  → usuario recoge el pedido con su código
```

### 3.5. Estados del pedido

- Pendiente
- En preparación
- Listo para recoger
- Recogido
- No recogido
- Cancelado
- Listo para recoger después

### 3.6. Estados del producto

- Por preparar
- Preparado, listo para recoger
- Preparado | Sin tiempo de espera
- Calentando tu alimento
- No disponible

### 3.7. Manejo de productos preparados

La cooperativa mantiene un **mínimo y máximo** de productos con etiqueta "Preparados". Estos productos pueden mostrarse como:

> **Preparado | Sin tiempo de espera** — el producto ya está listo y puede recogerse casi de inmediato.

El sistema también muestra **cuánto tiempo lleva preparado** cada producto, para que el administrador decida sobre su venta, reoferta o cambio de estado.

#### Inventario real: "stock de dark kitchen" (D-037)

El `stock` de cada producto son **unidades físicas disponibles ahora** para nuevos pedidos (ya sea porque están **almacenadas** —las bebidas, gelatinas— o porque son **excedente ya preparado**). Es un stock tradicional que **el ciclo de vida del pedido mueve solo**, con una regla propia de *dark kitchen*: **el `0` NO impide vender**, porque la cooperativa **no prepara sin orden** y cocina al momento. El candado real de venta es que el producto esté **disponible** (`isAvailable`), no el número de stock.

El inventario cambia **automáticamente y en el servidor** (transaccional, nunca baja de 0) en estas transiciones:

| Momento | Efecto en el stock | Por qué |
|---|---|---|
| **El admin acepta** el pedido (`por preparar → preparando`) | **Aparta** lo que haya: `stock = máx(0, stock − cantidad)` | Reserva del almacén lo disponible; el faltante se **cocina al momento** (no baja de 0). |
| **Se entrega** (`recogido`) | Sin cambio | Ya se apartó al aceptar; el alumno solo recoge. |
| **No se recoge** (`no recogido`: por el admin, o por **vencimiento automático** de un pedido **listo** que supera su ventana de ~20 min) | **Devuelve** como excedente: `stock = stock + cantidad` | Lo preparado y no reclamado queda **reofertable** (§3.11). |
| **El alumno cancela** un pedido **ya listo** | **Devuelve** como excedente: `stock = stock + cantidad` | El alimento no fue tocado → vuelve a estar disponible. |
| **El alumno cancela** un pedido **pendiente** | Sin cambio | Nunca se apartó. |

**Ejemplos con datos reales.** *Agua de horchata* (almacenada, stock 12): se acepta un pedido de 1 → 11; se entrega → 11; si no se recoge → **vuelve al 12** (no se inventa una unidad). *Hamburguesa* (stock 0, se cocina al momento): se acepta → sigue en 0 (se cocina); si **no se recoge** → **1** (excedente); al **reofertarse** y venderse → 0, y si no se vende **queda 1 para mañana**.

> **Decisión de diseño (honesta):** el stock sube **solo cuando una unidad preparada queda sin reclamar**, no "al empezar a prepararla" — así una unidad en preparación (ya apartada para un cliente) nunca se muestra como libre y **no se puede vender dos veces**. Todas las transiciones que mueven el stock están **serializadas con un bloqueo de fila** (dos "Aceptar" simultáneos no doble-descuentan; una entrega y un vencimiento no se pisan). El **mínimo/máximo de stock** siguen siendo etiquetas que el admin edita (`max ≥ min`); **no** disparan reórdenes ni alertas automáticas todavía (eso queda como trabajo futuro). **Matiz honesto del vencimiento automático:** el barrido automático solo vence pedidos en estado **listo** (`ready`) que superan su ventana; un pedido **extendido** (`ready_later`, §3.10) **no** se vence solo — su stock se devuelve cuando el **admin** lo marca "no recogido" o el **cliente** lo cancela (un barrido de fin de día para los extendidos queda como trabajo futuro). Lo funcional hoy: el descuento/devolución de stock del ciclo, la etiqueta "Preparado | Sin tiempo de espera", el "hace X min preparado", el cambio de estado y la **reoferta** (§3.11).

### 3.8. Caso: alumno no recoge su pedido

- El sistema considera que la orden estará lista en un **máximo aproximado de 10 a 15 minutos**.
- Una vez lista, el alumno tiene un margen aproximado de **10 a 20 minutos** para recogerla.
- Si no la recoge dentro de ese tiempo, la app muestra una confirmación:

> *Tu pedido está listo desde hace varios minutos.*
> *¿Deseas cancelar tu orden o extender tu tiempo para recogerla después?*
>
> Opciones: **Cancelar orden** · **Extender para después**

### 3.9. Si el alumno cancela

El alimento puede volver a ofertarse con la etiqueta **Preparado | Sin tiempo de espera**, porque no fue tocado por el cliente y puede venderse como producto preparado.

Si el alimento lleva demasiado tiempo preparado, el indicador deja de mostrarse como *Preparando tu alimento* y pasa a:

> **Calentando tu alimento** — comunica que el alimento ya estaba preparado y solo será calentado para entregarse.

### 3.10. Si el alumno extiende su tiempo

- Si elige recoger después, el pedido queda marcado como **Listo para recoger después**.
- El alumno podrá recogerlo dentro del **horario disponible del mismo día**.
- Si al final del día no lo recoge, el pedido pasa a **No recogido** y el alimento queda para manejo interno del local. Sobre el dinero: si pagó con **tarjeta/online** ya está **cobrado** (pago simulado en esta versión); si eligió **efectivo**, no se cobró (el pago queda **pendiente**, porque el efectivo se cobra al entregar).

### 3.11. Reoferta y precio dinámico

Para evitar que los alimentos preparados se queden sin vender, el sistema puede incluir una opción de **reoferta**. Si un producto lleva cierto tiempo preparado, el administrador puede activar una dinámica tipo:

> **Pon tu precio** — o aplicar un **descuento controlado**.

La finalidad es vender el producto **antes de perderlo**, aunque sea con menor ganancia.

### 3.12. Cooperativa por geolocalización — el pedido va a la cooperativa correcta

La app trabaja con **varias cooperativas UTC**. **No se precarga ninguna**: la app detecta por ubicación la **cooperativa más cercana** y la asigna sola, y el pedido se **enruta a esa cooperativa** (nadie pide en una y le responde otra).

- **Ubicación del usuario** con `expo-location` (permiso en primer plano). Con la posición, se calcula la distancia a cada cooperativa y se **asigna la más cercana** — sin precargar una por defecto.
- **Elegir a mano:** tocar el encabezado abre la lista de cooperativas; es también el *fallback* si se niega el permiso. **No se puede pedir sin cooperativa.**
- **El administrador igual:** su panel también detecta por geolocalización **qué cooperativa opera** (no viene fija). 
- **Ruteo del pedido:** cada pedido guarda su cooperativa; la **cola del administrador solo trae los pedidos de SU cooperativa**. Así, si pides en la UTC más cercana a ti, ese pedido llega a esa cocina y no a otra.
- La lista de cooperativas es hoy fija en la app (mismas para cliente y admin); a futuro llega de un `GET /branches`.

### 3.13. Menú inicial de la cooperativa

El menú con el que arranca la app refleja los antojos típicos del recreo. Es un **punto de partida**: la cooperativa puede agregar, quitar o ajustar productos, precios y disponibilidad según la temporada y la demanda. Cada producto muestra su precio y si **se prepara al momento** (con su tiempo estimado a la vista) o ya está **listo para llevar**:

- **Quesadilla de tinga** — $38 · se prepara en ~12 min. Tortilla de maíz al momento, tinga de pollo, queso oaxaca derretido y crema.
- **Combo estudiante** — $50 · se prepara en ~13 min. Quesadilla a elegir + agua fresca natural del día. El antojo completo del recreo.
- **Hamburguesa de la casa** — $65 · se prepara en ~15 min. Doble carne, queso amarillo, tocino y aderezo especial de la cooperativa.
- **Papas con queso** — $32 · se prepara en ~8 min. Papas a la francesa bañadas en queso amarillo fundido.
- **Agua de jamaica** — $18 · lista para llevar. Agua fresca de flor de jamaica, natural y bien fría.
- **Boneless BBQ** — $58 · se prepara en ~14 min. Trozos de pollo empanizado bañados en salsa BBQ, con aderezo ranch.
- **Papas a la francesa** — $28 · se prepara en ~7 min. Clásicas, doraditas y crujientes, con sal al gusto.
- **Esquites en vaso** — $22 · se prepara en ~6 min. Granos de elote tierno, mayonesa, queso, limón y chile.
- **Gelatina de mosaico** — $15 · lista para llevar. Gelatina de leche con cubos de colores, fresquita.
- **Agua de horchata** — $18 · lista para llevar. Horchata de arroz con canela, dulce y cremosa.

> ### 🚩 Cuatro descripciones NO coinciden con su receta — **decisión pendiente**
>
> La auditoría del 2026-07-14 cruzó este menú contra las recetas de
> [`recetas-e-insumos.md`](../datos/recetas-e-insumos.md). **No describen el mismo producto.**
> **Y eso importa porque la receta es la que COSTEA y la que decide si el producto se puede vender.**
>
> | Producto | El **menú** promete… | La **receta** dice… | Consecuencia |
> |---|---|---|---|
> | **Hamburguesa** $65 | *"**Doble carne**"* | **UNA** carne de 130 g | ⚠️ **Publicidad falsa** *y* el costeo miente. Doble carne = **260 g** → el costo sube ~$17 y el food cost pasa de **55 % a 85 %**. |
> | **Combo estudiante** $50 | *"**Quesadilla** a elegir + agua"* | **Hamburguesa sencilla + papas + agua** | ⚠️ **Son productos distintos.** No es un matiz: es otro platillo, con otro costo. |
> | **Quesadilla** $38 | Tortilla de **maíz** | Tortilla de **harina** de 30 cm | Cambia el insumo y el costo. |
> | **Papas con queso** $32 | Queso **amarillo** fundido | Queso **cheddar** líquido | Cambia el insumo y el costo. |
>
> **No se corrige aquí, y a propósito:** el **menú es del equipo realizador** (es el producto);
> las **recetas son una sugerencia investigada**. **Manda el menú** — pero entonces **hay que corregir las
> recetas**, y **la Hamburguesa con doble carne no cierra a $65**.
>
> **Es exactamente la decisión que el sistema existe para forzar.**

Las **aguas frescas** y la **gelatina** suelen ofrecerse como *Preparado | Sin tiempo de espera*, listas para recoger casi de inmediato; el resto se prepara al momento mostrando su tiempo de espera. Cada producto tendrá su foto en la app (al inicio con una imagen provisional que la cooperativa puede reemplazar).

### 3.14. Semáforo de congestión (cómo se calcula y quién lo ve)

Aunque existan los turnos, en el recreo siempre habrá un montón de pedidos juntos. El **semáforo** mide en vivo qué tan llena está la cooperativa, para que nadie pida a ciegas y el admin reparta la carga.

- **Qué cuenta:** los **pedidos en cola** ahorita mismo — los que están *pendientes*, *en preparación* o *listos esperando* en el mostrador. **No** cuentan los ya recogidos, los cancelados, ni los que se dejaron para después.
- **Los colores (parámetros):** 🟢 **Verde** = menos de 5 en cola · 🟡 **Amarillo** = de 5 a 10 · 🔴 **Rojo** = más de 10. Son números **ajustables**: si la cooperativa aguanta más movimiento, se suben.
- **Quién lo ve:**
  - **El alumno** ve el **color** (con un textito tipo *"está tranquila / concurrida / llena"*) para decidir si pide ya o se espera un toque.
  - **El admin** ve el **número exacto** además del color, para saber cuándo empujar los pedidos programados y repartir la llegada de todos.
- **Sin trampas:** el semáforo lo calcula el sistema con la **hora del servidor**, no el teléfono; así todos ven lo mismo.

### 3.15. Pedido programado — recoge a la hora justa

¿Ya sabes a qué hora vas a poder pasar? **Prográmalo.** Al pagar eliges la hora de recogida y la cooperativa lo tiene listo justo para entonces — nada de llegar y esperar, ni de que se enfríe por prepararlo antes.

- **Con tiempo:** se programa con **mínimo 30 minutos de anticipación** (no vale pedir 9:50 para las 10:00; la cocina necesita su tiempo).
- **Para hoy:** eliges una hora **del mismo día**, dentro del horario de la cooperativa.
- **La cocina no se adelanta ni se atrasa:** el sistema calcula **cuándo empezar** (tu hora de recogida menos lo que tarda en prepararse) y **le avisa al negocio** justo cuando toca ponerse a cocinar. En el panel del admin ese pedido sube de prioridad y se marca con un **"⏰ Empezar ahora"**.
- **No infla el semáforo antes de tiempo:** un pedido programado para dentro de un rato **no cuenta** en la cola hasta que **se abre su ventana** (cuando ya toca prepararlo, ~20 min antes de la recogida). Así el semáforo refleja lo que de verdad está pasando ahorita.
- Igual que cualquier pedido, trae su **número** (ej. U-00001) y lo sigues en vivo hasta recogerlo.

### 3.16. Inteligencia del negocio — el panel del administrador que dice qué comprar y cuándo

En el **panel del administrador** (dashboard) hay una tarjeta **"Inteligencia del negocio"** con dos datos que ayudan a la cooperativa a comprar mejor y reforzar la hora fuerte. Los calcula el **servidor** sobre los pedidos reales (no el teléfono):

- **Producto más vendido:** el que más **unidades** ha vendido, sumando las cantidades de todos los pedidos. **No** cuenta los pedidos **cancelados**. Sirve para no quedarse sin lo que más sale.
- **Hora pico:** la **franja horaria del día con más pedidos** (p. ej. 14:00–15:00). Se mide en la **hora local de la cooperativa** (no en UTC), tampoco cuenta cancelados. Sirve para reforzar personal/insumos justo en ese rato.
- **Quién lo ve:** solo el **administrador** (dato de gestión); el alumno no lo ve.

Es distinto del **semáforo** (§3.14, congestión *ahorita*) y de los **tiempos promedio de preparación** (§3.7, cuánto tarda cada producto): esto es la **demanda histórica** (qué y cuándo se vende).

### 3.17. Métodos de pago — qué se ofrece y qué es real en esta versión

Al pagar, el alumno elige entre **cinco** métodos: **Mercado Pago**, **PayPal**, **Tarjeta de crédito (TDC)**, **Tarjeta de débito (TDD)** y **Efectivo al recoger**.

**Importante — estado actual (honesto):** el cobro con tarjeta/online es **SIMULADO**; **no** hay integración real con Mercado Pago, PayPal ni un procesador de tarjeta (no se mueve dinero de verdad):

- **Tarjeta (TDC/TDD):** se captura en un **formulario real** (número, titular, expiración MM/AA y CVV) y **solo se guardan los últimos 4 dígitos** (nunca el número completo). En la demo el número valida el **formato** (13–19 dígitos), no el checksum, para no rechazar números de prueba. La **aprobación se simula** y va protegida por un **circuit breaker** (§3.2). Las tarjetas se pueden guardar en "Mi cartera" y reusar.
- **Mercado Pago / PayPal:** se registran como método (correo/titular + referencia); su cobro real también queda **diferido**.
- **Efectivo al recoger:** es el único **real** — no pasa por pasarela, se **cobra en el mostrador** al entregar; hasta entonces el pago queda *pendiente* y cuenta como ingreso cuando se entrega.

La integración con **pasarelas reales** (Mercado Pago/PayPal/procesador de tarjeta) queda **fuera del alcance de esta demo** y es trabajo futuro (ver `decisiones.md` D-006 / D-033).

---

### 3.17-bis. Las cuatro personas de la cooperativa — quién ve qué

Hasta esta versión solo existían **dos** roles: `user` y `admin`. Pero una cooperativa real la operan
**tres personas más el administrador**, y cada una necesita **cosas distintas** — y, sobre todo, **no debe
ver las demás**.

| Rol | Qué hace | Qué **nunca** ve |
|---|---|---|
| 🍳 **cocina** | **Acepta** el pedido y lo **marca listo**. Ve qué preparar, con las personalizaciones y las notas. | Dinero, precios, costos, márgenes, **ni el nombre o correo del cliente** (BR-014). Solo el código `#U-00042`. |
| 📦 **inventario** | Materia prima, **compras con costo**, recetas, mermas, conteo físico, **márgenes y ganancia**. | No cambia estados, no cobra, **no fija el precio de venta**. |
| 💵 **mostrador** | Cobra, **da cambio**, lleva **la caja**, entrega, **re-oferta**, **factura** y registra la ganancia. | No edita el menú ni fija precios de lista; no ve costos ni márgenes. |
| 🛡️ **admin** | Todo lo de **su** cooperativa: menú, precios, reoferta, métricas, personalización y **alta de personal**. | **Otra cooperativa.** |

**Dos reglas duras que esto impone:**

1. **Cada transición la dispara quien tiene la información.** El cocinero es el único que sabe que la
   hamburguesa ya salió; el de mostrador es el único que sabe que el cliente ya está enfrente con el
   dinero. Por eso **cocina** mueve `pendiente → en preparación → listo`, y **mostrador** mueve
   `listo → recogido`.
2. **El alcance por cooperativa lo decide el servidor, no el cliente.** Cada persona está **anclada a una
   sola cooperativa**, y esa pertenencia viaja **dentro de su credencial**. La aplicación **jamás** le
   pregunta al dispositivo de qué sucursal viene.

**No existe un "super-admin"** que vea todas las cooperativas: dar de alta planteles y administradores se
hace fuera de la aplicación. Un rol capaz de leerlo todo es una superficie de ataque que el proyecto no
necesita.

---

### 3.18. Personalización del pedido — insumos y notas

Cada producto tiene sus **"ramas"**: los insumos que lo componen. Y cada insumo es de una de **tres clases**:

- **BASE** — el pan, la carne, la tortilla. **Se muestra pero no se puede quitar.** Si se acaba,
  **el producto sale del menú** (§3.20).
- **ESTÁNDAR** — la lechuga, el jitomate, la mayonesa. **Vienen por defecto y el alumno puede quitarlos.**
- **EXTRA** — el tocino, el aderezo mango habanero. **No vienen, y el alumno puede agregarlos.**

Más un campo de **nota libre** para lo que ninguna casilla cubre — el ejemplo real que dio origen a esto:
*"no quiero ningún aderezo aunque haya seleccionado Mango Habanero"*.

Lo que el alumno elige **se congela en el pedido**: si mañana la cooperativa renombra un insumo, **el
ticket viejo no cambia**. Es el mismo principio que ya rige el precio.

---

### 3.19. Efectivo con desglose — y la caja de verdad

El alumno que paga en efectivo **declara con qué va a pagar**: elige los billetes y las monedas. El sistema:

- **Calcula el cambio** (lo hace el servidor, no el teléfono).
- **Apaga las denominaciones imposibles**: para un pedido de $148, el billete de $1 000 **nace apagado**,
  porque el cambio ($852) excedería el tope que la cooperativa acepta devolver.
- Ofrece un botón de **"pago exacto"** que arma el desglose con el menor número de piezas.

**Y del otro lado hay una caja real.** Mostrador **abre el día declarando el fondo** (cuántos billetes y
monedas hay), el sistema **registra cada entrada y cada salida**, y al final **hace el corte**: compara lo
contado contra lo esperado y **deja registrada la diferencia** (faltante o sobrante). La diferencia **no se
corrige sola**.

Eso permite responder la pregunta que de verdad importa en el mostrador, y que un simple tope nunca podría
contestar: **"¿tengo con qué dar este cambio?"** — porque el sistema **conoce las piezas que hay en el
cajón**.

---

### 3.20. Inventario, costos y ganancia — el sistema sabe cuánto ganas

El encargado de inventario **registra lo que compra con su costo real**: *"3 kg de carne, $150"*. De ahí
el sistema deriva **el costo por gramo** ($0.05/g) y, con la receta de cada producto, **cuánto cuesta cada
platillo**.

**Tres cosas que hacen que el número sea verdad y no un adorno:**

1. **El rendimiento.** 3 kg de carne **con hueso y grasa** no dan 3 kg de carne útil: dan ~2.4 kg. Para
   poner 130 g en la hamburguesa hay que **sacar más** de la alacena. **Sin esto, el costo siempre queda
   por debajo del real** y la cooperativa cree que gana más de lo que gana.
2. **El IVA.** La comida preparada causa **16 %** — *incluso para llevar*. De un precio de menú de $65, la
   cooperativa **se queda con $56.03**; los $8.97 restantes **son del SAT**. La ganancia se mide contra los
   $56.03, **nunca** contra los $65.
3. **El costo se congela en el pedido.** Una compra de mañana **no puede cambiar el margen de ayer**.

**Y el menú se ajusta solo:** el sistema calcula **cuántas unidades puede preparar** de cada producto a
partir del stock de sus insumos BASE. Si se acaba el pan, **la hamburguesa sale del menú sola** — y le dice
al encargado **exactamente qué falta**: *"Te quedan 4 hamburguesas — te falta pan."*

---

### 3.21. Facturación — el layout para el CFDI

El alumno indica **en su perfil** si quiere factura. Si dice que sí, llena **una sola vez** los datos que
la ley exige (RFC, razón social, código postal fiscal, régimen y uso del CFDI), **tal cual aparecen en su
Constancia de Situación Fiscal**.

El sistema **produce el paquete de datos (el layout)** que se necesita para timbrar un **CFDI 4.0**.
**No timbra**: el sello fiscal lo pone un proveedor autorizado, y eso queda fuera del alcance.

Quien **no** pide factura entra en la **factura global** de "público en general". Y una regla que el
sistema hace cumplir desde el primer día: **un pedido ya facturado no puede entrar también en la global**.

---

### 3.22. Reoferta — rescatar comida, no rematarla

Cuando un pedido **ya preparado** no se recoge, **los insumos ya se gastaron**. Ese costo **no vuelve**.

Y ahí está la trampa que hay que nombrar: la alternativa **no es venderlo a precio normal** (esa venta ya
fracasó). **La alternativa es la basura.**

| | Venta normal | **Reoferta** | **Si se tira** |
|---|---|---|---|
| Resultado para la cooperativa | **+$35** | **+$22** | **−$21** |

**La reoferta no baja la ganancia de $35 a $22: rescata una pérdida de $21 y la convierte en una ganancia
de $22.** Por eso el panel se lo dice a mostrador con esas palabras: *"Recuperaste $43 que se iban a la
basura."*

**Pero hay un piso**, y no es el costo: es **no enseñarle al alumno a esperar el descuento**. Si la
reoferta es muy barata y muy predecible, deja de comprar a precio normal — y eso destruye el negocio que
de verdad paga.

---

### 3.23. Alertas de inventario — antes de que se acabe, no después

El sistema avisa **por notificación** cuando:

- un insumo **baja de su mínimo** (antes de llegar a cero, no después);
- un insumo **se agotó**, y **qué productos se cayeron con él**;
- un lote **está por caducar**;
- **un producto quedó bajo el margen mínimo porque subió un costo** — sin que nadie lo tocara. *Esta es la
  alerta que salva dinero.*

Y el mensaje es **accionable**, no informativo:

> ❌ *"Stock bajo de Agua purificada."*
> ✅ *"Agua purificada: quedan 2 garrafones (mínimo: 3). Sin ella se caen **Horchata, Jamaica, Esquites y Gelatina**."*

---

## 4. Implementación

El **algoritmo para construir todo lo de la Propuesta** vive en [`Algoritmo-ejecucion.md`](Algoritmo-ejecucion.md): los pasos concretos (definir alcance y diseño, levantar servicios, estructura de carpetas, armar pantallas y backend, etc.). El **detalle técnico** (arquitectura, esquema de BD, seguridad) está en [`architecture-propuesta.md`](../arquitectura/architecture-propuesta.md) y las **decisiones** en [`decisiones.md`](../arquitectura/decisiones.md).

**Estado de implementación (2026-07-14) — ALCANCE AMPLIADO.** Lo descrito en §3.1–§3.17 está **implementado y verificado**. Lo descrito en **§3.17-bis y §3.18–§3.23 es alcance NUEVO**, con **diseño y plan escritos pero SIN implementar**:

| Sección nueva | Estado | Plan |
|---|---|---|
| §3.17-bis — Las 4 personas + alcance por cooperativa | 📋 diseñado, no implementado | [`01-cimientos-roles-y-alcance`](../superpowers/plans/2026-07-14-01-cimientos-roles-y-alcance.md) |
| *(fuente única de la verdad backend↔app)* | 📋 diseñado | [`02-ssot`](../superpowers/plans/2026-07-14-02-ssot.md) |
| *(seguridad a nivel de fila en la base de datos)* | 📋 diseñado | [`03-rls`](../superpowers/plans/2026-07-14-03-rls.md) |
| §3.18 · §3.20 — Personalización, inventario, costos y ganancia | 📋 diseñado | [`04-inventario-costeo`](../superpowers/plans/2026-07-14-04-inventario-costeo.md) |
| §3.19 · §3.21 — Efectivo con desglose, caja y layout CFDI | 📋 diseñado | [`05-efectivo-caja-ticket-cfdi`](../superpowers/plans/2026-07-14-05-efectivo-caja-ticket-cfdi.md) |
| §3.22 · §3.23 — Panel de receta, reoferta y alertas | 📋 diseñado | [`06-panel-de-receta-por-alimento`](../superpowers/plans/2026-07-14-06-panel-de-receta-por-alimento.md) |

El diseño del motor de costos está en [`motor-de-costeo-design.md`](../superpowers/specs/2026-07-14-motor-de-costeo-design.md). El uso de IA en el proyecto, en [`uso-de-ia-y-prompts.md`](uso-de-ia-y-prompts.md).

**Estado previo (2026-07-02).** Todo lo descrito en §3.1–§3.17 de esta Propuesta está implementado y verificado. En el último cierre (decisiones **D-027…D-034**) se completaron: buscador de menú (§3.1), **tiempos promedio** de preparación y "preparado hace X min" (§2/§3.7), **semáforo ajustable** desde el admin que también ve el alumno (§3.14), **métricas** de más-vendido y hora pico (§3.1), **auto-vencimiento** de la ventana de recogida (§3.8), estado "Calentando" y prompt cancelar/extender (§3.8/§3.9), **accesibilidad funcional** y foto de producto por URL (§3.1), **sucursal** persistida con el pedido (§3.12) y **MFA de admin forzada** (§3.2). Sobre los **pagos**: el checkout tiene un **formulario real de tarjeta** (valida formato/expiración/CVV, se guarda solo `last4`) con **aprobación simulada** protegida por un **circuit breaker**; la integración con **pasarelas reales** (Mercado Pago/PayPal/procesador) queda **diferida** por ser fuera de alcance de la demo (ver §3.17). Detalle en `decisiones.md`.

---

## 5. Valor agregado

Lo que hace que UTC Pick Sazón valga la pena, más allá de "una app para pedir":

- **Mata la fila del recreo de verdad:** turnos + semáforo + pedido programado reparten la llegada de cientos de alumnos a la misma hora.
- **Nadie se queda viendo a ciegas:** siempre sabes cuánto falta y cuándo está listo.
- **Incluye a todos:** pagar en efectivo al recoger (y a futuro, saldo/monedero escolar) para quien no trae tarjeta, más opciones de accesibilidad (texto más grande, más contraste) para que cualquiera la use con comodidad.
- **La cooperativa gana:** menos desperdicio (reoferta), mejores compras (datos de demanda) y una operación más tranquila en la hora pico.
- **Escala:** si funciona aquí, el mismo diseño sirve para otros planteles (selección de sucursal por cercanía).

**Y con el alcance ampliado (§3.17-bis–§3.23), el valor deja de ser solo "menos fila":**

- **La cooperativa sabe, por fin, si gana dinero.** No "cuánto vendió" — **cuánto ganó**, con el costo real de cada platillo, el rendimiento de la materia prima y el IVA descontado. Es la diferencia entre llevar una tiendita y llevar un negocio.
- **El menú se cuida solo.** Si se acaba el pan, la hamburguesa sale del menú **antes** de que un alumno la pida y se lleve el chasco.
- **Nadie ve lo que no le toca.** El cocinero no ve el nombre del cliente; el de mostrador no ve los costos; el admin de Roma no ve los pedidos de Tlalpan. **Y eso lo hace cumplir el servidor, no la pantalla.**
- **La caja cuadra.** Cada peso que entra y sale queda registrado, y el corte del día dice si falta o sobra — con **un responsable**.
- **Se tira menos comida.** La reoferta deja de ser un remate y se vuelve un rescate medible: *"recuperaste $43 que se iban a la basura"*.

**Ideas en el tintero (roadmap)** para sumar aún más valor: **monedero/saldo escolar**, **alérgenos e ingredientes** (que ahora salen casi gratis del catálogo de insumos), **favoritos ("lo de siempre")**, **avisos del día** y **tope de pedidos por horario**.

---

## 6. Adopción

Cómo logramos que la cooperativa y los alumnos de verdad la usen:

- **Pruebas con alumnos reales** en el editor y en el teléfono (Expo Go), iterando lo que confunda.
- **Arranque en una sola cooperativa** (la de la UTC) con el menú actual, para pulir el flujo completo: pedir → turno → recoger.
- **Demo a los dirigentes** de la cooperativa mostrando cómo baja la congestión y cómo se vende lo preparado.
- **Capacitación corta** al personal para el panel de admin (marcar listos, manejar el menú y leer el semáforo).
- Si convence, **se amplía**: más horarios, más productos y —si se da— más planteles.

**¿Cuándo decimos que fue un éxito?** Se le da un **periodo de adopción de 1 mes**: si en ese mes una buena parte de los alumnos ya pide por la app y se nota una **baja real en la congestión** del recreo (menos fila, menos espera a ciegas), se considera **adoptada** y se amplía.
