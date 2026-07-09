import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Optimistic locking (@VersionColumn) en products y app_settings: cierra el lost-update
 * de dos escrituras concurrentes (el admin editando en dos pestañas / dos admins). TypeORM
 * incrementa `version` en cada save y el UPDATE lleva `WHERE version = <leída>`; si otro
 * cambió la fila, afecta 0 filas y TypeORM lanza OptimisticLockVersionMismatchError.
 */
export class AddOptimisticLocking1782938000000 implements MigrationInterface {
  name = 'AddOptimisticLocking1782938000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD "version" integer NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ADD "version" integer NOT NULL DEFAULT 1`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_settings" DROP COLUMN "version"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "version"`);
  }
}
