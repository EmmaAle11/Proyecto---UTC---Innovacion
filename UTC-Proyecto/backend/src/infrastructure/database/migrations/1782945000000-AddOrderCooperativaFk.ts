import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * UTC-F1-003 · Cablea la FK de la sucursal de recogida hacia la fuente de verdad `cooperativa`.
 *
 * ADITIVA y NO destructiva (plan: 2026-10-21-UTC-F1-003):
 *  - Añade `orders.cooperativa_id uuid NULL` (NO toca el `branch_id`/`branch_name` legacy, que
 *    quedan como columnas autodescriptivas del pedido histórico).
 *  - FK `NOT VALID`: Postgres NO revalida las filas existentes (evita bloqueo largo y no rechaza
 *    datos legacy), pero SÍ hace fail-closed para los INSERT/UPDATE nuevos. El `VALIDATE` del
 *    histórico se hace en ventana aparte, tras el backfill de datos legacy (depende de la auditoría
 *    utc-f1-003-audit.sql — por eso NO se hace aquí).
 *  - Índice parcial para la cola del admin filtrada por cooperativa.
 *
 * El backfill de filas existentes NO va en esta migración: depende de los conteos reales
 * (rama A/B/C del diseño). Esta migración es segura cualquiera sea el estado de los datos.
 */
export class AddOrderCooperativaFk1782945000000 implements MigrationInterface {
  name = 'AddOrderCooperativaFk1782945000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cooperativa_id" uuid`,
    );
    // NOT VALID: no revalida el histórico; sí gatea los nuevos inserts (fail-closed hacia adelante).
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_cooperativa" ` +
        `FOREIGN KEY ("cooperativa_id") REFERENCES "cooperativa"("id") NOT VALID`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_orders_cooperativa" ` +
        `ON "orders" ("cooperativa_id") WHERE "cooperativa_id" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_orders_cooperativa"`);
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "fk_orders_cooperativa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN IF EXISTS "cooperativa_id"`,
    );
  }
}
