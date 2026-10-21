import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * F1 (BR-003): tabla catálogo `cooperativa` como fuente de verdad de la organización.
 * Cooperativa = sucursal independiente; pertenece a un grupo (texto). ADITIVA y no destructiva:
 * NO toca `orders.branch_id` (ese cableado de FK es un lote posterior con mapa de datos legacy).
 *
 * Idempotente: `CREATE TABLE IF NOT EXISTS` + índice `IF NOT EXISTS`. `down` elimina la tabla
 * (segura: nada depende de ella todavía).
 */
export class AddCooperativa1782944000000 implements MigrationInterface {
  name = 'AddCooperativa1782944000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cooperativa" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "nombre" text NOT NULL,
        "grupo" text NOT NULL,
        "activa" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "version" integer NOT NULL,
        CONSTRAINT "PK_cooperativa" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_cooperativa_grupo" ON "cooperativa" ("grupo")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_cooperativa_grupo"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cooperativa"`);
  }
}
