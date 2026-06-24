# Datos de demostración — UTC Pick Sazón

> **Pide fácil, recoge con sabor.** Este documento presenta el **conjunto de datos** con el que se pueblan las **6 tablas** de la base `UTC_PROJECT_DB` (PostgreSQL en Docker). Los datos son **coherentes con el esquema materializado** (migración TypeORM `1782168106072-Init`) y están pensados para la demo: **ejercitan todos los tipos enumerados y las reglas de negocio** del [círculo de innovación](algoritmo-circulo-innovacion.md).
>
> - **Esquema de referencia:** [`architecture-propuesta.md`](architecture-propuesta.md) §5.
> - **Cómo integrarlos / consultarlos:** seed en [`infra/postgres/seed-demo.sql`](../infra/postgres/seed-demo.sql); consultas en [`consultas-sql.md`](consultas-sql.md).
> - **Hora oficial:** todos los `timestamptz` son **hora del servidor en UTC** (BR-005). El "recreo" de la demo ocurre el **24-jun-2026** por la mañana.

---

## 0. Resumen y cobertura

| Tabla | Filas | Qué representa |
| --- | ---: | --- |
| `user_profile` | **9** | 3 clientes **reales** (ya registrados) + 5 alumnos demo + 1 administrador |
| `products` | **10** | menú inicial de la cooperativa (círculo §3.13) |
| `orders` | **11** | pedidos del recreo, cubriendo los 7 estados |
| `order_items` | **18** | líneas de esos pedidos |
| `payments` | **11** | un pago por pedido (5 métodos, 4 estados) |
| `preparation_times` | **20** | histórico real de preparación (BR-007) |

**Los datos ejercitan los 5 tipos enumerados del modelo:**

| Enum | Valores presentes en los datos |
| --- | --- |
| `user_role` | `admin` (1) · `user` (8) |
| `order_status` | `pending` · `preparing` · `ready` · `picked_up` · `not_picked_up` · `cancelled` · `ready_later` — **los 7** |
| `product_status` | `por_preparar` · `preparado` · `sin_tiempo_espera` · `calentando` · `no_disponible` — **los 5** |
| `payment_method` | `mercado_pago` · `paypal` · `tdc` · `tdd` · `efectivo` — **los 5** |
| `payment_status` | `pending` · `paid` · `failed` · `refunded` — **los 4** |

> **Integridad verificada:** el `total_amount` de cada pedido coincide con la suma de los `subtotal` de sus líneas (0 desajustes). Todas las claves foráneas resuelven y todos los `CHECK` (precio > 0, cantidad > 0, stock ≥ 0, `max_stock ≥ min_stock`, etc.) se cumplen.

> Las claves primarias reales son `uuid` (`gen_random_uuid()`). En este documento se usan **códigos cortos** (`U#`, `P##`, `O-###`) para leerlo fácil; en la BD corresponden a UUIDs con prefijo (`f…` usuarios demo, `a…` productos, `b…` pedidos, `c…` líneas, `d…` pagos, `e…` tiempos).

---

## 1. `user_profile` — alumnos y administrador

Perfil local enlazado a Keycloak (`keycloak_id` = `sub` del JWT). La **autoridad real del rol es el JWT**; la columna `role` es una copia de conveniencia (§5.1).

| Cód. | email | Nombre | `role` | Origen |
| --- | --- | --- | --- | --- |
| U01 | `prueba@utc.edu.mx` | Emmanuel Alejandre | `user` | **real** (registrado en la app) |
| U02 | `prueba.func.1782226408@utc.edu.mx` | Prueba Funcional | `user` | **real** |
| U03 | `sec.test.1782236599@utc.edu.mx` | Sec Test | `user` | **real** |
| U04 | `valeria.ramirez@utc.edu.mx` | Valeria Ramírez | `user` | demo |
| U05 | `diego.hernandez@utc.edu.mx` | Diego Hernández | `user` | demo |
| U06 | `sofia.martinez@utc.edu.mx` | Sofía Martínez | `user` | demo |
| U07 | `carlos.lopez@utc.edu.mx` | Carlos López | `user` | demo |
| U08 | `ana.torres@utc.edu.mx` | Ana Torres | `user` | demo |
| U09 | `admin@picksazon.app` | Coop Admin | `admin` | demo (operador de la cooperativa) |

