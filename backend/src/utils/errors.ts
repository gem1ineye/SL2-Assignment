export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details: Record<string, unknown>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

export const errorResponse = (
  statusCode: number,
  code: string,
  message: string,
  details: Record<string, unknown> = {}
) => ({
  success: false,
  error: {
    code,
    message,
    details,
  },
});

export const successResponse = (data: unknown) => ({
  success: true,
  data,
});

// Common error factories
export const unauthorized = (message = 'You must be logged in to access this resource') =>
  new AppError(401, 'UNAUTHORIZED', message);

export const forbidden = (message = 'You do not have permission to perform this action') =>
  new AppError(403, 'FORBIDDEN', message);

export const notFound = (resource = 'Resource') =>
  new AppError(404, 'NOT_FOUND', `${resource} not found`);

export const validationError = (message: string, details: Record<string, unknown> = {}) =>
  new AppError(400, 'VALIDATION_ERROR', message, details);

export const duplicateEntry = (message: string) =>
  new AppError(409, 'DUPLICATE_ENTRY', message);

export const expiredInvite = () =>
  new AppError(400, 'EXPIRED_INVITE', 'This invite code has expired');

export const invalidInvite = () =>
  new AppError(400, 'INVALID_INVITE', 'This invite code is not valid or has been deactivated');

export const attendanceWindowClosed = () =>
  new AppError(400, 'ATTENDANCE_WINDOW_CLOSED', 'The attendance window for this session has closed');
