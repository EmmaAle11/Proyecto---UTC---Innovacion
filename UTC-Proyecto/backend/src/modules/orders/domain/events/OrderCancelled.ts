import { DomainEvent } from '../../../../kernel/domain/DomainEvent';

export class OrderCancelled extends DomainEvent {
  constructor(public readonly orderId: string) {
    super();
  }
}
