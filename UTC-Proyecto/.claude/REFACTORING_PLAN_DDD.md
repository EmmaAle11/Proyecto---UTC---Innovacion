# Plan de Refactorización DDD — UTC Pick Sazón

**Objetivo:** Migrar Clean Architecture → DDD Híbrido en 4 semanas.
**Escala:** Backend NestJS + TypeORM + Keycloak.
**Criterio de éxito:** 0 regresiones (todos los tests verdes), arquitectura más expresiva.

---

## Resumen Ejecutivo

Actualmente el backend está bien estructurado en capas (clean architecture), pero el **domain** es anémico: solo repositorios. Necesitamos entidades ricas con comportamiento, agregados, value objects y reglas de negocio explícitas.

**Cambio:** Order/Product/Settings/UserProfile dejan de ser "modelos de BD" y se convierten en **agregados de dominio** que expresan las reglas del negocio.

---

## Fase 0: Inventario de cambios sin commitear (AHORA)

**Estado actual en disco:**
- `domain/order/`, `domain/product/`, `domain/settings/`, `domain/user-profile/` → solo `.repository.ts` (interfaces)
- `infrastructure/database/repositories/` → implementaciones TypeORM
- Application services (`orders.service.ts`, etc.) → modificados para inyectar repositorios, pero aún contienen lógica que debería estar en agregados
- Presentation modules → wireados con los nuevos repositorios

**Acción inmediata:**
1. Commit `D-037` (inventario stock) EN TOP de estos cambios (asume el nuevo domain repository)
2. Los cambios sin commitear forman la "base" de la refactorización

---

## Fase 1: Entidades y Agregados de Dominio (Semana 1)

### 1.1 Order Aggregate

**Archivos a crear:**

```
domain/order/
├── Order.ts                    (agregado raíz)
├── OrderItem.ts                (value object dentro del agregado)
├── OrderNumber.ts              (value object: número secuencial U-00001)
├── OrderStatus.ts              (enum con helpers: canTransitionTo, isTerminal)
├── OrderPolicy.ts              (reglas de negocio: transiciones válidas, stock, cancelación)
├── DomainEvents/
│   ├── OrderCreated.ts
│   ├── OrderAccepted.ts
│   ├── OrderReady.ts
│   ├── OrderCancelled.ts
│   └── OrderNotPickedUp.ts
├── Policies/
│   └── OrderTransitionPolicy.ts
└── order.repository.ts         (interfaz: actualizarla con nuevas firmas)
```

**Responsabilidades de Order.ts:**
- Encapsular items, estado, tiempos (aceptado, listo, recogido).
- **Método `canTransitionTo(newStatus)`**: pregunta a `OrderTransitionPolicy` si es válida.
- **Método `reserve(productId, qty)`**: aplica la lógica de stock (GREATEST(0, stock - qty)). Emite `OrderAccepted` event.
- **Método `release()`**: invierte la reserva. Emite `OrderNotPickedUp` event.
- **Invariante:** nunca crear un Order sin usuario, sin ítems, sin monto positivo.

**Impacto en Application:**
- `orders.service.ts` delega transiciones a `order.canTransitionTo()` y `order.reserve()`.
- El service **orquesta**, no duplica lógica.

---

### 1.2 Product Aggregate

**Archivos a crear:**

```
domain/product/
├── Product.ts                  (agregado raíz)
├── Money.ts                    (value object: precio en pesos)
├── ProductStatus.ts            (enum con helpers)
├── ReofferPrice.ts             (value object opcional)
├── PreparedStock.ts            (value object: min/max/current con invariantes)
├── DomainEvents/
│   ├── ProductCreated.ts
│   ├── ProductUpdated.ts
│   └── ProductStockChanged.ts
└── product.repository.ts       (interfaz)
```

**Responsabilidades de Product.ts:**
- Encapsular precio, estado, foto, preparación, stock.
- **Método `isAvailable()`**: pregunta estado + stock (no bloquea en 0, pero sí en NO_DISPONIBLE).
- **Método `adjustStock(delta)`**: cambia current, respeta min/max, emite evento.
- **Invariante:** precio > 0, prep_time > 0, min_stock ≤ max_stock.

---

### 1.3 Value Objects Compartidos

```
domain/shared/
├── BranchId.ts                 (id de sucursal, type-safe)
├── UserId.ts                   (keycloak sub, type-safe)
├── OrderNumber.ts              (U-00001 format, auto-incremento lógico)
├── Money.ts                    (precio/monto, con rounding rules)
├── TimeRange.ts                (horario de operación)
└── Coordinates.ts              (lat/lon de geolocalización)
```

