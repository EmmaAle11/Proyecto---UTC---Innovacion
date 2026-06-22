# UTC Pick Sazón — Design System (referencia recortada)

Referencia de marca de **UTC Pick Sazón** (app de pedidos Pick Up de la cooperativa UTC). Este directorio es **referencia**, no código de la app; la app vive en `frontend/`. Es una versión **recortada** del proyecto de Claude Design — lo que no está aquí es re-descargable.

- **Fuente:** Claude Design, projectId `c294ef42-5093-49e5-bf0e-186c8e8af540`.
- **Decisión asociada:** ver `../docs/decisiones.md` (D-004).

## Contenido
- `tokens/` — colores, tipografía, espaciado, base (variables CSS). **Se portan** al theme de `frontend/` (NativeWind).
- `styles.css` — punto de entrada que importa los tokens (lo usan el prototipo y el reporte técnico).
- `assets/` — logos (`logo-mark.svg`, `logo-wordmark.svg`).
- `components/` — por familia (core/forms/commerce): contrato `*.d.ts` + intención `*.prompt.md` de cada componente. **No** hay código ejecutable: los componentes se **reimplementan** en React Native en `frontend/src/shared/ui`.
- `ui_kits/app-mostrador/` — prototipo navegable (HTML) de la **Propuesta B "Mostrador"** (la elegida). Autocontenido; sírvelo por HTTP (no `file://`).

## Marca (resumen)
Azul `#021E5E` · Naranja `#E34100` · acentos de comida (ámbar "por preparar", lima "listo"). Tipografía: Bricolage Grotesque (display), Plus Jakarta Sans (cuerpo), Space Mono (números/códigos). Íconos: Lucide.

> El reporte técnico se movió a `../docs/Reporte-Tecnologias-Algoritmo.html`.
