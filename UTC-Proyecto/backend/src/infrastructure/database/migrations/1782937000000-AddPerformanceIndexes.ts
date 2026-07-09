import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Índices para los patrones de query reales (order.repository.ts). Postgres NO auto-indexa
 * columnas FK; sin estos, findMine/findAll/congestion/expireOverdue/avgPrepByProduct hacen
 * seq scan de tablas que solo crecen. Varios son PARCIALES (solo indexan las filas activas).
 */
export class AddPerformanceIndexes1782937000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1782937000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // findMine: WHERE user_profile_id ORDER BY created_at DESC
    await queryRunner.query(
      `CREATE INDEX "idx_orders_user_created" ON "orders" ("user_profile_id", "created_at" DESC)`,
    );
    // findAll (cola admin): ORDER BY created_at DESC
    await queryRunner.query(
      `CREATE INDEX "idx_orders_created" ON "orders" ("created_at" DESC)`,
    );
    // congestion (semáforo): WHERE status IN (activos) — índice PARCIAL
    await queryRunner.query(
      `CREATE INDEX "idx_orders_active" ON "orders" ("status") WHERE "status" IN ('pending','preparing','ready')`,
    );
    // expireOverdue: WHERE status='ready' AND pickup_deadline < now — índice PARCIAL
    await queryRunner.query(
      `CREATE INDEX "idx_orders_ready_deadline" ON "orders" ("pickup_deadline") WHERE "status" = 'ready'`,
    );
    // carga de relaciones ORDER_RELATIONS: order_items por pedido (FK sin índice)
    await queryRunner.query(
      `CREATE INDEX "idx_order_items_order" ON "order_items" ("order_id")`,
    );
    // FK RESTRICT product en order_items
    await queryRunner.query(
      `CREATE INDEX "idx_order_items_product" ON "order_items" ("product_id")`,
    );
    // avgPrepByProduct (hot-path de crear pedido): WHERE product_id + window ORDER BY recorded_at DESC
    await queryRunner.query(
      `CREATE INDEX "idx_prep_product_recorded" ON "preparation_times" ("product_id", "recorded_at" DESC)`,
    );
    // FK SET NULL order_item en preparation_times
    await queryRunner.query(
      `CREATE INDEX "idx_prep_order_item" ON "preparation_times" ("order_item_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_prep_order_item"`);
    await queryRunner.query(`DROP INDEX "idx_prep_product_recorded"`);
    await queryRunner.query(`DROP INDEX "idx_order_items_product"`);
    await queryRunner.query(`DROP INDEX "idx_order_items_order"`);
    await queryRunner.query(`DROP INDEX "idx_orders_ready_deadline"`);
    await queryRunner.query(`DROP INDEX "idx_orders_active"`);
    await queryRunner.query(`DROP INDEX "idx_orders_created"`);
    await queryRunner.query(`DROP INDEX "idx_orders_user_created"`);
  }
}
