import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MainStackParamList } from './types';
import { MainTabs } from './MainTabs';
import { ProductScreen } from '../../pages/product/ProductScreen';
import { CartScreen } from '../../pages/cart/CartScreen';
import { TrackingScreen } from '../../pages/tracking/TrackingScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

/**
 * Stack que envuelve las tabs (Inicio·Pedidos·Perfil) y deja empujar el detalle de
 * producto, el carrito y el seguimiento por encima de la tab bar.
 */
export function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="Product" component={ProductScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Tracking" component={TrackingScreen} />
    </Stack.Navigator>
  );
}
