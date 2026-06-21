Botón de acción de la app; usa `primary` (naranja) para la acción principal de cada pantalla y reserva `institutional` (azul) para acciones de marca/navegación.

```jsx
<Button variant="primary" size="lg" fullWidth>Agregar al pedido · $38</Button>
<Button variant="secondary" leftIcon={<i data-lucide="map-pin" />}>Ver punto de recogida</Button>
<Button variant="ghost" size="sm">Cancelar</Button>
```

Variantes: `primary` · `institutional` · `secondary` · `soft` · `ghost` · `danger`.
Tamaños: `sm` (36) · `md` (44) · `lg` (52). Props útiles: `leftIcon`, `rightIcon`, `fullWidth`, `loading`, `disabled`, `href`.
