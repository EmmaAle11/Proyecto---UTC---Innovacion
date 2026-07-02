import { useMemo, useState } from 'react';
import { View, TextInput, Pressable, Modal, Platform, type TextStyle } from 'react-native';
import { CreditCard, X } from 'lucide-react-native';
import { Heading, Body, Label } from '../../../shared/ui/Type';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { colors, text, surface, border, fonts } from '../../../shared/theme';
import {
  luhnValid,
  detectBrand,
  cvvValid,
  parseExpiry,
  expiryValid,
  last4,
  formatCardNumber,
  type CardBrand,
} from '../../../shared/lib/card';
import type { CardKind } from '../model/wallet.store';

const WEB_NO_OUTLINE: TextStyle | undefined =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : undefined;

const BRAND_LABEL: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  desconocida: 'Tarjeta',
};

export interface NewCard {
  kind: CardKind;
  holder: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
}

/** Formulario REAL de alta de tarjeta (C2): valida Luhn, expiración y CVV. NO guarda el
 *  número completo (solo `last4`). El pago se "aprueba" luego en el backend (simulado). */
export function CardForm({
  visible,
  kind,
  onClose,
  onAdd,
}: {
  visible: boolean;
  kind: CardKind; // 'tdc' | 'tdd' (crédito/débito)
  onClose: () => void;
  onAdd: (card: NewCard) => void;
}) {
  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState('');

  const brand = useMemo(() => detectBrand(number), [number]);

  const reset = () => {
    setNumber('');
    setHolder('');
    setExpiry('');
    setCvv('');
    setError('');
  };

  const submit = () => {
    setError('');
    if (!luhnValid(number)) return setError('El número de tarjeta no es válido.');
    if (!holder.trim()) return setError('Escribe el nombre del titular.');
    const exp = parseExpiry(expiry);
    if (!exp) return setError('La expiración debe ser MM/AA.');
    if (!expiryValid(exp.mm, exp.yy)) return setError('La tarjeta está vencida.');
    if (!cvvValid(cvv, brand)) return setError('El CVV no es válido.');
    onAdd({
      kind,
      holder: holder.trim(),
      last4: last4(number),
      brand: BRAND_LABEL[brand],
      expMonth: exp.mm,
      expYear: exp.yy,
    });
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

          {error ? (
            <Body color={colors.rojo[600]} style={{ fontSize: 13, marginBottom: 10, fontFamily: fonts.bodyMedium }}>{error}</Body>
          ) : null}

          <Label style={{ marginBottom: 6 }}>Número de tarjeta {brand !== 'desconocida' ? `· ${BRAND_LABEL[brand]}` : ''}</Label>
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
              <TextInput
                value={expiry}
                onChangeText={setExpiry}
                placeholder="09/28"
                placeholderTextColor={colors.gris[400]}
                keyboardType="number-pad"
                maxLength={5}
                style={[inputStyle, WEB_NO_OUTLINE]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Label style={{ marginBottom: 6 }}>CVV</Label>
              <TextInput
                value={cvv}
                onChangeText={setCvv}
                placeholder={brand === 'amex' ? '4 díg.' : '3 díg.'}
                placeholderTextColor={colors.gris[400]}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                style={[inputStyle, WEB_NO_OUTLINE]}
              />
            </View>
          </View>

          <Body color={text.subtle} style={{ fontSize: 11.5, marginTop: 12, marginBottom: 14 }}>
            No guardamos el número completo, solo los últimos 4. Pago simulado para la demo.
          </Body>

          <PrimaryButton color={colors.azul[700]} onPress={submit} label="Guardar tarjeta" />
        </View>
      </View>
    </Modal>
  );
}
