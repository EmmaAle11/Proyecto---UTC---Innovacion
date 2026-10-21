import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CooperativaEntity } from '../../../../infrastructure/database/entities/cooperativa.entity';
import type {
  BranchResolution,
  ICooperativaCatalog,
} from '../../domain/ports/cooperativa.catalog.port';

/**
 * Adapter TypeORM del catálogo de cooperativas. Lectura pura; NO decide política de negocio
 * (eso vive en la aplicación de `orders`). Devuelve el estado de datos observado:
 *  - catálogo vacío → `catalog_empty` (arranque de una sola cooperativa).
 *  - id activo presente → `active`; en otro caso → `not_found` (fail-closed).
 */
@Injectable()
export class TypeOrmCooperativaCatalog implements ICooperativaCatalog {
  constructor(
    @InjectRepository(CooperativaEntity)
    private readonly repo: Repository<CooperativaEntity>,
  ) {}

  async resolveBranch(id: string): Promise<BranchResolution> {
    const total = await this.repo.count();
    if (total === 0) return 'catalog_empty';
    const found = await this.repo.findOne({ where: { id, activa: true } });
    return found ? 'active' : 'not_found';
  }
}
