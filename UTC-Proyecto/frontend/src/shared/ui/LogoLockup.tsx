import { Image, type ImageStyle, type StyleProp } from 'react-native';
import logo from '../../../assets/logo-lockup.png';

// ancho/alto del recorte logo-lockup.png (1312x1130)
const RATIO = 1312 / 1130;

type Props = { width?: number; style?: StyleProp<ImageStyle> };

/**
 * Lockup de marca: la mascota UTC sobre "UTC Pick Sazón".
 * Fuente: `frontend/assets/logo-lockup.png` (derivado de design-system/assets/logo_utc.jpeg).
 * Ideal sobre fondos claros (header de Welcome).
 */
export function LogoLockup({ width = 240, style }: Props) {
  return (
    <Image source={logo} resizeMode="contain" style={[{ width, height: width / RATIO }, style]} />
  );
}
