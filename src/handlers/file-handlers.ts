import { ToolResponse } from '../types.js';
import { SSHConnectionManager } from '../connection-manager.js';

export class FileHandlers {
  constructor(private connectionManager: SSHConnectionManager) {}

  async handleFileOperations(args: any): Promise<ToolResponse> {
    try {
      let command = '';
      switch (args.operation) {
        case 'read': command = `cat "${args.path}"`; break;
        case 'write': command = `echo '${args.content}' > "${args.path}"`; break;
        case 'delete': command = `rm -f "${args.path}"`; break;
        case 'list': command = `ls -la "${args.path}"`; break;
        case 'create_dir': command = `mkdir -p "${args.path}"`; break;
        case 'remove_dir': command = `rm -rf "${args.path}"`; break;
      }
      const result = await this.connectionManager.executeCommand(command, args.connection);
      return {
        content: [{ type: 'text', text: `File operation '${args.operation}' on '${args.path}':\n\n${result.stdout || result.stderr || 'Done'}` }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `File operation failed: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
}
