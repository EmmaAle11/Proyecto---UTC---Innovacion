export type RootStackParamList = {
  Welcome: undefined;
  LoginUsuario: undefined;
  LoginAdmin: undefined;
  Main: undefined;
};

/** Stack interno tras iniciar sesión: las tabs + pantallas empujadas (detalle, carrito). */
export type MainStackParamList = {
  Tabs: undefined;
  Product: { productId: string };
  Cart: undefined;
  Tracking: undefined;
  Wallet: undefined;
};

/** Tabs del panel de administración (rol admin). */
export type AdminTabsParamList = {
  Inicio: undefined; // Dashboard (semáforo + KPIs)
  Pedidos: undefined; // Cola de pedidos
  Menu: undefined; // Catálogo / productos
  Cuenta: undefined; // Perfil admin + cerrar sesión
};

/** Stack del admin: las tabs + pantallas empujadas (detalle de pedido, editar producto, reoferta). */
export type AdminStackParamList = {
  Tabs: undefined;
  OrderDetail: { orderId: string };
  ProductEdit: { productId?: string };
  Reoffer: { productId: string };
  Personalizacion: undefined;
};
