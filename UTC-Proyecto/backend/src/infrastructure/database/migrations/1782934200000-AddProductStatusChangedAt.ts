import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * B5 (§3.7): "cuánto tiempo lleva preparado" un producto. `status_changed_at` marca
 * cuándo el producto entró a su estado actual (lo actualiza el service al cambiar
 * `status`). Para productos preparados/calentando, el front deriva "preparado hace
 * X min". Default now() para que las filas existentes tengan un valor válido.
 */
export class AddProductStatusChangedAt1782934200000
  implements MigrationInterface
{
  name = 'AddProductStatusChangedAt1782934200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD "status_changed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "status_changed_at"`,
    );
  }
}
