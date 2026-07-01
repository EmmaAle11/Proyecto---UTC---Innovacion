import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Pedido programado (recogida a hora fija). `scheduled_for` = hora de recogida
 * elegida por el cliente (NULL = pedido inmediato). El backend valida ≥30 min de
 * anticipación y mismo día; la "hora de empezar" se deriva en la respuesta.
 */
export class AddScheduledFor1782933496666 implements MigrationInterface {
  name = 'AddScheduledFor1782933496666';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "scheduled_for" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "scheduled_for"`);
  }
}
