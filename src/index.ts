#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as dotenv from 'dotenv';
import { MCPSSHServer } from './server.js';

dotenv.config();

async function main() {
  const mcpServer = new MCPSSHServer();
  const transport = new StdioServerTransport();
  await mcpServer.getServer().connect(transport);
  console.error('MCP SSH Server v2.1 running - Modular architecture');
}

main().catch(console.error);
