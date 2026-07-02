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
- Seguimiento del pedido (con su código de recogida, que es un número de pedido secuencial tipo U-00001) y las pestañas de Pedidos y Perfil.

6.- Construir el panel del administrador (la cooperativa):
- Dar de alta y editar el menú (productos, precios, fotos y el stock de "Preparados").
- Recibir los pedidos y marcarlos como "Listo" (eso dispara el aviso al alumno con su número de pedido).
- Ver el semáforo de congestión en vivo: menos de 5 = Verde, de 5 a 10 = Amarillo, más de 10 = Rojo (parámetros y visibilidad en §12).
- Manejar la reoferta / "Pon tu precio" para vender lo que ya está hecho.
- Cerrar sesión y ajustar su cuenta: accesibilidad (texto grande, alto contraste, reducir movimiento) y personalización funcional (nombre y horario de la cooperativa, y los umbrales del semáforo, que cambian el color de la cola al instante).
- Los pedidos son los mismos para el administrador y para el alumno: lo que el administrador marca le aparece al alumno al instante, y los pedidos que el alumno envía entran solos a esta cola.

7.- Conectar todo con la base de datos:
- Guardar productos, pedidos, pagos y tiempos en PostgreSQL (las 6 tablas).
- Que el backend valide quién es quién (alumno o administrador) con Keycloak + JWT antes de dejar hacer nada.

8.- Sumar las funciones que de verdad descongestionan: número de pedido secuencial (U-00001), pedido programado (ver §13) y el semáforo, más las notificaciones de "tu pedido está listo" (llegan tanto en el teléfono como en el navegador).

9.- Probar con alumnos reales, corregir lo que confunda y dejar todo listo para la demo a la cooperativa. Tras el arranque se le da un periodo de adopción de 1 mes: si en ese mes una buena parte de los alumnos ya pide por la app y baja la congestión del recreo, se considera un éxito y se amplía.

10.- Cooperativa por geolocalización — pedido enrutado a la cooperativa correcta
La app trabaja con varias cooperativas UTC y NO precarga ninguna: detecta la más cercana y la asigna, y enruta el pedido a esa cooperativa.
- Ubicación del usuario con expo-location (permiso en primer plano).
- Cooperativa más cercana por distancia, asignada automáticamente (sin default precargado).
- Tocar el encabezado abre la lista para elegir a mano; es el respaldo si se niega el permiso. No se puede pedir sin cooperativa.
- El panel del administrador también detecta por geolocalización qué cooperativa opera (no viene fija).
- Cada pedido guarda su cooperativa y la cola del administrador solo trae los de SU cooperativa: pedir en una y que responda otra ya no pasa (`GET /orders/all?branchId=`).

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

13.- Pedido programado (anticipación y aviso al negocio)
El cliente puede fijar la hora de recogida al momento de pagar. Reglas, validadas por el backend con la hora del servidor:
- Se programa con mínimo 30 minutos de anticipación y para el mismo día; si no cumple, el pedido se rechaza.
- El sistema calcula la hora de empezar a preparar = hora de recogida − el tiempo de preparación estimado del pedido.
- Cuando llega esa hora, se avisa al negocio (notificación en el dispositivo del administrador) para que empiece; en la cola del administrador esos pedidos suben de prioridad y se marcan con "Empezar ahora".
- Un pedido programado entra al semáforo de congestión solo cuando se abre su ventana (dentro de los ~20 minutos previos a la recogida), no antes, para no inflar la cola.
- Como cualquier pedido, lleva su número secuencial (U-00001) y se sigue en vivo hasta recogerlo.

14.- Número de pedido secuencial
Cada pedido recibe un número correlativo legible al crearse (el primero es U-00001, luego U-00002, y así). Ese número es el código de recogida que ve el cliente y con el que el administrador identifica el pedido en su cola. Lo genera la base de datos, de forma única y en orden.

15.- Inteligencia del negocio (panel del administrador)
En el dashboard del administrador hay una tarjeta "Inteligencia del negocio" con dos indicadores que calcula el servidor sobre los pedidos reales (no el teléfono), solo para el admin:
- Producto más vendido: el que suma más unidades vendidas en todos los pedidos; excluye los cancelados.
- Hora pico: la franja horaria del día con más pedidos (ej. 14:00–15:00), medida en la hora local de la cooperativa (no UTC); excluye cancelados.
Sirve para comprar mejor y reforzar la hora fuerte. Es distinto del semáforo (congestión ahorita, §12) y de los tiempos promedio de preparación (§7): esto es la demanda histórica (qué y cuándo se vende).

16.- Cierre de la propuesta (estado 2026-07-02)
Se completaron los detalles que faltaban para que la app haga TODO lo que dice la propuesta (decisiones D-027…D-034):
- Buscador del menú funcional; estado "Calentando tu alimento" y "preparado hace X min" visibles al alumno.
- La base de datos calcula el TIEMPO PROMEDIO de preparación (últimas 20 muestras; con menos de 3, usa el tiempo base) y la app lo usa para estimar.
- El SEMÁFORO se ajusta desde el panel del admin y ese ajuste se guarda en el servidor, así que también cambia el que ve el alumno.
- MÉTRICAS del negocio: producto más vendido y hora pico. AUTO-VENCIMIENTO de la ventana de recogida (pasa a "no recogido" solo).
- ACCESIBILIDAD que de verdad aplica (texto grande, alto contraste, reducir movimiento). FOTO del producto editable por URL.
- La SUCURSAL de recogida viaja con el pedido y se guarda. El acceso de ADMINISTRADOR exige MFA (TOTP) de forma obligatoria.
- PAGO CON TARJETA: formulario real (valida número con Luhn, expiración y CVV; solo guarda los últimos 4) con aprobación SIMULADA, protegida por un CIRCUIT BREAKER. Las pasarelas reales (Mercado Pago/PayPal) quedan fuera del alcance de la demo.

Nota de puerto (este equipo): el backend corre por defecto en el puerto 3002 (el 3001 lo ocupa otro proyecto).
