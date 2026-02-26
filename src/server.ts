import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { SSHConnectionManager, SSHConnectionConfig } from './connection-manager.js';
import { getAllTools } from './tools/index.js';
import { ConnectionHandlers, CommandHandlers, FileHandlers, DockerHandlers, SystemHandlers } from './handlers/index.js';

export class MCPSSHServer {
  private server: Server;
  private connectionManager: SSHConnectionManager;
  private connectionHandlers: ConnectionHandlers;
  private commandHandlers: CommandHandlers;
  private fileHandlers: FileHandlers;
  private dockerHandlers: DockerHandlers;
  private systemHandlers: SystemHandlers;

  constructor() {
    this.server = new Server(
      { name: 'mcp-ssh-server', version: '2.1.0' },
      { capabilities: { tools: {} } }
    );

    this.connectionManager = new SSHConnectionManager();
    
    // Initialize handlers
    this.connectionHandlers = new ConnectionHandlers(this.connectionManager);
    this.commandHandlers = new CommandHandlers(this.connectionManager);
    this.fileHandlers = new FileHandlers(this.connectionManager);
    this.dockerHandlers = new DockerHandlers(this.connectionManager);
    this.systemHandlers = new SystemHandlers(this.connectionManager);

    this.setupHandlers();
    this.loadDefaultConnections();
  }

  private loadDefaultConnections() {
    if (process.env.SSH_HOST) {
      const defaultConfig: SSHConnectionConfig = {
        name: 'default',
        host: process.env.SSH_HOST,
        port: parseInt(process.env.SSH_PORT || '22'),
        username: process.env.SSH_USERNAME || '',
        password: process.env.SSH_PASSWORD,
        privateKeyPath: process.env.SSH_PRIVATE_KEY_PATH,
        passphrase: process.env.SSH_PASSPHRASE,
        autoReconnect: true,
        reconnectDelay: 5000,
        maxReconnectAttempts: 5,
      };
      this.connectionManager.addConnection(defaultConfig);
      console.error('Default connection loaded from environment');
    }
  }

  private setupHandlers() {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: getAllTools(),
    }));

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      // Connection management
      switch (name) {
        case 'ssh_save_connection': return this.connectionHandlers.handleSaveConnection(args);
        case 'ssh_connect': return this.connectionHandlers.handleConnect(args);
        case 'ssh_quick_connect': return this.connectionHandlers.handleQuickConnect(args);
        case 'ssh_disconnect': return this.connectionHandlers.handleDisconnect(args);
        case 'ssh_disconnect_all': return this.connectionHandlers.handleDisconnectAll();
        case 'ssh_list_connections': return this.connectionHandlers.handleListConnections(args);
        case 'ssh_switch_connection': return this.connectionHandlers.handleSwitchConnection(args);
        case 'ssh_remove_connection': return this.connectionHandlers.handleRemoveConnection(args);
        case 'ssh_test_connection': return this.connectionHandlers.handleTestConnection(args);
        case 'ssh_connection_info': return this.connectionHandlers.handleConnectionInfo(args);
        
        // Commands
        case 'execute_command': return this.commandHandlers.handleExecuteCommand(args);
        case 'execute_on_multiple': return this.commandHandlers.handleExecuteOnMultiple(args);
        
        // Files
        case 'file_operations': return this.fileHandlers.handleFileOperations(args);
        
        // Docker
        case 'docker_command': return this.dockerHandlers.handleDockerCommand(args);
        
        // System
        case 'system_management': return this.systemHandlers.handleSystemManagement(args);
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  getServer(): Server {
    return this.server;
  }
}
