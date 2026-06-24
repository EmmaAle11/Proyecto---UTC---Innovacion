import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { House, ClipboardList, User } from 'lucide-react-native';
import { HomeScreen } from '../../pages/home/HomeScreen';
import { OrdersScreen } from '../../pages/orders/OrdersScreen';
import { ProfileScreen } from '../../pages/profile/ProfileScreen';
import { fonts } from '../../shared/theme';

const Tab = createBottomTabNavigator();

/** Tab bar principal de la app (tras iniciar sesión). */
export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#E34100',
        tabBarInactiveTintColor: '#9BA4B5',
        tabBarStyle: { height: 62, paddingTop: 6, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 12, fontFamily: fonts.bodySemi },
      }}
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
