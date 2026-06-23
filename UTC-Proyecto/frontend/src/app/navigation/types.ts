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
};
