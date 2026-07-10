import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * OUTBOX de notificaciones (bounded context `notifications`, D-045). Materializa los Domain
 * Events de pedido (BR-012) dentro de la tx del cambio de estado. Es la fuente de verdad del
 * servidor para las notificaciones (el cliente la lee por GET /notifications/mine).
 *
 * - FK a orders(id) ON DELETE CASCADE: una notificación no sobrevive a su pedido.
 * - UNIQUE(order_id, event_type): de-dup de BR-012 a nivel BD (el handler inserta con
 *   ON CONFLICT DO NOTHING → un evento repetido nunca aborta la tx del pedido).
 * - Índice (recipient_user_id, occurred_at): sirve GET /mine (Postgres lo escanea hacia atrás
 *   para el ORDER BY occurred_at DESC). Plano para que coincida con el @Index de la entidad
 *   (TypeORM no expresa DESC en el decorador) y no haya divergencia entidad↔BD.
 */
export class AddNotificationsOutbox1782940000000 implements MigrationInterface {
  name = 'AddNotificationsOutbox1782940000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "order_id" uuid NOT NULL,
        "order_number" integer NOT NULL,
        "recipient_user_id" character varying NOT NULL,
        "event_type" character varying NOT NULL,
        "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_notifications_order_event" UNIQUE ("order_id", "event_type"),
        CONSTRAINT "FK_notifications_order" FOREIGN KEY ("order_id")
          REFERENCES "orders"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_recipient" ON "notifications" ("recipient_user_id", "occurred_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_notifications_recipient"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
  }
}
