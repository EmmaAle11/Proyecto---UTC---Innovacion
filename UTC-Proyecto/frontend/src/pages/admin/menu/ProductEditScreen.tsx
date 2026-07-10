import { useState } from 'react';
import { View, ScrollView, Pressable, TextInput, Switch, KeyboardAvoidingView, Platform, Alert, Image, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../../app/navigation/types';
import { Display, Title, Body, Label } from '../../../shared/ui/Type';
import { Chip } from '../../../shared/ui/Chip';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { colors, text, surface, border, shadow, fonts } from '../../../shared/theme';
import { useAdminCatalogStore } from '../../../features/admin/model/catalog.store';
import { useSessionStore } from '../../../features/auth/model/session.store';
import { PRODUCT_STATUS_META, PRODUCT_STATUS_ORDER } from '../../../entities/product/admin-types';
import type { ProductWritePayload } from '../../../entities/product/admin-api';
import type { ProductStatus } from '../../../entities/product/model/types';

type Props = NativeStackScreenProps<AdminStackParamList, 'ProductEdit'>;

/** Parsea un entero no negativo desde el texto de un campo numérico (vacío → 0). */
function toInt(v: string): number {
  const n = parseInt(v.replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

/** Parsea un monto con hasta 2 decimales (el precio admite centavos; vacío → 0). */
function toMoney(v: string): number {
  const n = parseFloat(v.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

/** Campo de texto/numérico con etiqueta, mismo estilo editorial que BrandField. */
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  multiline,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  multiline?: boolean;
  hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginTop: 14 }}>
      <Label color={text.muted}>{label}</Label>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.gris[400]}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        style={{
          marginTop: 6,
          minHeight: multiline ? 84 : 52,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 12 : 0,
          textAlignVertical: multiline ? 'top' : 'center',
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: focused ? colors.naranja[500] : border.subtle,
          backgroundColor: surface.card,
          fontSize: 15,
          color: colors.azul[700],
          fontFamily: fonts.bodyMedium,
        }}
      />
      {hint ? <Body color={text.subtle} style={{ fontSize: 11.5, marginTop: 4 }}>{hint}</Body> : null}
    </View>
  );
}

