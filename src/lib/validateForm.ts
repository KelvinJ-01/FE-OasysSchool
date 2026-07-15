import type { ZodType } from 'zod';

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };

export function parseFormData<T>(schema: ZodType<T>, data: unknown): ParseResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const key = issue.path.join('.') || '_form';
    if (!errors[key]) errors[key] = issue.message;
  });
  return { success: false, errors };
}

export function firstError(errors: Record<string, string>): string | null {
  const keys = Object.keys(errors);
  return keys.length > 0 ? errors[keys[0]] : null;
}
