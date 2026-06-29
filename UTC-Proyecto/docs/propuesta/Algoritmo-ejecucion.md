UTC Pick Sazón
Pide fácil, recoge con sabor.

Este documento es la fase de **Implementación** del círculo de innovación: el algoritmo concreto para construir todo lo que vive en la **Propuesta** (ver `algoritmo-circulo-innovacion.md`, §3).

Objetivo
Resolver el problema de congestión en la cooperativa escolar, principalmente en horarios donde los alumnos salen a desayunar, la solución debe poder ser aplicada en cualquier modalidad (Escolarizada | Ejecutiva), en cualquier horario y en cualquier sucursal o plantel.

¿Para quien va dirigido?
Para alumnos, maestros, personal escolar, cualquier persona que desee y pueda comprar en la cooperativa escolar, y a los dirigentes de la cooperativa para facilitar la gestión de la congestión del alumnado.

¿Cómo se va a dirigir?
A través de arquitecturas definidas, tecnologías concretas que permitirán la creación de una app movil.

Nota a considerar
Se estarán haciendo constante pruebas en el editor de texto elegido y en el framework a trabajar.

Algoritmo de ejecución
1.- Se definirá el alcancé de la aplicación a través de los 3 primeros flujos del proceso de innovación los cuales son:
Ocurrencia
Idea
Propuesta (Tocará tema de alcance, usuarios, auth, funcionalidades, tecnologías , arquitectura , distribución, etc.) Se explayará más al detalle en esta sección.

Cuando se tenga la propuesta se procederá a generar el diseño de la(s) pantalla(s) que tendrá la página web.

