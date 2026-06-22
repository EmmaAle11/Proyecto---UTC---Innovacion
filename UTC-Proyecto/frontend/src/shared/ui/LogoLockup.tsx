import { Image, type ImageStyle, type StyleProp } from 'react-native';
import logo from '../../../assets/logo-lockup.png';

// ancho/alto del recorte logo-lockup.png (988x894)
const RATIO = 988 / 894;

type Props = { width?: number; style?: StyleProp<ImageStyle> };

/**
 * Lockup de marca: ilustración (perro + taco) sobre "UTC Pick Sazón".
 * Fuente: `frontend/assets/logo-lockup.png` (derivado de design-system/assets/logo.png).
 * Ideal sobre fondos claros (header de Welcome).
 */
export function LogoLockup({ width = 240, style }: Props) {
  return (
    <Image source={logo} resizeMode="contain" style={[{ width, height: width / RATIO }, style]} />
  );
}
