import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1782168106072 implements MigrationInterface {
  name = 'Init1782168106072';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_profile_role_enum" AS ENUM('admin', 'user')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_profile" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "keycloak_id" uuid NOT NULL, "email" text NOT NULL, "first_name" text NOT NULL, "last_name" text NOT NULL, "role" "public"."user_profile_role_enum" NOT NULL DEFAULT 'user', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_e336cc51b61c40b1b1731308aa5" UNIQUE ("email"), CONSTRAINT "PK_f44d0cd18cfd80b0fed7806c3b7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f9f1a0cba33231dcfdb2cc4a97" ON "user_profile"  ("keycloak_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_method_enum" AS ENUM('mercado_pago', 'paypal', 'tdc', 'tdd', 'efectivo')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'paid', 'failed', 'refunded')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "method" "public"."payments_method_enum" NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending', "amount" numeric(10,2) NOT NULL, "provider_reference" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "order_id" uuid NOT NULL, CONSTRAINT "REL_b2f7b823a21562eeca20e72b00" UNIQUE ("order_id"), CONSTRAINT "CHK_3ced2a23005e13d7a988b92a17" CHECK ("amount" > 0), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'preparing', 'ready', 'picked_up', 'not_picked_up', 'cancelled', 'ready_later')`,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending', "total_amount" numeric(10,2) NOT NULL DEFAULT '0', "accepted_at" TIMESTAMP WITH TIME ZONE, "estimated_ready_at" TIMESTAMP WITH TIME ZONE, "ready_at" TIMESTAMP WITH TIME ZONE, "pickup_deadline" TIMESTAMP WITH TIME ZONE, "picked_up_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_profile_id" uuid NOT NULL, CONSTRAINT "CHK_da3d4de67e1fd47994814eb5ac" CHECK ("total_amount" >= 0), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "preparation_times" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "duration_seconds" integer NOT NULL, "recorded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "product_id" uuid NOT NULL, "order_item_id" uuid, CONSTRAINT "CHK_1cde147a35c80ac0a3a7f3f2dc" CHECK ("duration_seconds" > 0), CONSTRAINT "PK_fa197b911318282c46b0be46281" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."products_status_enum" AS ENUM('por_preparar', 'preparado', 'sin_tiempo_espera', 'calentando', 'no_disponible')`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" text NOT NULL, "description" text, "price" numeric(10,2) NOT NULL, "category" text NOT NULL, "image_url" text, "base_prep_time_seconds" integer NOT NULL, "stock" integer NOT NULL DEFAULT '0', "min_stock" integer NOT NULL DEFAULT '0', "max_stock" integer, "status" "public"."products_status_enum" NOT NULL DEFAULT 'no_disponible', "is_available" boolean NOT NULL DEFAULT true, "reoffer_price" numeric(10,2), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_8bc9f15614fbe20203012022ff" CHECK ("reoffer_price" > 0), CONSTRAINT "CHK_7d5d6357bb9ac08b1f996fd90c" CHECK ("max_stock" >= "min_stock"), CONSTRAINT "CHK_14819612ddef74dba5c2554416" CHECK ("min_stock" >= 0), CONSTRAINT "CHK_1f5ec29fd762bd3d512d5a0434" CHECK ("stock" >= 0), CONSTRAINT "CHK_f01fc1a31cc78b6cf6fbaecf9d" CHECK ("base_prep_time_seconds" > 0), CONSTRAINT "CHK_ba339f178553051542254ef21d" CHECK ("price" > 0), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "quantity" integer NOT NULL, "unit_price" numeric(10,2) NOT NULL, "subtotal" numeric(10,2) NOT NULL, "prep_time_seconds" integer, "order_id" uuid NOT NULL, "product_id" uuid NOT NULL, CONSTRAINT "CHK_e30480c00df78712ccce4c31ff" CHECK ("subtotal" >= 0), CONSTRAINT "CHK_c30b851643d2e97e7f5135e238" CHECK ("unit_price" > 0), CONSTRAINT "CHK_b3b6503b13c66d4e90598ad46d" CHECK ("quantity" > 0), CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_b2f7b823a21562eeca20e72b006" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_a3f3fcf5c6c77d40078fcb96a29" FOREIGN KEY ("user_profile_id") REFERENCES "user_profile"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "preparation_times" ADD CONSTRAINT "FK_6745f970064e6aa052e8985ff25" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "preparation_times" ADD CONSTRAINT "FK_59d9ef0fa957909db50797c7d1c" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_9263386c35b6b242540f9493b00"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preparation_times" DROP CONSTRAINT "FK_59d9ef0fa957909db50797c7d1c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "preparation_times" DROP CONSTRAINT "FK_6745f970064e6aa052e8985ff25"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_a3f3fcf5c6c77d40078fcb96a29"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_b2f7b823a21562eeca20e72b006"`,
    );
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
    await queryRunner.query(`DROP TABLE "preparation_times"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_method_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f9f1a0cba33231dcfdb2cc4a97"`,
    );
    await queryRunner.query(`DROP TABLE "user_profile"`);
    await queryRunner.query(`DROP TYPE "public"."user_profile_role_enum"`);
  }
}
