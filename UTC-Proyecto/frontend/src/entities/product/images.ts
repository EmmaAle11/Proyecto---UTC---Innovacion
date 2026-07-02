import type { ImageSourcePropType } from 'react-native';
import quesadillaTinga from '../../../assets/products/quesadilla-tinga.png';
import comboEstudiante from '../../../assets/products/combo-estudiante.png';
import hamburguesaCasa from '../../../assets/products/hamburguesa-casa.png';
import papasQueso from '../../../assets/products/papas-queso.png';
import aguaJamaica from '../../../assets/products/agua-jamaica.png';
import bonelessBbq from '../../../assets/products/boneless-bbq.png';
import papasFrancesa from '../../../assets/products/papas-francesa.png';
import esquites from '../../../assets/products/esquites.png';
import gelatinaMosaico from '../../../assets/products/gelatina-mosaico.png';
import aguaHorchata from '../../../assets/products/agua-horchata.png';

/**
 * Assets de producto (placeholders SUSTITUIBLES). Cada archivo vive en
 * `frontend/assets/products/<slug>.png`. Para poner una foto real: reemplaza el PNG
 * con el MISMO nombre y reinicia Metro con `-c`. Metro resuelve estos imports en build,
 * por eso el mapa es estático (en RN no hay require dinámico por string).
 * Mapea el `id` del producto → su asset.
 */
// Llaveado por **slug** (coincide con `image_url` de la BD: "products/<slug>.png")
// y por **id del mock** ('1'..'10'), para que sirva igual con datos reales (UUID +
// imageUrl) que con el mock/admin (ids cortos).
const IMAGES: Record<string, ImageSourcePropType> = {
  'quesadilla-tinga': quesadillaTinga, '1': quesadillaTinga,
  'combo-estudiante': comboEstudiante, '2': comboEstudiante,
  'hamburguesa-casa': hamburguesaCasa, '3': hamburguesaCasa,
  'papas-queso': papasQueso, '4': papasQueso,
  'agua-jamaica': aguaJamaica, '5': aguaJamaica,
  'boneless-bbq': bonelessBbq, '6': bonelessBbq,
  'papas-francesa': papasFrancesa, '7': papasFrancesa,
  'esquites': esquites, '8': esquites,
  'gelatina-mosaico': gelatinaMosaico, '9': gelatinaMosaico,
  'agua-horchata': aguaHorchata, '10': aguaHorchata,
};

/**
 * Asset local del producto, o `undefined` si no hay (se usa el ícono de fallback).
 * Acepta un `id` suelto (mock/admin) o el producto completo: con datos reales
 * resuelve por `imageUrl` (slug) y, si no, por `id`.
 */
export function productImage(
  arg: string | { id: string; imageUrl?: string | null },
): ImageSourcePropType | undefined {
  if (typeof arg === 'string') return IMAGES[arg];
  if (arg.imageUrl) {
    // F1: foto real puesta por el admin (URL http/https) → imagen remota por `uri`.
    if (/^https?:\/\//i.test(arg.imageUrl)) return { uri: arg.imageUrl };
    // slug local ("products/<slug>.png") → asset empaquetado.
    const slug = arg.imageUrl.split('/').pop()?.replace(/\.png$/i, '');
    if (slug && IMAGES[slug]) return IMAGES[slug];
  }
  return IMAGES[arg.id];
}
