import { Image, type ImageStyle, type StyleProp } from 'react-native';
import symbol from '../../../assets/logo.png';

// ancho/alto de logo.png (1178x1200)
const RATIO = 1178 / 1200;

type Props = { width?: number; style?: StyleProp<ImageStyle> };

/**
 * Símbolo de marca: la mascota UTC, sin texto.
 * Fuente: `frontend/assets/logo.png` (PNG transparente; máster en `brand/logo_utc_hq.png`).
 * Fondo transparente (PNG): se ve bien sobre cualquier color (claro u oscuro).
 */
export function LogoSymbol({ width = 120, style }: Props) {
  return (
    <Image source={symbol} resizeMode="contain" style={[{ width, height: width / RATIO }, style]} />
  );
}
