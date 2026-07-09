import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fuerza en la BD invariantes que hoy solo garantiza el código (defensa en profundidad).
 * - subtotal = round(unit_price * quantity, 2)         (dato derivado, antes solo >= 0)
 * - status ↔ timestamps                                 (un READY sin ready_at es inrepresentable)
 * - congestion_yellow >= 0                              (antes solo red > yellow)
 * - total_amount = SUM(order_items.subtotal)            (constraint trigger DIFERIDA: valida al COMMIT)
 * - payment.amount = orders.total_amount                (trigger BEFORE)
 */
export class AddIntegrityConstraints1782936000000
  implements MigrationInterface
{
  name = 'AddIntegrityConstraints1782936000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- CHECKs de fila ---
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "CHK_order_items_subtotal_derived" CHECK ("subtotal" = round("unit_price" * "quantity", 2))`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "CHK_orders_accepted_at" CHECK ("status" NOT IN ('preparing','ready','ready_later','picked_up','not_picked_up') OR "accepted_at" IS NOT NULL)`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "CHK_orders_ready_ts" CHECK ("status" NOT IN ('ready','ready_later','picked_up','not_picked_up') OR ("ready_at" IS NOT NULL AND "pickup_deadline" IS NOT NULL))`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "CHK_orders_picked_up_at" CHECK ("status" <> 'picked_up' OR "picked_up_at" IS NOT NULL)`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ADD CONSTRAINT "CHK_app_settings_yellow_positive" CHECK ("congestion_yellow" >= 0)`,
    );

    // --- Trigger DIFERIDO: total_amount = SUM(subtotal). Diferido para permitir el orden
    // insert(order) → insert(items) dentro de la misma tx; valida al COMMIT. ---
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION check_order_total() RETURNS trigger AS $$
      DECLARE oid uuid; expected numeric(10,2); actual numeric(10,2);
      BEGIN
        oid := COALESCE(NEW.order_id, OLD.order_id);
        SELECT total_amount INTO actual FROM orders WHERE id = oid;
        IF actual IS NULL THEN RETURN NULL; END IF; -- pedido borrado (CASCADE)
        SELECT COALESCE(SUM(subtotal), 0) INTO expected FROM order_items WHERE order_id = oid;
        IF actual <> expected THEN
          RAISE EXCEPTION 'orders.total_amount (%) != SUM(order_items.subtotal) (%) para pedido %', actual, expected, oid;
        END IF;
        RETURN NULL;
      END; $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE CONSTRAINT TRIGGER trg_order_total
        AFTER INSERT OR UPDATE OR DELETE ON order_items
        DEFERRABLE INITIALLY DEFERRED
        FOR EACH ROW EXECUTE FUNCTION check_order_total();
    `);

    // --- Trigger: payment.amount = orders.total_amount (el pedido ya existe al insertar el pago) ---
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION check_payment_amount() RETURNS trigger AS $$
      DECLARE total numeric(10,2);
      BEGIN
        SELECT total_amount INTO total FROM orders WHERE id = NEW.order_id;
        IF NEW.amount <> total THEN
          RAISE EXCEPTION 'payments.amount (%) != orders.total_amount (%) para pedido %', NEW.amount, total, NEW.order_id;
        END IF;
        RETURN NEW;
      END; $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_payment_amount
        BEFORE INSERT OR UPDATE ON payments
        FOR EACH ROW EXECUTE FUNCTION check_payment_amount();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_payment_amount ON payments`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS check_payment_amount()`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_order_total ON order_items`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS check_order_total()`);
    await queryRunner.query(`ALTER TABLE "app_settings" DROP CONSTRAINT "CHK_app_settings_yellow_positive"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "CHK_orders_picked_up_at"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "CHK_orders_ready_ts"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "CHK_orders_accepted_at"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "CHK_order_items_subtotal_derived"`);
  }
}
