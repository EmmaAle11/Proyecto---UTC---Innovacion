import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * findAll(branchId) (cola del admin filtrada por sucursal, §3.12) hace
 * WHERE branch_id = ? ORDER BY created_at DESC. Sin índice sobre branch_id era un seq scan;
 * este índice compuesto (parcial: solo pedidos con sucursal) lo resuelve sin sort.
 */
export class AddOrderBranchIndex1782939000000 implements MigrationInterface {
  name = 'AddOrderBranchIndex1782939000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "idx_orders_branch_created" ON "orders" ("branch_id", "created_at" DESC) WHERE "branch_id" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_orders_branch_created"`);
  }
}
