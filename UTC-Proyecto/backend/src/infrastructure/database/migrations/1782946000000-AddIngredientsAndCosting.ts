import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * F2 (plan 04) — Inventario de insumos + costeo CPP. ADITIVA y NO destructiva.
 * Crea: ingredients, ingredient_purchases (lotes/histórico de precios), ingredient_movements
 * (libro mayor append-only), product_ingredients (receta). Añade `cooperativa.iva_acreditable`
 * y `app_settings.food_cost_max`/`price_spike_pct` (D6-bis/D7).
 * NO toca `stock_movements` (esa tabla es del producto terminado/finished_goods, D-052) ni
 * `products.stock` (fresco/por hacer, BR-006). Costeo CPP (decisión F0 2026-10-21, no FIFO).
 *
 * Idempotente (IF NOT EXISTS) y reversible (down elimina solo lo que crea).
 */
export class AddIngredientsAndCosting1782946000000 implements MigrationInterface {
  name = 'AddIngredientsAndCosting1782946000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ingredients" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" text NOT NULL,
        "base_unit" text NOT NULL,
        "yield_pct" numeric(5,4) NOT NULL DEFAULT 1,
        "track_stock" boolean NOT NULL DEFAULT true,
        "iva_rate" numeric(5,4) NOT NULL DEFAULT 0,
        "stock" numeric(14,3) NOT NULL DEFAULT 0,
        "min_stock" numeric(14,3) NOT NULL DEFAULT 0,
        "max_stock" numeric(14,3),
        "avg_unit_cost" numeric(14,6) NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "version" integer NOT NULL,
        CONSTRAINT "PK_ingredients" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_ingredients_base_unit" CHECK ("base_unit" IN ('g','ml','pza')),
        CONSTRAINT "CHK_ingredients_yield" CHECK ("yield_pct" > 0 AND "yield_pct" <= 1),
        CONSTRAINT "CHK_ingredients_stock" CHECK ("stock" >= 0),
        CONSTRAINT "CHK_ingredients_avg_cost" CHECK ("avg_unit_cost" >= 0),
        CONSTRAINT "CHK_ingredients_min_stock" CHECK ("min_stock" >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ingredient_purchases" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "ingredient_id" uuid NOT NULL,
        "qty_purchased" numeric(14,3) NOT NULL,
        "purchase_unit" text NOT NULL,
        "factor_to_base" numeric(14,6) NOT NULL,
        "total_cost" numeric(14,2) NOT NULL,
        "unit_cost" numeric(14,6) NOT NULL,
        "supplier" text,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "purchased_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "registered_by" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ingredient_purchases" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ingredient_purchases_ingredient" FOREIGN KEY ("ingredient_id")
          REFERENCES "ingredients"("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_ingredient_purchases_qty" CHECK ("qty_purchased" > 0),
        CONSTRAINT "CHK_ingredient_purchases_factor" CHECK ("factor_to_base" > 0),
        CONSTRAINT "CHK_ingredient_purchases_total" CHECK ("total_cost" >= 0),
        CONSTRAINT "CHK_ingredient_purchases_unit_cost" CHECK ("unit_cost" >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ingredient_movements" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "ingredient_id" uuid NOT NULL,
        "type" text NOT NULL,
        "qty_delta" numeric(14,3) NOT NULL,
        "unit_cost_at" numeric(14,6) NOT NULL DEFAULT 0,
        "reason" text,
        "order_id" uuid,
        "registered_by" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ingredient_movements" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ingredient_movements_ingredient" FOREIGN KEY ("ingredient_id")
          REFERENCES "ingredients"("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_ingredient_movements_type" CHECK ("type" IN
          ('compra','consumo_venta','merma','ajuste_conteo','devolucion_proveedor'))
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ingredient_movements_ingredient" ON "ingredient_movements" ("ingredient_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_ingredients" (
        "product_id" uuid NOT NULL,
        "ingredient_id" uuid NOT NULL,
        "qty_net" numeric(14,3) NOT NULL,
        "is_default" boolean NOT NULL DEFAULT false,
        "is_customizable" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_product_ingredients" PRIMARY KEY ("product_id","ingredient_id"),
        CONSTRAINT "FK_product_ingredients_product" FOREIGN KEY ("product_id")
          REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_product_ingredients_ingredient" FOREIGN KEY ("ingredient_id")
          REFERENCES "ingredients"("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_product_ingredients_qty" CHECK ("qty_net" > 0)
      )
    `);

    // D6-bis: si la cooperativa acredita el IVA de compra, éste no es costo.
    await queryRunner.query(
      `ALTER TABLE "cooperativa" ADD COLUMN IF NOT EXISTS "iva_acreditable" boolean NOT NULL DEFAULT false`,
    );
    // D7: techo de food cost y umbral de alerta por subida de precio de insumo.
    await queryRunner.query(
      `ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "food_cost_max" numeric(5,4) NOT NULL DEFAULT 0.45`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "price_spike_pct" numeric(5,2) NOT NULL DEFAULT 15`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_settings" DROP COLUMN IF EXISTS "price_spike_pct"`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" DROP COLUMN IF EXISTS "food_cost_max"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cooperativa" DROP COLUMN IF EXISTS "iva_acreditable"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "product_ingredients"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_ingredient_movements_ingredient"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "ingredient_movements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ingredient_purchases"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ingredients"`);
  }
}
