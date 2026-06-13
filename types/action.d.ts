export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
};