> Los 3 clientes **reales** se crearon con el auto-registro `@utc.edu.mx` (D-014) y **no se modifican**. El admin (`coop-admin`) vive realmente en Keycloak con MFA (D-016); aquí se incluye su **espejo local** para mostrar el rol `admin`. Los alumnos demo llevan un `keycloak_id` de relleno (sin cuenta real) porque solo pueblan el modelo de datos.

---

## 2. `products` — menú inicial (10 productos)

Precios en MXN; `base_prep_time_seconds` en **segundos** (tiempo base de preparación; las bebidas y la gelatina llevan un valor pequeño de "servir"). `stock`/`min_stock`/`max_stock` solo son relevantes para los productos tipo *"Preparados"* (bebidas, gelatina, esquites); los hechos al momento manejan `stock = 0`.

| Cód. | `name` | `price` | `category` | `base_prep` | `stock` | `min`/`max` | `status` | `is_available` | `reoffer_price` |
| --- | --- | ---: | --- | ---: | ---: | :---: | --- | :---: | ---: |
| P01 | Quesadilla de tinga | $38.00 | Antojitos | 720 s (~12 min) | 0 | 0 / — | `por_preparar` | sí | — |
| P02 | Combo estudiante | $50.00 | Combos | 780 s (~13 min) | 0 | 0 / — | `por_preparar` | sí | — |
| P03 | Hamburguesa de la casa | $65.00 | Antojitos | 900 s (~15 min) | 0 | 0 / — | `por_preparar` | sí | — |
| P04 | Papas con queso | $32.00 | Snacks | 480 s (~8 min) | 3 | 0 / — | `calentando` | sí | **$24.00** |
| P05 | Agua de jamaica | $18.00 | Bebidas | 30 s | 24 | 6 / 40 | `sin_tiempo_espera` | sí | — |
| P06 | Boneless BBQ | $58.00 | Antojitos | 840 s (~14 min) | 0 | 0 / — | `por_preparar` | sí | — |
| P07 | Papas a la francesa | $28.00 | Snacks | 420 s (~7 min) | 0 | 0 / — | `no_disponible` | **no** | — |
| P08 | Esquites en vaso | $22.00 | Snacks | 360 s (~6 min) | 8 | 4 / 20 | `preparado` | sí | — |
| P09 | Gelatina de mosaico | $15.00 | Postres | 30 s | 18 | 6 / 30 | `sin_tiempo_espera` | sí | — |
| P10 | Agua de horchata | $18.00 | Bebidas | 30 s | 12 | 6 / 40 | `sin_tiempo_espera` | sí | — |

**Lo que muestra cada estado de producto (círculo §3.6):**
- **P01·P02·P03·P06** `por_preparar` — se hacen al momento, con su tiempo a la vista.
- **P08** `preparado` — recién hecho, listo en el rail *"Listos ahora"*.
- **P05·P09·P10** `sin_tiempo_espera` — bebidas/gelatina listas para llevar casi de inmediato.
- **P04** `calentando` + `reoffer_price` — sobró de un pedido **no recogido** (ver O-005) y se **reoferta** más barato (§3.11 *"Pon tu precio"*): $32 → **$24**.
- **P07** `no_disponible` + `is_available = false` — se **agotó** durante el recreo.

---

## 3. `orders` — pedidos del recreo (24-jun)

Horas en formato `hh:mm` (UTC). El número de turno se asigna cuando el admin marca **`ready`** (círculo §3.4). `pickup_deadline` = `ready_at` + 20 min (D-005).

