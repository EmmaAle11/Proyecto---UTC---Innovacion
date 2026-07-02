import { useMemo, useState } from 'react';
import { View, TextInput, Pressable, Modal, Platform, type TextStyle } from 'react-native';
import { CreditCard, X } from 'lucide-react-native';
import { Heading, Body, Label } from '../../../shared/ui/Type';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { colors, text, surface, border, fonts } from '../../../shared/theme';
import {
  detectBrand,
  cvvValid,
  parseExpiry,
  expiryValid,
  last4,
  formatCardNumber,
  type CardBrand,
} from '../../../shared/lib/card';
import { CARD_KINDS, type CardKind } from '../model/wallet.store';

const WEB_NO_OUTLINE: TextStyle | undefined =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : undefined;

const BRAND_LABEL: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  desconocida: 'Tarjeta',
};

/** Métodos que llevan NÚMERO de tarjeta (formulario completo con Luhn/expiración/CVV). */
const CARD_NUMBER_KINDS: CardKind[] = ['tdc', 'tdd'];
const kindLabel = (k: CardKind) => CARD_KINDS.find((c) => c.kind === k)?.label ?? 'Método';

export interface NewCard {
  kind: CardKind;
  holder: string;
  last4: string;
  brand: string;
  expMonth?: number;
  expYear?: number;
}

/**
 * Formulario ÚNICO de "Agregar tarjeta/método" (C2), usado igual en el checkout y en
 * Mi cartera. Con `kind` fijo (checkout) oculta el selector de tipo; sin él (cartera)
 * lo muestra. Para TDC/TDD pide el número real y valida Luhn/expiración/CVV (guarda
 * solo `last4`); para Mercado Pago/PayPal pide correo/titular + referencia. Pago simulado.
 */
