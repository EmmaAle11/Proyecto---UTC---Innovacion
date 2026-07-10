import type { Branch } from './model/types';

/**
 * Cooperativas UTC (planteles). Lista canónica compartida por el cliente (elige/detecta
 * dónde recoge) y el admin (qué cooperativa opera). Mismos `id` en ambos lados para que
 * el pedido se enrute a la cooperativa correcta. Reemplazable por `GET /branches`.
 * Coordenadas aproximadas de cada dirección.
 */
export const BRANCHES: Branch[] = [
  {
    id: 'cdmx-tlalpan',
    name: 'UTC Tlalpan',
    address: 'Calz. de Tlalpan 639, Álamos, Benito Juárez, 03400, CDMX',
    lat: 19.3897,
    lng: -99.1428,
  },
  {
    id: 'cdmx-coyoacan',
    name: 'UTC Coyoacán',
    address: 'Av. Universidad 3000, Coyoacán, CDMX',
    lat: 19.35,
    lng: -99.162,
  },
  {
    id: 'cdmx-roma',
    name: 'UTC Roma',
    address: 'Av. Álvaro Obregón 100, Roma Norte, Cuauhtémoc, CDMX',
    lat: 19.415,
    lng: -99.162,
  },
];
