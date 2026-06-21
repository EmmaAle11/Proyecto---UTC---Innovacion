Tarjeta de producto para la rejilla del menú; muestra precio, tiempo de espera y estado del pedido.

```jsx
<ProductCard
  name="Quesadilla de tinga" category="Quesadillas" price={38} prepMin={12}
  popular icon={<i data-lucide="utensils-crossed" />} onAdd={add} />

<ProductCard name="Agua de jamaica" price={18} status="Listo" tone="ready" readyAgo={4} />
```

Props clave: `name`, `price`, `prepMin`, `category`, `image`/`icon`, `status`+`tone`, `readyAgo`, `popular`, `onAdd`.
