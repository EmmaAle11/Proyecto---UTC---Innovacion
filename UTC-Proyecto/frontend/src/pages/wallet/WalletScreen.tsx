import { useRef, useState } from 'react';
import {
  View,
  Pressable,
  Animated,
  Text,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { ArrowLeft, Eye, EyeOff, Plus, Pencil, Trash2, X, Banknote } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../app/navigation/types';
import { Display, Title, Body, Label } from '../../shared/ui/Type';
import { colors, text, border, surface, shadow, fonts } from '../../shared/theme';
import {
  useWalletStore,
  CARD_KINDS,
  type CardColor,
  type CardKind,
  type PaymentCard,
} from '../../features/wallet/model/wallet.store';

type Props = NativeStackScreenProps<MainStackParamList, 'Wallet'>;

const BG: Record<CardColor, string> = {
  azul500: colors.azul[500],
  azul700: colors.azul[700],
  white: '#ffffff',
};
const fgOf = (c: CardColor) => (c === 'white' ? colors.azul[700] : '#ffffff');

type Draft = { id?: string; kind: CardKind; holder: string; last4: string };

function Chip({ tint }: { tint: string }) {
  return <View style={{ width: 30, height: 22, borderRadius: 4, backgroundColor: tint, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }} />;
}

export function WalletScreen({ navigation }: Props) {
  const cards = useWalletStore((s) => s.cards);
  const add = useWalletStore((s) => s.add);
  const update = useWalletStore((s) => s.update);
  const remove = useWalletStore((s) => s.remove);

  const a = useRef(new Animated.Value(0)).current;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    Animated.spring(a, { toValue: next ? 1 : 0, useNativeDriver: false, friction: 8, tension: 60 }).start();
  };
  const starsOpacity = a.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const realOpacity = a.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  // Pila visual: tarjetas del store + el efectivo fijo (frente).
  const visual = [
    ...cards.map((c) => ({ key: c.id, brand: c.brand, holder: c.holder, masked: `**** ${c.last4}`, bg: BG[c.color], fg: fgOf(c.color) })),
    { key: 'cash', brand: 'Efectivo', holder: 'En mostrador', masked: 'BILLETE', bg: colors.lima[500], fg: '#ffffff' },
  ];

  const save = () => {
    if (!draft || !draft.holder.trim() || !draft.last4.trim()) return;
    if (draft.id) update(draft.id, { kind: draft.kind, holder: draft.holder.trim(), last4: draft.last4.trim() });
    else add({ kind: draft.kind, holder: draft.holder.trim(), last4: draft.last4.trim() });
    setDraft(null);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: surface.page }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 4 }}>
        <Pressable onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: border.subtle, backgroundColor: surface.card, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} color={colors.azul[700]} />
        </Pressable>
        <View>
          <Display style={{ fontSize: 28, lineHeight: 32 }}>Mi cartera</Display>
          <View style={{ width: 58, height: 6, borderRadius: 3, backgroundColor: colors.naranja[500], marginTop: 8 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {/* Cartera visual: toca para abrir/revelar */}
        <View style={{ alignItems: 'center', marginTop: 6 }}>
          <Pressable onPress={toggle} style={{ width: 300, height: 250 }}>
            <View style={{ position: 'absolute', bottom: 0, left: 10, width: 280, height: 190, backgroundColor: colors.azul[900], borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottomLeftRadius: 60, borderBottomRightRadius: 60 }} />

            {visual.map((c, i) => {
              const lift = -(8 + i * 26);
              const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [0, lift] });
              return (
                <Animated.View
                  key={c.key}
                  style={{ position: 'absolute', left: 20, bottom: 30 + i * 22, width: 260, height: 130, borderRadius: 16, padding: 16, backgroundColor: c.bg, justifyContent: 'space-between', transform: [{ translateY }], ...shadow.card }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 1, color: c.fg, textTransform: 'uppercase' }}>{c.brand}</Text>
                    <Chip tint={c.bg === '#ffffff' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.2)'} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 11, fontFamily: fonts.bodySemi, color: c.fg }}>{c.holder}</Text>
                    <Text style={{ fontFamily: fonts.monoBold, fontSize: 14, letterSpacing: 1, color: c.fg }}>{c.masked}</Text>
                  </View>
                </Animated.View>
              );
            })}

            {/* Bolsillo (SVG real) */}
            <View style={{ position: 'absolute', bottom: 0, left: 10, width: 280, height: 150 }}>
              <Svg width={280} height={150} viewBox="0 0 280 160" fill="none">
                <Path d="M 0 20 C 0 10, 5 10, 10 10 C 20 10, 25 25, 40 25 L 240 25 C 255 25, 260 10, 270 10 C 275 10, 280 10, 280 20 L 280 120 C 280 155, 260 160, 240 160 L 40 160 C 20 160, 0 155, 0 120 Z" fill={colors.azul[900]} />
                <Path d="M 8 22 C 8 16, 12 16, 15 16 C 23 16, 27 29, 40 29 L 240 29 C 253 29, 257 16, 265 16 C 268 16, 272 16, 272 22 L 272 120 C 272 150, 255 152, 240 152 L 40 152 C 25 152, 8 152, 8 120 Z" stroke={colors.azul[600]} strokeWidth={1.5} strokeDasharray="6 4" />
              </Svg>
              <View style={{ position: 'absolute', top: 42, left: 0, right: 0, alignItems: 'center' }}>
                <View style={{ height: 26, justifyContent: 'center' }}>
                  <Animated.Text style={{ position: 'absolute', alignSelf: 'center', fontFamily: fonts.monoBold, fontSize: 22, letterSpacing: 4, color: colors.azul[200], opacity: starsOpacity }}>✱✱✱✱✱✱</Animated.Text>
                  <Animated.Text style={{ fontFamily: fonts.monoBold, fontSize: 18, color: colors.lima[100], opacity: realOpacity }}>{cards.length} tarjetas</Animated.Text>
                </View>
                <Body style={{ fontSize: 11, marginTop: 2 }} color={colors.azul[200]}>Tus métodos</Body>
                <View style={{ marginTop: 4, opacity: 0.9 }}>
                  {open ? <Eye size={16} color={colors.lima[500]} /> : <EyeOff size={16} color={colors.lima[500]} />}
                </View>
              </View>
            </View>
          </Pressable>
          <Label style={{ marginTop: 14 }} color={text.muted}>{open ? 'Toca para cerrar' : 'Toca la cartera para abrirla'}</Label>
        </View>

        {/* Gestión de tarjetas */}
        <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
          <Label style={{ marginBottom: 10 }}>Tus tarjetas</Label>
          <View style={{ backgroundColor: surface.card, borderRadius: 18, borderWidth: 1, borderColor: border.subtle, paddingHorizontal: 14, ...shadow.card }}>
            {cards.map((c, i) => (
              <CardRow key={c.id} card={c} last={false} onEdit={() => setDraft({ id: c.id, kind: c.kind, holder: c.holder, last4: c.last4 })} onRemove={() => remove(c.id)} firstBorder={i > 0} />
            ))}
            {/* Efectivo fijo */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderTopWidth: cards.length ? 1 : 0, borderTopColor: border.subtle }}>
              <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: colors.lima[50], alignItems: 'center', justifyContent: 'center' }}>
                <Banknote size={19} color={colors.lima[600]} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Title style={{ fontSize: 14.5 }}>Efectivo</Title>
                <Body color={text.muted} style={{ fontSize: 12 }}>Pago en el mostrador (siempre disponible)</Body>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => setDraft({ kind: 'mercado_pago', holder: '', last4: '' })}
            style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: colors.naranja[500], backgroundColor: colors.naranja[50] }}
          >
            <Plus size={18} color={colors.naranja[600]} />
            <Title style={{ fontSize: 14.5 }} color={colors.naranja[600]}>Agregar tarjeta</Title>
          </Pressable>

          <Body color={text.subtle} style={{ fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 16 }}>
            El cobro real llega en una versión futura — por ahora es demostración (D-006).
          </Body>
        </View>
      </ScrollView>

      {/* Modal alta/edición */}
      <Modal visible={draft != null} transparent animationType="fade" onRequestClose={() => setDraft(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,14,46,0.45)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: surface.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Title style={{ fontSize: 18 }}>{draft?.id ? 'Editar tarjeta' : 'Agregar tarjeta'}</Title>
              <Pressable onPress={() => setDraft(null)} hitSlop={10}><X size={22} color={text.muted} /></Pressable>
            </View>

            {draft ? (
              <>
                <Label style={{ marginTop: 12, marginBottom: 8 }}>Tipo</Label>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {CARD_KINDS.map((k) => {
                    const on = draft.kind === k.kind;
                    return (
                      <Pressable key={k.kind} onPress={() => setDraft({ ...draft, kind: k.kind })} style={{ paddingHorizontal: 12, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.naranja[50] : colors.gris[100], borderWidth: on ? 1.5 : 1, borderColor: on ? colors.naranja[500] : border.subtle }}>
                        <Body style={{ fontSize: 12.5, fontFamily: fonts.bodySemi }} color={on ? colors.naranja[700] : text.heading}>{k.label}</Body>
                      </Pressable>
                    );
                  })}
                </View>

                <Label style={{ marginTop: 16, marginBottom: 6 }}>Titular o correo</Label>
                <TextInput
                  value={draft.holder}
                  onChangeText={(v) => setDraft({ ...draft, holder: v })}
                  placeholder="ALUMNO UTC"
                  placeholderTextColor={colors.gris[400]}
                  style={{ height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: border.subtle, paddingHorizontal: 14, fontSize: 15, fontFamily: fonts.bodyMedium, color: colors.azul[700], backgroundColor: surface.card }}
                />

                <Label style={{ marginTop: 14, marginBottom: 6 }}>Últimos 4 dígitos</Label>
                <TextInput
                  value={draft.last4}
                  onChangeText={(v) => setDraft({ ...draft, last4: v.replace(/[^0-9]/g, '').slice(0, 4) })}
                  placeholder="4242"
                  placeholderTextColor={colors.gris[400]}
                  keyboardType="number-pad"
                  style={{ height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: border.subtle, paddingHorizontal: 14, fontSize: 15, fontFamily: fonts.monoBold, color: colors.azul[700], backgroundColor: surface.card }}
                />

                <Pressable
                  onPress={save}
                  disabled={!draft.holder.trim() || !draft.last4.trim()}
                  style={{ marginTop: 22, height: 50, borderRadius: 14, backgroundColor: colors.naranja[500], alignItems: 'center', justifyContent: 'center', opacity: !draft.holder.trim() || !draft.last4.trim() ? 0.5 : 1 }}
                >
                  <Title color="#fff" style={{ fontSize: 15 }}>{draft.id ? 'Guardar cambios' : 'Agregar'}</Title>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/** Fila de tarjeta en la lista de gestión: marca + ••••last4 + editar + eliminar. */
function CardRow({
  card,
  onEdit,
  onRemove,
  firstBorder,
}: {
  card: PaymentCard;
  last: boolean;
  firstBorder: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderTopWidth: firstBorder ? 1 : 0, borderTopColor: border.subtle }}>
      <View style={{ width: 40, height: 28, borderRadius: 6, backgroundColor: BG[card.color], borderWidth: card.color === 'white' ? 1 : 0, borderColor: border.subtle }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Title style={{ fontSize: 14.5 }} numberOfLines={1}>{card.brand}</Title>
        <Body color={text.muted} style={{ fontSize: 12 }} numberOfLines={1}>{`•••• ${card.last4} · ${card.holder}`}</Body>
      </View>
      <Pressable onPress={onEdit} hitSlop={8} style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gris[100] }}>
        <Pencil size={16} color={colors.azul[600]} />
      </Pressable>
      <Pressable onPress={onRemove} hitSlop={8} style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.rojo[50] }}>
        <Trash2 size={16} color={colors.rojo[500]} />
      </Pressable>
    </View>
  );
}
