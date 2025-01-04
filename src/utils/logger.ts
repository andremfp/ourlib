enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    // Set default log level to INFO or based on environment variable
    this.logLevel =
      import.meta.env.NODE_ENV === "prod" ? LogLevel.INFO : LogLevel.DEBUG;
  }

  private logMessage(level: LogLevel, message: string, ...args: any[]) {
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

  public debug(message: string, ...args: any[]) {
    this.logMessage(LogLevel.DEBUG, message, ...args);
  }

  public info(message: string, ...args: any[]) {
    this.logMessage(LogLevel.INFO, message, ...args);
  }

  public warn(message: string, ...args: any[]) {
    this.logMessage(LogLevel.WARN, message, ...args);
  }

  public error(message: string, ...args: any[]) {
    this.logMessage(LogLevel.ERROR, message, ...args);
  }
}

export default new Logger();
