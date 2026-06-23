# Armonía de Login (Cliente + Admin) · Implementation Plan

> **For agentic workers:** plan enfocado de UI. Pasos con checkbox (`- [ ]`). Cierra con verificación real (rules §0) y gate de confianza 95–100% (rules §22). Git lo ejecuta el usuario (rules §23).

**Goal:** Que `LoginUsuarioScreen` (cliente, naranja) y `LoginAdminScreen` (admin, azul) se vean como **una sola familia** — mismo esqueleto, mismos componentes, mismos radios/espaciados/tipografía — diferenciadas **solo** por el color de rol y el copy. Hoy se ven "async" porque el cliente usa hero inmersivo + hoja blanca y el admin usa banda plana + formulario distinto.

**Dirección elegida (usuario, 2026-06-23): A — Armonía total.** El admin adopta el mismo esqueleto del cliente (hero con degradado + hoja blanca) en azul.

**Architecture:** Extraer los bloques repetidos a componentes reutilizables (FSD §3, no duplicar §13) y reescribir ambas pantallas para consumirlos. Sin cambios de lógica/negocio: se preservan el flujo de auth del cliente (D-014, auto-registro `@utc.edu.mx`) y el mock del admin.

**Tech Stack:** React Native (Expo SDK 56) · TypeScript · expo-linear-gradient · react-native-safe-area-context · lucide-react-native. (Antes de codificar, consultar uso v56 de `expo-linear-gradient`/safe-area — ver `frontend/AGENTS.md`.)

## Global Constraints

- **EVIDENCE OR BLOCK (§0) / FAIL-CLOSED (§1):** cerrar con `tsc`/`lint` verdes + verificación visual en Expo Go.
- **FSD (§3):** átomos reutilizables en `shared/ui`; scaffold compuesto en `widgets/auth`; las pantallas viven en `pages/auth`. Una capa solo importa de capas inferiores.
- **No regresión funcional:** intactos el flujo D-014 del cliente (registro/login, regex `@utc.edu.mx`, `setSession` sin `navigate('Main')`), el mock del admin (`setSession('mock-admin')`) y el guard de sesión.
- **Marca:** color por rol — cliente naranja `#E34100`, admin azul `#021E5E`. El degradado y los acentos cambian por rol; el resto es idéntico.
- **Git (§23):** no se commitea; se deja staged y se propone el commit.

---

## Sistema de diseño compartido (la "familia")

| Pieza | Regla común | Cliente | Admin |
|---|---|---|---|
| Hero | `LinearGradient` full-screen 3 stops + 2 blobs decorativos | naranja `#F0531A→#E34100→#A82C00` | azul `#0A2E7A→#021E5E→#010E2E` |
| Botón atrás | 40×40, radio 12, `rgba(255,255,255,0.16)`, margin 16 | = | = |
| Logo | tarjeta blanca radio 22, `LogoSymbol` 120, sombra | mascota | mascota |
| Título hero | 36px / w800 / blanco / tracking -0.5 (2 líneas) | "Tu antojo,\nal mostrador." | "Panel de\nadministración." |
| Accesorio hero | misma píldora (rgba blanco .16, radio 999) | 3 pills (tiempos/Pick Up/tarjeta) | 1 chip "🛡 Acceso restringido" |
| Hoja blanca | radio sup 30, grabber 42×5, sombra superior, padding 24 | = | = |
| Header de hoja | título 20 w800 `#021E5E` + subtítulo 13.5 `#6C7689` | "Crea tu cuenta" / "Inicia sesión" | "Iniciar sesión" |
| Campo (`BrandField`) | alto **52**, radio 14, borde 1.5 (foco `#E34100`), icono izq, placeholder-only | Nombre/Apellido/correo/contraseña | correo/contraseña |
| CTA (`PrimaryButton`) | full-width, alto 54, radio 16, sombra del color, loading spinner | naranja, sin icono | azul, icono `LogIn` |
| Error | banner `#FDECEC` + `CircleAlert` (idéntico) | = | = |

---

### Task 1: Átomos compartidos en `shared/ui`

**Files:**
- Create: `frontend/src/shared/ui/BrandField.tsx`
- Create: `frontend/src/shared/ui/PrimaryButton.tsx`

