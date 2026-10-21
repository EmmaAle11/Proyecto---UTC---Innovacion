import { haversineKm } from './geo';

// Geolocalización de sucursal (BR-001: pick up, sin reparto). Distancia haversine pura.
describe('geo: haversineKm', () => {
  it('distancia cero para el mismo punto', () => {
    expect(haversineKm({ lat: 19.3, lng: -99.1 }, { lat: 19.3, lng: -99.1 })).toBeCloseTo(0, 6);
  });
  it('~111 km por grado de latitud en el ecuador', () => {
    const d = haversineKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });
  it('es simétrica', () => {
    const a = { lat: 19.29, lng: -99.16 };
    const b = { lat: 19.43, lng: -99.13 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 9);
  });
});
