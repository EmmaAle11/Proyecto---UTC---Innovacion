import { Image, type ImageStyle, type StyleProp } from 'react-native';
import symbol from '../../../assets/logo-symbol.png';

// ancho/alto del recorte logo-symbol.png (896x610)
const RATIO = 896 / 610;

type Props = { width?: number; style?: StyleProp<ImageStyle> };

/**
 * Símbolo de marca: ilustración (perro + taco), sin texto.
 * Fuente: `frontend/assets/logo-symbol.png` (derivado de design-system/assets/logo.png).
 * Tiene fondo claro propio; sobre fondos de color colócalo en una tarjeta blanca.
 */
export function LogoSymbol({ width = 120, style }: Props) {
  return (
    <Image source={symbol} resizeMode="contain" style={[{ width, height: width / RATIO }, style]} />
  );
}
