import { ToolDefinition } from '../types.js';

export const commandTools: ToolDefinition[] = [
  {
    name: 'execute_command',
    description: 'Execute a command on the active or specified SSH connection',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to execute' },
        connection: { type: 'string', description: 'Connection name (optional)' },
      },
      required: ['command'],
    },
  },
  {
    name: 'execute_on_multiple',
    description: 'Execute a command on multiple connections simultaneously',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to execute' },
        connections: { type: 'array', items: { type: 'string' }, description: 'Connection names or "all"' },
        parallel: { type: 'boolean', description: 'Execute in parallel', default: true },
      },
      required: ['command', 'connections'],
    },
  },
];
