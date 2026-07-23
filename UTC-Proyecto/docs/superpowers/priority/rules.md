# UTC PICK SAZÓN — Reglas operativas

Fuente de decisiones: `docs/arquitectura/decisiones.md`. Ante conflicto: **ADR → regla de negocio (BR) → regla operativa**. El mapa de responsables, prefijos y zonas de cambio vive en `docs/arquitectura/code-map.md`.

## 0. Evidencia o bloqueo

- Declara un resultado solo con evidencia real: archivo/diff leído, comando y salida, prueba, consulta o validación visual.
- No inventes resultados, logs, usuarios, tokens, endpoints, tablas, fuentes ni cifras. Si no se ejecutó: **No ejecutado; no verificado**.
- Ante error, salida inesperada o validación incompleta: detente, reporta `BLOQUEADO` y corrige antes de cerrar.
- Cierre mínimo: qué se revisó/ejecutó, resultado, riesgos y lo no validado.

## 2. Entender antes de cambiar

Antes: define el objetivo, lee los archivos afectados y sus llamadores, y analiza rutas, contratos, DTO, entidades, migraciones, UI y pruebas. Después: revisa `git diff`, dependencias, tipos, imports, contratos front-back y regresión. No edites a ciegas ni hagas fixes aislados: corrige la causa compartida.

## 3. Frontend (FSD)

`app` configura; `pages` son pantallas; `widgets` agrupan UI; `features` son acciones; `entities` son negocio; `shared` es reutilizable. `shared` no importa de `features`; una feature no importa otra. La lógica de negocio no vive en componentes ni las llamadas API fuera de `features/*/api` o `entities/*/api`. Mantener Expo SDK 56 y TypeScript.

## 4. Backend (Hexagonal + DDD + Vertical Slice)

Cada contexto usa `contracts`, `domain`, `application`, `infrastructure`, `presentation` y `tests`. Presentation llama Application; Application depende de puertos del Domain; Infrastructure implementa esos puertos. Domain no depende de capas externas. Controllers orquestan HTTP; DTO validan; guards protegen; `DomainError` es el error uniforme. `orders` usa DDD táctico; `products` es slice pragmático; `auth/settings/payments` pueden conservar capas clásicas.

## 6–14. Plataforma y calidad

