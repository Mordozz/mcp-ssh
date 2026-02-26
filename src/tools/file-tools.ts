import { ToolDefinition } from '../types.js';

export const fileTools: ToolDefinition[] = [
  {
    name: 'file_operations',
    description: 'Perform file operations on the active connection',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['read', 'write', 'delete', 'list', 'create_dir', 'remove_dir'],
          description: 'File operation to perform',
        },
        path: { type: 'string', description: 'File or directory path' },
        content: { type: 'string', description: 'Content for write operation' },
        connection: { type: 'string', description: 'Connection name (optional)' },
      },
      required: ['operation', 'path'],
    },
  },
];
