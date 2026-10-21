import { scheduleView } from './schedule';

// Programación de pedido (spec #4 / BR-004): isDue se deriva de startBy con `now` inyectable.
describe('order: scheduleView', () => {
  it('pedido sin programación: no scheduled, no due', () => {
    const v = scheduleView({ scheduledFor: null, startBy: null } as never);
    expect(v.isScheduled).toBe(false);
    expect(v.isDue).toBe(false);
    expect(v.pickupLabel).toBe('');
  });

  it('programado con hora de recogida en etiqueta HH:MM', () => {
    const scheduledFor = new Date(2026, 9, 21, 14, 5).toISOString();
    const v = scheduleView({ scheduledFor, startBy: null } as never);
    expect(v.isScheduled).toBe(true);
    expect(v.pickupLabel).toBe('14:05');
    expect(v.startByMs).toBeNull();
    expect(v.isDue).toBe(false);
  });

  it('isDue=true cuando now ya alcanzó startBy; false si aún no', () => {
    const scheduledFor = new Date(2026, 9, 21, 14, 0).toISOString();
    const startBy = new Date(2026, 9, 21, 13, 40).toISOString();
    const startByMs = new Date(startBy).getTime();
    expect(scheduleView({ scheduledFor, startBy } as never, startByMs + 1000).isDue).toBe(true);
    expect(scheduleView({ scheduledFor, startBy } as never, startByMs - 1000).isDue).toBe(false);
  });
});
