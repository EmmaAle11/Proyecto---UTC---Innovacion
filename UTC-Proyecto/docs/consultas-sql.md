# Consultas SQL — UTC Pick Sazón (PostgreSQL en Docker)

La BD corre en el contenedor **`utc_postgres`** (imagen `postgres:16`), base **`UTC_PROJECT_DB`**, schema **`public`**. En esta PC el puerto del host es **5433** (mapeado al 5432 interno del contenedor).

**Credenciales** (de `backend/.env`, *gitignored*): usuario **`UTC_PROJECT`**; la contraseña es el valor `DB_PASSWORD` de ese archivo.

---

## A) Una consulta rápida (one-off) desde la terminal
```bash
docker exec utc_postgres psql -U UTC_PROJECT -d UTC_PROJECT_DB -c "SELECT * FROM products;"
```

## B) Sesión interactiva (psql) — para correr varias y explorar
```bash
docker exec -it utc_postgres psql -U UTC_PROJECT -d UTC_PROJECT_DB
```
Dentro de `psql` (meta-comandos útiles):
```
\dt          -- listar tablas
\d products  -- describir una tabla (columnas, tipos, PK/FK, CHECKs)
\dT+         -- listar los tipos enum (products_status_enum, orders_status_enum, …)
\du          -- roles
\l           -- bases de datos
\q           -- salir
```

## C) Desde un cliente gráfico en tu PC (DBeaver / pgAdmin / TablePlus)
```
Host: localhost   Puerto: 5433   Base: UTC_PROJECT_DB
Usuario: UTC_PROJECT   Password: (DB_PASSWORD de backend/.env)
```

---

## Consultas de ejemplo (para la demo del profe)
```sql
-- Estructura
\dt
\dT+

docker exec utc_postgres psql -U UTC_PROJECT -d UTC_PROJECT_DB -c 
-- Clientes registrados
SELECT email, first_name, last_name, role, created_at
FROM user_profile ORDER BY created_at;

-- Catálogo
SELECT id, name, category, price, status, stock
FROM products ORDER BY category, name;

-- Productos listos para llevar (rail "Listos ahora")
SELECT name, price, status FROM products
WHERE status IN ('preparado', 'sin_tiempo_espera');

-- Pedidos con su dueño (JOIN orders ↔ user_profile)
SELECT o.id, u.email, o.status, o.total_amount, o.created_at
FROM orders o
JOIN user_profile u ON u.id = o.user_profile_id
ORDER BY o.created_at DESC;

-- Líneas de un pedido (JOIN order_items ↔ products)
SELECT oi.order_id, p.name, oi.quantity, oi.unit_price, oi.subtotal
FROM order_items oi
JOIN products p ON p.id = oi.product_id;

-- Promedio de preparación por producto (BR-007: últimas muestras)
SELECT p.name, round(avg(pt.duration_seconds)) AS prom_segundos, count(*) AS muestras
FROM preparation_times pt
JOIN products p ON p.id = pt.product_id
GROUP BY p.name;
```

> **Nota:** hoy `products` / `orders` están **vacías** (los datos reales llegan en el "turno de datos"). Las consultas funcionan; devolverán 0 filas hasta sembrar el catálogo. `user_profile` sí tiene registros (los clientes creados).
