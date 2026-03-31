import { jsonText } from "./formatters.js";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "TIMEOUT"
  | "UPSTREAM_ERROR"
  | "DATA_SHAPE_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly safeMessage: string;
  public readonly transient: boolean;
  public readonly causeValue: unknown;

  public constructor(
    code: ErrorCode,
    message: string,
    options?: {
      safeMessage?: string;
      transient?: boolean;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.safeMessage = options?.safeMessage ?? message;
    this.transient = options?.transient ?? false;
    this.causeValue = options?.cause;
  }
}

export class ValidationError extends AppError {
  public constructor(message: string) {
    super("VALIDATION_ERROR", message, { safeMessage: message });
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  public constructor(message: string) {
    super("NOT_FOUND", message, { safeMessage: message });
    this.name = "NotFoundError";
  }
}

export class TimeoutError extends AppError {
  public constructor(message: string, cause?: unknown) {
    super("TIMEOUT", message, {
      safeMessage: "The CSE API took too long to respond. Please try again shortly.",
      transient: true,
      cause
    });
    this.name = "TimeoutError";
  }
}

export class UpstreamError extends AppError {
  public constructor(message: string, options?: { safeMessage?: string; transient?: boolean; cause?: unknown }) {
    super("UPSTREAM_ERROR", message, {
      safeMessage:
        options?.safeMessage ??
        "The CSE API is temporarily unavailable or returned an unexpected status.",
      transient: options?.transient ?? true,
      cause: options?.cause
    });
    this.name = "UpstreamError";
  }
}

export class DataShapeError extends AppError {
  public constructor(message: string, cause?: unknown) {
    super("DATA_SHAPE_ERROR", message, {
      safeMessage: "The CSE API returned data in an unexpected format. Please try again later.",
      transient: true,
      cause
    });
    this.name = "DataShapeError";
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError("INTERNAL_ERROR", error.message, {
      safeMessage: "Something unexpected happened while processing this request.",
      cause: error
    });
  }

  return new AppError("INTERNAL_ERROR", "Unknown error", {
    safeMessage: "Something unexpected happened while processing this request.",
    cause: error
  });
}

function serializeCause(cause: unknown): unknown {
  if (cause instanceof Error) {
    return {
      name: cause.name,
      message: cause.message,
      stack: cause.stack
    };
  }

  return cause;
}

export function logError(context: string, error: unknown): void {
  const appError = toAppError(error);

  console.error(
    `[cse-mcp] ${context}`,
    jsonText({
      code: appError.code,
      message: appError.message,
      safeMessage: appError.safeMessage,
      transient: appError.transient,
      cause: serializeCause(appError.causeValue)
    })
  );
}

export function createToolSuccessResponse(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: jsonText(payload)
      }
    ]
  };
}

export function createToolErrorResponse(context: string, error: unknown) {
  const appError = toAppError(error);
  logError(context, appError);

  return {
    content: [
      {
        type: "text" as const,
        text: jsonText({
          ok: false,
          error: {
            code: appError.code,
            message: appError.safeMessage,
            transient: appError.transient
          }
        })
      }
    ],
    isError: true
  };
}

export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}