/** Alta/edición de producto (M3): formulario con TODOS los campos del AdminProduct. */
export function ProductEditScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const products = useAdminCatalogStore((s) => s.products);
  const createProduct = useAdminCatalogStore((s) => s.create);
  const updateProduct = useAdminCatalogStore((s) => s.update);
  const token = useSessionStore((s) => s.session?.accessToken);

  const editing = route.params.productId
    ? products.find((p) => p.id === route.params.productId)
    : undefined;

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [price, setPrice] = useState(String(editing?.price ?? ''));
  const [category, setCategory] = useState(editing?.category ?? '');
  const [prepTime, setPrepTime] = useState(String(editing?.basePrepTimeSeconds ?? ''));
  const [stock, setStock] = useState(String(editing?.stock ?? ''));
  const [minStock, setMinStock] = useState(String(editing?.minStock ?? ''));
  const [maxStock, setMaxStock] = useState(editing?.maxStock != null ? String(editing.maxStock) : '');
  const [status, setStatus] = useState<ProductStatus>(editing?.status ?? 'por_preparar');
  const [isAvailable, setIsAvailable] = useState(editing?.isAvailable ?? true);
  const [imageUrl, setImageUrl] = useState(editing?.imageUrl ?? ''); // F1: foto del producto

  const onSave = async () => {
    if (saving) return;
    // Validación local (espejo del backend) para no viajar al servidor por un error trivial.
    const priceValue = toMoney(price);
    const prepValue = toInt(prepTime);
    if (!name.trim() || !category.trim()) {
      Alert.alert('Faltan datos', 'El nombre y la categoría son obligatorios.');
      return;
    }
    if (priceValue < 0.01) {
      Alert.alert('Precio inválido', 'El precio debe ser mayor a 0.');
      return;
    }
    if (prepValue < 1) {
      Alert.alert('Tiempo inválido', 'El tiempo de preparación debe ser mayor a 0 segundos.');
      return;
    }
    const payload: ProductWritePayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: priceValue,
      category: category.trim(),
      basePrepTimeSeconds: prepValue,
      stock: toInt(stock),
      minStock: toInt(minStock),
      maxStock: maxStock.trim() === '' ? null : toInt(maxStock),
      status,
      isAvailable,
      imageUrl: imageUrl.trim() === '' ? null : imageUrl.trim(),
    };
    setSaving(true);
    try {
      if (editing) {
        await updateProduct(editing.id, payload, token);
      } else {
        await createProduct(payload, token);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert(
        'No se pudo guardar',
        e instanceof Error ? e.message : 'Intenta de nuevo',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: surface.page }}>
      <SafeHeader insets={insets} onBack={() => navigation.goBack()} editing={!!editing} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 64}
      >
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 110 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Field label="Nombre" value={name} onChangeText={setName} placeholder="Quesadilla de tinga" />
          <Field label="Descripción" value={description} onChangeText={setDescription} placeholder="Descripción del producto" multiline />
          <Field label="Categoría" value={category} onChangeText={setCategory} placeholder="Antojitos" />

          {/* F1: foto del producto por URL + vista previa */}
          <Field label="Foto (URL)" value={imageUrl} onChangeText={setImageUrl} placeholder="https://…/foto.png" keyboardType="url" autoCapitalize="none" hint="Pega el enlace de una imagen. Vacío = ícono por defecto." />
          {imageUrl.trim() !== '' ? (
            <View style={{ marginTop: 10, alignItems: 'center' }}>
              <Image source={{ uri: imageUrl.trim() }} style={{ width: 120, height: 90, borderRadius: 12, backgroundColor: colors.gris[100] }} resizeMode="cover" />
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field label="Precio (MXN)" value={price} onChangeText={setPrice} placeholder="0" keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Prep. (seg)" value={prepTime} onChangeText={setPrepTime} placeholder="0" keyboardType="number-pad" />
            </View>
          </View>

          {/* Inventario */}
          <Title style={{ marginTop: 22, fontSize: 15 }}>Inventario</Title>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field label="Stock" value={stock} onChangeText={setStock} placeholder="0" keyboardType="number-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Mín." value={minStock} onChangeText={setMinStock} placeholder="0" keyboardType="number-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Máx." value={maxStock} onChangeText={setMaxStock} placeholder="∞" keyboardType="number-pad" hint="Vacío = sin tope" />
            </View>
          </View>

          {/* Estado */}
          <Title style={{ marginTop: 22, fontSize: 15 }}>Estado</Title>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {PRODUCT_STATUS_ORDER.map((s) => (
              <Chip key={s} selected={s === status} onPress={() => setStatus(s)}>
                {PRODUCT_STATUS_META[s].label}
              </Chip>
            ))}
          </View>

          {/* Disponibilidad */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: surface.card, borderRadius: 18, borderWidth: 1, borderColor: border.subtle, paddingVertical: 14, paddingHorizontal: 16, marginTop: 18, ...shadow.card }}>
            <View>
              <Title style={{ fontSize: 15 }}>Disponible</Title>
              <Body color={text.muted} style={{ fontSize: 12, marginTop: 2 }}>Visible para los clientes</Body>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: colors.gris[200], true: colors.naranja[300] }}
              thumbColor={isAvailable ? colors.naranja[500] : colors.gris[100]}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Barra inferior: guardar */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, paddingBottom: insets.bottom + 16, backgroundColor: surface.card, borderTopWidth: 1, borderTopColor: border.subtle }}>
        <PrimaryButton
          color={colors.naranja[500]}
          onPress={() => void onSave()}
          disabled={saving}
          label={saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear producto'}
        />
      </View>
    </View>
  );
}

/** Header editorial con botón atrás (Display + barrita naranja). */
function SafeHeader({ insets, onBack, editing }: { insets: { top: number }; onBack: () => void; editing: boolean }) {
  return (
    <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 20, paddingBottom: 6, backgroundColor: surface.page }}>
      <Pressable
        onPress={onBack}
        style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: surface.card, borderWidth: 1, borderColor: border.subtle, alignItems: 'center', justifyContent: 'center', ...shadow.card }}
      >
        <ArrowLeft size={20} color={colors.azul[700]} />
      </Pressable>
      <Label style={{ marginTop: 12 }}>{editing ? 'Editar' : 'Alta'} · producto</Label>
      <Display style={{ marginTop: 4 }}>{editing ? 'Editar' : 'Nuevo'}</Display>
      <View style={{ width: 58, height: 6, borderRadius: 3, backgroundColor: colors.naranja[500], marginTop: 10 }} />
    </View>
  );
}