| Cód. | Alumno | `status` | `total` | creado | listo (`ready_at`) | recogido | Qué muestra |
| --- | --- | --- | ---: | :---: | :---: | :---: | --- |
| O-001 | U01 Emmanuel | `picked_up` | $56.00 | 09:31 | 09:43 | 09:48 | flujo feliz completo |
| O-002 | U04 Valeria | `preparing` | $123.00 | 09:50 | — | — | en cocina ahora mismo |
| O-003 | U05 Diego | `ready` | $50.00 | 09:40 | 09:55 | — | listo, con turno; paga al recoger |
| O-004 | U06 Sofía | `pending` | $59.00 | 10:02 | — | — | recién enviado, sin aceptar |
| O-005 | U07 Carlos | `not_picked_up` | $50.00 | 09:20 | 09:30 | — | no se recogió → alimenta la reoferta P04 |
| O-006 | U08 Ana | `cancelled` | $38.00 | 09:15 | — | — | cancelado por **pago rechazado** |
| O-007 | U02 Prueba F. | `ready_later` | $68.00 | 09:25 | 09:40 | — | el alumno **extendió** la recogida |
| O-008 | U03 Sec Test | `picked_up` | $58.00 | 09:05 | 09:19 | 09:24 | recogido |
| O-009 | U01 Emmanuel | `picked_up` | $97.00 | 08:55 | 09:10 | 09:15 | cliente recurrente |
| O-010 | U05 Diego | `picked_up` | $40.00 | 09:35 | 09:42 | 09:50 | recogido (pago en efectivo) |
| O-011 | U04 Valeria | `cancelled` | $50.00 | 09:48 | — | — | cancelado a tiempo → **reembolso** |

> **Semáforo de congestión (círculo §3.14, D-019):** la cola = pedidos en `pending` + `preparing` + `ready` = O-002 (`preparing`), O-003 (`ready`) y O-004 (`pending`) = **3 → 🟢 Verde** (umbral Verde `< 5`). Es lo que ven el **admin** (con el número) y el **cliente** (solo el color). Consulta en [`consultas-sql.md`](consultas-sql.md).

---

## 4. `order_items` — líneas de los pedidos

`unit_price` es el **snapshot** del precio al momento de ordenar; `subtotal = quantity × unit_price`.

| Pedido | Producto | `quantity` | `unit_price` | `subtotal` | `prep_time_seconds` |
| --- | --- | :---: | ---: | ---: | ---: |
| O-001 | P01 Quesadilla de tinga | 1 | $38.00 | $38.00 | 720 |
| O-001 | P05 Agua de jamaica | 1 | $18.00 | $18.00 | 30 |
| O-002 | P03 Hamburguesa de la casa | 1 | $65.00 | $65.00 | 900 |
| O-002 | P06 Boneless BBQ | 1 | $58.00 | $58.00 | 840 |
| O-003 | P02 Combo estudiante | 1 | $50.00 | $50.00 | 780 |
| O-004 | P08 Esquites en vaso | 2 | $22.00 | $44.00 | 360 |
| O-004 | P09 Gelatina de mosaico | 1 | $15.00 | $15.00 | 30 |
| O-005 | P04 Papas con queso | 1 | $32.00 | $32.00 | 480 |
| O-005 | P10 Agua de horchata | 1 | $18.00 | $18.00 | 30 |
| O-006 | P01 Quesadilla de tinga | 1 | $38.00 | $38.00 | 720 |
| O-007 | P02 Combo estudiante | 1 | $50.00 | $50.00 | 780 |
| O-007 | P05 Agua de jamaica | 1 | $18.00 | $18.00 | 30 |
| O-008 | P06 Boneless BBQ | 1 | $58.00 | $58.00 | 840 |
| O-009 | P03 Hamburguesa de la casa | 1 | $65.00 | $65.00 | 900 |
| O-009 | P04 Papas con queso | 1 | $32.00 | $32.00 | 480 |
| O-010 | P08 Esquites en vaso | 1 | $22.00 | $22.00 | 360 |
| O-010 | P10 Agua de horchata | 1 | $18.00 | $18.00 | 30 |
| O-011 | P02 Combo estudiante | 1 | $50.00 | $50.00 | 780 |

---

## 5. `payments` — pagos (1:1 con el pedido)

Un pago por pedido (`order_id` **UNIQUE**, §5.5). `provider_reference` es el id de la transacción de la pasarela; el **efectivo** no lo lleva (BR-009).

