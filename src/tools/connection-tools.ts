import { ToolDefinition } from '../types.js';

export const connectionTools: ToolDefinition[] = [
  {
    name: 'ssh_save_connection',
    description: 'Save a new SSH connection configuration for quick access',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Friendly name for the connection' },
        host: { type: 'string', description: 'SSH server hostname or IP address' },
        port: { type: 'number', description: 'SSH server port', default: 22 },
        username: { type: 'string', description: 'SSH username' },
        password: { type: 'string', description: 'SSH password (optional if using key)' },
        privateKeyPath: { type: 'string', description: 'Path to private key file' },
        passphrase: { type: 'string', description: 'Passphrase for private key' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorizing connections' },
        autoReconnect: { type: 'boolean', description: 'Auto reconnect on disconnection', default: true },
      },
      required: ['name', 'host', 'username'],
    },
  },
  {
    name: 'ssh_connect',
    description: 'Connect to a saved SSH server or establish a new connection',
    inputSchema: {
      type: 'object',
      properties: {
        nameOrHost: { type: 'string', description: 'Connection name or hostname/IP' },
        username: { type: 'string', description: 'Username (for new connections)' },
        password: { type: 'string', description: 'Password (for new connections)' },
        port: { type: 'number', description: 'Port (for new connections)', default: 22 },
      },
      required: ['nameOrHost'],
    },
  },
  {
    name: 'ssh_quick_connect',
    description: 'Quickly connect to a server without saving (temporary connection)',
    inputSchema: {
      type: 'object',
      properties: {
        host: { type: 'string', description: 'SSH server hostname or IP' },
        username: { type: 'string', description: 'SSH username' },
        password: { type: 'string', description: 'SSH password' },
        port: { type: 'number', description: 'SSH port', default: 22 },
      },
      required: ['host', 'username', 'password'],
    },
  },
  {
    name: 'ssh_disconnect',
    description: 'Disconnect from a specific connection or the active one',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Connection name (optional)' },
      },
    },
  },
  {
    name: 'ssh_disconnect_all',
    description: 'Disconnect from all SSH servers',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'ssh_list_connections',
    description: 'List all saved connections and their status',
    inputSchema: {
      type: 'object',
      properties: {
        showDetails: { type: 'boolean', description: 'Show detailed information', default: false },
      },
    },
  },
  {
    name: 'ssh_switch_connection',
    description: 'Switch the active connection to another connected server',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the connection to switch to' },
      },
      required: ['name'],
    },
  },
  {
    name: 'ssh_remove_connection',
    description: 'Remove a saved connection configuration',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the connection to remove' },
      },
      required: ['name'],
    },
  },
  {
    name: 'ssh_test_connection',
    description: 'Test if a connection can be established',
    inputSchema: {
      type: 'object',
      properties: {
        nameOrHost: { type: 'string', description: 'Connection name or hostname' },
        username: { type: 'string', description: 'Username (for testing new connection)' },
        password: { type: 'string', description: 'Password (for testing new connection)' },
        port: { type: 'number', description: 'Port (for testing new connection)', default: 22 },
      },
      required: ['nameOrHost'],
    },
  },
  {
    name: 'ssh_connection_info',
    description: 'Get detailed information about a connection',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Connection name (optional, shows active if not specified)' },
      },
    },
  },
];
