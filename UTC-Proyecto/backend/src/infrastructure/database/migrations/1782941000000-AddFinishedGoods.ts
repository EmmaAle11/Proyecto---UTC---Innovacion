import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `finished_goods` + `stock_movements` (D-052, Plan 08). Cierra los bugs 1 y 2 del producto terminado:
 *
 * - `finished_goods`: lo YA hecho / rescatado. `expires_at` es lo que ROMPE el bucle infinito de
 *   reoferta (una unidad no recogida caduca y se merma, ya no se revende para siempre). `reoffer_price`
 *   vive AQUÍ (en la unidad), no en el producto → deja de contaminar las ventas frescas (bug 2).
 * - `stock_movements`: auditoría de bajas. Hoy solo MERMA `caducado`; `finished_good_id` es un id suelto
 *   (SIN FK) porque la `finished_good` se elimina al mermarse y el registro debe sobrevivirla.
 *
 * `type`/`reason`/`source` son `text` + CHECK (no enum pg) para que Plan 04 los amplíe sin ALTER TYPE.
 * Índices: (product_id) para disponibilidad, (expires_at) para el barrido de merma, y el parcial de
 * reoferta para el catálogo (solo unidades ofertables).
 */
export class AddFinishedGoods1782941000000 implements MigrationInterface {
  name = 'AddFinishedGoods1782941000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "finished_goods" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "branch_id" text,
        "product_id" uuid NOT NULL,
        "qty" integer NOT NULL,
        "produced_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "is_reoffer" boolean NOT NULL DEFAULT false,
        "reoffer_price" numeric(10,2),
        "source" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_finished_goods" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_finished_goods_qty" CHECK ("qty" >= 0),
        CONSTRAINT "CHK_finished_goods_reoffer_price" CHECK ("reoffer_price" > 0),
        CONSTRAINT "CHK_finished_goods_source" CHECK ("source" IN ('produccion', 'no_recogido', 'cancelado')),
        CONSTRAINT "FK_finished_goods_product" FOREIGN KEY ("product_id")
          REFERENCES "products"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_finished_goods_product" ON "finished_goods" ("product_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_finished_goods_expires" ON "finished_goods" ("expires_at")`,
    );
    // Catálogo: solo las unidades reofertables (parcial → índice pequeño).
    await queryRunner.query(
      `CREATE INDEX "IDX_finished_goods_reoffer" ON "finished_goods" ("product_id", "expires_at")
         WHERE "is_reoffer" = true`,
    );

    await queryRunner.query(
      `CREATE TABLE "stock_movements" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "product_id" uuid NOT NULL,
        "qty" integer NOT NULL,
        "type" text NOT NULL,
        "reason" text NOT NULL,
        "finished_good_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stock_movements" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_stock_movements_qty" CHECK ("qty" > 0),
        CONSTRAINT "CHK_stock_movements_type" CHECK ("type" IN ('merma')),
        CONSTRAINT "CHK_stock_movements_reason" CHECK ("reason" IN ('caducado')),
        CONSTRAINT "FK_stock_movements_product" FOREIGN KEY ("product_id")
          REFERENCES "products"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stock_movements_product" ON "stock_movements" ("product_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_stock_movements_product"`);
    await queryRunner.query(`DROP TABLE "stock_movements"`);
    await queryRunner.query(`DROP INDEX "IDX_finished_goods_reoffer"`);
    await queryRunner.query(`DROP INDEX "IDX_finished_goods_expires"`);
    await queryRunner.query(`DROP INDEX "IDX_finished_goods_product"`);
    await queryRunner.query(`DROP TABLE "finished_goods"`);
  }
}
