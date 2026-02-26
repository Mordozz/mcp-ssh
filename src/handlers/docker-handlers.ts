import { ToolResponse } from '../types.js';
import { SSHConnectionManager } from '../connection-manager.js';

export class DockerHandlers {
  constructor(private connectionManager: SSHConnectionManager) {}

  async handleDockerCommand(args: any): Promise<ToolResponse> {
    try {
      let command = 'docker ';
      switch (args.action) {
        case 'ps': command += `ps ${args.options || '-a'}`; break;
        case 'images': command += 'images'; break;
        case 'run': command += `run ${args.options || ''} ${args.image} ${args.command || ''}`; break;
        case 'stop': command += `stop ${args.container}`; break;
        case 'start': command += `start ${args.container}`; break;
        case 'restart': command += `restart ${args.container}`; break;
        case 'remove': command += `rm ${args.options || ''} ${args.container}`; break;
        case 'logs': command += `logs ${args.options || ''} ${args.container}`; break;
        case 'exec': command += `exec ${args.options || ''} ${args.container} ${args.command}`; break;
        case 'build': command += `build ${args.options || ''} ${args.path || '.'}`; break;
        case 'pull': command += `pull ${args.image}`; break;
        case 'push': command += `push ${args.image}`; break;
      }
      const result = await this.connectionManager.executeCommand(command, args.connection);
      return { content: [{ type: 'text', text: `Docker: ${command}\n\n${result.stdout || result.stderr}` }] };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Docker failed: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
}
