import { ToolDefinition } from '../types.js';
import { connectionTools } from './connection-tools.js';
import { commandTools } from './command-tools.js';
import { fileTools } from './file-tools.js';
import { dockerTools } from './docker-tools.js';
import { systemTools } from './system-tools.js';

export function getAllTools(): ToolDefinition[] {
  return [
    ...connectionTools,
    ...commandTools,
    ...fileTools,
    ...dockerTools,
    ...systemTools,
  ];
}

export { connectionTools, commandTools, fileTools, dockerTools, systemTools };
