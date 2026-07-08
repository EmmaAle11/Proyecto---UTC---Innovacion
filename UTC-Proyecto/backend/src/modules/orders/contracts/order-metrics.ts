/** Métricas para el panel del admin (F5/§3.1): qué se vende más y a qué hora pega el pico. */
export interface TopProduct {
  productId: string;
  name: string;
  qty: number; // unidades vendidas (excluye pedidos cancelados)
}

export interface PeakHour {
  hour: number; // 0–23, hora del servidor
  count: number; // pedidos creados en esa hora
}

export interface OrderMetrics {
  topProducts: TopProduct[];
  peakHour: PeakHour | null;
}
