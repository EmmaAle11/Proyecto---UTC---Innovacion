/**
 * Validación de tarjeta (C2). Pagos SIMULADOS: NO se guarda el número completo,
 * solo los últimos 4 (buena práctica). Aquí viven las reglas del formulario: marca por
 * BIN, expiración y CVV. (No se valida checksum de tarjeta; cobro simulado, D-033.) Sin dependencias.
 */
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'desconocida';

/** Solo dígitos del texto. */
function digits(v: string): string {
  return v.replace(/\D/g, '');
}

/** Marca por prefijo (BIN). */
export function detectBrand(number: string): CardBrand {
  const d = digits(number);
  if (/^4/.test(d)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'mastercard';
  if (/^3[47]/.test(d)) return 'amex';
  return 'desconocida';
}

/** CVV: 3 dígitos (4 para Amex). */
export function cvvValid(cvv: string, brand: CardBrand): boolean {
  const d = digits(cvv);
  return brand === 'amex' ? d.length === 4 : d.length === 3;
}

/** Expiración MM/AA válida y no vencida (la tarjeta vale hasta fin de su mes). */
export function expiryValid(mm: number, yy: number, now: Date = new Date()): boolean {
  if (!Number.isInteger(mm) || !Number.isInteger(yy) || mm < 1 || mm > 12) {
    return false;
  }
  // Primer día del mes SIGUIENTE al de expiración (JS: mes 0-indexado ⇒ `mm`).
  const expiresAfter = new Date(2000 + yy, mm, 1).getTime();
  return expiresAfter > now.getTime();
}

/** Últimos 4 dígitos (lo único que se guarda). */
export function last4(number: string): string {
  return digits(number).slice(-4);
}

/** Formatea el número en grupos de 4 mientras se escribe. */
export function formatCardNumber(v: string): string {
  return digits(v)
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

/** Parsea "MM/AA" → { mm, yy } (o null si el formato no cuadra). */
export function parseExpiry(v: string): { mm: number; yy: number } | null {
  const m = v.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) return null;
  return { mm: parseInt(m[1], 10), yy: parseInt(m[2], 10) };
}
