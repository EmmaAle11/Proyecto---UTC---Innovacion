import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Número de pedido secuencial legible (`order_number`) para la cooperativa.
 * Reemplaza el código derivado del UUID en el frontend: el primer pedido es
 * `U-00001` (la app formatea `U-` + 5 dígitos sobre este entero autoincremental).
 * Respaldado por una secuencia propia (arranca en 1) + restricción UNIQUE.
 */
export class AddOrderNumber1782927016881 implements MigrationInterface {
  name = 'AddOrderNumber1782927016881';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SEQUENCE "orders_order_number_seq"`);
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "order_number" integer NOT NULL DEFAULT nextval('orders_order_number_seq')`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "orders_order_number_seq" OWNED BY "orders"."order_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "UQ_orders_order_number" UNIQUE ("order_number")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // La secuencia es OWNED BY la columna → se elimina en cascada al soltar la columna.
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "UQ_orders_order_number"`,
    );
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "order_number"`);
  }
}