**Beneficio:** Type safety. Un `BranchId` no es intercambiable con `UserId`.

---

### 1.4 Domain Services

```
domain/order/services/
├── OrderDomainService.ts       (si la lógica cruza múltiples agregados)
```

Ejemplos:
- ¿Puede el usuario cancelar su propio pedido? (cruza Order + User).
- ¿Hay suficiente stock en la rama? (cruza Order + Product).

---

## Fase 2: Application Layer — Orquestación (Semana 1-2)

### 2.1 Refactor Application Services

**Patrón actual:**
```typescript
// ❌ Antes: lógica de negocio en el service
async createOrder(dto: CreateOrderDto, user: JwtUser) {
  // validar usuario
  // cargar productos
  // calcular total
  // validar transiciones
  // actualizar stock
  // persistir
}
```

**Patrón nuevo:**
```typescript
// ✅ Después: service orquesta agregados
async createOrder(dto: CreateOrderDto, user: JwtUser): Promise<Order> {
  const userProfile = await this.userProfileRepo.findById(user.sub);
  if (!userProfile) throw new UserNotFound();
  
  const products = await this.productRepo.findByIds(dto.items.map(i => i.productId));
  const order = Order.create({ user: userProfile, items: products, ... });
  
  // Order ya validó internamente:
  // - usuario existe
  // - ítems son válidos
  // - no hay duplicados
  // - total > 0
  
  await this.orderRepo.save(order);
  await this.eventBus.publish(order.domainEvents);
  
  return order;
}
```

**No hay CQRS explícito** (commands/queries separadas en carpetas), pero el service es **limpio y delegador**.

---

### 2.2 Reorganización de Application Services

Cambio mínimo: mantener `orders.service.ts`, `products.service.ts`, etc., pero **simplificar**.

```
application/
├── orders/
│   ├── orders.service.ts       (refactorizado, solo orquestación)
│   ├── dto/                    (CreateOrderDto, UpdateOrderStatusDto, etc.)
│   └── ...
├── products/
│   ├── products.service.ts     (refactorizado)
│   └── ...
```

Cada service:
1. Valida entrada (DTO).
2. Carga agregados del repositorio.
3. Ejecuta operación en el agregado (p. ej. `order.transitionTo(READY)`).
4. Persiste cambios.
5. Publica eventos de dominio.

---

## Fase 3: Repositories — Implementación TypeORM (Semana 2)

### 3.1 TypeORM Repositories

Las **interfaces** ya existen en `domain/order/order.repository.ts`, etc.

Las **implementaciones** viven en `infrastructure/database/repositories/typeorm-order.repository.ts`.

**Lo que cambia:**
- `typeorm-order.repository.ts` retorna **Order aggregate** (no OrderEntity).
- Mapea entre `OrderEntity` (ORM) y `Order` (dominio).

```typescript
// En typeorm-order.repository.ts
async findById(id: string): Promise<Order | null> {
  const entity = await this.db.getRepository(OrderEntity).findOne({ where: { id } });
  if (!entity) return null;
  
  // Mapear de ORM a dominio
  return Order.fromPersistence({
    id: entity.id,
    status: entity.status,
    items: entity.items.map(it => OrderItem.create(...)),
    ...
  });
}

async save(order: Order): Promise<void> {
  const entity = order.toPersistence();
  await this.db.getRepository(OrderEntity).save(entity);
}
```

---

## Fase 4: Presentation Layer — Wiring (Semana 2-3)

### 4.1 Controllers

Los controllers **NO cambian de responsabilidad**, pero sí apuntan a las nuevas interfaces:

```typescript
@Post(':id/accept')
async acceptOrder(@Param('id') orderId: string) {
  const order = await this.orderService.acceptOrder(orderId);
  return this.toResponse(order);  // mapear Order → DTO de respuesta
}
```

---

## Fase 5: Testing e Integración (Semana 3-4)

### 5.1 Unit Tests por Agregado

```
domain/order/__tests__/
├── Order.spec.ts               (teste invariantes, transiciones)
├── OrderPolicy.spec.ts
└── ...
```

