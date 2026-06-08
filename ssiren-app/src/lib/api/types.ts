export type ApiResponse<T> = {
  status: number;
  message: string;
  data: T;
};

export type PageInfo = {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type SortInfo = {
  by: string;
  direction: string;
};

export type PageResponse<T> = {
  page: PageInfo;
  sort: SortInfo;
  contents: T[];
};
