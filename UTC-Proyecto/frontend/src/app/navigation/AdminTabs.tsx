import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, ClipboardList, UtensilsCrossed, UserCog } from 'lucide-react-native';
import type { AdminTabsParamList } from './types';
import { DashboardScreen } from '../../pages/admin/dashboard/DashboardScreen';
import { QueueScreen } from '../../pages/admin/queue/QueueScreen';
import { MenuScreen } from '../../pages/admin/menu/MenuScreen';
import { AdminAccountScreen } from '../../pages/admin/account/AdminAccountScreen';
import { colors, text, fonts } from '../../shared/theme';

const Tab = createBottomTabNavigator<AdminTabsParamList>();

/** Tab bar del panel de administración (rol admin). Color de rol = azul institucional. */
export function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.azul[700],
        tabBarInactiveTintColor: text.subtle,
        tabBarStyle: { height: 62, paddingTop: 6, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 12, fontFamily: fonts.bodySemi },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Pedidos"
        component={QueueScreen}
        options={{ tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Menu"
        component={MenuScreen}
        options={{ tabBarLabel: 'Menú', tabBarIcon: ({ color, size }) => <UtensilsCrossed color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Cuenta"
        component={AdminAccountScreen}
        options={{ tabBarIcon: ({ color, size }) => <UserCog color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
