import { detectBrand, cvvValid, expiryValid, last4, parseExpiry } from './card';

// Reglas del formulario de tarjeta (C2). Pagos SIMULADOS; se valida forma, no checksum (D-033).
describe('card: detectBrand (BIN)', () => {
  it('detecta visa / mastercard / amex por prefijo', () => {
    expect(detectBrand('4111 1111 1111 1111')).toBe('visa');
    expect(detectBrand('5500 0000 0000 0004')).toBe('mastercard');
    expect(detectBrand('2221 0000 0000 0009')).toBe('mastercard'); // rango 2221-2720
    expect(detectBrand('3400 000000 00009')).toBe('amex');
  });
  it('marca desconocida para prefijos fuera de rango', () => {
    expect(detectBrand('6011 0000 0000 0004')).toBe('desconocida');
  });
});

describe('card: cvvValid', () => {
  it('amex exige 4 dígitos; el resto 3', () => {
    expect(cvvValid('1234', 'amex')).toBe(true);
    expect(cvvValid('123', 'amex')).toBe(false);
    expect(cvvValid('123', 'visa')).toBe(true);
    expect(cvvValid('12', 'visa')).toBe(false);
  });
});

describe('card: expiryValid (vale hasta fin de su mes)', () => {
  const now = new Date(2026, 9, 21); // 21-oct-2026 (mes 9 = octubre)
  it('acepta el mes en curso y rechaza el anterior', () => {
    expect(expiryValid(10, 26, now)).toBe(true); // 10/26 vence fin de octubre
    expect(expiryValid(9, 26, now)).toBe(false); // 09/26 ya venció
  });
  it('rechaza meses fuera de 1..12 o no enteros', () => {
    expect(expiryValid(0, 26, now)).toBe(false);
    expect(expiryValid(13, 26, now)).toBe(false);
    expect(expiryValid(1.5, 26, now)).toBe(false);
  });
});

describe('card: last4 y parseExpiry', () => {
  it('last4 toma solo los últimos 4 dígitos', () => {
    expect(last4('4111 1111 1111 1234')).toBe('1234');
  });
  it('parseExpiry acepta MM/AA y rechaza basura', () => {
    expect(parseExpiry('10/26')).toEqual({ mm: 10, yy: 26 });
    expect(parseExpiry('1026')).toBeNull();
  });
});
