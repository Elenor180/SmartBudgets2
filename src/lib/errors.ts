type ErrorEnvelope = {
  code?: unknown;
  error_code?: unknown;
  message?: unknown;
  status?: unknown;
  statusCode?: unknown;
};

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

const readString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const readStatus = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const numeric = Number.parseInt(value, 10);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return null;
};

const includesAny = (value: string, checks: readonly string[]) =>
  checks.some((check) => value.includes(check));

const sanitizeFallback = (fallback: string) =>
  fallback.trim() || DEFAULT_ERROR_MESSAGE;

const getErrorEnvelope = (error: unknown): ErrorEnvelope => {
  if (error instanceof Error) {
    return {
      message: error.message,
      status: (error as ErrorEnvelope).status,
      statusCode: (error as ErrorEnvelope).statusCode,
      code: (error as ErrorEnvelope).code,
      error_code: (error as ErrorEnvelope).error_code,
    };
  }

  if (typeof error === 'object' && error !== null) {
    return error as ErrorEnvelope;
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  return {};
};

export const toErrorMessage = (
  error: unknown,
  fallback = DEFAULT_ERROR_MESSAGE,
) => {
  const safeFallback = sanitizeFallback(fallback);
  const envelope = getErrorEnvelope(error);

  const status =
    readStatus(envelope.status) ?? readStatus(envelope.statusCode);
  const message = readString(envelope.message).toLowerCase();
  const code = readString(envelope.code || envelope.error_code).toLowerCase();

  if (status === 429 || includesAny(message, ['too many requests', 'rate limit'])) {
    return 'Too many attempts right now. Please wait a moment and try again.';
  }

  if (status === 401 || status === 403) {
    return 'Your session has expired or access was denied. Please sign in again.';
  }

  if (status !== null && status >= 500) {
    return 'The service is temporarily unavailable. Please try again shortly.';
  }

  if (
    includesAny(code, ['invalid_credentials']) ||
    includesAny(message, ['invalid login credentials', 'invalid credentials'])
  ) {
    return 'Invalid email or password. Please try again.';
  }

  if (includesAny(message, ['email not confirmed', 'signup is disabled'])) {
    return 'Please confirm your email before signing in.';
  }

  if (
    includesAny(message, ['user already registered', 'already exists']) ||
    includesAny(code, ['user_already_exists'])
  ) {
    return 'An account with these details already exists. Try signing in instead.';
  }

  if (includesAny(message, ['conflict', 'stale data', 'changed in another session'])) {
    return 'This record changed in another session. Reload the workspace and try again.';
  }

  if (
    includesAny(message, ['jwt', 'token', 'session not found', 'refresh token']) ||
    includesAny(code, ['invalid_jwt', 'jwt_expired'])
  ) {
    return 'Your session is no longer valid. Please sign in again.';
  }

  if (
    includesAny(message, [
      'row-level security',
      'permission denied',
      'not authorized',
      'no api key found',
      'failed to fetch',
      'networkerror',
      'network request failed',
    ])
  ) {
    return 'We could not connect securely to your workspace. Please try again.';
  }

  return safeFallback;
};
