import { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../app/navigation/types';
import { Media } from '../../shared/ui/Media';
import { Badge } from '../../shared/ui/Badge';
import { QtyStepper } from '../../shared/ui/QtyStepper';
import { PrimaryButton } from '../../shared/ui/PrimaryButton';
import { Display, Title, Body, Label } from '../../shared/ui/Type';
import { colors, text, border, surface, shadow } from '../../shared/theme';
import { productImage } from '../../entities/product/images';
import { productIcon } from '../../entities/product/icons';
import { useCartStore } from '../../features/cart/model/cart.store';
import { useCatalogStore } from '../../features/catalog/model/catalog.store';
import { useSessionStore } from '../../features/auth/model/session.store';

type Props = NativeStackScreenProps<MainStackParamList, 'Product'>;

/** Detalle del producto: foto + estado + descripción + cantidad. Agregar → vuelve a Inicio. */
export function ProductScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const loaded = useCatalogStore((s) => s.loaded);
  const loading = useCatalogStore((s) => s.loading);
  const loadCatalog = useCatalogStore((s) => s.load);
  const token = useSessionStore((s) => s.session?.accessToken);
  useEffect(() => {
    if (!loaded) void loadCatalog(token); // deep-link: carga una vez si nadie lo hizo
  }, [loaded, loadCatalog, token]);
  const product = useCatalogStore((s) => s.getById(route.params.productId));
  const add = useCartStore((s) => s.add);
  const [qty, setQty] = useState(1);

  if (!product) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: surface.page }}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <Body color={text.muted}>Producto no encontrado.</Body>
        )}
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
    <View style={{ flex: 1, backgroundColor: surface.page }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <Media height={300} radius={0} source={productImage(product)} icon={<Icon size={96} color={colors.azul[300]} />} />

        <View style={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 22 }}>
          {/* HERO editorial: categoría → nombre enorme → barrita naranja */}
          <Label color={colors.naranja[600]}>{product.category}</Label>
          <Display style={{ marginTop: 8 }}>{product.name}</Display>
          <View style={{ width: 58, height: 6, borderRadius: 3, backgroundColor: colors.naranja[500], marginTop: 12 }} />

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 18, marginBottom: 18, flexWrap: 'wrap' }}>
            {product.readySinceMin != null ? (
              <Badge tone="ready" dot>{`Listo hace ${product.readySinceMin} min`}</Badge>
            ) : (
              <Badge tone="cooking" dot>{`Se prepara en ~${prepMin} min`}</Badge>
            )}
            <Badge tone="neutral" icon={<MapPin size={13} color={colors.gris[700]} />}>Recoger en tienda</Badge>
          </View>

          {/* Descripción en tarjeta editorial */}
          <View style={{ backgroundColor: surface.card, borderRadius: 18, borderWidth: 1, borderColor: border.subtle, padding: 16, ...shadow.card }}>
            <Body color={colors.gris[700]} style={{ fontSize: 15, lineHeight: 23 }}>{product.description}</Body>
          </View>

          {/* Cantidad en tarjeta editorial */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: surface.card, borderRadius: 18, borderWidth: 1, borderColor: border.subtle, paddingVertical: 14, paddingHorizontal: 16, marginTop: 12, ...shadow.card }}>
            <Title>Cantidad</Title>
            <QtyStepper value={qty} min={1} max={10} onChange={setQty} />
          </View>
        </View>
      </ScrollView>

      {/* botón atrás flotante sobre la foto */}
      <Pressable
        onPress={() => navigation.goBack()}
        style={{ position: 'absolute', top: insets.top + 10, left: 16, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', ...shadow.card }}
      >
        <ArrowLeft size={20} color={colors.azul[700]} />
      </Pressable>

      {/* barra inferior: agregar */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, paddingBottom: insets.bottom + 16, backgroundColor: surface.card, borderTopWidth: 1, borderTopColor: border.subtle }}>
        <PrimaryButton
          color={colors.naranja[500]}
          onPress={onAdd}
          label={`Agregar${qty > 1 ? ` ×${qty}` : ''} · $${product.price * qty}`}
        />
      </View>
    </View>
  );
}
