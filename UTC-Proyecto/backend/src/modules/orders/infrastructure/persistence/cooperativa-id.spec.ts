import { asCooperativaId } from './cooperativa-id';

/**
 * UTC-F1-003 · dual-write: traducción legacy→FK. Mutante: si se devolviera el branch_id tal cual
 * (sin filtrar a uuid), el caso "nombre libre" caería (un nombre no es un uuid de cooperativa).
 */
describe('asCooperativaId', () => {
  const UUID = 'a0000000-0000-4000-8000-000000000001';

  it('un branch_id uuid → se usa como cooperativa_id', () => {
    expect(asCooperativaId(UUID)).toBe(UUID);
  });

  it('un nombre libre legacy → null (no se inventa un id)', () => {
    expect(asCooperativaId('UTC Tlalpan')).toBeNull();
  });

  it('null / vacío → null', () => {
    expect(asCooperativaId(null)).toBeNull();
    expect(asCooperativaId(undefined)).toBeNull();
    expect(asCooperativaId('')).toBeNull();
  });

  it('un uuid que no es v4 (versión equivocada) → null (fail-closed)', () => {
    expect(asCooperativaId('a0000000-0000-1000-8000-000000000001')).toBeNull();
  });
});
