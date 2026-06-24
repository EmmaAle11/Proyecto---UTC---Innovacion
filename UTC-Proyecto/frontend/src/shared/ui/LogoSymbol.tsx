import { Image, type ImageStyle, type StyleProp } from 'react-native';
import symbol from '../../../assets/logo-symbol.png';

// ancho/alto del recorte logo-symbol.png (980x997)
const RATIO = 980 / 997;

type Props = { width?: number; style?: StyleProp<ImageStyle> };

/**
 * Símbolo de marca: la mascota UTC, sin texto.
 * Fuente: `frontend/assets/logo-symbol.png` (derivado del máster en `brand/logo_utc_hq.png`).
 * Fondo transparente (PNG): se ve bien sobre cualquier color (claro u oscuro).
 */
export function LogoSymbol({ width = 120, style }: Props) {
  return (
    <Image source={symbol} resizeMode="contain" style={[{ width, height: width / RATIO }, style]} />
  );
}
