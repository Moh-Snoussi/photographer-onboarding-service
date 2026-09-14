import { readFile } from 'node:fs/promises';

export class EnvironmentService {
  constructor({
    filePaths = [
      new URL('../../.env', import.meta.url),
      new URL('../../.env.local', import.meta.url),
    ],
    environment = process.env,
  } = {}) {
    this.filePaths = filePaths;
    this.environment = environment;
  }

  async load() {
    const fileEnvironment = {};

    for (const filePath of this.filePaths) {
      Object.assign(fileEnvironment, await this.readFile(filePath));
    }

    for (const [name, value] of Object.entries(fileEnvironment)) {
      if (this.environment[name] === undefined) {
        this.environment[name] = value;
      }
    }
  }

  async readFile(filePath) {
    try {
      return this.parse(await readFile(filePath, 'utf8'));
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return {};
      }

      throw error;
    }
  }

  parse(content) {
    return Object.fromEntries(content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');

        if (separator === -1) {
          throw new Error(`Invalid environment entry: ${line}`);
        }

        const name = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2');

        if (!name) {
          throw new Error(`Invalid environment entry: ${line}`);
        }

        return [name, value];
      }));
  }
}
