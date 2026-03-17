/**
 * Structured HTTP error with a status code.
 * Use this instead of `const err: any = new Error(...)` throughout the app.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFound(message = 'Not found'): AppError {
  return new AppError(message, 404);
}

export function forbidden(message = 'Forbidden'): AppError {
  return new AppError(message, 403);
}

export function conflict(message: string): AppError {
  return new AppError(message, 409);
}
