import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AdminStackParamList } from './types';
import { AdminTabs } from './AdminTabs';
import { OrderDetailScreen } from '../../pages/admin/order-detail/OrderDetailScreen';
import { ProductEditScreen } from '../../pages/admin/menu/ProductEditScreen';
import { ReofferScreen } from '../../pages/admin/menu/ReofferScreen';
import { PersonalizacionScreen } from '../../pages/admin/account/PersonalizacionScreen';

const Stack = createNativeStackNavigator<AdminStackParamList>();

/**
 * Stack del panel de administración: las tabs (Dashboard · Cola · Menú) y, por
 * encima, el detalle de pedido, la edición de producto y la reoferta.
 */
export function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={AdminTabs} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="ProductEdit" component={ProductEditScreen} />
      <Stack.Screen name="Reoffer" component={ReofferScreen} />
      <Stack.Screen name="Personalizacion" component={PersonalizacionScreen} />
    </Stack.Navigator>
  );
}
