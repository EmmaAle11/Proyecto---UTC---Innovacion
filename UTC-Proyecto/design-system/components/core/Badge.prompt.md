Etiqueta de estado pequeña; para pedidos usa los tonos de comida (`cooking`, `ready`, `reoffer`) con `dot` para reforzar el color.

```jsx
<Badge tone="cooking" dot>Por preparar · ~12 min</Badge>
<Badge tone="ready" dot>Listo para recoger</Badge>
<Badge tone="reoffer">↻ Re-ofertado</Badge>
<Badge tone="primary">Popular</Badge>
```

Tonos: `neutral` `primary` `institutional` `cooking` `ready` `reoffer` `success` `warning` `danger` `solid`. Props: `size` (sm/md), `dot`, `icon`.
