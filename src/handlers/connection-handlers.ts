import { ToolResponse } from '../types.js';
import { SSHConnectionManager, SSHConnectionConfig } from '../connection-manager.js';

export class ConnectionHandlers {
  constructor(private connectionManager: SSHConnectionManager) {}

  async handleSaveConnection(args: any): Promise<ToolResponse> {
    try {
      const config: SSHConnectionConfig = {
        name: args.name,
        host: args.host,
        port: args.port || 22,
        username: args.username,
        password: args.password,
        privateKeyPath: args.privateKeyPath,
        passphrase: args.passphrase,
        tags: args.tags,
        autoReconnect: args.autoReconnect !== false,
      };
      const id = this.connectionManager.addConnection(config);
      return {
        content: [{ type: 'text', text: `Connection '${args.name}' saved with ID: ${id}` }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Failed to save: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }

  async handleConnect(args: any): Promise<ToolResponse> {
    try {
      let result: string;
      if (args.username) {
        const config: SSHConnectionConfig = {
          name: `temp-${args.nameOrHost}`,
          host: args.nameOrHost,
          port: args.port || 22,
          username: args.username,
          password: args.password,
          autoReconnect: true,
        };
        result = await this.connectionManager.connect(config);
      } else {
        result = await this.connectionManager.connect(args.nameOrHost);
      }
      const config = this.connectionManager.getConfig(result);
      return {
        content: [{ type: 'text', text: `Connected to '${config?.name || args.nameOrHost}' (${config?.host}:${config?.port})` }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Failed to connect: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }

  async handleQuickConnect(args: any): Promise<ToolResponse> {
    try {
      const config: SSHConnectionConfig = {
        name: `quick-${args.host}`,
        host: args.host,
        port: args.port || 22,
        username: args.username,
        password: args.password,
        autoReconnect: false,
      };
      await this.connectionManager.connect(config);
      return {
        content: [{ type: 'text', text: `Quick connection to ${args.host}:${args.port || 22} as ${args.username}` }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Quick connect failed: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }

  async handleDisconnect(args: any): Promise<ToolResponse> {
    try {
      await this.connectionManager.disconnect(args.name);
      return { content: [{ type: 'text', text: `Disconnected from ${args.name || 'active connection'}` }] };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Failed to disconnect: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }

  async handleDisconnectAll(): Promise<ToolResponse> {
    await this.connectionManager.disconnectAll();
    return { content: [{ type: 'text', text: 'All SSH connections closed' }] };
  }

  async handleListConnections(args: any): Promise<ToolResponse> {
    const connections = this.connectionManager.listConnections();
    const stats = this.connectionManager.getStatistics();
    if (connections.length === 0) {
      return { content: [{ type: 'text', text: 'No saved connections. Use ssh_save_connection to add.' }] };
    }
    let text = `SSH Connections (${stats.connected}/${stats.total} connected)\n\n`;
    connections.forEach(conn => {
      const isActive = stats.activeConnection === conn.id;
      const status = conn.isConnected ? 'Connected' : 'Disconnected';
      text += `${isActive ? '> ' : '  '}${conn.name} [${status}] - ${conn.host}\n`;
      if (args.showDetails && conn.isConnected) {
        text += `    Connected since: ${conn.connectedAt?.toLocaleString()}\n`;
      }
    });
    return { content: [{ type: 'text', text }] };
  }

  async handleSwitchConnection(args: any): Promise<ToolResponse> {
    const success = this.connectionManager.switchConnection(args.name);
    if (success) {
      return { content: [{ type: 'text', text: `Switched to '${args.name}'` }] };
    }
    return { content: [{ type: 'text', text: `Cannot switch to '${args.name}'` }], isError: true };
  }

  async handleRemoveConnection(args: any): Promise<ToolResponse> {
    const success = this.connectionManager.removeConnection(args.name);
    if (success) {
      return { content: [{ type: 'text', text: `Connection '${args.name}' removed` }] };
    }
    return { content: [{ type: 'text', text: `Connection '${args.name}' not found` }], isError: true };
  }

  async handleTestConnection(args: any): Promise<ToolResponse> {
    try {
      let config: SSHConnectionConfig;
      if (args.username) {
        config = { name: 'test', host: args.nameOrHost, port: args.port || 22, username: args.username, password: args.password };
      } else {
        const savedConfig = this.connectionManager.getConfig(args.nameOrHost);
        if (!savedConfig) throw new Error(`Connection '${args.nameOrHost}' not found`);
        config = savedConfig;
      }
      const success = await this.connectionManager.testConnection(config);
      return { content: [{ type: 'text', text: success ? `Test OK: ${config.host}:${config.port}` : `Test FAILED: ${config.host}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Test failed: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }

  async handleConnectionInfo(args: any): Promise<ToolResponse> {
    const config = args.name
      ? this.connectionManager.getConfig(args.name)
      : this.connectionManager.getConfig(this.connectionManager.getStatistics().activeConnection || '');
    if (!config) {
      return { content: [{ type: 'text', text: 'No connection found' }] };
    }
    const connections = this.connectionManager.listConnections();
    const status = connections.find(c => c.name === config.name);
    let text = `Connection: ${config.name}\nHost: ${config.host}:${config.port}\nUsername: ${config.username}\n`;
    text += `Auth: ${config.password ? 'Password' : config.privateKeyPath ? 'SSH Key' : 'None'}\n`;
    if (status) text += `Status: ${status.isConnected ? 'Connected' : 'Disconnected'}\n`;
    return { content: [{ type: 'text', text }] };
  }
}
