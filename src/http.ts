import { z } from 'zod';

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    throw new HttpError(400, 'Validation failed', details);
  }
  return result.data;
}

export const idParams = z.object({ id: z.coerce.number().int().positive() });

export function notFound(what: string): never {
  throw new HttpError(404, `${what} not found`);
}
