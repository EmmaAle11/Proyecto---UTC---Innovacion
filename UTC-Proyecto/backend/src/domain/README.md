# domain — Vocabulario de dominio de los contextos clásicos (puro, sin framework)

Sólo **vocabulario compartido** de los contextos que NO tienen slice propio en `modules/`
(identity, products-CRUD, payments): hoy, los enums (`enums.ts`).

PROHIBIDO importar NestJS o TypeORM aquí (regla de dependencia: `infrastructure/` puede
borrarse y esto sigue compilando). La infraestructura re-exporta estos enums vía barrel
(`infrastructure/database/entities/enums.ts`) para las columnas `@Column enum`.

Los **puertos de persistencia** (interfaces de repositorio) NO viven aquí: hablan en
entidades TypeORM (modelo compartido, tradeoff clásico D-041), así que su hogar es la capa
que los consume — `application/<contexto>/*.repository.port.ts` — y el adaptador TypeORM en
`infrastructure/` los implementa. El dominio con reglas propias vive en `modules/*/domain`.
