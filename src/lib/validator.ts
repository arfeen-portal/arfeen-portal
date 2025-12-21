// src/lib/validator.ts

export type ValidatorResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export function validate<T>(
  data: T,
  validator: (data: T) => boolean,
  errorMessage = "Validation failed"
): ValidatorResult<T> {
  if (!validator(data)) {
    return {
      success: false,
      error: errorMessage,
    };
  }

  return {
    success: true,
    data,
  };
}
