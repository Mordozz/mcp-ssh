// Common types for MCP SSH Server
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export type ToolResponse = CallToolResult;

export interface CommandResult {
  stdout: string;
  stderr: string;
  code: number;
}
