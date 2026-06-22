import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

// BR-002 / D-011: correo institucional. El admin es aparte (no usa este endpoint).
const UTC_DOMAIN = /@utc\.edu\.mx$/i;

export class RegisterDto {
  @IsEmail({}, { message: 'Correo inválido' })
  @Matches(UTC_DOMAIN, { message: 'Debe ser un correo institucional @utc.edu.mx' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72)
  password: string;

  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(60)
  firstName: string;

  @IsString()
  @MinLength(1, { message: 'El apellido es obligatorio' })
  @MaxLength(60)
  lastName: string;
}
