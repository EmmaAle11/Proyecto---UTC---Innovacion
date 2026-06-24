# Brand — UTC Pick Sazón

Másters del logo (mascota verde antojada). Fuente de verdad del arte de marca; las copias que usa la app viven en `frontend/assets/` (`logo.png`, `logo-symbol.png`, `logo-lockup.png`).

- `logo_utc_hq.png` — máster super-resolución (2132×2172). De aquí se generan los tamaños que necesite la app.
- `logo_utc.jpeg` — original (533×543).

La identidad visual del producto ("Editorial Street-Food", D-020) vive en código: `frontend/src/shared/theme/tokens.ts` (colores, tipografías, sombras) + primitivas `frontend/src/shared/ui/Type.tsx`. El antiguo `design-system/` de referencia se retiró (consumido en las pantallas + superado por el sistema en código).
