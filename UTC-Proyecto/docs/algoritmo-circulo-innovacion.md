# Círculo de innovación — UTC Pick Sazón

> **Pide fácil, recoge con sabor.** Documento **fuente** del círculo de innovación de la app de cooperativa / dark kitchen escolar UTC, modalidad **Pick Up** (sin envíos). Recorre las fases: **Ocurrencia → Idea → Propuesta → Implementación → Valor agregado → Adopción**.
>
> - Aquí viven el **alcance** y las **reglas de negocio**. El **algoritmo de implementación** está en [`Algoritmo-ejecucion.md`](Algoritmo-ejecucion.md); el detalle técnico en [`architecture-propuesta.md`](architecture-propuesta.md); las decisiones en [`decisiones.md`](decisiones.md).
> - La **Propuesta consolidada** (§3.1) reúne, en cortito, todo lo que tendrá la app (lado alumno + panel de admin).

---

## 1. Ocurrencia

- Resolver el problema de **congestión** en la cooperativa.
- Implementar **tecnologías** en la cooperativa.
- Crear una **app móvil intuitiva**.
- Agregar una **fila por turnos**.
- **Semáforo de congestión** / pedir para después.
- **Programar tu pedido**.

---

## 2. Idea

Crear una aplicación web/móvil amigable (p. ej. con Expo Go o framework similar) para una empresa tipo **dark kitchen** que permita pagos con tarjeta. La empresa mantiene un **mínimo y máximo** de productos con la etiqueta **"Preparados"**.

- Pagos con tarjeta mediante plataformas como **PayPal** y **Mercado Pago**.
- La aplicación se enfoca **únicamente en la compra** de productos — **no** es un sistema de envíos.
- Funciona bajo modalidad **Pick Up**: recoger en tienda.
- Cada producto indica un **tiempo de espera** preestablecido.
- **PostgreSQL** para almacenar información y calcular **tiempos promedio** de preparación.
- Campos mínimos indispensables con estructura primaria usando **Primary Key** y **Foreign Key**.
- **Pop-ups** y **notificaciones push** sobre el estado de preparación del pedido.
- Una vez listo, el pedido debe recogerse en ~**10 a 20 minutos**; de lo contrario podrá volver a ofertarse con la tag "Preparados".
- Estados de producto: *por preparar* (con tiempo estimado de espera) y *preparado* (listo para recoger).
- Mostrar **cuánto tiempo lleva preparado** cada producto.
- **Número de fila** — cuando el **administrador de la cooperativa** marca tu pedido como listo, recibes un **número de turno** (ej. el 15). Con ese número en tu celular **no te acercas antes de tiempo**, evitando la congestión en la ventanilla.
- **Programar tu pedido** — pides con anticipación y recoges a la hora justa, tomando desde antes tu número de turno. 
- **Semáforo de congestión** — aunque existan los turnos, siempre habrá muchos pedidos, así que un semáforo en vivo detecta cuántos hay en cola: **menos de 5 = Verde**, **más de 5 = Amarillo**, **más de 10 = Rojo**.

---

## 3. Propuesta

### 3.1. Propuesta consolidada

Todo lo que hará, **todo lo que hará UTC Pick Sazón** — juntando la idea original con las mejoras que se nos ocurrieron para de verdad acabar con las filas del recreo.

**Para el alumno:**

- Entrará con su **correo institucional** (`@utc.edu.mx`), sino tiene cuenta registrada en la app deberá crear una, cuando acceda verá el **menú con fotos**, precios y, lo mejor, **cuánto vas a esperar** por cada cosa. Lo que ya está hecho aparece como *Listo para llevar*.
- Arma su pedido, elige cómo pagar (Mercado Pago, PayPal, tarjeta (TDC o TDD) o **efectivo al recoger**) y lo manda a la cocina **sin moverse de tu lugar**.
- Puede **programar su pedido** para que esté listo justo cuando salga (ej. "lo quiero a las 10:00") — así llega y ya está.
- Cuando esté listo llega una **notificación** con su **número de turno**: con ese número en el celular **no se acerca antes de tiempo**, y se acaba el amontonamiento en la ventanilla.
- Sigue su pedido en vivo (Pagado → En preparación → Listo → Recogido) y lo recoge mostrando su **código de recogida**.
- ¿No alcanzaste a recogerlo? Puede **cancelar** o **extender para después**; si lo dejas, el alimento se puede **reofertar** como *Preparado | Sin tiempo de espera*.

**Para la cooperativa (panel de admin):**

- Da de alta y edita el **menú** (productos, precios, fotos, stock mínimo/máximo de "Preparados").
- Marca los pedidos como **listos**, y eso dispara el **turno** del alumno.
- Ve el **semáforo de congestión en vivo** según la cola: **Verde (< 5)**, **Amarillo (> 5)**, **Rojo (> 10)** — para leer cómo viene el recreo y, si hace falta, empujar el **pedido programado** para repartir la llegada.
- Aprovecha la **reoferta / "Pon tu precio"** para vender lo que ya está hecho antes de perderlo.
- Con el tiempo, ve **qué se vende más y a qué hora pega el pico** (la app mide los tiempos reales de preparación) para comprar mejor y reforzar la hora pico.

