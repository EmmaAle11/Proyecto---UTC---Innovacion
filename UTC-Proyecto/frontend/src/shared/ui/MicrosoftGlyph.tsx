import Svg, { Rect } from 'react-native-svg';

/** Glifo de 4 cuadros de Microsoft (para "Iniciar sesión con Outlook"). */
export function MicrosoftGlyph({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 23 23">
      <Rect x={1} y={1} width={10} height={10} fill="#F25022" />
      <Rect x={12} y={1} width={10} height={10} fill="#7FBA00" />
      <Rect x={1} y={12} width={10} height={10} fill="#00A4EF" />
      <Rect x={12} y={12} width={10} height={10} fill="#FFB900" />
    </Svg>
  );
}
