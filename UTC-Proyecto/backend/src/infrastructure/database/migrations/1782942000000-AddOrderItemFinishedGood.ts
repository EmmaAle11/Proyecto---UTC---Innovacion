import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `order_items.finished_good_id` (D-052, Plan 08 bug 2): marca la línea que COMPRÓ una unidad
 * reofertada concreta, para (a) cobrar el precio DE LA UNIDAD y (b) al cancelar, devolver la qty a
 * ESA `finished_good` (no a `products.stock`). Id suelto (sin FK): la `finished_good` se elimina al
 * consumirse/mermarse y la línea debe conservar el rastro. Índice parcial para las devoluciones.
 */
export class AddOrderItemFinishedGood1782942000000
  implements MigrationInterface
{
  name = 'AddOrderItemFinishedGood1782942000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD COLUMN "finished_good_id" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_order_items_finished_good" ON "order_items" ("finished_good_id")
         WHERE "finished_good_id" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_order_items_finished_good"`);
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "finished_good_id"`,
    );
  }
}
