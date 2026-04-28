type Severity = 'info' | 'warning' | 'error';

interface ReportContext {
  /** Component or module that originated the report. */
  source: string;
  /** Free-form tags useful for filtering in the eventual sink (Sentry/PostHog). */
  tags?: Record<string, string | number | boolean>;
}

// Single choke-point for runtime warnings/errors. Today this routes to the
// console; replacing the body with Sentry.captureException / posthog.captureException
// later is a one-file change. Always go through this — never call console.warn /
// console.error directly from product code, or those failures stay invisible
// in prod.

function emit(severity: Severity, message: string, error: unknown, ctx: ReportContext) {
  const payload = {
    severity,
    source: ctx.source,
    message,
    tags: ctx.tags,
    error,
  };
  if (severity === 'error') {
    console.error(`[${ctx.source}]`, message, payload);
  } else if (severity === 'warning') {
    console.warn(`[${ctx.source}]`, message, payload);
  } else {
    console.info(`[${ctx.source}]`, message, payload);
  }
}

export const reporter = {
  warn(message: string, error: unknown, ctx: ReportContext) {
    emit('warning', message, error, ctx);
  },
  error(message: string, error: unknown, ctx: ReportContext) {
    emit('error', message, error, ctx);
  },
  info(message: string, ctx: ReportContext) {
    emit('info', message, undefined, ctx);
  },
};
