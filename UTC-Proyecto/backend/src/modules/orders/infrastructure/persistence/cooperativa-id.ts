/**
 * UTC-F1-003 · Conversión legacy→FK de la sucursal de recogida (función PURA, testeable sin DB).
 *
 * `orders.branch_id` es texto libre histórico: puede ser un uuid (sucursal del catálogo) o un
 * nombre libre legacy. El dual-write escribe `cooperativa_id` (uuid, FK) SOLO cuando el valor es
 * un uuid: los nombres legacy quedan en `cooperativa_id = NULL` (no se inventa un id).
 *
 * El servicio (UTC-F1-002) ya validó que, si hay sucursal, existe y está activa en el catálogo;
 * aquí solo se traduce la forma. Fail-closed: cualquier cosa que no sea uuid → null.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function asCooperativaId(branchId?: string | null): string | null {
  if (!branchId) return null;
  return UUID_RE.test(branchId) ? branchId : null;
}
