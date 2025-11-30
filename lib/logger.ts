// lib/logger.ts

// Simple safe logger wrapper.
// In production, you can route this to an external logging service.

export const logger = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[LOG]", ...args);
    }
  },

  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.info("[INFO]", ...args);
    }
  },

  warn: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[WARN]", ...args);
    }
  },

  error: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[ERROR]", ...args);
    }
  },
};

