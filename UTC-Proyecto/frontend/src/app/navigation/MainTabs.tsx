import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { House, ClipboardList, User } from 'lucide-react-native';
import { HomeScreen } from '../../pages/home/HomeScreen';
import { OrdersScreen } from '../../pages/orders/OrdersScreen';
import { ProfileScreen } from '../../pages/profile/ProfileScreen';
import { FloatingTabBar } from './FloatingTabBar';
import { useSessionStore } from '../../features/auth/model/session.store';
import { useOrderNotifications } from '../../features/notifications/model/useOrderNotifications';

const Tab = createBottomTabNavigator();

/** Tab bar principal de la app (tras iniciar sesión): píldora flotante (FloatingTabBar). */
export function MainTabs() {
  // Avisos del pedido (BR-012): sondea el backend y notifica las transiciones del cliente.
  const token = useSessionStore((s) => s.session?.accessToken);
  useOrderNotifications(token);

  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Pedidos"
        component={OrdersScreen}
        options={{ tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
