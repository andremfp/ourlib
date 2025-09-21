enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    // Determine log level from (in order of precedence):
    // 1) localStorage override (log_level)
    // 2) Vite env var VITE_LOG_LEVEL
    // 3) Build mode (prod => INFO, dev => DEBUG)
    let override = "";
    try {
      override = (localStorage.getItem("log_level") || "").toLowerCase();
    } catch {
      // ignore (e.g., SSR or storage unavailable)
    }
    const envLevel = (
      (import.meta.env.VITE_LOG_LEVEL as string | undefined) || ""
    ).toLowerCase();

    const candidate = override || envLevel;
    const validLevels = Object.values(LogLevel) as string[];

    if (validLevels.includes(candidate)) {
      this.logLevel = candidate as LogLevel;
    } else {
      this.logLevel = import.meta.env.PROD ? LogLevel.INFO : LogLevel.DEBUG;
    }
  }

  private logMessage(level: LogLevel, message: string, ...args: unknown[]) {
    // Log only if the current log level allows the message
    const logLevels: LogLevel[] = Object.values(LogLevel);
    const currentIndex = logLevels.indexOf(this.logLevel);
    const messageIndex = logLevels.indexOf(level);

    if (messageIndex >= currentIndex) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug("[DEBUG] " + message, ...args);
          break;
        case LogLevel.INFO:
          console.info("[INFO] " + message, ...args);
          break;
        case LogLevel.WARN:
          console.warn("[WARN] " + message, ...args);
          break;
        case LogLevel.ERROR:
          console.error("[ERROR] " + message, ...args);
          break;
        default:
          console.log("[LOG] " + message, ...args);
          break;
      }
    }
  }

  public debug(message: string, ...args: unknown[]) {
    this.logMessage(LogLevel.DEBUG, message, ...args);
  }

  public info(message: string, ...args: unknown[]) {
    this.logMessage(LogLevel.INFO, message, ...args);
  }

  public warn(message: string, ...args: unknown[]) {
    this.logMessage(LogLevel.WARN, message, ...args);
  }

  public error(message: string, ...args: unknown[]) {
    this.logMessage(LogLevel.ERROR, message, ...args);
  }
}

export default new Logger();
