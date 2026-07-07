# Master Plan 8 Semanas — UTC Pick Sazón MVP Tesis

**Objetivo:** Operativa en producción con arquitectura sólida, seguridad certificada (OWASP L2), y admin panel completo.

**Equipo:** (confirmar: ¿N personas? Asumimos 2-3 desarrolladores)

**Deadline:** 2026-09-07 (8 semanas desde ahora)

---

## Frentes Paralelos

```
┌─────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│  FRENTE 1: OWASP L2 │     │  FRENTE 2: ARQUI DDD │     │  FRENTE 3: ADMIN VIS │
│  (Seguridad)        │     │  (Modularidad)       │     │  (Cálculos/Datos)    │
├─────────────────────┤     ├──────────────────────┤     ├──────────────────────┤
│ Semana 1-2:         │     │ Semana 1-4:          │     │ Semana 1:            │
│ - V6 Criptografía   │     │ - Fase 1: Agregados  │     │ - Wireframe          │
│ - V7 Transport      │     │ - Fase 2: CQRS       │     │ - Stack decision     │
│ - V9 CORS           │     │ - Fase 3: Repos      │     │                      │
│ - V14 Config        │     │ - Fase 4: Wiring     │     │ Semana 2-7:          │
│ Verification        │     │                      │     │ - Dashboard (RN/Web) │
│                     │     │ Semana 5-6:          │     │ - Reportes (ventas)  │
│ Semana 3-4:         │     │ - Fase 5: Tests      │     │ - Facturación        │
│ - Pentest real      │     │ - Fase 6: Docs       │     │ - Minería datos      │
│ - Remediar         │     │                      │     │ - Exportar (CSV/PDF) │
│                     │     │ Semana 7-8:          │     │                      │
│ Semana 5-8:         │     │ - Gate (0 regres)    │     │ Semana 8:            │
│ - Auditoría         │     │ - D-045 cerrado      │     │ - Integración BE     │
│ - Certificación     │     │                      │     │ - Tests              │
│ - ADR D-046         │     │                      │     │                      │
└─────────────────────┘     └──────────────────────┘     └──────────────────────┘
     ~15 days                    ~30 days                     ~30 days
  (finalización)            (renovación completa)        (nuevo feature)
```

---

## Sprint-by-Sprint Roadmap

### SEMANA 1 (2026-07-07 a 2026-07-13)

**FRENTE 1 — OWASP L2 (Luis/Emi)**
- [ ] Leer y entender V6/V7/V9/V14 en ASVS Analysis.md
- [ ] Crear issue por cada gap (ej: "bcrypt password hashing para datos sensibles")
- [ ] Plan de remediación detallado (estimación de horas)

**FRENTE 2 — ARQUITECTURA (Emi + 1)**
- [ ] Commitear D-037 (inventario endurecido) ✅ DONE
- [ ] **Fase 1 START:** Crear Order, Product, UserProfile agregados
  - [ ] Order.ts + OrderItem.ts + OrderStatus.ts
  - [ ] OrderPolicy.ts (reglas de transición)
  - [ ] DomainEvents/ carpeta (OrderCreated, OrderReady, etc.)
  - [ ] Value Objects: OrderNumber.ts, Money.ts, BranchId.ts
- [ ] Tests unitarios de agregados (mínimo 60% cobertura)

**FRENTE 3 — ADMIN PANEL (Diseñador/Emi)**
- [ ] ✅ Wireframe de admin dashboard (Figma o papel)
  - [ ] Pantalla home (KPIs: ventas hoy, pedidos en cola, ingresos)
  - [ ] Pantalla reportes (gráficas: ventas por hora, productos top)
  - [ ] Pantalla facturación (tabla de transacciones)
  - [ ] Pantalla minería (tendencias, predicciones)
- [ ] Decisión técnica: ¿ReactJS Web + API Backend o React Native?
  - Recomendación: **React Web** (mejor para reportes/gráficas, admin desktop)
  - Setup: vite + recharts / visx

---

### SEMANA 2 (2026-07-14 a 2026-07-20)

