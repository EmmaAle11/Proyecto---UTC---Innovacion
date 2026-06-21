PROYECTO: APP COOPERATIVA / DARK KITCHEN PICK UP

1. FRONTEND
   Tecnología:
   - Expo Go
   - TypeScript
   - Tailwind / NativeWind
   - Arquitectura FSD

   Estructura:
   src/
   ├─ app/              Configuración global
   ├─ pages/            Pantallas principales
   ├─ widgets/          Bloques visuales grandes
   ├─ features/         Acciones del usuario
   ├─ entities/         Modelos del negocio
   └─ shared/           Componentes, helpers, API client

   Funciones:
   - Login de usuario
   - Login de administrador
   - Ver productos disponibles
   - Crear pedido
   - Ver estado del pedido
   - Recibir notificaciones
   - Panel admin para cambiar estados


2. BACKEND
   Tecnología:
   - NestJS
   - TypeScript
   - Controllers
   - Services
   - TypeORM

   Estructura:
   src/
   ├─ modules/
   │  ├─ auth/
   │  ├─ users/
   │  ├─ products/
   │  ├─ orders/
   │  └─ payments/
   ├─ common/
   │  ├─ guards/
   │  ├─ pipes/
   │  ├─ filters/
   │  └─ interceptors/
   └─ database/

   Flujo:
   Controller
   → DTO Validation
   → Service
   → TypeORM Repository
   → PostgreSQL


3. BASE DE DATOS
   Tecnología:
   - PostgreSQL local con Docker

   Tablas principales:
   - users
   - products
   - orders
   - order_items
   - payments
   - preparation_times

   Uso:
   - Guardar usuarios
   - Guardar productos
   - Registrar pedidos
   - Medir tiempos de preparación
   - Calcular promedios históricos


4. AUTH
   Tecnología:
   - Keycloak local con Docker

   Configuración:
   - Realm: utc-food
   - Roles:
     - admin
     - user

   Funciones:
   - Login
   - Registro de usuarios
   - Emisión de JWT
   - Validación de roles
   - MFA solo para administradores


5. SEGURIDAD
   Medidas:
   - JWT para autenticación
   - Roles para permisos
   - DTO validation para validar inputs
   - Rate limiting para evitar abuso
   - MFA para administradores
   - Circuit breaker para pagos

   Ejemplos:
   - Usuario no puede acceder al panel admin
   - Admin debe usar MFA
   - Login limitado a ciertos intentos
   - Si Mercado Pago o PayPal fallan, se corta temporalmente el intento


6. EDITOR
   Tecnología:
   - Visual Studio Code

   Uso:
   - Programación frontend
   - Programación backend
   - Manejo de terminal
   - Git
   - Docker
   - Extensiones para TypeScript, NestJS y Tailwind


7. DISEÑO
   Herramienta:
   - Claude Design

   Uso:
   - Diseño de pantallas
   - Prototipos visuales
   - Guía UX/UI
   - Componentes base
   - Paleta de colores
   - Flujo de usuario


8. FLUJO GENERAL DEL SISTEMA

   Usuario
   → App Expo Go
   → Backend NestJS
   → PostgreSQL

   Admin
   → App Expo Go / Panel Admin
   → Keycloak con MFA
   → Backend NestJS
   → PostgreSQL


9. FLUJO DE PEDIDO

   Usuario inicia sesión
   → selecciona producto
   → confirma pedido
   → backend registra pedido
   → dark kitchen prepara producto
   → admin cambia estado a "listo"
   → usuario recibe notificación
   → usuario recoge pedido


10. ESTADOS DEL PEDIDO

   - Pendiente
   - En preparación
   - Listo para recoger
   - Recogido
   - No recogido
   - Cancelado
