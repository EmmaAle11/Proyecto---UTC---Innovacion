# Círculo de innovación — UTC Pick Sazón

> **Pide fácil, recoge con sabor.** Documento **fuente** del proceso de innovación (Ocurrencia → Idea → Propuesta) para la app de cooperativa / dark kitchen escolar UTC, modalidad **Pick Up** (sin envíos).
>
> - Aquí viven el **alcance** y las **reglas de negocio** originales. Su realización técnica está en [`architecture-propuesta.md`](architecture-propuesta.md); las decisiones, en [`decisiones.md`](decisiones.md).
> - Complemento de ejecución: [`Algoritmo-ejecucion.md`](Algoritmo-ejecucion.md) (objetivo, público, paleta, pasos).
> - La numeración de secciones (§1…§12) es **canónica**: otros documentos citan "círculo §7/§9/§12".

---

## 1. Ocurrencias

- Resolver el problema de **congestión** en la cooperativa.
- Implementar **tecnologías** en la cooperativa.
- Crear una **app móvil intuitiva**.

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

---

## 3. Tecnologías a utilizar

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

---

## 4. Flujo general del sistema

```txt
Usuario → App Expo Go / Panel usuario → Backend NestJS → PostgreSQL
Admin   → App Expo Go / Panel Admin   → Keycloak (con MFA) → Backend NestJS → PostgreSQL
```

---

## 5. Flujo de pedido

```txt
Usuario inicia sesión
  → selecciona producto (Preparado o con tiempo de espera)
  → revisa tiempo estimado
  → confirma pedido
  → realiza pago
  → backend registra el pedido
  → la dark kitchen prepara el producto
  → admin cambia estado a "Listo para recoger"
  → usuario recibe notificación
  → usuario recoge el pedido
```

---

## 6. Estados del pedido

- Pendiente
- En preparación
- Listo para recoger
- Recogido
- No recogido
- Cancelado
- Listo para recoger después

---

## 7. Estados del producto

- Por preparar
- Preparado, listo para recoger
- Preparado | Sin tiempo de espera
- Calentando tu alimento
- No disponible

---

## 8. Manejo de productos preparados

La empresa mantiene un **mínimo y máximo** de productos con etiqueta "Preparados". Estos productos pueden mostrarse como:

> **Preparado | Sin tiempo de espera** — el producto ya está listo y puede recogerse casi de inmediato.

El sistema también muestra **cuánto tiempo lleva preparado** cada producto, para que el administrador decida sobre su venta, reoferta o cambio de estado.

---

## 9. Caso: alumno no recoge su pedido

- El sistema considera que la orden estará lista en un **máximo aproximado de 10 a 15 minutos**.
- Una vez lista, el alumno tiene un margen aproximado de **10 a 20 minutos** para recogerla.
- Si no la recoge dentro de ese tiempo, la app muestra una confirmación:

> *Tu pedido está listo desde hace varios minutos.*
> *¿Deseas cancelar tu orden o extender tu tiempo para recogerla después?*
>
> Opciones: **Cancelar orden** · **Extender para después**

---

## 10. Si el alumno cancela

El alimento puede volver a ofertarse con la etiqueta **Preparado | Sin tiempo de espera**, porque no fue tocado por el cliente y puede venderse como producto preparado.

Si el alimento lleva demasiado tiempo preparado, el indicador deja de mostrarse como *Preparando tu alimento* y pasa a:

> **Calentando tu alimento** — comunica que el alimento ya estaba preparado y solo será calentado para entregarse.

---

## 11. Si el alumno extiende su tiempo

- Si elige recoger después, el pedido queda marcado como **Listo para recoger después**.
- El alumno podrá recogerlo dentro del **horario disponible del mismo día**.
- Si al final del día no lo recoge, el **dinero se mantiene cobrado** y el alimento queda para manejo interno del local.

---

## 12. Reoferta y precio dinámico

Para evitar que los alimentos preparados se queden sin vender, el sistema puede incluir una opción de **reoferta**. Si un producto lleva cierto tiempo preparado, el administrador puede activar una dinámica tipo:

> **Pon tu precio** — o aplicar un **descuento controlado**.

La finalidad es vender el producto **antes de perderlo**, aunque sea con menor ganancia.

---

## Implementación

La materialización técnica de estas reglas vive en:

- [`architecture-propuesta.md`](architecture-propuesta.md) — frontend (FSD), backend (Clean Architecture), esquema de BD (las 6 tablas + enums), seguridad y flujos.
- [`decisiones.md`](decisiones.md) — decisiones canónicas (D-001…D-018).
