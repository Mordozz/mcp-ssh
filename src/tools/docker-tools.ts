import { ToolDefinition } from '../types.js';

export const dockerTools: ToolDefinition[] = [
  {
    name: 'docker_command',
    description: 'Execute Docker commands on the active connection',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['ps', 'images', 'run', 'stop', 'start', 'restart', 'remove', 'logs', 'exec', 'build', 'pull', 'push'],
          description: 'Docker action to perform',
        },
        container: { type: 'string', description: 'Container name or ID' },
        image: { type: 'string', description: 'Docker image name' },
        command: { type: 'string', description: 'Command to execute in container' },
        options: { type: 'string', description: 'Additional Docker options' },
        connection: { type: 'string', description: 'Connection name (optional)' },
      },
      required: ['action'],
    },
  },
];
