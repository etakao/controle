export type ApiError = {
  error: string;
  details?: unknown;
};

export type ApiResponse<T> = T | ApiError;
