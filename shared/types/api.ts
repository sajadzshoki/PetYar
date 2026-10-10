export interface ApiSuccess<T> {
  status: 'ok'
  data: T
}

export interface ApiErrorBody {
  status: 'error'
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody
