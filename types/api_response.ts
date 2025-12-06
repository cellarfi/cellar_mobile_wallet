export interface PaginationInfo {
  page: number
  pageSize: number
  totalPages: number
  totalPosts: number
}

export interface ApiResponseInterface<D = any> {
  data?: D
  message?: string
  success?: boolean
  pagination?: PaginationInfo
}
