import { IsNotEmpty, IsString } from 'class-validator';

/** Cuerpo para renovar la sesión con el refresh_token. */
export class RefreshDto {
  @IsString()
  @IsNotEmpty({ message: 'refresh_token requerido' })
  refresh_token: string;
}
