/**
 * Constantes de validación compartidas por los DTOs de producto (create/update),
 * para no acoplar un DTO con otro al reutilizar la regla.
 *
 * `image_url` admite DOS formas (F1): una RUTA de asset local
 * (`products/quesadilla-tinga.png`) o una URL http/https que termine en imagen
 * (`.png/.jpg/.jpeg/.webp`, con query opcional). Restringir el formato bloquea
 * inyecciones tipo `javascript:`, esquemas raros y path-traversal (`../`). Defensa
 * en profundidad (además de `MaxLength` en el DTO).
 */
export const IMAGE_URL_PATTERN =
  /^(products\/[a-z0-9-]+\.(png|jpg|jpeg|webp)|https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|webp)(\?[^\s"'<>]*)?)$/i;
