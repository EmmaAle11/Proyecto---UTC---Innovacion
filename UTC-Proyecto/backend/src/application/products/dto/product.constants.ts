/**
 * Constantes de validación compartidas por los DTOs de producto (create/update),
 * para no acoplar un DTO con otro al reutilizar la regla.
 *
 * `image_url` es una RUTA de asset local (p. ej. `products/quesadilla-tinga.png`),
 * NO una URL externa. Restringir el formato bloquea inyecciones tipo `javascript:`,
 * URLs remotas arbitrarias y path-traversal (`../`). Defensa en profundidad.
 */
export const IMAGE_URL_PATTERN = /^products\/[a-z0-9-]+\.(png|jpg|jpeg|webp)$/;
