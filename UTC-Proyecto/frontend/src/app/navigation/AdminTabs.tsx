import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, ClipboardList, UtensilsCrossed, UserCog } from 'lucide-react-native';
import type { AdminTabsParamList } from './types';
import { DashboardScreen } from '../../pages/admin/dashboard/DashboardScreen';
import { QueueScreen } from '../../pages/admin/queue/QueueScreen';
import { MenuScreen } from '../../pages/admin/menu/MenuScreen';
import { AdminAccountScreen } from '../../pages/admin/account/AdminAccountScreen';
import { FloatingTabBar } from './FloatingTabBar';
import { useSessionStore } from '../../features/auth/model/session.store';
import { useScheduledAdminAlerts } from '../../features/notifications/model/useScheduledAlerts';

const Tab = createBottomTabNavigator<AdminTabsParamList>();

/** Tab bar del panel de administración (rol admin): misma píldora flotante que el cliente. */
export function AdminTabs() {
  // Aviso al negocio de pedidos programados que ya deben empezar (spec #4, BR-012).
  const token = useSessionStore((s) => s.session?.accessToken);
  useScheduledAdminAlerts(token);

  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
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
