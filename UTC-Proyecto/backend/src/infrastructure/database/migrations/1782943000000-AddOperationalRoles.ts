import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * F1 (BR-003): añade los roles operativos cocina/inventario/mostrador al enum de rol de perfil.
 * Fuente: rules.md BR-003/BR-016. Antes solo existían 'admin' y 'user'.
 *
 * Idempotente: `ADD VALUE IF NOT EXISTS` (Postgres 12+; el proyecto usa postgres:16).
 * NO toca filas existentes (añadir un valor de enum es no destructivo).
 *
 * `down` es un NO-OP deliberado: Postgres no permite eliminar un valor de un enum sin
 * recrear el tipo y reescribir toda columna que lo use; revertir aquí sería más destructivo
 * que el cambio. Si hiciera falta revertir, se haría con una migración dedicada que recree
 * el tipo con los dos valores originales tras garantizar que ninguna fila use los nuevos.
 */
export class AddOperationalRoles1782943000000 implements MigrationInterface {
  name = 'AddOperationalRoles1782943000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."user_profile_role_enum" ADD VALUE IF NOT EXISTS 'cocina'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."user_profile_role_enum" ADD VALUE IF NOT EXISTS 'inventario'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."user_profile_role_enum" ADD VALUE IF NOT EXISTS 'mostrador'`,
    );
  }

  public async down(): Promise<void> {
    // NO-OP: ver nota de cabecera. Postgres no soporta DROP VALUE en un enum.
  }
}
