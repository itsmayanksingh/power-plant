export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  details?: unknown;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
};
