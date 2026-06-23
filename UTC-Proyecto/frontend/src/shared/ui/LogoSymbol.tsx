import { Image, type ImageStyle, type StyleProp } from 'react-native';
import symbol from '../../../assets/logo-symbol.png';

// ancho/alto del recorte logo-symbol.png (980x997)
const RATIO = 980 / 997;

type Props = { width?: number; style?: StyleProp<ImageStyle> };

/**
 * Símbolo de marca: la mascota UTC, sin texto.
 * Fuente: `frontend/assets/logo-symbol.png` (derivado de design-system/assets/logo_utc.jpeg).
 * Tiene fondo claro propio; sobre fondos de color colócalo en una tarjeta blanca.
 */
export function LogoSymbol({ width = 120, style }: Props) {
  return (
    <Image source={symbol} resizeMode="contain" style={[{ width, height: width / RATIO }, style]} />
  );
}
