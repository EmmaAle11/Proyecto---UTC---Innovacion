import type { Branch } from './model/types';

// Sede real de la cooperativa (coordenadas aproximadas de la dirección).
const CDMX_TLALPAN: Branch = {
  id: 'cdmx-tlalpan',
  name: 'UTC Tlalpan',
  address: 'Calz. de Tlalpan 639, Álamos, Benito Juárez, 03400, CDMX',
  lat: 19.3897,
  lng: -99.1428,
};

/**
 * Sucursales demo (mock). La primera es la sede real; las otras son ficticias
 * para demostrar la selección de la "más cercana". Reemplazable por `GET /branches`.
 */
export const BRANCHES: Branch[] = [
  CDMX_TLALPAN,
  { id: 'demo-coyoacan', name: 'UTC Coyoacán (demo)', address: 'Av. Universidad, Coyoacán, CDMX', lat: 19.35, lng: -99.162 },
  { id: 'demo-roma', name: 'UTC Roma (demo)', address: 'Col. Roma, Cuauhtémoc, CDMX', lat: 19.415, lng: -99.162 },
];

/** Sucursal por defecto (sede real CDMX) mientras no haya geolocalización ni elección manual. */
export const DEFAULT_BRANCH: Branch = CDMX_TLALPAN;
