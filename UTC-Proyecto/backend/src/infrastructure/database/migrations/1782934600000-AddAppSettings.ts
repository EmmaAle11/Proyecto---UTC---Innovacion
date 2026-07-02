import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * G2 (§3.14): umbrales del semáforo ajustables por el admin, persistidos server-side
 * (fila única `id = 1`). El cálculo de congestión los lee, de modo que el semáforo
 * del alumno refleja el ajuste. Se siembra la fila con los defaults 5/10.
 */
export class AddAppSettings1782934600000 implements MigrationInterface {
  name = 'AddAppSettings1782934600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "app_settings" (
        "id" smallint NOT NULL DEFAULT 1,
        "congestion_yellow" integer NOT NULL DEFAULT 5,
        "congestion_red" integer NOT NULL DEFAULT 10,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_app_settings" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_app_settings_singleton" CHECK ("id" = 1),
        CONSTRAINT "CHK_app_settings_thresholds" CHECK ("congestion_red" > "congestion_yellow")
      )
    `);
    await queryRunner.query(
      `INSERT INTO "app_settings" ("id", "congestion_yellow", "congestion_red") VALUES (1, 5, 10)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "app_settings"`);
  }
}
