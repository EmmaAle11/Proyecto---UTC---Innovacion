import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

/**
 * Cooperativa = sucursal independiente (F1, BR-003, decisión del propietario 2026-10-21).
 * Fuente de verdad de la organización: una cooperativa pertenece a un GRUPO (Grupo UTC,
 * Grupo Lotus…) pero es independiente — los pedidos de una NO aplican en otra (aislamiento
 * total por cooperativa, estilo McDonald's). El `branch_id` del JWT/pedido referencia esta `id`.
 *
 * Nota de alcance: esta tabla es ADITIVA. El cableado de FK desde `orders.branch_id` (hoy texto
 * libre nullable) se hará como lote propio con su mapa de migración de datos legacy (regla: sin FK
 * hasta confirmar el dual-write; no se migra dato legacy sin contar huérfanos).
 */
@Entity('cooperativa')
@Index('idx_cooperativa_grupo', ['grupo'])
export class CooperativaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Nombre visible de la cooperativa/sucursal (p. ej. "UTC Tlalpan"). */
  @Column('text')
  nombre: string;

  /** Grupo al que pertenece (p. ej. "Grupo UTC", "Grupo Lotus"). Agrupa, no comparte pedidos. */
  @Column('text')
  grupo: string;

  /** Activa: una cooperativa inactiva no recibe pedidos nuevos (soft-disable, no se borra el historial). */
  @Column('boolean', { default: true })
  activa: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  /** Optimistic locking para ediciones concurrentes del admin. */
  @VersionColumn()
  version: number;
}
