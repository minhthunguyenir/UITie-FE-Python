export interface Response<T> {
  data: T;
  status: boolean;
  message: string;
}

export interface Pagination<T> {
  data: T;
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}