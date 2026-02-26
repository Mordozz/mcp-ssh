import { ToolResponse } from '../types.js';
import { SSHConnectionManager } from '../connection-manager.js';

export class SystemHandlers {
  constructor(private connectionManager: SSHConnectionManager) {}

  async handleSystemManagement(args: any): Promise<ToolResponse> {
    try {
      let command = '';
      switch (args.category) {
        case 'service':
          command = `systemctl ${args.action} ${args.target || ''}`;
          break;
        case 'process':
          if (args.action === 'list') command = 'ps aux';
          else if (args.action === 'kill') command = `kill ${args.target}`;
          break;
        case 'network':
          if (args.action === 'list') command = 'netstat -tuln';
          else if (args.action === 'test') command = `ping -c 4 ${args.target}`;
          break;
        case 'firewall':
          command = `ufw ${args.action} ${args.target || ''}`;
          break;
        case 'system':
          if (args.action === 'info') command = 'uname -a && df -h && free -m';
          else if (args.action === 'reboot') command = 'sudo reboot';
          break;
      }
      const result = await this.connectionManager.executeCommand(command, args.connection);
      return { content: [{ type: 'text', text: `System: ${args.category} ${args.action}\n\n${result.stdout || result.stderr}` }] };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `System management failed: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
}
