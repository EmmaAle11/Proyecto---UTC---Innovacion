# Consultas en vivo + comandos psql — UTC Pick Sazón

Guía rápida para **ver los datos que se van ingresando** (cuentas que se registran,
pedidos que se crean, pagos, etc.) directo en PostgreSQL, y los **meta-comandos `\d`**
de psql para tenerlos a la mano.

> BD: `UTC_PROJECT_DB` · usuario: `UTC_PROJECT` · contenedor Docker: `utc_postgres`
> (host `localhost:5433` en este equipo; dentro del contenedor es 5432).

---

## 1) Entrar a psql (sesión interactiva)

```bash
docker exec -it utc_postgres psql -U UTC_PROJECT -d UTC_PROJECT_DB
```

Una sola consulta sin entrar (modo `-c`):

```bash
docker exec -i utc_postgres psql -U UTC_PROJECT -d UTC_PROJECT_DB -c "SELECT count(*) FROM orders;"
```

Salir: `\q`

---

## 2) Meta-comandos `\d` (estructura)

| Comando | Qué muestra |
| --- | --- |
| `\l` | Lista de bases de datos |
| `\dt` | **Tablas** del esquema actual |
| `\d nombre_tabla` | **Estructura** de una tabla (columnas, tipos, índices, FKs) |
| `\d+ nombre_tabla` | Igual + tamaño y descripción |
| `\dT+` | Tipos **enum** (order_status, product_status, payment_method, payment_status, user_role) y sus valores |
| `\di` | Índices |
| `\du` | Roles/usuarios de la BD |
| `\dn` | Esquemas |
| `\x` | Modo **expandido** on/off (útil para filas anchas; muestra columna por línea) |
| `\timing` | Mide cuánto tarda cada consulta |
| `\dt+` | Tablas con tamaño en disco |

Ejemplos:

```sql
\dt
\d orders
\d order_items
\dT+ order_status
```

---

## 3) Consultas sobre los datos que se van ingresando

### Productos (el menú)
```sql
SELECT name, price, category, status, is_available, reoffer_price
FROM products
ORDER BY category, name;
```

### Cuentas registradas (usuarios) — las nuevas aparecen arriba
```sql
SELECT email, first_name, last_name, role, created_at
FROM user_profile
ORDER BY created_at DESC;
```

### Pedidos en vivo (con su dueño) — los nuevos primero
```sql
SELECT o.id,
       u.email                         AS cliente,
       o.status,
       o.total_amount                  AS total,
       o.created_at
FROM orders o
JOIN user_profile u ON u.id = o.user_profile_id
ORDER BY o.created_at DESC
LIMIT 20;
```

### Detalle completo de UN pedido (líneas + pago)
```sql
-- reemplaza el id por el del pedido
SELECT u.email AS cliente, o.status, o.total_amount, pay.method, pay.status AS pago
FROM orders o
JOIN user_profile u ON u.id = o.user_profile_id
LEFT JOIN payments pay ON pay.order_id = o.id
WHERE o.id = '00000000-0000-0000-0000-000000000000';

SELECT pr.name, oi.quantity, oi.unit_price, oi.subtotal
FROM order_items oi
JOIN products pr ON pr.id = oi.product_id
WHERE oi.order_id = '00000000-0000-0000-0000-000000000000';
```

### Cuántos pedidos hay por estado
```sql
SELECT status, count(*)
FROM orders
GROUP BY status
ORDER BY count(*) DESC;
```

### Semáforo de congestión (D-019): pedidos en cola ahora mismo
```sql
SELECT count(*) AS en_cola
FROM orders
WHERE status IN ('pending', 'preparing', 'ready');
-- Verde < 5 · Amarillo 5–10 · Rojo > 10
```

### Pagos por método y estado
```sql
SELECT method, status, count(*), sum(amount) AS monto
FROM payments
GROUP BY method, status
ORDER BY method;
```

### Conteos rápidos de todo
```sql
SELECT
  (SELECT count(*) FROM products)     AS productos,
  (SELECT count(*) FROM user_profile) AS usuarios,
  (SELECT count(*) FROM orders)       AS pedidos,
  (SELECT count(*) FROM payments)     AS pagos;
```

---

## 4) "Ver en vivo" mientras pruebas la app

Re-corre esta consulta cada vez que crees una cuenta o un pedido en la app para
ver cómo entra el dato (en sesión interactiva, flecha ↑ y Enter):

```sql
SELECT u.email, o.status, o.total_amount, o.created_at
FROM orders o JOIN user_profile u ON u.id = o.user_profile_id
ORDER BY o.created_at DESC LIMIT 5;
```

---

## 5) Limpiar los pedidos en vivo (dejar 0 pedidos, conservar productos + usuarios)

Borra **todo lo generado en vivo** (pedidos, líneas, pagos, tiempos) sin tocar el
menú ni las cuentas. Recomendado: **`TRUNCATE`** — más rápido que `DELETE` y
**`RESTART IDENTITY`** reinicia los contadores (para que el próximo número de pedido
vuelva a arrancar desde el principio; relevante con la numeración `U-00001`).
`CASCADE` resuelve el orden de las llaves foráneas automáticamente:

```bash
docker exec -i utc_postgres psql -U UTC_PROJECT -d UTC_PROJECT_DB -c \
  "TRUNCATE payments, preparation_times, order_items, orders RESTART IDENTITY CASCADE;"
```

> Verificado 2026-06-29: pasó de 4 pedidos / 5 líneas / 4 pagos / 2 tiempos → 0,
> conservando 10 productos y los usuarios. NO toca `products` ni `user_profile`
> (son tablas padre; `TRUNCATE ... CASCADE` solo vacía las hijas listadas).

Confirmar que quedó limpio:

```bash
docker exec -i utc_postgres psql -U UTC_PROJECT -d UTC_PROJECT_DB -c \
  "SELECT (SELECT count(*) FROM orders) AS pedidos, (SELECT count(*) FROM products) AS productos, (SELECT count(*) FROM user_profile) AS usuarios;"
```

Alternativa con `DELETE` (equivalente, sin reiniciar contadores):

```bash
docker exec -i utc_postgres psql -U UTC_PROJECT -d UTC_PROJECT_DB -c \
  "DELETE FROM preparation_times; DELETE FROM payments; DELETE FROM order_items; DELETE FROM orders;"
```

(Para borrar un pedido puntual: `DELETE FROM orders WHERE id='<uuid>';` — la línea
y el pago se borran en cascada.)

> ⚠️ `TRUNCATE user_profile` o `products` borraría cuentas/menú. Para un reinicio
> total y recargar la semilla, ver el bloque `REINICIO` en `infra/postgres/seed-demo.sql`.

> Relacionado: `consultas-sql.md` (consultas del modelo) y `datos-demo.md`.
