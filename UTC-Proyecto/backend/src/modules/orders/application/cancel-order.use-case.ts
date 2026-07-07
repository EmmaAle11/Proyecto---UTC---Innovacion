import { DomainError } from '../../../kernel/domain/DomainError';
import { UseCase } from '../../../kernel/domain/UseCase';
import { OrderRepositoryPort } from '../domain/ports/order.repository.port';

export interface CancelOrderInput {
  orderId: string;
  ownerUserId: string;
}

/** No encontrado / no es tuyo. Subtipo de DomainError → la presentación lo mapea a 404. */
export class OrderNotFoundError extends DomainError {}

/**
 * Caso de uso PLANO (regla 46: sin commands/queries hasta ~20 casos).
 * Orquesta: carga por el puerto (que ya filtra por dueño), aplica la regla del
 * agregado y persiste. La invariante vive en Order, no aquí.
 */
export class CancelOrder implements UseCase<CancelOrderInput, void> {
  constructor(private readonly orders: OrderRepositoryPort) {}

  async execute({ orderId, ownerUserId }: CancelOrderInput): Promise<void> {
    const order = await this.orders.findOwned(orderId, ownerUserId);
    if (!order) {
      throw new OrderNotFoundError('Pedido no encontrado');
    }
    order.cancelByOwner();
    await this.orders.save(order);
  }
}
