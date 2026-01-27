import { logger } from "@/lib/log";
import { JobRunRepo } from "@/repositories/jobRunRepo";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface JobRunOptions {
  retries?: number;
  baseDelayMs?: number;
  meta?: Record<string, unknown>;
}

export async function runJob<T>(
  jobName: string,
  task: () => Promise<T>,
  options: JobRunOptions = {}
): Promise<T> {
  const retries = options.retries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 500;

  let attempt = 0;
  let lastError: unknown = null;

  const run = await JobRunRepo.start(jobName, {
    ...(options.meta ?? {}),
    retries,
    baseDelayMs
  });

  logger.info("job.start", { jobName, runId: run.id });

  while (attempt <= retries) {
    try {
      const result = await task();
      await JobRunRepo.succeed(run.id, {
        ...(options.meta ?? {}),
        attempts: attempt + 1
      });
      logger.info("job.success", { jobName, runId: run.id, attempts: attempt + 1 });
      return result;
    } catch (err) {
      lastError = err;
      attempt += 1;

      logger.error("job.attempt_failed", err, {
        jobName,
        runId: run.id,
        attempt,
        retries
      });

      if (attempt > retries) break;

      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError ?? "Unknown error");
  await JobRunRepo.fail(run.id, message, {
    ...(options.meta ?? {}),
    attempts: attempt
  });
  logger.error("job.failed", lastError, { jobName, runId: run.id, attempts: attempt });

  throw lastError instanceof Error ? lastError : new Error(message);
}
