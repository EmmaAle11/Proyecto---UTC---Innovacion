# Demo en dos teléfonos — Cliente ↔ Administrador

> Cómo demostrar el **intercambio de pedidos en vivo** entre un cliente y la
> cooperativa (admin) usando **dos teléfonos** con el mismo APK (development build).
> Requiere haber hecho antes el build de la sección **4** de
> [`levantar-proyecto.md`](levantar-proyecto.md).

---

## 1) Qué necesitas

- El **APK (development build)** instalado en **los dos** teléfonos Android.
- En la **Mac (host)**, los **4 servicios encendidos a la vez** (sección 4.3 del runbook):
  1. Docker (Postgres + Keycloak) · 2. Backend `:3002` · 3. `cloudflared` · 4. Metro dev-client.

```bash
# 4) Metro (copia la URL que imprimió cloudflared en el paso 3)
cd UTC-Proyecto/frontend
EXPO_PUBLIC_API_URL=https://XXXX.trycloudflare.com npx expo start --tunnel --dev-client
```

---

## 2) Cómo logran AMBOS apuntar al mismo backend

El dev build **no trae el código adentro**: lo carga de tu Metro, y ese bundle ya lleva
la `EXPO_PUBLIC_API_URL` (el backend) **horneada**. Por eso:

1. En **cada** teléfono abres la app **"UTC Pick Sazón"** → aparece la pantalla del
   *dev-client* ("Development servers").
2. **Escaneas el MISMO QR** que muestra la terminal de Metro (o tocas el servidor listado).
3. Ambos descargan el **mismo bundle** → con la **misma URL de backend** → pegan al
   **mismo Postgres**. Comparten datos.

> No hace falta que se conecten al mismo tiempo (el backend guarda todo en Postgres),
> pero para ver el intercambio **en vivo** conviene tener los dos abiertos.

---

## 3) Login (uno de cada rol)

- **Teléfono A — Cliente:** registra/inicia con un correo **`@edu.utc.mx`**.
- **Teléfono B — Administrador:** `admin@picksazon.app` + su contraseña + **código TOTP** (MFA).

---

## 4) Guion de la demo (el intercambio)

1. **Cliente (A)** arma un carrito y hace el pedido → recibe su **número secuencial** (`U-00001`).
2. **Admin (B)** ve el pedido entrar **solo** a su **cola** (GET `/orders/all`).
3. **Admin (B)** lo marca **Aceptado → Listo** (o entregado).
4. **Cliente (A)** ve el estado cambiar y le llega la **notificación** ("tu pedido está listo") 🔔.
5. Bonus: prueba el **semáforo de congestión** (varios pedidos) y un **pedido programado**.

---

## 5) Qué es real y qué es demo (honestidad, regla #0)

- **Pedidos y estados:** reales y compartidos (server-authoritative en Postgres). ✅
- **Sincronización:** por **sondeo (~cada 15 s)** y al **re-enfocar** la pantalla — aparece en
  segundos, **no** al milisegundo.
- **Dinero:** **DEMO.** No hay pasarela de pago real; el "pago" se **registra como dato**
  (método + estado en la tabla `payments`), pero **no mueve dinero** entre cuentas.

---

## 6) Trampas

- Si **reinicias `cloudflared`**, la URL `trycloudflare.com` **cambia** → reinicia Metro con la
  URL nueva y haz que **ambos teléfonos recarguen** el bundle (vuelven a jalar la nueva URL).
- Si apagas **Metro** o **cloudflared**, la app se queda sin código o sin datos.
- El teléfono admin necesita el **TOTP** (app de autenticación) para entrar.