- **Auth (#6):** Keycloak es la única autenticación; JWT RS256/JWKS, MFA TOTP para admin y roles autorizados en backend.
- **Entrada (#7):** todo endpoint recibe DTO con `class-validator`; no body libre, `any` innecesario, IDs/textos libres para catálogo, valores negativos o estados inventados.
- **Rate limit (#8):** login 5/min, pedido 10/min, productos 60/min y privilegiadas 30/min; exceder devuelve 429 sin escritura.
- **Datos (#11):** PostgreSQL/TypeORM con migraciones, constraints e índices; no cambios manuales no reproducibles.
- **Docker (#12):** stack local documentado y validado con `docker compose ps/logs`.
- **Diseño (#14):** identidad Editorial Street-Food; accesibilidad, contraste y consistencia. Diseño nunca rebaja seguridad ni reglas de negocio.

## 16. Git y secretos

No incluir secretos, `.env`, tokens, credenciales, `node_modules`, `dist`, `coverage` ni logs. Evitar `commit -a` y cambios no relacionados. Revisar status/diff y usar el prefijo del code map. Los commits, merges y pushes los ejecuta el usuario salvo orden explícita para hacerlo.

## 18–24. Verificación, entrega y documentos

- Ejecutar según impacto: backend `lint`, `build`, `test`; frontend `lint`, `typecheck`; infraestructura `docker compose ps/logs`; BD con conexión y migración real.
- Definition of Done: archivos leídos, diff revisado, validaciones y resultados, riesgos, pendientes y confianza justificada.
- Prioridad: funcionamiento, seguridad, claridad, arquitectura, explicación, diseño y optimización; seguridad no se omite.
- Gate #22: un cambio planificado requiere evidencia de workflows y regresión; se aplica solo con 95–100% de confianza y sin hallazgos P0–P5 no resueltos o refutados.
- Actualizar en el mismo cambio los documentos vivos aplicables (`propuesta`, `Algoritmo-ejecucion`, ADR y `.claude/Architecture.md`) y el CHANGELOG para features relevantes, fixes críticos, migraciones, arquitectura o configuración.

## 38, 40–45. Forma de trabajar

- Toda explicación solicitada incluye frente técnico verificable y analogía que conserve el significado.
- Evalúa críticamente requisitos y propuestas; explica evidencia, riesgos y contraejemplos en vez de asentir por defecto.
- Código nuevo: una responsabilidad, reutilización antes de duplicación y comentarios solo para intención/invariantes no obvias.
- Antes de crear código o carpeta, busca su ubicación existente. Para cambios multi-módulo o dependencias nuevas, justifica ubicación, alternativas, dependencia, encapsulamiento, acoplamiento y cohesión. No adoptar patrones por autoridad: el contexto es tesis, un dev y evolución real.

## BR-001 — Solo Pick Up

No hay delivery, repartidor, rutas, costo de envío ni tracking. La geolocalización de sucursal sí es válida.

## BR-002 — Identidad UTC

Solo correo `@edu.utc.mx`, validado por Keycloak; sin anónimos ni correos personales.

## BR-003 y BR-016 — Roles y alcance

Roles: `user` (cliente), `cocina` (acepta/termina), `inventario` (insumos, costos, recetas, merma, ganancia), `mostrador` (cobro, cambio, caja, entrega, reoferta, CFDI) y `admin` (sus tres funciones en una cooperativa). El frontend puede ocultar UI, pero backend autoriza. Cada rol distinto de user tiene exactamente una cooperativa; `branch_id` llega del JWT, nunca del request. No crear `manager`, `owner` o `super-admin` sin autorización. Estado actual: código implementa `user` y `admin`; los demás son alcance pendiente del Plan 01.

## BR-004, BR-005 y BR-008 — Pedido

Estados: `pending → preparing|cancelled`; `preparing → ready|cancelled`; `ready → picked_up|not_picked_up|ready_later`; `ready_later → picked_up|not_picked_up`. Terminales no retroceden. El agregado `Order` valida transiciones. Cocina mueve `pending→preparing→ready`; mostrador entrega/no recogido; admin actúa en su cooperativa; user no modifica estado interno. `ready_at` es hora del servidor y fuente de verdad.

## BR-006 y BR-011 — Reoferta e inventario

`products.stock` es fresco/por hacer, no negativo; cero no bloquea venta y `isAvailable` es el candado. Un pedido no recogido crea un `finished_good`, no devuelve comida a stock. La unidad tiene precio propio, `expires_at`, origen y referencia desde el pedido; una vencida no se vende. El barrido automático crea movimiento de merma y elimina/consume la unidad; inventario puede registrar merma anticipada. Disponibilidad = fresco + preparados no vencidos.

## BR-007 — Preparación

`preparation_times` es la única fuente: promedio de últimas 20 muestras con mínimo 3; si no, usar tiempo base. Nunca usar datos del frontend.

## BR-009 y BR-010 — Pago

Métodos: `mercado_pago`, `paypal`, `tdc`, `tdd`, `efectivo`; son simulados. Efectivo se cobra al entregar. Circuit breaker abierto no cobra, devuelve error controlado y sugiere efectivo; no hay reintentos infinitos ni pagos marcados sin evidencia.

## BR-012–015 — Datos y privacidad

Notificar una vez por outbox ante aceptación, listo, cancelado o no recogido. Métricas: preparación, ventas, pedidos, no recogidos, costos/márgenes/ganancia solo para inventario/admin; no guardar información académica. Un usuario solo consulta sus pedidos y cocina ve código, no identidad del cliente. Backend valida, autoriza, calcula, persiste y decide; frontend muestra y solicita.

## Compatibilidad de referencias

Los identificadores históricos #1, #5, #9, #10, #13, #15, #17, #21, #23, #39, #44 y #46 están absorbidos en las secciones anteriores: #0, BR-003/016, BR-010, BR-004, #3, #0, #16, #0, #16, #18–24 y #38–45, respectivamente. Se preservan como referencias, sin duplicar reglas.
