# Roadmap — UTC Pick Sazón 8 Semanas

**Documentos maestros para ejecución del MVP de tesis.**

---

## 📋 Planes

### 1. **MASTER_PLAN_8WEEKS.md**
3 frentes paralelos en 8 semanas (semana-by-semana detallado):
- ✅ OWASP ASVS L2 (seguridad)
- ✅ Arquitectura DDD + CQRS (modularidad)
- ✅ Admin Panel visual (cálculos, ventas, facturación, minería datos)

**Leer primero:** Confirma equipo, stack, dependencias → START WEEK 1.

---

### 2. **REFACTORING_PLAN_DDD.md** (en `.claude/`)
Refactorización backend: Clean Architecture → DDD Híbrido.
- 6 fases (4 semanas)
- Agregados ricos + Value Objects
- CQRS separado (commands/queries)
- Event Bus para domain events
- Timeline: Fase 1-6 detallada

**Leer después:** Entiende por qué cada semana del master plan hace qué.

---

### 3. **Architecture.md** (en `.claude/`)
Manual de 20+ secciones para arquitecto/agente IA:
- Visión + principios
- Capas y dependencias
- Flujos completos (orden, admin, pagos, autenticación)
- Modelo de datos (entidades, relaciones)
- Invariantes + límites LOC
- Puntos de regresión críticos
- Diagramas Mermaid

**Leer en paralelo:** Actualiza conforme avanza cada semana.

---

## 🗂️ Estructura Recomendada

```
docs/
├── roadmap/                        ← TÚ ESTÁS AQUÍ
│   ├── README.md                   (este archivo)
│   ├── MASTER_PLAN_8WEEKS.md       (plan maestro + sprints)
│   ├── SEMANA_1.md                 (tareas específicas, en progreso)
│   ├── SEMANA_2.md
│   └── ...
├── arquitectura/
│   ├── decisiones.md               (ADRs D-001..D-047)
│   └── ...
├── OWASP/
│   ├── README.md                   (checklist L2)
│   └── ...
└── ...
```

---

## 🚀 Cómo Usar Este Roadmap

### Lunes de cada semana:
1. Abre `MASTER_PLAN_8WEEKS.md` → sección correspondiente (SEMANA X)
2. Copia tareas a tu board (Trello/Jira/GitHub Issues)
3. Actualiza `.claude/Architecture.md` conforme avanza

### Diariamente:
- **Backend dev:** Sigue REFACTORING_PLAN_DDD.md (Fase actual)
- **Frontend dev:** Sigue MASTER_PLAN_8WEEKS.md (Semana actual)
- **Security:** Sigue MASTER_PLAN_8WEEKS.md (FRENTE 1 — OWASP)

### Gate (§22, fin de semana):
- Verifica que el cumplimiento alcanzado ≥ 95% del plan semanal
- Si < 95%: reajusta semana siguiente (no avances a siguiente Fase)

---

## ⚙️ Stack Confirmado (Completar)

- [ ] **Equipo:** N personas (especificar roles)
- [ ] **Backend:** NestJS 11 + TypeORM + PostgreSQL 16 ✅
- [ ] **Frontend cliente:** React Native + Expo SDK 56 ✅
- [ ] **Admin panel:** React Web (vite + recharts) ← **DECIDE**
- [ ] **Repo:** Mismo (`frontend-admin/`) o separado? ← **DECIDE**

---

## 📊 Métricas Semanales

Al fin de cada semana, reportar:

| Métrica | Objetivo | Alcance | % |
|---------|----------|---------|---|
| Commits | ~2-3 por dev | ? | ? |
| Tests | +20% cobertura | ? | ? |
| LOC | < alertas (ver Architecture.md) | ? | ? |
| Bugs abiertos | 0 críticos, < 5 alerta | ? | ? |
| OWASP L2 items | +5-10 por semana | ? | ? |

---

## 🎯 Entregables Finales (Semana 8)

- ✅ Backend: tsc 0, 75%+ tests, 0 regresiones
- ✅ Admin Panel: Dashboard + Reportes + Facturación + Minería
- ✅ OWASP L2: 100% conformidad certificada
- ✅ Documentación: Architecture.md + D-045..D-047 ADRs
- ✅ Tesis: Ejecutiva + técnica + apéndices (ready)

---

**Inicio:** 2026-07-07  
**Deadline:** 2026-09-07 (8 semanas)

¿Listo para START WEEK 1? ⚡