2.- Definir diseño y paleta de colores, la paleta de colores está definida con los siguientes códigos hexadecimales:
| Variante            |         Hex |
| ------------------- | ----------: |
| Azul institucional  | **#021E5E** |
| Azul alterno        | **#0A2E7A** |
| Naranja principal   | **#E34100** |
| Naranja alterno     | **#F26336** |
Se deben crear dos diseños diferentes para el posible usuario dependiendo del perfil
1 .- Pantalla de Colaborador de la cooperativa (dark kitchen
2 .- Pantalla de Usuario con próposito de usar la plataforma

3.- Una vez definido los estilos a elegir para
- Welcome Page
- Login Page
- Logo
- Nombre
- Eslogan

Procederemos a levantar los servicios necesarios como:
- Node.js
- Docker
- Puertos 5432 (PostgreSQL) y 8080 (Keycloak), etc.

Construiremos las imagenes de Postgre.sql y Keycloack, tecnologías determinadas desde la propuesta.

4.- Cuando se tenga el servicio en linea, vamos a establecer de forma concreta la distribición de las carpetas quedando de la siguiente forma:
UTC-Proyecto/
  frontend/        (la app Expo: pantallas del alumno)
  backend/         (NestJS: la lógica y la conexión a la base de datos)
  infra/           (Docker: PostgreSQL + Keycloak)
  brand/           (másters del logo; el sistema de diseño vive en frontend/src/shared/theme + ui)
  docs/            (este documento, la propuesta y las decisiones)

5.- Construir las pantallas del alumno (cliente):
- Welcome y Login con el correo institucional (@edu.utc.mx).
- Inicio: el menú con fotos, precios y el tiempo de espera de cada cosa, más el carril de "listos para llevar ya" y el buscador.
- Detalle del producto, carrito y checkout (pago con Mercado Pago, PayPal, tarjeta o efectivo al recoger).
- Seguimiento del pedido (con su código de recogida y su número de turno) y las pestañas de Pedidos y Perfil.

6.- Construir el panel del administrador (la cooperativa):
- Dar de alta y editar el menú (productos, precios, fotos y el stock de "Preparados").
- Recibir los pedidos y marcarlos como "Listo" (eso le asigna el número de turno al alumno).
- Ver el semáforo de congestión en vivo: menos de 5 = Verde, de 5 a 10 = Amarillo, más de 10 = Rojo (parámetros y visibilidad en §12).
- Manejar la reoferta / "Pon tu precio" para vender lo que ya está hecho.
- Cerrar sesión y ajustar su cuenta: accesibilidad (texto grande, alto contraste, reducir movimiento) y personalización funcional (nombre y horario de la cooperativa, y los umbrales del semáforo, que cambian el color de la cola al instante).
- Los pedidos son los mismos para el administrador y para el alumno: lo que el administrador marca le aparece al alumno al instante, y los pedidos que el alumno envía entran solos a esta cola.

7.- Conectar todo con la base de datos:
- Guardar productos, pedidos, pagos y tiempos en PostgreSQL (las 6 tablas).
- Que el backend valide quién es quién (alumno o administrador) con Keycloak + JWT antes de dejar hacer nada.

8.- Sumar las funciones que de verdad descongestionan: número de turno, pedido programado y el semáforo, más las notificaciones de "tu pedido está listo".

9.- Probar con alumnos reales, corregir lo que confunda y dejar todo listo para la demo a la cooperativa. Tras el arranque se le da un periodo de adopción de 1 mes: si en ese mes una buena parte de los alumnos ya pide por la app y baja la congestión del recreo, se considera un éxito y se amplía.

10.- Escalabilidad — selección de sucursal por geolocalización
Hoy la app atiende una sola cooperativa: UTC, Calz. de Tlalpan 639, Álamos, Benito Juárez, 03400, Ciudad de México; por eso el encabezado "Recoges en · Cooperativa UTC" es fijo.
Para escalar a más planteles, ese encabezado se vuelve un botón accionable:
- Ubicación del usuario con expo-location
- Cooperativa más cercana por distancia preseleccionada automáticamente.
- Tocar el encabezado abre la lista de sucursales para elegir manualmente; esa lista es también el respaldo si se niega el permiso de ubicación.

11.- Menú inicial de la cooperativa
La aplicación arranca con un menú base pensado para el recreo. La cooperativa puede cambiarlo cuando lo necesite (productos, precios y disponibilidad). Estos son los productos y sus precios:
- Quesadilla de tinga — $38 (se prepara en ~12 minutos)
- Combo estudiante — $50 (se prepara ~13 minutos)
- Hamburguesa de la casa — $65 (se prepara ~15 minutos)
- Papas con queso — $32 (se prepara ~8 minutos)
- Agua de jamaica — $18 (lista para llevar)
- Boneless BBQ — $58 (se prepara ~14 minutos)
- Papas a la francesa — $28 (se prepara ~7 minutos)
- Esquites en vaso — $22 (se prepara ~6 minutos)
- Gelatina de mosaico — $15 (lista para llevar)
- Agua de horchata — $18 (lista para llevar)
Las aguas frescas y la gelatina suelen estar listas para llevar de inmediato; los demás se preparan al momento mostrando su tiempo de espera. Cada producto lleva su foto, que arranca con una imagen provisional y se puede reemplazar.

12.- Semáforo de congestión (parámetros y visibilidad)
El semáforo mide en vivo qué tan cargada está la cooperativa. Lo calcula el backend (no el frontend) como el número de pedidos en cola: los pedidos en estado pending, preparing y ready. No cuentan ready_later, picked_up, not_picked_up ni cancelled.
Umbrales (parámetros ajustables, UMBRAL_AMARILLO = 5 y UMBRAL_ROJO = 10):
- Verde: menos de 5 pedidos en cola (n < 5).
- Amarillo: de 5 a 10 pedidos en cola (5 ≤ n ≤ 10).
- Rojo: más de 10 pedidos en cola (n > 10).
Lo ven los dos perfiles: el administrador con el conteo exacto (para decidir cuándo empujar los pedidos programados) y el cliente con el color y una etiqueta (tranquila / concurrida / llena) para decidir cuándo pedir o recoger. El cálculo usa la hora del servidor.