| Pedido | `method` | `status` | `amount` | `provider_reference` |
| --- | --- | --- | ---: | --- |
| O-001 | `tdc` | `paid` | $56.00 | `tdc_aprob_8842` |
| O-002 | `mercado_pago` | `paid` | $123.00 | `mp_4f9a21c7` |
| O-003 | `efectivo` | `pending` | $50.00 | — (paga al recoger) |
| O-004 | `paypal` | `pending` | $59.00 | — (en proceso) |
| O-005 | `tdd` | `paid` | $50.00 | `tdd_aprob_5521` |
| O-006 | `mercado_pago` | `failed` | $38.00 | `mp_rechazo_3471` |
| O-007 | `tdc` | `paid` | $68.00 | `tdc_aprob_9033` |
| O-008 | `mercado_pago` | `paid` | $58.00 | `mp_7b1e90fa` |
| O-009 | `tdc` | `paid` | $97.00 | `tdc_aprob_8810` |
| O-010 | `efectivo` | `paid` | $40.00 | — |
| O-011 | `mercado_pago` | `refunded` | $50.00 | `mp_reembolso_2210` |

> **Lecturas para el maestro:** O-003/O-010 muestran **efectivo** (`pending` mientras no recoge / `paid` al entregar); O-006 un **cobro rechazado** (`failed`) que tira el pedido; O-011 un **reembolso** (`refunded`) tras cancelar a tiempo.

---

## 6. `preparation_times` — histórico de preparación (BR-007)

Cada fila es un **tiempo real medido** (en segundos) de un producto. Las de hoy se ligan a su `order_item`; las de días previos llevan `order_item_id` nulo (muestra histórica). **Nunca se confía en tiempos enviados por el frontend.**

**Promedio aplicado (BR-007: media de las últimas 20 muestras; con menos de 3, se usa el `base_prep_time_seconds`):**

| Producto | Muestras | Base (s) | Promedio medido (s) | **Usado (s)** |
| --- | :---: | ---: | ---: | ---: |
| Quesadilla de tinga | 4 | 720 | 710 | **710** |
| Combo estudiante | 3 | 780 | 785 | **785** |
| Hamburguesa de la casa | 3 | 900 | 888 | **888** |
| Boneless BBQ | 3 | 840 | 843 | **843** |
| Papas con queso | 3 | 480 | 475 | **475** |
| Esquites en vaso | 3 | 360 | 357 | **357** |
| **Papas a la francesa** | **1** | 420 | (415) | **420 ← usa base (< 3 muestras)** |
| Agua de jamaica / horchata / Gelatina | 0 | 30 | — | **30 ← usa base** |

> *Papas a la francesa* tiene una sola muestra → el sistema **ignora el promedio y usa el tiempo base** (420 s), tal como exige BR-007. Es el caso que muestra la regla de respaldo.

---

## 7. Cómo integrarlo y consultarlo

**Cargar los datos en la BD** (idempotente, se puede re-correr):
```bash
docker exec -i utc_postgres psql -U UTC_PROJECT -d UTC_PROJECT_DB < infra/postgres/seed-demo.sql
```

**Consultas para la demo** (ver más en [`consultas-sql.md`](consultas-sql.md)):
```sql
-- Pedidos con su dueño
SELECT o.status, u.email, o.total_amount, o.ready_at
FROM orders o JOIN user_profile u ON u.id = o.user_profile_id
ORDER BY o.created_at;

-- Promedio real de preparación por producto (BR-007)
SELECT p.name, count(pt.*) AS muestras, round(avg(pt.duration_seconds)) AS prom_s
FROM products p LEFT JOIN preparation_times pt ON pt.product_id = p.id
GROUP BY p.name ORDER BY p.name;

-- Recaudación por método de pago
SELECT method, status, count(*), sum(amount)
FROM payments GROUP BY method, status ORDER BY method;
```

> **Reiniciar los datos demo:** el seed trae al final un bloque `REINICIO` (comentado) que borra solo lo demo y conserva los 3 clientes reales.
