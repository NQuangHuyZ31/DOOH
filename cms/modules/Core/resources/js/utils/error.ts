interface ErrorWithResponse {
  response?: {
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
  };
  message?: string;
}

export function extractErrorMessage(error: unknown, fallback = 'An unexpected error occurred.'): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as ErrorWithResponse;
    const apiMessage = err.response?.data?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
      return apiMessage;
    }

    if (typeof err.message === 'string' && err.message.trim().length > 0) {
      return err.message;
    }
  }

  return fallback;
}
