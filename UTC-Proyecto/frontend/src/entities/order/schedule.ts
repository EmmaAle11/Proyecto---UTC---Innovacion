import type { AdminOrder } from './admin-types';

/** Vista de programación de un pedido (spec #4), derivada de scheduledFor/startBy. */
export interface ScheduleView {
  isScheduled: boolean;
  pickupLabel: string; // 'HH:MM' de la recogida
  startByMs: number | null; // ms epoch de la hora sugerida para empezar
  isDue: boolean; // ya toca empezar (now >= startBy)
}

/** 'HH:MM' local desde un ISO. */
function hhmm(iso: string): string {
  const d = new Date(iso);
  return `${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`;
}

/**
 * Deriva la vista de programación de un pedido. `now` inyectable para tests/render.
 * `isDue` = ya llegó (o pasó) la hora sugerida de empezar → prioridad "glaciar".
 */
export function scheduleView(
  o: Pick<AdminOrder, 'scheduledFor' | 'startBy'>,
  now: number = Date.now(),
): ScheduleView {
  if (!o.scheduledFor) {
    return { isScheduled: false, pickupLabel: '', startByMs: null, isDue: false };
  }
  const startByMs = o.startBy ? new Date(o.startBy).getTime() : null;
  return {
    isScheduled: true,
    pickupLabel: hhmm(o.scheduledFor),
    startByMs,
    isDue: startByMs !== null && now >= startByMs,
  };
}