- [ ] **Step 1:** `BrandField` — props `{ icon, value, onChangeText, placeholder, focused, onFocus, onBlur, secure?, rightSlot?, hint?, keyboardType?, autoCapitalize? }`. Render: fila icono+`TextInput` (+`rightSlot` para el ojo), alto 52, radio 14, borde 1.5 (foco `#E34100` / `#DEE2EA`), texto `#021E5E`, placeholder `#9BA4B5`. Hint opcional debajo (12px `#6C7689`).
- [ ] **Step 2:** `PrimaryButton` — props `{ label, onPress, color, loading?, icon?, disabled? }`. Render: full-width alto 54, radio 16, `backgroundColor=color`, sombra `color`, `ActivityIndicator`/`icon` + label (w700 15.5 blanco), `opacity` en loading.
- [ ] **Step 3 (verificación):** `npx tsc --noEmit` desde `frontend/` → exit 0.

---

### Task 2: Scaffold compartido `widgets/auth/AuthScaffold`

**Files:**
- Create: `frontend/src/widgets/auth/AuthScaffold.tsx`

- [ ] **Step 1:** Props `{ gradient:[string,string,string], blobTint:string, onBack, title:string, accessory:ReactNode, children:ReactNode }`. Render: `LinearGradient` + 2 blobs (uno con `blobTint`) + `KeyboardAvoidingView` + `SafeAreaView(top)` con botón atrás + hero (tarjeta logo + título + `accessory`) + **hoja blanca** (grabber + `children`). Replica exactamente el esqueleto actual del cliente.
- [ ] **Step 2 (verificación):** `tsc --noEmit` → exit 0.

---

### Task 3: Reescribir `LoginUsuarioScreen` sobre los compartidos

**Files:** Modify `frontend/src/pages/auth/LoginUsuarioScreen.tsx`

- [ ] **Step 1:** Sustituir el JSX por `<AuthScaffold gradient={naranja} ...>` + `BrandField`×(Nombre/Apellido/correo/contraseña) + `PrimaryButton` naranja. **Preservar** estados, `handleSubmit`, regex `@utc.edu.mx`, modos register/login, switch link, disclaimer, `setSession`.
- [ ] **Step 2 (verificación):** `tsc` + `lint` verdes; `grep` confirma que sigue **sin** `navigate('Main')` y con `setSession`.

---

### Task 4: Reescribir `LoginAdminScreen` con hero azul + hoja blanca

**Files:** Modify `frontend/src/pages/auth/LoginAdminScreen.tsx`

- [ ] **Step 1:** Reemplazar banda+form por `<AuthScaffold gradient={azul} accessory={chip acceso restringido} title="Panel de\nadministración">` + `BrandField`×(correo/contraseña con ojo) + `PrimaryButton` azul (icono `LogIn`, "Entrar al panel"). **Preservar** `handleLogin` mock + `setSession({accessToken:'mock-admin',...})` y validaciones.
- [ ] **Step 2 (verificación):** `tsc` + `lint` verdes; `grep` confirma `setSession('mock-admin')` y **sin** `navigate('Main')`.

---

### Task 5: Verificación integral + visual (rules §0, §18, §22)

- [ ] **Step 1:** `cd frontend && npx tsc --noEmit && npm run lint` → ambos exit 0.
- [ ] **Step 2:** `npx expo start` (puerto 8083) → en Expo Go abrir **Welcome → Soy Cliente** y **Welcome → Soy Administrador**; confirmar visualmente que ambas comparten esqueleto/átomos y solo difieren en color/copy. (Evidencia: captura o validación del usuario.)
- [ ] **Step 3:** Cierre DoD (rules §19): Observaciones · Riesgos · Validaciones realizadas · Pendientes · Nivel de confianza (objetivo 95–100%). **No commit** — proponer staging (rules §23).

---

## Fuera de alcance / notas

- **No** se regresa el cliente al flujo Microsoft/Outlook (el `login-usuario.html` de referencia está obsoleto, pre-D-014). Opcional aparte: actualizar ese HTML para que el design-system no engañe.
- **No** se toca el backend, navegación, ni el guard de sesión.
- Riesgo: en pantallas chicas el teclado puede tapar campos del admin → mitigado por `KeyboardAvoidingView` (igual que el cliente).
</content>