export function CardForm({
  visible,
  kind,
  onClose,
  onAdd,
}: {
  visible: boolean;
  kind?: CardKind; // fijo (checkout) → sin selector; ausente (cartera) → con selector
  onClose: () => void;
  onAdd: (card: NewCard) => void;
}) {
  const [selKind, setSelKind] = useState<CardKind>(kind ?? 'tdc');
  const activeKind = kind ?? selKind;
  const isCard = CARD_NUMBER_KINDS.includes(activeKind);

  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [ref, setRef] = useState(''); // referencia (últimos 4) para MP/PayPal
  const [error, setError] = useState('');

  const brand = useMemo(() => detectBrand(number), [number]);

  const reset = () => {
    setNumber('');
    setHolder('');
    setExpiry('');
    setCvv('');
    setRef('');
    setError('');
  };

  const submit = () => {
    setError('');
    if (!holder.trim()) return setError(isCard ? 'Escribe el nombre del titular.' : 'Escribe el titular o correo.');
    if (isCard) {
      // Demo (D-006): no exigimos el checksum de Luhn (el cobro es simulado); solo
      // pedimos que "parezca" un número de tarjeta (13–19 dígitos).
      const digits = number.replace(/\D/g, '');
      if (digits.length < 13 || digits.length > 19) {
        return setError('El número debe tener entre 13 y 19 dígitos.');
      }
      const exp = parseExpiry(expiry);
      if (!exp) return setError('La expiración debe ser MM/AA.');
      if (!expiryValid(exp.mm, exp.yy)) return setError('La tarjeta está vencida.');
      if (!cvvValid(cvv, brand)) return setError('El CVV no es válido.');
      onAdd({
        kind: activeKind,
        holder: holder.trim(),
        last4: last4(number),
        brand: BRAND_LABEL[brand],
        expMonth: exp.mm,
        expYear: exp.yy,
      });
    } else {
      if (ref.trim().length !== 4) return setError('La referencia debe ser de 4 dígitos.');
      onAdd({
        kind: activeKind,
        holder: holder.trim(),
        last4: ref.trim(),
        brand: kindLabel(activeKind),
      });
    }
    reset();
    onClose();
  };

  const inputStyle: TextStyle = {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: border.default,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.azul[700],
    fontFamily: fonts.bodyMedium,
    backgroundColor: surface.card,
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(2,14,46,0.45)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: surface.page, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <CreditCard size={20} color={colors.azul[600]} />
              <Heading style={{ fontSize: 20 }}>Agregar tarjeta</Heading>
            </View>
            <Pressable onPress={onClose} hitSlop={10}><X size={22} color={text.muted} /></Pressable>
          </View>

          {/* Selector de tipo: solo cuando el método no viene fijado (cartera). */}
          {kind === undefined ? (
            <>
              <Label style={{ marginBottom: 8 }}>Tipo</Label>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                {CARD_KINDS.map((k) => {
                  const on = activeKind === k.kind;
                  return (
                    <Pressable key={k.kind} onPress={() => setSelKind(k.kind)} style={{ paddingHorizontal: 12, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.naranja[50] : colors.gris[100], borderWidth: on ? 1.5 : 1, borderColor: on ? colors.naranja[500] : border.subtle }}>
                      <Body style={{ fontSize: 12.5, fontFamily: fonts.bodySemi }} color={on ? colors.naranja[700] : text.heading}>{k.label}</Body>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          {error ? (
            <Body color={colors.rojo[600]} style={{ fontSize: 13, marginTop: 10, marginBottom: 2, fontFamily: fonts.bodyMedium }}>{error}</Body>
          ) : null}

          {isCard ? (
            <>
              <Label style={{ marginTop: 12, marginBottom: 6 }}>Número de tarjeta {brand !== 'desconocida' ? `· ${BRAND_LABEL[brand]}` : ''}</Label>
              <TextInput
                value={formatCardNumber(number)}
                onChangeText={setNumber}
                placeholder="4242 4242 4242 4242"
                placeholderTextColor={colors.gris[400]}
                keyboardType="number-pad"
                maxLength={23}
                style={[inputStyle, WEB_NO_OUTLINE]}
              />

              <Label style={{ marginTop: 12, marginBottom: 6 }}>Titular</Label>
              <TextInput
                value={holder}
                onChangeText={setHolder}
                placeholder="Como aparece en la tarjeta"
                placeholderTextColor={colors.gris[400]}
                autoCapitalize="characters"
                style={[inputStyle, WEB_NO_OUTLINE]}
              />

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Label style={{ marginBottom: 6 }}>Expira (MM/AA)</Label>
                  <TextInput value={expiry} onChangeText={setExpiry} placeholder="09/28" placeholderTextColor={colors.gris[400]} keyboardType="number-pad" maxLength={5} style={[inputStyle, WEB_NO_OUTLINE]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Label style={{ marginBottom: 6 }}>CVV</Label>
                  <TextInput value={cvv} onChangeText={setCvv} placeholder={brand === 'amex' ? '4 díg.' : '3 díg.'} placeholderTextColor={colors.gris[400]} keyboardType="number-pad" maxLength={4} secureTextEntry style={[inputStyle, WEB_NO_OUTLINE]} />
                </View>
              </View>
            </>
          ) : (
            <>
              <Label style={{ marginTop: 12, marginBottom: 6 }}>Titular o correo</Label>
              <TextInput
                value={holder}
                onChangeText={setHolder}
                placeholder={activeKind === 'paypal' ? 'tucorreo@ejemplo.com' : 'ALUMNO UTC'}
                placeholderTextColor={colors.gris[400]}
                autoCapitalize="none"
                style={[inputStyle, WEB_NO_OUTLINE]}
              />
              <Label style={{ marginTop: 12, marginBottom: 6 }}>Referencia (últimos 4)</Label>
              <TextInput
                value={ref}
                onChangeText={(v) => setRef(v.replace(/[^0-9]/g, '').slice(0, 4))}
                placeholder="4242"
                placeholderTextColor={colors.gris[400]}
                keyboardType="number-pad"
                maxLength={4}
                style={[inputStyle, WEB_NO_OUTLINE]}
              />
            </>
          )}

          <Body color={text.subtle} style={{ fontSize: 11.5, marginTop: 12, marginBottom: 14 }}>
            No guardamos el número completo, solo los últimos 4. Pago simulado para la demo.
          </Body>

          <PrimaryButton color={colors.azul[700]} onPress={submit} label="Guardar tarjeta" />
        </View>
      </View>
    </Modal>
  );
}
