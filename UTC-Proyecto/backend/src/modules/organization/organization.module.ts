import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CooperativaEntity } from '../../infrastructure/database/entities/cooperativa.entity';
import { COOPERATIVA_CATALOG } from './domain/ports/cooperativa.catalog.port';
import { TypeOrmCooperativaCatalog } from './infrastructure/persistence/cooperativa.repository';

/**
 * Contexto `organization`: fuente de verdad de cooperativas (= sucursales independientes, BR-003).
 * Exporta el puerto `COOPERATIVA_CATALOG` para que otros contextos (p. ej. `orders`) validen la
 * sucursal de recogida sin acoplarse a la infraestructura (Hexagonal).
 */
@Module({
  imports: [TypeOrmModule.forFeature([CooperativaEntity])],
  providers: [
    { provide: COOPERATIVA_CATALOG, useClass: TypeOrmCooperativaCatalog },
  ],
  exports: [COOPERATIVA_CATALOG],
})
export class OrganizationModule {}
