import { Client as SSHClient } from 'ssh2';
import { Readable } from 'stream';

export interface SFTPFileInfo {
  filename: string;
  longname: string;
  attrs: {
    mode: number;
    uid: number;
    gid: number;
    size: number;
    atime: number;
    mtime: number;
  };
}

export class SFTPOperations {
  private client: SSHClient;

  constructor(client: SSHClient) {
    this.client = client;
  }

  async uploadFile(localPath: string, remotePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }

        const readStream = require('fs').createReadStream(localPath);
        const writeStream = sftp.createWriteStream(remotePath);

        writeStream.on('close', () => {
          sftp.end();
          resolve();
        });

        writeStream.on('error', (err: Error) => {
          sftp.end();
          reject(err);
        });

        readStream.pipe(writeStream);
      });
    });
  }

  async downloadFile(remotePath: string, localPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }

        sftp.fastGet(remotePath, localPath, (err) => {
          sftp.end();
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  async listDirectory(remotePath: string): Promise<SFTPFileInfo[]> {
    return new Promise((resolve, reject) => {
      this.client.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }

        sftp.readdir(remotePath, (err: Error | undefined, list) => {
          sftp.end();
          if (err) {
            reject(err);
          } else {
            resolve(list as SFTPFileInfo[]);
          }
        });
      });
    });
  }

  async createDirectory(remotePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }

        sftp.mkdir(remotePath, (err) => {
          sftp.end();
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  async removeFile(remotePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }

        sftp.unlink(remotePath, (err) => {
          sftp.end();
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  async removeDirectory(remotePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }

        sftp.rmdir(remotePath, (err) => {
          sftp.end();
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  async fileExists(remotePath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.client.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }

        sftp.stat(remotePath, (err) => {
          sftp.end();
          if (err) {
            if ((err as any).code === 'ENOENT') {
              resolve(false);
            } else {
              reject(err);
            }
          } else {
            resolve(true);
          }
        });
      });
    });
  }
}

export class CommandBuilder {
  static buildDockerCommand(action: string, options: any): string {
    const parts = ['docker', action];

    switch (action) {
      case 'run':
        if (options.detach) parts.push('-d');
        if (options.name) parts.push('--name', options.name);
        if (options.ports) {
          options.ports.forEach((port: string) => parts.push('-p', port));
        }
        if (options.volumes) {
          options.volumes.forEach((volume: string) => parts.push('-v', volume));
        }
        if (options.env) {
          Object.entries(options.env).forEach(([key, value]) => {
            parts.push('-e', `${key}=${value}`);
          });
        }
        if (options.network) parts.push('--network', options.network);
        if (options.restart) parts.push('--restart', options.restart);
        parts.push(options.image);
        if (options.command) parts.push(options.command);
        break;

      case 'exec':
        if (options.interactive) parts.push('-it');
        if (options.detach) parts.push('-d');
        if (options.user) parts.push('--user', options.user);
        if (options.workdir) parts.push('--workdir', options.workdir);
        parts.push(options.container, options.command);
        break;

      case 'ps':
        if (options.all) parts.push('-a');
        if (options.quiet) parts.push('-q');
        if (options.size) parts.push('-s');
        if (options.filter) parts.push('--filter', options.filter);
        break;

      case 'logs':
        if (options.follow) parts.push('-f');
        if (options.tail) parts.push('--tail', options.tail);
        if (options.since) parts.push('--since', options.since);
        if (options.timestamps) parts.push('-t');
        parts.push(options.container);
        break;

      default:
        if (options.container) parts.push(options.container);
        if (options.force) parts.push('-f');
    }

    return parts.join(' ');
  }

  static buildSystemctlCommand(action: string, service?: string, options?: any): string {
    const parts = ['systemctl'];
    
    if (options?.user) parts.push('--user');
    
    parts.push(action);
    
    if (service) parts.push(service);
    
    if (action === 'status' && options?.lines) {
      parts.push('-n', options.lines.toString());
    }
    
    return parts.join(' ');
  }

  static buildPackageCommand(manager: string, action: string, packageName?: string, options?: any): string {
    const parts = [];
    const needsSudo = ['apt', 'yum', 'dnf'].includes(manager) && 
                     ['install', 'remove', 'update', 'upgrade'].includes(action);
    
    if (needsSudo) parts.push('sudo');

    switch (manager) {
      case 'apt':
        parts.push('apt-get');
        if (action === 'search') {
          return `apt-cache search ${packageName}`;
        }
        parts.push(action);
        if (options?.yes) parts.push('-y');
        if (packageName) parts.push(packageName);
        break;

      case 'yum':
      case 'dnf':
        parts.push(manager, action);
        if (options?.yes) parts.push('-y');
        if (packageName) parts.push(packageName);
        break;

      case 'npm':
        parts.push('npm', action);
        if (options?.global) parts.push('-g');
        if (options?.save) parts.push('--save');
        if (options?.saveDev) parts.push('--save-dev');
        if (packageName) parts.push(packageName);
        break;

      case 'pip':
        parts.push('pip', action);
        if (action === 'install' && options?.upgrade) parts.push('--upgrade');
        if (action === 'install' && options?.user) parts.push('--user');
        if (action === 'uninstall' && options?.yes) parts.push('-y');
        if (packageName) parts.push(packageName);
        break;
    }

    return parts.join(' ');
  }
}

export function parseCommandOutput(output: string, format: 'json' | 'table' | 'text' = 'text'): any {
  switch (format) {
    case 'json':
      try {
        return JSON.parse(output);
      } catch (e) {
        return { error: 'Failed to parse JSON', raw: output };
      }
    
    case 'table':
      const lines = output.trim().split('\n');
      if (lines.length < 2) return [];
      
      const headers = lines[0].split(/\s+/);
      const rows = lines.slice(1).map(line => {
        const values = line.split(/\s+/);
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });
      return rows;
    
    default:
      return output;
  }
}

export function sanitizeCommand(command: string): string {
  // Remove potentially dangerous characters and command chaining
  return command
    .replace(/[;&|`$(){}[\]<>]/g, '')
    .replace(/\n|\r/g, ' ')
    .trim();
}

export function escapeShellArg(arg: string): string {
  // Escape single quotes and wrap in single quotes
  return `'${arg.replace(/'/g, "'\\''")}'`;
}
