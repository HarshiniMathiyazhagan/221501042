class LoggingService {
  private static instance: LoggingService;
  private readonly logPrefix = '[URL Shortener]';

  private constructor() {}

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  private formatMessage(level: string, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `${this.logPrefix} [${timestamp}] ${level}: ${message}${contextStr}`;
  }

  public info(message: string, context?: any): void {
    const formattedMessage = this.formatMessage('INFO', message, context);
    this.writeToLog(formattedMessage);
  }

  public error(message: string, context?: any): void {
    const formattedMessage = this.formatMessage('ERROR', message, context);
    this.writeToLog(formattedMessage);
  }

  public warn(message: string, context?: any): void {
    const formattedMessage = this.formatMessage('WARN', message, context);
    this.writeToLog(formattedMessage);
  }

  public debug(message: string, context?: any): void {
    const formattedMessage = this.formatMessage('DEBUG', message, context);
    this.writeToLog(formattedMessage);
  }

  private writeToLog(message: string): void {
    // In a real application, this would write to a file or external logging service
    // For this demo, we'll store logs in localStorage to persist them
    const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
    logs.push(message);
    localStorage.setItem('app_logs', JSON.stringify(logs));
  }
}

export const logger = LoggingService.getInstance();