import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Escalabilidad (§3.12): el pedido guarda EN QUÉ sucursal se recoge. Como las
 * sucursales son hoy una lista del front (sin tabla propia), persistimos `branch_id`
 * y `branch_name` (texto) para que el pedido quede autodescriptivo. Nullable: los
 * pedidos previos y el arranque de una sola cooperativa siguen válidos.
 */
export class AddOrderBranch1782935000000 implements MigrationInterface {
  name = 'AddOrderBranch1782935000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" ADD "branch_id" text`);
    await queryRunner.query(`ALTER TABLE "orders" ADD "branch_name" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "branch_name"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "branch_id"`);
  }
}
