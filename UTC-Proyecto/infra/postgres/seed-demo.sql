-- ============================================================================
-- UTC Pick Sazón — Semilla mínima (seed)
-- ----------------------------------------------------------------------------
-- SOLO datos indispensables para arrancar la demo: PRODUCTOS (el menú) y
-- USUARIOS (perfiles). NADA de pedidos/pagos/tiempos: esos se generan EN VIVO
-- al usar la app (crear cuenta → hacer pedido → el admin lo ve), que es lo que
-- se quiere demostrar. Coherente con la migración 1782168106072-Init.
--
-- Cómo cargarlo:
--   docker exec -i utc_postgres psql -U UTC_PROJECT -d UTC_PROJECT_DB < infra/postgres/seed-demo.sql
--
-- Idempotente (ON CONFLICT DO NOTHING + UUIDs fijos): se puede re-correr.
--
-- Convenciones de UUID:
--   usuarios   f0000000-...-0000000000NN
--   productos  a0000000-...-0000000000NN  (P01..P10)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) user_profile  (perfil local enlazado a Keycloak)
--    ÚNICO usuario sembrado: el admin (admin@picksazon.app). Los alumnos se crean
--    EN VIVO al registrarse en la app (arranque limpio, decisión 2026-06-29).
--    keycloak_id es filler (las cuentas REALES se crean al registrarse en la
--    app). El login real lo maneja Keycloak por separado.
-- ----------------------------------------------------------------------------
INSERT INTO user_profile (id, keycloak_id, email, first_name, last_name, role, created_at, updated_at) VALUES
  ('f0000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'admin@picksazon.app', 'Coop', 'Admin', 'admin', '2026-06-22 16:00:00+00', '2026-06-22 16:00:00+00')
ON CONFLICT (email) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2) products  (menú inicial, 10 productos del círculo §3.13)
--    Cubre los 5 estados de product_status. base_prep_time_seconds en SEGUNDOS.
-- ----------------------------------------------------------------------------
INSERT INTO products (id, name, description, price, category, image_url, base_prep_time_seconds, stock, min_stock, max_stock, status, is_available, reoffer_price, created_at, updated_at) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Quesadilla de tinga',  'Tortilla de maíz al momento, tinga de pollo, queso oaxaca derretido y crema.',   38.00, 'Antojitos', 'products/quesadilla-tinga.png',  720,  0, 0, NULL, 'por_preparar',      true,  NULL,  '2026-06-22 16:00:00+00', '2026-06-24 09:30:00+00'),
  ('a0000000-0000-4000-8000-000000000002', 'Combo estudiante',     'Quesadilla a elegir + agua fresca natural del día. El antojo completo del recreo.', 50.00, 'Combos',   'products/combo-estudiante.png', 780,  0, 0, NULL, 'por_preparar',      true,  NULL,  '2026-06-22 16:00:00+00', '2026-06-24 09:30:00+00'),
  ('a0000000-0000-4000-8000-000000000003', 'Hamburguesa de la casa','Doble carne, queso amarillo, tocino y aderezo especial de la cooperativa.',       65.00, 'Antojitos', 'products/hamburguesa-casa.png', 900,  0, 0, NULL, 'por_preparar',      true,  NULL,  '2026-06-22 16:00:00+00', '2026-06-24 09:30:00+00'),
  ('a0000000-0000-4000-8000-000000000004', 'Papas con queso',      'Papas a la francesa bañadas en queso amarillo fundido.',                          32.00, 'Snacks',   'products/papas-queso.png',      480,  3, 0, NULL, 'calentando',        true,  24.00, '2026-06-22 16:00:00+00', '2026-06-24 09:50:00+00'),
  ('a0000000-0000-4000-8000-000000000005', 'Agua de jamaica',      'Agua fresca de flor de jamaica, natural y bien fría.',                            18.00, 'Bebidas',  'products/agua-jamaica.png',      30, 24, 6,   40, 'sin_tiempo_espera', true,  NULL,  '2026-06-22 16:00:00+00', '2026-06-24 09:30:00+00'),
  ('a0000000-0000-4000-8000-000000000006', 'Boneless BBQ',         'Trozos de pollo empanizado bañados en salsa BBQ, con aderezo ranch.',             58.00, 'Antojitos', 'products/boneless-bbq.png',     840,  0, 0, NULL, 'por_preparar',      true,  NULL,  '2026-06-22 16:00:00+00', '2026-06-24 09:30:00+00'),
  ('a0000000-0000-4000-8000-000000000007', 'Papas a la francesa',  'Clásicas, doraditas y crujientes, con sal al gusto.',                             28.00, 'Snacks',   'products/papas-francesa.png',   420,  0, 0, NULL, 'no_disponible',     false, NULL,  '2026-06-22 16:00:00+00', '2026-06-24 09:55:00+00'),
  ('a0000000-0000-4000-8000-000000000008', 'Esquites en vaso',     'Granos de elote tierno, mayonesa, queso, limón y chile.',                         22.00, 'Snacks',   'products/esquites-vaso.png',    360,  8, 4,   20, 'preparado',         true,  NULL,  '2026-06-22 16:00:00+00', '2026-06-24 09:30:00+00'),
  ('a0000000-0000-4000-8000-000000000009', 'Gelatina de mosaico',  'Gelatina de leche con cubos de colores, fresquita.',                              15.00, 'Postres',  'products/gelatina-mosaico.png',  30, 18, 6,   30, 'sin_tiempo_espera', true,  NULL,  '2026-06-22 16:00:00+00', '2026-06-24 09:30:00+00'),
  ('a0000000-0000-4000-8000-000000000010', 'Agua de horchata',     'Horchata de arroz con canela, dulce y cremosa.',                                  18.00, 'Bebidas',  'products/agua-horchata.png',     30, 12, 6,   40, 'sin_tiempo_espera', true,  NULL,  '2026-06-22 16:00:00+00', '2026-06-24 09:30:00+00')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================================================
-- REINICIO (opcional) — limpia TODO lo generado en vivo (pedidos/pagos/tiempos)
-- y la semilla, para volver a un arranque limpio. Descomenta y corre:
-- ----------------------------------------------------------------------------
-- BEGIN;
--   DELETE FROM preparation_times;
--   DELETE FROM payments;
--   DELETE FROM order_items;
--   DELETE FROM orders;            -- borra TODOS los pedidos (también los creados en vivo)
--   DELETE FROM products     WHERE id LIKE 'a0000000-%';
--   DELETE FROM user_profile WHERE id LIKE 'f0000000-%';
-- COMMIT;
-- ============================================================================
