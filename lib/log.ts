export type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  requestId?: string;
  jobName?: string;
  meta?: Record<string, unknown>;
  err?: unknown;
}

function safeError(err: unknown) {
  if (!err) return undefined;
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    };
  }
  return { message: String(err) };
}

function emit(payload: LogPayload) {
  const line = {
    ts: new Date().toISOString(),
    level: payload.level,
    message: payload.message,
    requestId: payload.requestId,
    jobName: payload.jobName,
    meta: payload.meta,
    err: safeError(payload.err)
  };

  // Structured JSON logs are easy to ingest later.
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(line));
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    emit({ level: "info", message, meta });
  },
  warn(message: string, meta?: Record<string, unknown>) {
    emit({ level: "warn", message, meta });
  },
  error(message: string, err?: unknown, meta?: Record<string, unknown>) {
    emit({ level: "error", message, err, meta });
  }
};
