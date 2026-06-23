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
const IMAGES: Record<string, ImageSourcePropType> = {
  '1': quesadillaTinga,
  '2': comboEstudiante,
  '3': hamburguesaCasa,
  '4': papasQueso,
  '5': aguaJamaica,
  '6': bonelessBbq,
  '7': papasFrancesa,
  '8': esquites,
  '9': gelatinaMosaico,
  '10': aguaHorchata,
};

/** Asset local del producto, o `undefined` si no hay (entonces se usa el ícono de fallback). */
export function productImage(id: string): ImageSourcePropType | undefined {
  return IMAGES[id];
}