Ejemplo:
```typescript
describe('Order', () => {
  it('no permite transición invalid: PICKED_UP → PREPARING', () => {
    const order = Order.create({ status: PICKED_UP, ... });
    expect(() => order.canTransitionTo(PREPARING)).toThrow(InvalidTransition);
  });
  
  it('reserve descuenta stock correctamente', () => {
    const order = Order.create(...);
    order.reserve('product-1', 2);
    expect(order.pendingReservations).toContain({ productId: 'product-1', qty: 2 });
  });
});
```

### 5.2 Integration Tests

```
application/orders/__tests__/
├── orders.service.integration.spec.ts
```

Testan:
- E2E: crear pedido → aceptar → listo → recogido.
- Stock descuenta correctamente en cada paso.
- Eventos de dominio se emiten.

### 5.3 Regression Tests

Ejecutar suite completa (jest) para garantizar 0 regresiones.

---

## Fase 6: Documentación y ADRs (Semana 4)

### 6.1 Architecture.md

Documentar:
- Por qué existe cada agregado.
- Cómo fluyen los datos (React → Service → Aggregate → Repository → DB).
- Invariantes de cada agregado.
- Puntos de regresión.

### 6.2 ADR — D-045

Decisión arquitectónica:
- **Título:** DDD Híbrido: Entidades Ricas + Clean Architecture.
- **Contexto:** backend comienza anémico, crece lógica en servicios.
- **Decisión:** mover reglas a agregados; mantener services limpios.
- **Consecuencias:** más fácil de cambiar, más fácil de testear, menos "mágico".

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|---|---|---|
| Regresión en pedidos | Media | Alto | Suite de tests + 2 personas revisando |
| Mapping ORM ↔ Dominio falla | Media | Alto | Tests unitarios de mapper, ejemplos reales |
| Cambio en BD sin sincronizar dominio | Baja | Crítico | Invariante: nunca cambiar schema sin actualizar Order.ts |
| Cambio en lógica de stock rompe otros flujos | Alta | Alto | Tests de integración de stock + CI |

---

## Dependencias Críticas

1. **Mi trabajo D-037 (inventario)** debe estar commiteado ANTES de empezar Fase 1.
   - La lógica de `reserve()`/`release()` en Order.ts depende de D-037.

2. **Los cambios sin commitear** (`domain/order/order.repository.ts`, etc.) son la base.
   - No tocar hasta tener plan confirmado.

3. **Keycloak + JWT:** No cambia. Order simplemente tiene `userId` (keycloak sub).

4. **PostgreSQL schema:** No cambia. Solo reinterpretación desde dominio.

---

## Líneas de Código — Límites

(Ver Architecture.md para detalles, pero adelanto:)

| Módulo | Objetivo | Alerta | Crítico |
|--------|----------|--------|---------|
| Agregado (Order.ts) | 200 | 300 | 400 |
| Application Service | 200 | 350 | 500 |
| Controller | 100 | 150 | 200 |
| Repository impl. | 300 | 400 | 500 |
| Value Object | 50 | 100 | 150 |
| Domain Service | 150 | 250 | 350 |

**Métrica semanal:** reportar LOC de archivos que crecen. Si Order.ts → 400 líneas, refactor en misma semana.

---

## Timeline

| Semana | Hito | Commit |
|--------|------|--------|
| 1 (hoy) | D-037 committeado + Fase 1 Order/Product agregados listos | feat(domain): agregados Order, Product, Value Objects (D-045) |
| 1-2 | Fase 2 Services refactorizados | refactor(application): services delegan a agregados |
| 2 | Fase 3 Repositories mappean dominio ↔ ORM | refactor(infrastructure): TypeORM repositories retornan agregados |
| 2-3 | Fase 4 Presentation wiring (controllers siguen siendo controllers) | - (sin cambios funcionales) |
| 3-4 | Fase 5 Tests + regresión | test(domain): suite de agregados verde |
| 4 | Fase 6 Docs + Architecture.md completado | docs: Architecture.md + D-045 |

---

## Próximos Pasos Inmediatos

1. **Confirmar plan** (tú): ¿OK con las fases y timeline?
2. **Commitear D-037** (yo): cambios sin commitear de inventario.
3. **Crear Architecture.md** (yo): introducción + estructura de alto nivel + flujo Order.
4. **Comenzar Fase 1** (yo): Order.ts + value objects.

---

**Preguntas abiertas:**
- ¿En 2 meses necesitamos CQRS separadas (commands/queries folders) o services limpios es suficiente?
- ¿Campos calculados (ej: `order.estimatedReadyTime`) viven en Order.ts o son DTOs?
- ¿Domain events se publican a un event bus o se loguean solo en audit?
