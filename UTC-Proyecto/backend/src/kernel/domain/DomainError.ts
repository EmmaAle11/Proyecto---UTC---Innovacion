/**
 * Estrategia de error ÚNICA del proyecto (D-039): el dominio lanza DomainError.
 * NO se usa Result/Either (evita mezclar estilos con las excepciones de NestJS).
 * La presentación mapea cada subtipo a su HTTP (ver adaptador Nest del módulo).
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
