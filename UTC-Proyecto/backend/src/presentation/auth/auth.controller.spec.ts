import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../../application/auth/auth.service';
import { RegisterDto } from '../../application/auth/dto/register.dto';
import { LoginDto } from '../../application/auth/dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  const auth = { register: jest.fn(), login: jest.fn() };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: auth }],
    }).compile();
    controller = moduleRef.get(AuthController);
  });

  it('register delega en AuthService', async () => {
    const dto: RegisterDto = {
      email: 'alguien@utc.edu.mx',
      password: 'contrasena8',
      firstName: 'Ana',
      lastName: 'García',
    };
    auth.register.mockResolvedValue({
      message: 'Cuenta creada',
      access_token: 't',
    });
    await expect(controller.register(dto)).resolves.toMatchObject({
      message: 'Cuenta creada',
    });
    expect(auth.register).toHaveBeenCalledWith(dto);
  });

  it('login delega en AuthService', async () => {
    const dto: LoginDto = {
      email: 'alguien@utc.edu.mx',
      password: 'contrasena8',
    };
    auth.login.mockResolvedValue({
      access_token: 't',
      refresh_token: 'r',
      expires_in: 300,
    });
    await expect(controller.login(dto)).resolves.toMatchObject({
      access_token: 't',
    });
    expect(auth.login).toHaveBeenCalledWith(dto);
  });
});
