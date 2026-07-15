// Barrel de infraestructura: re-exporta el vocabulario de dominio para que las entidades
// TypeORM (@Column enum) y las migraciones lo consuman SIN que el dominio dependa de infra.
//
// - OrderStatus: fuente única en el slice de pedidos (modules/orders/domain/entities/Order).
// - UserRole/ProductStatus/PaymentMethod/PaymentStatus: vocabulario de los contextos clásicos
//   (src/domain/enums). Los valores string son idénticos, así que las columnas enum no cambian.
export { OrderStatus } from '../../../modules/orders/domain/entities/Order';
export {
  UserRole,
  ProductStatus,
  PaymentMethod,
  PaymentStatus,
  FinishedGoodSource,
  StockMovementType,
  StockMovementReason,
} from '../../../domain/enums';
