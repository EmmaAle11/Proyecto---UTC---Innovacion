import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../app/navigation/types';
import { Media } from '../../shared/ui/Media';
import { Badge } from '../../shared/ui/Badge';
import { QtyStepper } from '../../shared/ui/QtyStepper';
import { PrimaryButton } from '../../shared/ui/PrimaryButton';
import { colors, text, border } from '../../shared/theme';
import { PRODUCTS } from '../../entities/product/mock';
import { productImage } from '../../entities/product/images';
import { productIcon } from '../../entities/product/icons';
import { useCartStore } from '../../features/cart/model/cart.store';

type Props = NativeStackScreenProps<MainStackParamList, 'Product'>;

/** Detalle del producto: foto + estado + descripción + cantidad. Agregar → vuelve a Inicio. */
export function ProductScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const product = PRODUCTS.find((p) => p.id === route.params.productId);
  const add = useCartStore((s) => s.add);
  const [qty, setQty] = useState(1);

  if (!product) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <Text style={{ color: text.muted }}>Producto no encontrado.</Text>
      </View>
    );
  }

  const Icon = productIcon(product.icon);
  const prepMin = Math.round(product.basePrepTimeSeconds / 60);

  const onAdd = () => {
    add(product, qty);
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <Media height={300} radius={0} source={productImage(product.id)} icon={<Icon size={96} color={colors.azul[300]} />} />

        <View style={{ padding: 22 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, color: colors.naranja[600], marginBottom: 6 }}>
            {product.category.toUpperCase()}
          </Text>
          <Text style={{ fontSize: 26, fontWeight: '800', color: text.heading, marginBottom: 12 }}>{product.name}</Text>

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {product.readySinceMin != null ? (
              <Badge tone="ready" dot>{`Listo hace ${product.readySinceMin} min`}</Badge>
            ) : (
              <Badge tone="cooking" dot>{`Se prepara en ~${prepMin} min`}</Badge>
            )}
            <Badge tone="neutral" icon={<MapPin size={13} color={colors.gris[700]} />}>Recoger en tienda</Badge>
          </View>

          <Text style={{ fontSize: 15, lineHeight: 23, color: colors.gris[700], marginBottom: 22 }}>{product.description}</Text>

          <View style={{ height: 1, backgroundColor: border.subtle, marginBottom: 18 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: text.heading }}>Cantidad</Text>
            <QtyStepper value={qty} min={1} max={10} onChange={setQty} />
          </View>
        </View>
      </ScrollView>

      {/* botón atrás flotante sobre la foto */}
      <Pressable
        onPress={() => navigation.goBack()}
        style={{ position: 'absolute', top: insets.top + 10, left: 16, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }}
      >
        <ArrowLeft size={20} color={colors.azul[700]} />
      </Pressable>

      {/* barra inferior: agregar */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, paddingBottom: insets.bottom + 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: border.subtle }}>
        <PrimaryButton
          color={colors.naranja[500]}
          onPress={onAdd}
          label={`Agregar${qty > 1 ? ` ×${qty}` : ''} · $${product.price * qty}`}
        />
      </View>
    </View>
  );
}
