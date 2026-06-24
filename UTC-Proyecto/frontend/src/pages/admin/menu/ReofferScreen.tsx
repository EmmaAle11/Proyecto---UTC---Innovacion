import { useState } from 'react';
import { View, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Tag, ArrowDown } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../../app/navigation/types';
import { Display, Heading, Title, Body, Label, Mono } from '../../../shared/ui/Type';
import { Chip } from '../../../shared/ui/Chip';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { colors, text, surface, border, shadow, fonts } from '../../../shared/theme';
import { useCatalogStore } from '../../../features/admin/model/catalog.store';
import { PRODUCT_STATUS_META } from '../../../entities/product/admin-mock';
import type { ProductStatus } from '../../../entities/product/model/types';

type Props = NativeStackScreenProps<AdminStackParamList, 'Reoffer'>;

/** Estados elegibles para la reoferta "Pon tu precio" (§3.11). */
const REOFFER_OPTIONS: ProductStatus[] = ['calentando', 'sin_tiempo_espera'];

/** Reoferta / "Pon tu precio" (§3.11): baja el precio para vender antes de perderlo. */
export function ReofferScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const products = useCatalogStore((s) => s.products);
  const applyReoffer = useCatalogStore((s) => s.applyReoffer);
  const product = products.find((p) => p.id === route.params.productId);

  const [reoffer, setReoffer] = useState<string>(product?.reofferPrice != null ? String(product.reofferPrice) : '');
  const [status, setStatus] = useState<ProductStatus>(
    product && REOFFER_OPTIONS.includes(product.status) ? product.status : 'calentando',
  );

  if (!product) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: surface.page }}>
        <Body color={text.muted}>Producto no encontrado.</Body>
      </View>
    );
  }

  const parsed = parseInt(reoffer.replace(/[^0-9]/g, ''), 10);
  const newPrice = Number.isFinite(parsed) ? parsed : 0;
  const valid = newPrice > 0 && newPrice < product.price;
  const off = product.price > 0 ? Math.round(((product.price - newPrice) / product.price) * 100) : 0;

  const onApply = () => {
    if (!valid) return;
    applyReoffer(product.id, newPrice, status);
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: surface.page }}>
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 20, paddingBottom: 6 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: surface.card, borderWidth: 1, borderColor: border.subtle, alignItems: 'center', justifyContent: 'center', ...shadow.card }}
        >
          <ArrowLeft size={20} color={colors.azul[700]} />
        </Pressable>
        <Label style={{ marginTop: 12 }}>Pon tu precio · §3.11</Label>
        <Display style={{ marginTop: 4 }}>Reoferta</Display>
        <View style={{ width: 58, height: 6, borderRadius: 3, backgroundColor: colors.naranja[500], marginTop: 10 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top + 64}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 110 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Producto */}
          <View style={{ backgroundColor: surface.card, borderRadius: 18, borderWidth: 1, borderColor: border.subtle, padding: 16, marginTop: 6, ...shadow.card }}>
            <Title style={{ fontSize: 16 }}>{product.name}</Title>
            <Mono style={{ fontSize: 11.5, marginTop: 4 }} color={text.muted}>{product.category}</Mono>
          </View>

          {/* Texto explicativo del §3.11 */}
          <View style={{ backgroundColor: colors.naranja[50], borderRadius: 18, padding: 16, marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Tag size={16} color={colors.naranja[700]} />
              <Title style={{ fontSize: 14.5 }} color={colors.naranja[700]}>Vender antes de perderlo</Title>
            </View>
            <Body color={colors.naranja[700]} style={{ fontSize: 13, lineHeight: 20, marginTop: 8 }}>
              Pon tu precio: baja el precio de este producto para venderlo antes de que se enfríe o se acabe el recreo. Los clientes lo verán como una reoferta.
            </Body>
          </View>

          {/* Precio actual → nuevo */}
          <View style={{ backgroundColor: surface.card, borderRadius: 18, borderWidth: 1, borderColor: border.subtle, padding: 16, marginTop: 12, ...shadow.card }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label color={text.muted}>Precio actual</Label>
              <Mono style={{ fontFamily: fonts.monoBold, fontSize: 18 }} color={text.heading}>{`$${product.price}`}</Mono>
            </View>

            <View style={{ alignItems: 'center', marginVertical: 10 }}>
              <ArrowDown size={18} color={text.subtle} />
            </View>

            <Label color={colors.naranja[600]}>Precio de reoferta</Label>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 8,
                height: 56,
                paddingHorizontal: 16,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: colors.naranja[500],
                backgroundColor: colors.naranja[50],
              }}
            >
              <Mono style={{ fontFamily: fonts.monoBold, fontSize: 22 }} color={colors.naranja[700]}>$</Mono>
              <TextInput
                value={reoffer}
                onChangeText={setReoffer}
                placeholder="0"
                placeholderTextColor={colors.naranja[200]}
                keyboardType="number-pad"
                style={{ flex: 1, marginLeft: 4, fontSize: 22, color: colors.naranja[700], fontFamily: fonts.monoBold }}
              />
              {valid ? (
                <Mono style={{ fontFamily: fonts.monoBold, fontSize: 14 }} color={colors.lima[600]}>{`-${off}%`}</Mono>
              ) : null}
            </View>
            {reoffer.trim() !== '' && !valid ? (
              <Body color={colors.rojo[500]} style={{ fontSize: 12, marginTop: 6 }}>
                El precio debe ser mayor a 0 y menor al actual (${product.price}).
              </Body>
            ) : null}
          </View>

          {/* Estado de la reoferta */}
          <Heading style={{ fontSize: 17, marginTop: 22 }}>Estado al reofertar</Heading>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {REOFFER_OPTIONS.map((s) => (
              <Chip key={s} selected={s === status} onPress={() => setStatus(s)}>
                {PRODUCT_STATUS_META[s].label}
              </Chip>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Barra inferior: aplicar */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, paddingBottom: insets.bottom + 16, backgroundColor: surface.card, borderTopWidth: 1, borderTopColor: border.subtle }}>
        <PrimaryButton
          color={colors.naranja[500]}
          onPress={onApply}
          disabled={!valid}
          label={valid ? `Aplicar reoferta · $${newPrice}` : 'Aplicar reoferta'}
        />
      </View>
    </View>
  );
}
