import { Fragment } from 'react';
import { View, Text } from 'react-native';
import { colors, text, fonts } from '../theme';

const STEPS = [
  { k: 'paid', l: 'Pagado' },
  { k: 'cooking', l: 'En preparación' },
  { k: 'ready', l: 'Listo' },
  { k: 'picked', l: 'Recogido' },
] as const;

type Props = { current: number; note?: string };

/** Línea de progreso del pedido (4 pasos). `current` = índice del paso activo. */
export function OrderTracker({ current, note }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const color = done ? colors.lima[500] : active ? colors.naranja[500] : colors.gris[300];
        return (
          <Fragment key={s.k}>
            <View style={{ alignItems: 'center', width: 62 }}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: done || active ? color : '#fff',
                  borderWidth: done || active ? 0 : 2,
                  borderColor: colors.gris[300],
                }}
              >
                <Text style={{ color: '#fff', fontSize: 13, fontFamily: fonts.bodyBold }}>{done ? '✓' : active ? '●' : ''}</Text>
              </View>
              <Text
                style={{
                  marginTop: 7,
                  fontSize: 11,
                  fontFamily: active ? fonts.bodyBold : fonts.bodySemi,
                  textAlign: 'center',
                  color: active ? text.heading : done ? colors.lima[600] : text.subtle,
                }}
              >
                {s.l}
              </Text>
              {active && note ? <Text style={{ marginTop: 3, fontSize: 11, fontFamily: fonts.bodyBold, color: colors.naranja[600] }}>{note}</Text> : null}
            </View>
            {i < STEPS.length - 1 ? (
              <View style={{ flex: 1, height: 3, borderRadius: 3, marginTop: 11.5, backgroundColor: i < current ? colors.lima[500] : colors.gris[200] }} />
            ) : null}
          </Fragment>
        );
      })}
    </View>
  );
}
