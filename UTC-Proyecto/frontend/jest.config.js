/**
 * Jest (FE) con preset jest-expo (Expo SDK 56). Pruebas deterministas de lógica de negocio pura
 * (reglas de pago C2, programación de pedidos BR-004, geolocalización de sucursal BR-001).
 * No a la vez que Jest de backend (rules.md 0.7); CI los corre en jobs separados.
 */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
