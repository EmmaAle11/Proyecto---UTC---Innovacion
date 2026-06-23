import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { MapPin, X, Check, Navigation } from 'lucide-react-native';
import { BRANCHES } from '../../entities/branch/mock';
import { useBranchStore } from '../../features/branch/model/branch.store';
import { colors, text, border } from '../../shared/theme';

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
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(2,22,66,0.35)', justifyContent: 'flex-end' }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingBottom: 28, paddingHorizontal: 20 }}
        >
          <View style={{ alignSelf: 'center', width: 42, height: 5, borderRadius: 5, backgroundColor: border.subtle, marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: text.heading }}>Elige tu tienda más cercana</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color={text.muted} />
            </Pressable>
          </View>

          {onUseLocation ? (
            <Pressable
              onPress={onUseLocation}
              disabled={locating}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.naranja[50], marginBottom: 6 }}
            >
              {locating ? <ActivityIndicator size="small" color={colors.naranja[600]} /> : <Navigation size={18} color={colors.naranja[600]} />}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontWeight: '700', fontSize: 14.5, color: colors.naranja[700] }}>
                  {locating ? 'Ubicándote…' : 'Usar mi ubicación'}
                </Text>
                {denied ? (
                  <Text style={{ fontSize: 11.5, color: text.muted, marginTop: 1 }}>Permiso de ubicación denegado. Actívalo en Ajustes del teléfono.</Text>
                ) : null}
              </View>
            </Pressable>
          ) : null}

          <ScrollView style={{ maxHeight: 340 }}>
            {BRANCHES.map((b) => {
              const on = b.id === selected.id;
              return (
                <Pressable
                  key={b.id}
                  onPress={() => {
                    selectByUser(b);
                    onClose();
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: border.subtle }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: on ? colors.naranja[50] : colors.gris[100], alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={20} color={on ? colors.naranja[600] : colors.azul[700]} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontWeight: '700', fontSize: 15, color: text.heading }}>{b.name}</Text>
                    <Text style={{ fontSize: 12, color: text.muted, marginTop: 1 }}>{b.address}</Text>
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
