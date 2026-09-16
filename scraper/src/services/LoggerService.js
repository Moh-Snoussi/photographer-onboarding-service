import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export class LoggerService {
  constructor({
    consoleLevel = process.env.LOG_LEVEL || 'info',
    fileLevel = process.env.LOG_FILE_LEVEL || 'debug',
    logLlmPayloads = process.env.LOG_LLM_PAYLOADS === 'true',
    logFile = process.env.LOG_FILE || 'logs/scraper.log',
    consoleImpl = console,
    fileSystem = { appendFileSync, mkdirSync },
  } = {}) {
    this.consoleLevel = levelValue(consoleLevel);
    this.fileLevel = levelValue(fileLevel);
    this.logLlmPayloads = logLlmPayloads;
    this.logFile = logFile;
    this.console = consoleImpl;
    this.fileSystem = fileSystem;
  }

  info(message, context = {}) {
    this.write('info', message, context);
  }

  warn(message, context = {}) {
    this.write('warn', message, context);
  }

  error(message, context = {}) {
    this.write('error', message, context);
  }

  debug(message, context = {}) {
    this.write('debug', message, context);
  }

  debugLlmPayload(message, context = {}) {
    if (this.logLlmPayloads) {
      this.write('debug', message, context);
    }
  }

  write(level, message, context) {
    const output = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service: 'scraper',
      message,
      ...context,
    }, errorReplacer);
    if (this.consoleLevel >= LOG_LEVELS[level]) {
      const writeToConsole = this.console[level] || this.console.log;
      writeToConsole.call(this.console, output);
    }

    if (!this.logFile || this.fileLevel < LOG_LEVELS[level]) {
      return;
    }

    try {
      this.fileSystem.mkdirSync(dirname(this.logFile), { recursive: true });
      this.fileSystem.appendFileSync(this.logFile, `${output}\n`, 'utf8');
    } catch (error) {
      this.console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        service: 'scraper',
        message: 'Unable to write log file.',
        logFile: this.logFile,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }
}

const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

function levelValue(level) {
  return LOG_LEVELS[level] ?? LOG_LEVELS.info;
}

function errorReplacer(_key, value) {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }

  return typeof value === 'bigint' ? value.toString() : value;
}
