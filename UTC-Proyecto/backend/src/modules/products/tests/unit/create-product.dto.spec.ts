import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateProductDto } from '../../contracts/create-product.dto';

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
  // F1: acepta ruta local de asset O una URL http(s) de imagen.
  it.each([
    'products/quesadilla-tinga.png',
    'https://cdn.picksazon.app/fotos/hamburguesa.jpg',
    'https://images.example.com/a/b.webp?w=400',
    'http://mi-servidor.local/foto.png',
  ])('acepta %s', async (good) => {
    expect(await imageUrlErrors(good)).toBe(false);
  });

  it('es opcional: ausente no falla', async () => {
    const errors = await validate(plainToInstance(CreateProductDto, base()));
    expect(errors).toHaveLength(0);
  });

  // Regresión: bloquear inyección/esquemas raros/path-traversal/extensión no-imagen.
  it.each([
    'javascript:alert(1)',
    'javascript:alert(1)//x.png',
    '../../etc/passwd',
    'products/../secret.png',
    'products/foo.svg',
    'https://evil.example/x.svg',
    'ftp://x/x.png',
  ])('rechaza %s', async (bad) => {
    expect(await imageUrlErrors(bad)).toBe(true);
  });
});
