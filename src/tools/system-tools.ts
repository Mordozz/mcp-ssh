import { ToolDefinition } from '../types.js';

export const systemTools: ToolDefinition[] = [
  {
    name: 'system_management',
    description: 'System management operations',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['service', 'process', 'network', 'firewall', 'system'],
          description: 'Management category',
        },
        action: { type: 'string', description: 'Action to perform' },
        target: { type: 'string', description: 'Target service, process, or port' },
        connection: { type: 'string', description: 'Connection name (optional)' },
      },
      required: ['category', 'action'],
    },
  },
];
