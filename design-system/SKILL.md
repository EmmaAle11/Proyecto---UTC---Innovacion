---
name: utc-pick-sazon-design
description: Use this skill to generate well-branded interfaces and assets for UTC Pick Sazón (app de pedidos Pick Up de la cooperativa UTC), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files (tokens, guidelines, components, ui_kits, assets).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view, linking `styles.css` for tokens and loading Lucide icons from CDN. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

Key facts to anchor on:
- **Marca:** Azul institucional `#021E5E` + Naranja institucional `#E34100` sobre blanco. Acentos de comida: ámbar (por preparar), verde lima (listo), naranja (re-ofertado).
- **Tipografía:** Bricolage Grotesque (display), Plus Jakarta Sans (cuerpo/UI), Space Mono (precios/tiempos/códigos).
- **Idioma:** español, tuteo, tono cercano y con sabor. Botones en sentence case.
- **Producto:** pedidos Pick Up (recoger en tienda), tiempos de espera visibles, estados Por preparar → Listo, ventana de recogida 10–20 min, re-oferta con tag “Preparados”. Login con cuenta UTC vía Outlook/Microsoft (Keycloak). Pagos: Mercado Pago, PayPal, TDC, TDD y efectivo al recoger.
- **Íconos:** Lucide (línea, stroke 2px) por CDN.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