En una frase: **pides desde tu lugar, te avisan con tu turno y recoges sin fila** — y la cooperativa cocina con orden y vende mejor.

### 3.2. Tecnologías a utilizar

| Capa | Tecnologías |
| --- | --- |
| **Frontend** | Expo Go · TypeScript · Tailwind / NativeWind · Arquitectura **FSD** |
| **Backend** | NestJS · TypeScript · Controllers · Services · **TypeORM** |
| **Base de datos** | PostgreSQL · Docker (corre **local** vía Docker) |
| **Autenticación** | Keycloak · Docker (corre **local** vía Docker) |

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
  → backend registra el pedido
  → la dark kitchen prepara el producto
  → admin cambia estado a "Listo para recoger" (y se asigna el número de turno)
  → usuario recibe notificación con su turno
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
- Si al final del día no lo recoge, el **dinero se mantiene cobrado** y el alimento queda para manejo interno del local.

### 3.11. Reoferta y precio dinámico

Para evitar que los alimentos preparados se queden sin vender, el sistema puede incluir una opción de **reoferta**. Si un producto lleva cierto tiempo preparado, el administrador puede activar una dinámica tipo:

> **Pon tu precio** — o aplicar un **descuento controlado**.

La finalidad es vender el producto **antes de perderlo**, aunque sea con menor ganancia.

### 3.12. Escalabilidad — selección de sucursal por geolocalización

Hoy la app atiende **una** cooperativa: **UTC, Calz. de Tlalpan 639, Álamos, Benito Juárez, 03400, CDMX**, por lo que el encabezado "Recoges en · Cooperativa UTC" es fijo. Pensando en **escalar** a más planteles/cooperativas, ese encabezado se convierte en un **selector de sucursal accionable**:

- **Ubicación del usuario** con `expo-location`. Requiere permiso de ubicación en primer plano.
- **Sucursal más cercana:** se calcula la distancia entre el usuario y las coordenadas de cada cooperativa, y se preselecciona la más cercana.
- **Override manual:** tocar el encabezado abre la lista de sucursales para elegir a mano; es también el *fallback* si se niega el permiso de ubicación.

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

Las **aguas frescas** y la **gelatina** suelen ofrecerse como *Preparado | Sin tiempo de espera*, listas para recoger casi de inmediato; el resto se prepara al momento mostrando su tiempo de espera. Cada producto tendrá su foto en la app (al inicio con una imagen provisional que la cooperativa puede reemplazar).

---

## 4. Implementación

El **algoritmo para construir todo lo de la Propuesta** vive en [`Algoritmo-ejecucion.md`](Algoritmo-ejecucion.md): los pasos concretos (definir alcance y diseño, levantar servicios, estructura de carpetas, armar pantallas y backend, etc.). El **detalle técnico** (arquitectura, esquema de BD, seguridad) está en [`architecture-propuesta.md`](architecture-propuesta.md) y las **decisiones** en [`decisiones.md`](decisiones.md).

---

## 5. Valor agregado

Lo que hace que UTC Pick Sazón valga la pena, más allá de "una app para pedir":

- **Mata la fila del recreo de verdad:** turnos + semáforo + pedido programado reparten la llegada de cientos de alumnos a la misma hora.
- **Nadie se queda viendo a ciegas:** siempre sabes cuánto falta y cuándo está listo.
- **Incluye a todos:** pagar en efectivo al recoger (y a futuro, saldo/monedero escolar) para quien no trae tarjeta.
- **La cooperativa gana:** menos desperdicio (reoferta), mejores compras (datos de demanda) y una operación más tranquila en la hora pico.
- **Escala:** si funciona aquí, el mismo diseño sirve para otros planteles (selección de sucursal por cercanía).

**Ideas en el tintero (roadmap)** para sumar aún más valor: **monedero/saldo escolar**, **alérgenos e ingredientes**, **favoritos ("lo de siempre")**, **avisos del día** y **tope de pedidos por horario**.

---

## 6. Adopción

Cómo logramos que la cooperativa y los alumnos de verdad la usen:

- **Pruebas con alumnos reales** en el editor y en el teléfono (Expo Go), iterando lo que confunda.
- **Arranque en una sola cooperativa** (la de la UTC) con el menú actual, para pulir el flujo completo: pedir → turno → recoger.
- **Demo a los dirigentes** de la cooperativa mostrando cómo baja la congestión y cómo se vende lo preparado.
- **Capacitación corta** al personal para el panel de admin (marcar listos, manejar el menú y leer el semáforo).
- Si convence, **se amplía**: más horarios, más productos y —si se da— más planteles.

**¿Cuándo decimos que fue un éxito?** Se le da un **periodo de adopción de 1 mes**: si en ese mes una buena parte de los alumnos ya pide por la app y se nota una **baja real en la congestión** del recreo (menos fila, menos espera a ciegas), se considera **adoptada** y se amplía.
