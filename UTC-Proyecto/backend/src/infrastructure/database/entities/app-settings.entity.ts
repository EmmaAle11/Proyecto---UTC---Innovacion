import {
  Check,
  Column,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

/**
 * Ajustes globales de la cooperativa (fila única, `id = 1`). Hoy: umbrales del
 * semáforo de congestión (G2/§3.14), ajustables por el admin y usados por el
 * cálculo server-side — así el semáforo del ALUMNO también refleja el ajuste.
 */
@Entity('app_settings')
@Check(`"id" = 1`)
@Check(`"congestion_red" > "congestion_yellow"`)
export class AppSettingsEntity {
  @PrimaryColumn('smallint', { default: 1 })
  id: number;

  @Column('int', { name: 'congestion_yellow', default: 5 })
  congestionYellow: number;

  @Column('int', { name: 'congestion_red', default: 10 })
  congestionRed: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  /** Optimistic locking (cierra el lost-update de dos ediciones concurrentes del admin). */
  @VersionColumn()
  version: number;
}
