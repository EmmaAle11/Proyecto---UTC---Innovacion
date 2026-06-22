import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Correo inválido' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'La contraseña es obligatoria' })
  password: string;
}
