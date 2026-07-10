import { Modal, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { MapPin, X, Check, Navigation } from 'lucide-react-native';
import { BRANCHES } from '../../entities/branch/branches';
import { useBranchStore } from '../../features/branch/model/branch.store';
import { Heading, Title, Body, Label } from '../../shared/ui/Type';
import { colors, text, border, surface, shadow } from '../../shared/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  locating?: boolean;
  denied?: boolean;
  onUseLocation?: () => void;
};

/** Selector manual de sucursal de recogida (hoja inferior) + acción "Usar mi ubicación". */
export function BranchPicker({ visible, onClose, locating, denied, onUseLocation }: Props) {
  const selected = useBranchStore((s) => s.selected);
  const selectByUser = useBranchStore((s) => s.selectByUser);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(2,22,66,0.45)', justifyContent: 'flex-end' }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ backgroundColor: surface.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingBottom: 28, paddingHorizontal: 20, ...shadow.floating }}
        >
          <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 5, backgroundColor: border.default, marginBottom: 16 }} />
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
            <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
              <Label color={colors.naranja[500]}>Punto de recogida</Label>
              <Heading style={{ fontSize: 22, lineHeight: 26, marginTop: 4 }}>Elige tu tienda más cercana</Heading>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: surface.page, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
              <X size={20} color={text.muted} />
            </Pressable>
          </View>

          <View style={{ height: 4, width: 46, borderRadius: 2, backgroundColor: colors.naranja[500], marginTop: 8, marginBottom: 14 }} />

          {onUseLocation ? (
            <Pressable
              onPress={onUseLocation}
              disabled={locating}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 16, backgroundColor: colors.primary, marginBottom: 16, ...shadow.card }}
            >
              {locating ? <ActivityIndicator size="small" color="#fff" /> : <Navigation size={18} color="#fff" />}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Title color="#fff" style={{ fontSize: 15 }}>
                  {locating ? 'Ubicándote…' : 'Usar mi ubicación'}
                </Title>
                {denied ? (
                  <Body color={colors.naranja[100]} style={{ fontSize: 12, lineHeight: 16, marginTop: 2 }}>Permiso de ubicación denegado. Actívalo en Ajustes del teléfono.</Body>
                ) : null}
              </View>
            </Pressable>
          ) : null}

          <ScrollView style={{ maxHeight: 340 }} contentContainerStyle={{ gap: 10, paddingBottom: 4 }} showsVerticalScrollIndicator={false}>
            {BRANCHES.map((b) => {
              const on = b.id === selected?.id;
              return (
                <Pressable
                  key={b.id}
                  onPress={() => {
                    selectByUser(b);
                    onClose();
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, paddingHorizontal: 13, borderRadius: 16, backgroundColor: surface.card, borderWidth: on ? 2 : 1, borderColor: on ? colors.naranja[500] : border.subtle, ...(on ? shadow.card : null) }}
                >
                  <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: on ? colors.naranja[50] : surface.page, alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={20} color={on ? colors.naranja[600] : colors.azul[700]} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Title style={{ fontSize: 15.5 }} numberOfLines={1}>{b.name}</Title>
                    <Body color={text.muted} style={{ fontSize: 12.5, lineHeight: 17, marginTop: 2 }} numberOfLines={1}>{b.address}</Body>
                  </View>
                  {on ? <Check size={20} color={colors.naranja[500]} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