**FRENTE 1 — OWASP L2 (Luis)**
- [ ] Implementar V6: bcrypt para campos sensibles (admin passwords, API keys)
- [ ] Implementar V7: validación extra de HTTPS (check cert validity)
- [ ] Implementar V9: CORS whitelist refinada (solo https://admin.utc.local)
- [ ] Tests de seguridad (ej: intenta CORS desde origin no permitido → 403)

**FRENTE 2 — ARQUITECTURA (Emi + 1)**
- [ ] **Fase 1 CONTINÚA:** Product, UserProfile, Settings agregados
- [ ] Value Objects: Coordinates.ts (geo), TimeRange.ts (horarios)
- [ ] Domain Services: OrderDomainService (lógica que cruza agregados)
- [ ] Repository interfaces actualizadas en domain/
- [ ] Tests: 70%+ cobertura de agregados

**FRENTE 3 — ADMIN PANEL (Dev Frontend)**
- [ ] Setup proyecto React Web (`npm create vite@latest`)
- [ ] Estructura FSD + shared/ui componentes base (Button, Card, Chart)
- [ ] Auth integration (reutilizar JWT del backend)
- [ ] Home dashboard mock (datos hardcodeados)
- [ ] Gráficas base (recharts: ventas/hora, productos top)

---

### SEMANA 3 (2026-07-21 a 2026-07-27)

**FRENTE 1 — OWASP L2 (Luis)**
- [ ] Implementar V14: hardening producción (env vars, secrets rotation)
- [ ] Audit completo de L2 (checklist 70+ items)
- [ ] Crear ADR D-046 (seguridad en producción)
- [ ] Documentar en CHANGELOG

**FRENTE 2 — ARQUITECTURA (Emi + 1)**
- [ ] **Fase 2 START:** CQRS (Commands/Queries handlers)
  - [ ] CreateOrderHandler, AcceptOrderHandler, CancelOrderHandler
  - [ ] GetOrderHandler, GetMetricsHandler, GetCongestionHandler
  - [ ] CommandBus + QueryBus (inyectable en NestJS)
- [ ] Event Bus service (subscribers/handlers)
- [ ] OrderReadyHandler (dispara notificación admin)

**FRENTE 3 — ADMIN PANEL (Frontend Dev)**
- [ ] Integración con API:
  - [ ] GET /orders/all (cola actual)
  - [ ] GET /metrics (ventas, top products)
  - [ ] GET /congestion (semáforo)
- [ ] Dashboard dinámico (datos reales del backend)
- [ ] Tabla de pedidos en vivo (estado, cliente, monto)

---

### SEMANA 4 (2026-07-28 a 2026-08-03)

**FRENTE 1 — OWASP L2 (Luis)**
- [ ] Pentest interno (simular ataques L2)
  - [ ] SQL injection (ej: `' OR 1=1 --`)
  - [ ] XSS en inputs (ej: `<script>alert(1)</script>`)
  - [ ] CSRF (POST sin CSRF token)
  - [ ] Escalación de privilegios (user trata de ser admin)
- [ ] Remediar hallazgos
- [ ] Reporte de conformidad (95%+ L2)

**FRENTE 2 — ARQUITECTURA (Emi + 1)**
- [ ] **Fase 2 CONTINÚA:**
  - [ ] Event handlers completos (OrderCreated, OrderCancelled, etc.)
  - [ ] Integration tests de comandos (E2E: crear pedido → aceptar → listo)
  - [ ] 80%+ cobertura de tests
- [ ] **Fase 3 START:** TypeORM repositories
  - [ ] Mapper de OrderEntity → Order aggregate
  - [ ] Implementaciones de findById, save, transitionStatus con locks
  - [ ] Tests de mapper

**FRENTE 3 — ADMIN PANEL (Frontend)**
- [ ] Reportes:
  - [ ] Ventas por rango de fechas (date picker + gráfica)
  - [ ] Productos más vendidos (gráfica de barras)
  - [ ] Ingresos acumulados (línea temporal)
- [ ] Exportar CSV (ventas, pedidos)
- [ ] Filtros (por sucursal, por fecha, por estado)

---

### SEMANA 5 (2026-08-04 a 2026-08-10)

**FRENTE 1 — OWASP L2 (Luis)**
- [ ] Auditoría final (multi-agente, 3 ángulos)
- [ ] Certificación: "UTC Pick Sazón cumple OWASP ASVS L2"
- [ ] Documento de seguridad para tesis (40-50 páginas)

**FRENTE 2 — ARQUITECTURA (Emi + 1)**
- [ ] **Fase 3 CONTINÚA:** Repositories completos
- [ ] **Fase 4 START:** Presentation wiring
  - [ ] Controllers inyectan CommandBus / QueryBus (no services)
  - [ ] Endpoint `/orders/create` → CreateOrderCommand → CreateOrderHandler
  - [ ] Tests E2E (HTTP POST → command → agregado → BD → response)
- [ ] Regresión: 57+ tests verdes (backend)

**FRENTE 3 — ADMIN PANEL (Frontend)**
- [ ] Facturación:
  - [ ] Tabla de transacciones (id, cliente, monto, método, estado, fecha)
  - [ ] Detalles de transacción (modal)
  - [ ] Filtros (por método, por estado)
  - [ ] Exportar PDF (factura)
- [ ] Integración con backend: GET /transactions, GET /transaction/:id

---

### SEMANA 6 (2026-08-11 a 2026-08-17)

**FRENTE 1 — OWASP L2 (Luis)**
- [ ] Documentación de compliance (para defensa de tesis)
- [ ] Crear ADR D-047 (auditoría final)

**FRENTE 2 — ARQUITECTURA (Emi + 1)**
- [ ] **Fase 5 START:** Tests completos
  - [ ] Unit tests de agregados (Order, Product, etc.)
  - [ ] Integration tests de handlers (CreateOrder E2E)
  - [ ] Regression tests (toda la suite, 0 fallas)
  - [ ] Cobertura: 75%+
- [ ] **Fase 6 START:** Documentación
  - [ ] Architecture.md completado (secciones 5-12)
  - [ ] D-045 ADR finalizado
  - [ ] Diagramas Mermaid actualizados

**FRENTE 3 — ADMIN PANEL (Frontend)**
- [ ] Minería de datos:
  - [ ] Análisis de tendencias (pedidos/día, ingresos/día)
  - [ ] Predicción simple (próxima semana: X pedidos esperados)
  - [ ] Heatmap (qué horas concentran más pedidos)
  - [ ] Top students (quién más ordena)
- [ ] Integración con backend: GET /analytics, GET /predictions

---

### SEMANA 7 (2026-08-18 a 2026-08-24)

**FRENTE 1 — OWASP L2 (Luis)**
- [ ] QA final (verificar todas las recomendaciones aplicadas)
- [ ] Reporte ejecutivo para profesor

**FRENTE 2 — ARQUITECTURA (Emi + 1)**
- [ ] **Fase 6 CONTINÚA:**
  - [ ] Architecture.md finalizado (todas las secciones)
  - [ ] Diagramas: flujos, dependencias, deployment
  - [ ] Checklist de code review (Apéndice A)
- [ ] **Gate (§22):** Confidence 95%+
  - [ ] tsc 0 (backend)
  - [ ] 75%+ tests verdes
  - [ ] 0 regresiones
  - [ ] Auditoría adversarial si hay cambios

**FRENTE 3 — ADMIN PANEL (Frontend)**
- [ ] Polish & UX:
  - [ ] Dark mode / Light mode
  - [ ] Responsive design (mobile + tablet + desktop)
  - [ ] Loading states + error boundaries
  - [ ] Accesibilidad (WCAG A mínimo)
- [ ] Integración final con backend (todas las APIs)
- [ ] Tests: cobertura 60%+

---

### SEMANA 8 (2026-08-25 a 2026-09-07) — SEMANA FINAL

**FRENTE 1 — OWASP L2 (Luis + Emi)**
- [ ] Reporte final de seguridad (para tesis)
- [ ] Presentación de cumplimiento L2 al profesor
- ✅ **Cierre:** OWASP L2 certificado

**FRENTE 2 — ARQUITECTURA (Emi + 1)**
- [ ] **Semana de estabilización:**
  - [ ] Bugs y edge cases finales
  - [ ] Performance review (query optimization si es needed)
  - [ ] Documentación de hotspots (puntos críticos)
- [ ] **Cierre:** D-045 + Architecture.md listos, 0 regresiones
- ✅ Arquitectura validada

**FRENTE 3 — ADMIN PANEL (Dev Frontend + Emi)**
- [ ] **Integración final + QA:**
  - [ ] Tests E2E: crear pedido desde cliente → admin ve en dashboard
  - [ ] Exportar reportes (CSV, PDF, Excel)
  - [ ] Performance: dashboard carga en < 2s
- [ ] **Cierre:** Admin panel productivo
- ✅ Feature completada

---

## Dependencias Críticas

```
SEMANA 1:
  - D-037 (inventario) debe estar committeado ✅
  - OWASP checklist actualizado
  - Wireframe del admin panel

SEMANA 2-3:
  - Fase 1 de arquitectura (agregados) DEBE completarse antes de Fase 2 (CQRS)
  - Admin panel mocks pueden correr en paralelo

SEMANA 4:
  - Fase 2 DEBE estar 80%+ completa antes de Fase 3 (Repositories)
  - Pentest del OWASP depende de que el backend esté estable

SEMANA 5-6:
  - Tests de arquitectura dependen de que Fase 3-4 esté lista
  - Admin panel integración depende de endpoints de backend completos

SEMANA 7-8:
  - Todo debe estar en verde para cierre
  - Sin cambios grandes, solo fixes
```

---

## Tareas Previas (Antes de Semana 1)

- [ ] Crear repo separado para admin panel (si es React Web)
  - O: en mismo repo, carpeta `frontend-admin/` 
  - Decisión: **¿cuál prefieres?**
  
- [ ] Confirmar equipo:
  - Dev 1 (Emi): Backend DDD + Tests
  - Dev 2 (?): Frontend React admin panel
  - Dev 3 (?): OWASP L2 auditoría + seguridad
  
- [ ] Confirmar stack admin panel:
  - **React Web** (vite + recharts) — RECOMENDADO
  - React Native (mismo que cliente)
  - Angular
  
- [ ] Setup CI/CD (GitHub Actions):
  - Backend: `tsc && jest`
  - Frontend: `npm run build && npm run test`

---

## Entregables por Semana

| Semana | Backend | Frontend Admin | OWASP | Docs |
|--------|---------|----------------|-------|------|
| 1 | Agregados base | Wireframe | Gap analysis | Plan |
| 2 | Tests agregados | Dashboard mock | V6/V7 impl | - |
| 3 | CQRS handlers | Reportes | V9/V14 impl | CHANGELOG |
| 4 | Repositories | Exportar CSV | Pentest | D-046 |
| 5 | Integration tests | Facturación | Audit | Architecture.md |
| 6 | Regression gate | Minería datos | Compliance | D-045 |
| 7 | Zero defects | Polish/UX | QA final | README |
| 8 | Cierre | MVP ready | Cert | Tesis ready |

---

## Criterios de Éxito (Gate 22)

### FRENTE 1 — OWASP L2
- [ ] 100% de recomendaciones implementadas
- [ ] Audit por tercero (interno, 3 ángulos)
- [ ] Documento de conformidad firmado

### FRENTE 2 — ARQUITECTURA DDD
- [ ] tsc 0 (TypeScript sin errores)
- [ ] 75%+ cobertura de tests
- [ ] 0 regresiones (57+ tests verdes)
- [ ] D-045 ADR + Architecture.md completados
- [ ] Code review: sin defectos críticos

### FRENTE 3 — ADMIN PANEL
- [ ] Dashboard carga en < 2s
- [ ] Reportes exportables (CSV, PDF)
- [ ] Facturación funcional
- [ ] Minería de datos presente
- [ ] Tests: 60%+ cobertura
- [ ] No hay regresiones en cliente (existe aún)

---

## Riesgos y Mitigaciones

| Riesgo | Prob | Impacto | Mitigación |
|--------|------|--------|-----------|
| Arquitectura toma más tiempo | Media | Alto | Priorizar Phase 1-3, Phase 5-6 puede reducirse |
| Admin panel necesita iteración | Alta | Medio | Wireframes claros semana 1, feedback temprano |
| OWASP tiene gaps inesperados | Baja | Crítico | Auditoria multi-agente, time buffer semana 8 |
| Equipo incompleto | Media | Crítico | Redistribuir tareas (Emi + 1 dev mínimo) |
| Cambios en BD necesarios | Baja | Medio | Migrations desde día 1, testing temprano |

---

## Preguntas Abiertas

1. **¿Cuántas personas en el equipo?** (Asumo 2-3, requerido mínimo 2)
2. **¿Admin panel en React Web o React Native?** (Recomiendo Web)
3. **¿Repo separado o misma carpeta?** (Recomiendo misma, carpeta `frontend-admin/`)
4. **¿Cuántas horas/semana por dev?** (Asumo 40h full-time)
5. **¿Hay diseñador/UX?** (Para admin panel visual)

---

**Siguiente paso:** Confirmar equipo + stack, luego **START WEEK 1**.
