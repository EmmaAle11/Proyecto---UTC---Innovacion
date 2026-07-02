import { IsInt, Min } from 'class-validator';

/** Ajuste de los umbrales del semáforo (G2/§3.14). `red > yellow` lo valida el service. */
export class UpdateCongestionDto {
  @IsInt({ message: 'El umbral amarillo debe ser un entero' })
  @Min(1, { message: 'El umbral amarillo debe ser al menos 1' })
  yellow: number;

  @IsInt({ message: 'El umbral rojo debe ser un entero' })
  @Min(2, { message: 'El umbral rojo debe ser al menos 2' })
  red: number;
}
