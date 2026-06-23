Circulo de innovación 

1. Ocurrencias
 Resolver el problema de congestión en cooperativa.
 Implementar tecnologías en la cooperativa.
 Crear una app móvil intuitiva.

2. Idea
Crear una aplicación web/móvil amigable, por ejemplo con Expo Go o un framework similar, para una empresa tipo dark kitchen que permita pagos con tarjeta.
La empresa debe mantener un mínimo y máximo de productos con la etiqueta “Preparados”.
    • Implementar pagos con tarjeta mediante plataformas como PayPal y Mercado Libre.
    • La aplicación estará enfocada únicamente en la compra de productos.
    • No será un sistema de envíos.
    • Funcionará bajo la modalidad Pick Up: recoger en tienda.
    • Cada producto deberá indicar un tiempo de espera preestablecido.
    • Utilizar PostgreSQL para almacenar información y calcular tiempos promedio de preparación.
    • Definir los campos mínimos indispensables con estructura primaria usando Primary Key y Foreign Key.
    • Incluir ventanas emergentes, pop-up, y notificaciones push sobre el estado de preparación del pedido.
    • Una vez concluido el pedido, deberá recogerse en un lapso aproximado de 10 a 20 minutos; de lo contrario podrá volver a ofertarse con la tag “Preparados”.
    • Manejar estados de producto:
        ◦ Por preparar, con tiempo estimado de espera.
        ◦ Preparado, listo para recoger.
    • Mostrar cuánto tiempo lleva preparado cada producto.
3. Tecnologías a utilizar
Frontend
Se utilizará:
    • Expo Go
    • TypeScript
    • Tailwind / NativeWind
    • Arquitectura FSD
Backend
Se utilizará:
    • NestJS
    • TypeScript
    • Controllers
    • Services
    • TypeORM
Base de datos
Se utilizará:
    • PostgreSQL
    • Docker
La base de datos correrá de forma local mediante Docker.
Tablas principales:
    • users
    • products
    • orders
    • order_items
    • payments
    • preparation_times


Autenticación
Se utilizará:
    • Keycloak
    • Docker
Keycloak correrá de forma local mediante Docker.
Seguridad
Medidas principales:
    • JWT para autenticación.
    • Roles para permisos.
    • DTO Validation para validar inputs.
    • Rate limiting para evitar abuso.
    • MFA para administradores.
    • Circuit breaker para pagos.
4. Flujo general del sistema
Usuario
→ App Expo Go / Panel usuario 
→ Backend NestJS
→ PostgreSQL
Admin
→ App Expo Go / Panel Admin
→ Keycloak con MFA
→ Backend NestJS
→ PostgreSQL
5. Flujo de pedido
Usuario inicia sesión
→ selecciona producto (Preparado o Con tiempo de espera) 
→ revisa tiempo estimado
→ confirma pedido
→ realiza pago
→ backend registra pedido
→ dark kitchen prepara producto
→ admin cambia estado a "Listo para recoger"
→ usuario recibe notificación
→ usuario recoge pedido
6. Estados del pedido
    • Pendiente
    • En preparación
    • Listo para recoger
    • Recogido
    • No recogido
    • Cancelado
    • Listo para recoger después
7. Estados del producto
    • Por preparar
    • Preparado, listo para recoger
    • Preparado | Sin tiempo de espera
    • Calentando tu alimento
    • No disponible
8. Manejo de productos preparados
La empresa deberá mantener un mínimo y máximo de productos con etiqueta “Preparados”.
Estos productos podrán mostrarse como:
Preparado | Sin tiempo de espera
Esto indica que el producto ya está listo y puede recogerse casi de inmediato.
El sistema también mostrará cuánto tiempo lleva preparado cada producto, para que el administrador pueda tomar decisiones sobre su venta, reoferta o cambio de estado.
9. Caso: alumno no recoge su pedido
Cuando un alumno realiza un pedido, el sistema considera que la orden estará lista en un máximo aproximado de 10 a 15 minutos.
Una vez que el pedido esté listo, el alumno tendrá un margen aproximado de 10 a 20 minutos para recogerlo.
Si el alumno no recoge el pedido dentro de ese tiempo, la aplicación mostrará una confirmación:
Tu pedido está listo desde hace varios minutos.

¿Deseas cancelar tu orden o extender tu tiempo para recogerla después?
Opciones:
Cancelar orden
Extender para después

10. Si el alumno cancela
El alimento puede volver a ofertarse con la etiqueta:
Preparado | Sin tiempo de espera
Esto aplica porque el alimento no fue tocado por el cliente y puede venderse como producto preparado.
Si el alimento lleva demasiado tiempo preparado, el indicador ya no deberá mostrarse como:
Preparando tu alimento
Sino como:
Calentando tu alimento
Esto permite comunicar que el alimento ya estaba preparado y únicamente será calentado para entregarse.
11. Si el alumno extiende su tiempo
Si el alumno elige la opción de recoger después, el pedido queda marcado como:
Listo para recoger después
El alumno podrá recogerlo dentro del horario disponible del mismo día.
Si al final del día no recoge el pedido, el dinero se mantiene cobrado y el alimento queda para manejo interno del local.
12. Reoferta y precio dinámico
Para evitar que los alimentos preparados se queden sin vender, el sistema puede incluir una opción de reoferta.
Si un producto lleva cierto tiempo preparado, el administrador puede activar una dinámica tipo:
Pon tu precio
o aplicar un descuento controlado.
La finalidad es vender el producto antes de perderlo, aunque sea con menor ganancia.
Implementación