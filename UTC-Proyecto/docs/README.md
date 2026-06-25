# Documentación — UTC Pick Sazón

> **Pide fácil, recoge con sabor.** App de cooperativa / dark kitchen escolar UTC, modalidad **Pick Up** (sin envíos, BR-001). Esta carpeta reúne toda la documentación del proyecto, **organizada por tema** (sin archivos sueltos).

## Mapa de la documentación

### 📐 Propuesta — qué es y por qué (círculo de innovación)
- [algoritmo-circulo-innovacion.md](propuesta/algoritmo-circulo-innovacion.md) — el círculo completo: Ocurrencia → Idea → Propuesta → Implementación → Valor agregado → Adopción. *(Tono juvenil.)*
- [Algoritmo-ejecucion.md](propuesta/Algoritmo-ejecucion.md) — el algoritmo de **pasos** para construir la propuesta. *(Tono plano y directo.)*

### 🏗️ Arquitectura — cómo está construido
- [architecture-propuesta.md](arquitectura/architecture-propuesta.md) — frontend, backend, **esquema de BD (§5)**, seguridad y flujos.
- [decisiones.md](arquitectura/decisiones.md) — **registro canónico de decisiones** (ADR ligero, D-001…D-021).

### 🗄️ Datos — base de datos y demo
- [datos-demo.md](datos/datos-demo.md) — dataset de demostración (las 6 tablas), tabla por tabla.
- [consultas-sql.md](datos/consultas-sql.md) — consultas SQL listas para la demo.

### ⚙️ Operación — cómo correrlo
- [correr-en-otra-pc.md](operacion/correr-en-otra-pc.md) — **plan completo para clonar y correr el proyecto en otra laptop** (prerrequisitos, runbook paso a paso y trampas verificadas).

### 📚 Histórico — archivos de proceso (no vivos)
- [regresion-2026-06-23.md](historico/regresion-2026-06-23.md) — regresión multi-agente de la Fase 1.
- [revision-reporte-llm-2026-06-25.md](historico/revision-reporte-llm-2026-06-25.md) — verificación (§0) del reporte de seguridad de un LLM (ChatGPT) contra el código real.
- [Reporte-Tecnologias-Algoritmo.html](historico/Reporte-Tecnologias-Algoritmo.html) — reporte inicial de tecnologías. *(Su CSS apuntaba a `design-system/`, ya retirado; queda como archivo.)*

### 📋 Reglas y planes de fase
- [superpowers/priority/rules.md](superpowers/priority/rules.md) — **reglas obligatorias** del proyecto (0–24 + reglas de negocio BR-001…BR-015). Es el path canónico; muchos archivos lo referencian.
- [superpowers/plans/](superpowers/plans/) · [superpowers/specs/](superpowers/specs/) — planes y especificaciones por fase.

---

> **Documentos vivos (regla #24):** el círculo, la ejecución y las decisiones se mantienen **siempre actualizados** conforme avanza el proyecto, cada uno en su tono.
>
> **Nota de archivo:** los planes/specs dentro de `superpowers/` son **registros históricos** del trabajo de cada fase; pueden citar rutas previas a esta reorganización por temas.
