import { ToolResponse } from '../types.js';
import { SSHConnectionManager } from '../connection-manager.js';

export class CommandHandlers {
  constructor(private connectionManager: SSHConnectionManager) {}

  async handleExecuteCommand(args: any): Promise<ToolResponse> {
    try {
      const result = await this.connectionManager.executeCommand(args.command, args.connection);
      return {
        content: [{
          type: 'text',
          text: `Command: ${args.command}\n\nStdout:\n${result.stdout || '(empty)'}\n\nStderr:\n${result.stderr || '(empty)'}\n\nExit code: ${result.code}`,
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Failed: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }

  async handleExecuteOnMultiple(args: any): Promise<ToolResponse> {
    const results: any[] = [];
    let connections = args.connections;

    if (connections.length === 1 && connections[0] === 'all') {
      connections = this.connectionManager.listConnections()
        .filter(c => c.isConnected)
        .map(c => c.name);
    }

    if (args.parallel) {
      const promises = connections.map(async (connName: string) => {
        try {
          const result = await this.connectionManager.executeCommand(args.command, connName);
          return { connection: connName, success: true, ...result };
        } catch (error) {
          return { connection: connName, success: false, error: error instanceof Error ? error.message : String(error) };
        }
      });
      results.push(...await Promise.all(promises));
    } else {
      for (const connName of connections) {
        try {
          const result = await this.connectionManager.executeCommand(args.command, connName);
          results.push({ connection: connName, success: true, ...result });
        } catch (error) {
          results.push({ connection: connName, success: false, error: error instanceof Error ? error.message : String(error) });
        }
      }
    }

    let text = `Executed on ${results.length} connections\nCommand: ${args.command}\n\n`;
    results.forEach(r => {
      text += `[${r.connection}] ${r.success ? 'OK' : 'FAIL'}\n`;
      if (r.success) {
        if (r.stdout) text += `  Output: ${r.stdout.substring(0, 200)}${r.stdout.length > 200 ? '...' : ''}\n`;
        text += `  Exit code: ${r.code}\n`;
      } else {
        text += `  Error: ${r.error}\n`;
      }
    });
    return { content: [{ type: 'text', text }] };
  }
}
