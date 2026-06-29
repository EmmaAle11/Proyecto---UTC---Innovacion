import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateProductDto } from './create-product.dto';

/** Producto válido mínimo; cada test sobrescribe solo lo que prueba. */
function base(): Record<string, unknown> {
  return {
    name: 'Quesadilla de tinga',
    price: 38,
    category: 'Antojitos',
    basePrepTimeSeconds: 720,
    status: 'por_preparar',
  };
}

async function imageUrlErrors(imageUrl: unknown): Promise<boolean> {
  const dto = plainToInstance(CreateProductDto, { ...base(), imageUrl });
  const errors = await validate(dto);
  return errors.some((e) => e.property === 'imageUrl');
}

describe('CreateProductDto · imageUrl', () => {
  it('acepta una ruta de asset válida (products/<slug>.png)', async () => {
    expect(await imageUrlErrors('products/quesadilla-tinga.png')).toBe(false);
  });

  it('es opcional: ausente no falla', async () => {
    const errors = await validate(plainToInstance(CreateProductDto, base()));
    expect(errors).toHaveLength(0);
  });

  // Regresión: bloquear inyección/URLs externas/path-traversal (defensa en profundidad).
  it.each([
    'javascript:alert(1)',
    'http://evil.example/x.png',
    'https://evil.example/x.png',
    '../../etc/passwd',
    'products/../secret.png',
    'products/foo.svg',
  ])('rechaza %s', async (bad) => {
    expect(await imageUrlErrors(bad)).toBe(true);
  });
});
