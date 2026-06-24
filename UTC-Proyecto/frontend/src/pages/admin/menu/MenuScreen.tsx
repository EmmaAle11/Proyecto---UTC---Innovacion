import { useMemo, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Tag, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../../app/navigation/types';
import { Heading, Title, Body, Label, Mono } from '../../../shared/ui/Type';
import { Badge } from '../../../shared/ui/Badge';
import { Chip } from '../../../shared/ui/Chip';
import { Media } from '../../../shared/ui/Media';
import { colors, text, surface, border, shadow, fonts } from '../../../shared/theme';
import { useCatalogStore } from '../../../features/admin/model/catalog.store';
import { PRODUCT_STATUS_META, type AdminProduct } from '../../../entities/product/admin-mock';
import { productImage } from '../../../entities/product/images';
import { productIcon } from '../../../entities/product/icons';

/** Estados que admiten reoferta / "Pon tu precio" (§3.11): tienen acceso al editor de reoferta. */
const REOFFER_STATUSES: AdminProduct['status'][] = ['calentando', 'preparado', 'sin_tiempo_espera'];

function canReoffer(p: AdminProduct): boolean {
  return p.reofferPrice != null || REOFFER_STATUSES.includes(p.status);
}

const ALL = 'Todo';

/** Catálogo del admin (M3): lista de productos con filtro por categoría, toggle de disponibilidad y reoferta. */
export function MenuScreen() {
  const products = useCatalogStore((s) => s.products);
  const toggleAvailable = useCatalogStore((s) => s.toggleAvailable);
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const [category, setCategory] = useState<string>(ALL);

  // Categorías derivadas de los productos cargados (más "Todo").
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return [ALL, ...Array.from(set)];
  }, [products]);

  const list = products.filter((p) => category === ALL || p.category === category);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: surface.page }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Label>Catálogo · {products.length} productos</Label>
          <Heading style={{ fontSize: 25, lineHeight: 29, marginTop: 2 }}>Menú</Heading>
        </View>
        <Pressable
          onPress={() => navigation.navigate('ProductEdit', {})}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.naranja[500], paddingHorizontal: 14, height: 40, borderRadius: 12, ...shadow.card }}
        >
          <Plus size={16} color="#fff" />
          <Body color="#fff" style={{ fontSize: 13.5, fontFamily: fonts.bodyBold }}>Nuevo</Body>
        </Pressable>
      </View>

      {/* Filtro por categoría */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingTop: 10, paddingBottom: 12 }}>
        {categories.map((c) => (
          <Chip key={c} selected={c === category} onPress={() => setCategory(c)}>
            {c}
          </Chip>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 2, paddingBottom: 28, gap: 14 }} showsVerticalScrollIndicator={false}>
        {list.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 48 }}>
            <Body color={text.muted}>Sin productos en esta categoría.</Body>
          </View>
        ) : (
          list.map((p) => {
            const meta = PRODUCT_STATUS_META[p.status];
            const Icon = productIcon(p.icon);
            const reoffer = canReoffer(p);
            return (
              <Pressable
                key={p.id}
                onPress={() => navigation.navigate('ProductEdit', { productId: p.id })}
                style={{ backgroundColor: surface.card, borderRadius: 18, borderWidth: 1, borderColor: border.subtle, padding: 12, ...shadow.card }}
              >
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Media
                    height={64}
                    radius={12}
                    source={productImage(p.id)}
                    icon={<Icon size={28} color={colors.azul[300]} />}
                    style={{ width: 64 }}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <Title style={{ fontSize: 15, flex: 1 }} numberOfLines={1}>{p.name}</Title>
                      <Mono style={{ fontFamily: fonts.monoBold, fontSize: 15 }} color={text.heading}>{`$${p.price}`}</Mono>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <Mono style={{ fontSize: 11.5 }} color={text.muted}>{p.category}</Mono>
                      <Badge tone={meta.tone} dot>{meta.label}</Badge>
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: border.subtle }}>
                  <Pressable
                    onPress={() => toggleAvailable(p.id)}
                    hitSlop={6}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 7, height: 32, paddingHorizontal: 11, borderRadius: 10, backgroundColor: p.isAvailable ? colors.lima[50] : colors.gris[100] }}
                  >
                    <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: p.isAvailable ? colors.lima[500] : colors.gris[400] }} />
                    <Body color={p.isAvailable ? colors.lima[600] : text.subtle} style={{ fontSize: 12.5, fontFamily: fonts.bodySemi }}>
                      {p.isAvailable ? 'Disponible' : 'Agotado'}
                    </Body>
                  </Pressable>

                  {reoffer ? (
                    <Pressable
                      onPress={() => navigation.navigate('Reoffer', { productId: p.id })}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.naranja[50], paddingHorizontal: 10, height: 32, borderRadius: 10 }}
                    >
                      <Tag size={13} color={colors.naranja[700]} />
                      <Body color={colors.naranja[700]} style={{ fontSize: 12, fontFamily: fonts.bodyBold }}>
                        {p.reofferPrice != null ? `Reoferta $${p.reofferPrice}` : 'Reofertar'}
                      </Body>
                      <ChevronRight size={14} color={colors.naranja[700]} />
                    </Pressable>
                  ) : (
                    <ChevronRight size={18} color={text.subtle} />
                  )}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
