import ssh2 from 'ssh2';
import type { ConnectConfig, Client, ClientChannel } from 'ssh2';
const { Client: SSHClient, utils } = ssh2;
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as crypto from 'crypto';

// Debug logger - writes to stderr so MCP can see it
const debug = (msg: string) => {
  if (process.env.SSH_DEBUG === 'true') {
    console.error(`[SSH-DEBUG] ${msg}`);
  }
};

export interface SSHConnectionConfig {
  id?: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKeyPath?: string;
  passphrase?: string;
  tags?: string[];
  lastConnected?: Date;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export interface ConnectionStatus {
  id: string;
  name: string;
  host: string;
  isConnected: boolean;
  connectedAt?: Date;
  lastError?: string;
  reconnectAttempts?: number;
}

export class SSHConnectionManager {
  private connections: Map<string, Client> = new Map();
  private configs: Map<string, SSHConnectionConfig> = new Map();
  private activeConnectionId: string | null = null;
  private connectionStatus: Map<string, ConnectionStatus> = new Map();
  private configFilePath: string;
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(configDir?: string) {
    const baseDir = configDir || join(process.cwd(), 'config');
    this.configFilePath = join(baseDir, 'ssh-connections.json');
    this.loadConfigs();
  }

  /**
   * Load saved connection configurations from file
   */
  private loadConfigs(): void {
    if (existsSync(this.configFilePath)) {
      try {
        const data = readFileSync(this.configFilePath, 'utf-8');
        const configs = JSON.parse(data) as SSHConnectionConfig[];
        configs.forEach(config => {
          if (!config.id) {
            config.id = this.generateId();
          }
          this.configs.set(config.id, config);
          this.connectionStatus.set(config.id, {
            id: config.id,
            name: config.name,
            host: config.host,
            isConnected: false
          });
        });
      } catch (error) {
        console.error('Failed to load SSH configurations:', error);
      }
    }
  }

  /**
   * Save connection configurations to file
   */
  private saveConfigs(): void {
    try {
      const configs = Array.from(this.configs.values());
      const dirPath = join(this.configFilePath, '..');
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
      }
      writeFileSync(this.configFilePath, JSON.stringify(configs, null, 2));
    } catch (error) {
      console.error('Failed to save SSH configurations:', error);
    }
  }

  /**
   * Generate unique ID for connection
   */
  private generateId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Add or update a connection configuration
   */
  addConnection(config: SSHConnectionConfig): string {
    if (!config.id) {
      config.id = this.generateId();
    }
    
    this.configs.set(config.id, config);
    this.connectionStatus.set(config.id, {
      id: config.id,
      name: config.name,
      host: config.host,
      isConnected: false
    });
    
    this.saveConfigs();
    return config.id;
  }

  /**
   * Remove a connection configuration
   */
  removeConnection(idOrName: string): boolean {
    const id = this.findConnectionId(idOrName);
    if (!id) return false;

    // Disconnect if connected
    if (this.connections.has(id)) {
      this.disconnect(id);
    }

    this.configs.delete(id);
    this.connectionStatus.delete(id);
    this.saveConfigs();
    return true;
  }

  /**
   * List all saved connections
   */
  listConnections(): ConnectionStatus[] {
    return Array.from(this.connectionStatus.values());
  }

  /**
   * Find connection ID by name or ID
   */
  private findConnectionId(idOrName: string): string | null {
    // First try direct ID
    if (this.configs.has(idOrName)) {
      return idOrName;
    }

    // Then try by name
    for (const [id, config] of this.configs.entries()) {
      if (config.name === idOrName) {
        return id;
      }
    }

    // Try partial match on name or host
    for (const [id, config] of this.configs.entries()) {
      if (config.name.toLowerCase().includes(idOrName.toLowerCase()) ||
          config.host.toLowerCase().includes(idOrName.toLowerCase())) {
        return id;
      }
    }

    return null;
  }

  /**
   * Connect to a saved connection or new connection
   */
  async connect(idOrNameOrConfig: string | SSHConnectionConfig): Promise<string> {
    let config: SSHConnectionConfig;
    let connectionId: string;

    if (typeof idOrNameOrConfig === 'string') {
      const foundId = this.findConnectionId(idOrNameOrConfig);
      if (!foundId) {
        throw new Error(`Connection '${idOrNameOrConfig}' not found`);
      }
      connectionId = foundId;
      config = this.configs.get(connectionId)!;
    } else {
      config = idOrNameOrConfig;
      if (!config.id) {
        config.id = this.generateId();
      }
      connectionId = config.id;
      
      // Save if it's a new config
      if (!this.configs.has(connectionId)) {
        this.addConnection(config);
      }
    }

    // Disconnect existing connection if any
    if (this.connections.has(connectionId)) {
      await this.disconnect(connectionId);
    }

    return new Promise((resolve, reject) => {
      const client = new SSHClient();
      
      client.on('ready', () => {
        this.connections.set(connectionId, client);
        this.activeConnectionId = connectionId;
        
        const status = this.connectionStatus.get(connectionId)!;
        status.isConnected = true;
        status.connectedAt = new Date();
        status.lastError = undefined;
        status.reconnectAttempts = 0;
        
        // Update last connected time
        config.lastConnected = new Date();
        this.saveConfigs();
        
        resolve(connectionId);
      });

      client.on('error', (err) => {
        const status = this.connectionStatus.get(connectionId)!;
        status.isConnected = false;
        status.lastError = err.message;
        
        debug(`Connection error: ${err.message}`);
        console.error(`[SSH] Connection to ${config.host} failed: ${err.message}`);
        
        // Handle auto-reconnect
        if (config.autoReconnect && !this.reconnectTimers.has(connectionId)) {
          this.scheduleReconnect(connectionId);
        }
        
        reject(err);
      });

      client.on('end', () => {
        const status = this.connectionStatus.get(connectionId)!;
        status.isConnected = false;
        
        if (config.autoReconnect && !this.reconnectTimers.has(connectionId)) {
          this.scheduleReconnect(connectionId);
        }
      });

      // Prepare connection config
      const connectConfig: ConnectConfig = {
        host: config.host,
        port: config.port,
        username: config.username,
        readyTimeout: 30000,
        keepaliveInterval: 10000,
        keepaliveCountMax: 3,
        // Enable debug logging
        debug: process.env.SSH_DEBUG === 'true' ? (msg: string) => console.error(`[SSH2] ${msg}`) : undefined
      };

      debug(`Connecting to ${config.host}:${config.port} as ${config.username}`);

      if (config.password) {
        connectConfig.password = config.password;
        debug('Using password authentication');
      }

      if (config.privateKeyPath && existsSync(config.privateKeyPath)) {
        try {
          debug(`Reading private key from: ${config.privateKeyPath}`);
          const keyData = readFileSync(config.privateKeyPath);
          debug(`Key data length: ${keyData.length} bytes`);
          debug(`Key header: ${keyData.slice(0, 80).toString().replace(/\n/g, ' ')}`);
          
          // Validate key format using ssh2's parseKey
          try {
            const parsed = utils.parseKey(keyData, config.passphrase);
            if (parsed instanceof Error) {
              debug(`Key parse error: ${parsed.message}`);
              console.error(`[SSH] Warning: Key parse issue: ${parsed.message}`);
            } else if (Array.isArray(parsed)) {
              debug(`Parsed ${parsed.length} keys, type: ${parsed[0]?.type}`);
            } else {
              debug(`Parsed key type: ${parsed.type}`);
            }
          } catch (parseErr: any) {
            debug(`Key validation warning: ${parseErr.message}`);
          }
          
          connectConfig.privateKey = keyData;
          if (config.passphrase) {
            connectConfig.passphrase = config.passphrase;
            debug('Using passphrase for key');
          }
        } catch (err) {
          reject(new Error(`Failed to read private key: ${err}`));
          return;
        }
      } else if (config.privateKeyPath) {
        debug(`Private key file not found: ${config.privateKeyPath}`);
      }

      // Try to use SSH agent if available and no privateKey provided
      // On Windows, use the OpenSSH agent named pipe
      // On Unix, use SSH_AUTH_SOCK environment variable
      if (!connectConfig.privateKey && !connectConfig.password) {
        const getAgentSocket = (): string | undefined => {
          // Check for Unix SSH agent first
          if (process.env.SSH_AUTH_SOCK) {
            return process.env.SSH_AUTH_SOCK;
          }
          // Windows OpenSSH agent uses a named pipe
          if (process.platform === 'win32') {
            return '\\\\.\\pipe\\openssh-ssh-agent';
          }
          return undefined;
        };

        const agentSocket = getAgentSocket();
        if (agentSocket) {
          debug(`Using SSH agent: ${agentSocket} (platform: ${process.platform})`);
          connectConfig.agent = agentSocket;
        } else {
          debug('No SSH agent available and no credentials provided');
        }
      } else {
        debug('Using direct authentication (privateKey or password)');
      }

      debug(`Final auth methods: password=${!!connectConfig.password}, privateKey=${!!connectConfig.privateKey}, agent=${!!connectConfig.agent}`);

      client.connect(connectConfig);
    });
  }

  /**
   * Schedule automatic reconnection
   */
  private scheduleReconnect(connectionId: string): void {
    const config = this.configs.get(connectionId);
    if (!config || !config.autoReconnect) return;

    const status = this.connectionStatus.get(connectionId)!;
    const maxAttempts = config.maxReconnectAttempts || 5;
    const delay = config.reconnectDelay || 5000;

    if (status.reconnectAttempts && status.reconnectAttempts >= maxAttempts) {
      console.error(`Max reconnection attempts reached for ${config.name}`);
      return;
    }

    const timer = setTimeout(async () => {
      this.reconnectTimers.delete(connectionId);
      
      if (!status.reconnectAttempts) {
        status.reconnectAttempts = 0;
      }
      status.reconnectAttempts++;

      try {
        await this.connect(connectionId);
        console.error(`Successfully reconnected to ${config.name}`);
      } catch (error) {
        console.error(`Reconnection attempt ${status.reconnectAttempts} failed for ${config.name}`);
        // Schedule another reconnect if not at max attempts
        if (status.reconnectAttempts < maxAttempts) {
          this.scheduleReconnect(connectionId);
        }
      }
    }, delay);

    this.reconnectTimers.set(connectionId, timer);
  }

  /**
   * Disconnect from a specific connection
   */
  async disconnect(idOrName?: string): Promise<void> {
    const connectionId = idOrName ? this.findConnectionId(idOrName) : this.activeConnectionId;
    
    if (!connectionId) {
      throw new Error('No connection specified or active');
    }

    // Cancel any reconnect timer
    if (this.reconnectTimers.has(connectionId)) {
      clearTimeout(this.reconnectTimers.get(connectionId)!);
      this.reconnectTimers.delete(connectionId);
    }

    const client = this.connections.get(connectionId);
    if (client) {
      client.end();
      this.connections.delete(connectionId);
    }

    const status = this.connectionStatus.get(connectionId);
    if (status) {
      status.isConnected = false;
    }

    if (this.activeConnectionId === connectionId) {
      // Switch to another connected connection if available
      for (const [id, status] of this.connectionStatus.entries()) {
        if (id !== connectionId && status.isConnected) {
          this.activeConnectionId = id;
          break;
        }
      }
      
      // If no other connections, set to null
      if (this.activeConnectionId === connectionId) {
        this.activeConnectionId = null;
      }
    }
  }

  /**
   * Disconnect all connections
   */
  async disconnectAll(): Promise<void> {
    // Cancel all reconnect timers
    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();

    // Disconnect all connections
    for (const [id, client] of this.connections.entries()) {
      client.end();
      const status = this.connectionStatus.get(id);
      if (status) {
        status.isConnected = false;
      }
    }
    
    this.connections.clear();
    this.activeConnectionId = null;
  }

  /**
   * Switch active connection
   */
  switchConnection(idOrName: string): boolean {
    const connectionId = this.findConnectionId(idOrName);
    if (!connectionId) return false;

    const status = this.connectionStatus.get(connectionId);
    if (!status || !status.isConnected) return false;

    this.activeConnectionId = connectionId;
    return true;
  }

  /**
   * Get active connection
   */
  getActiveConnection(): Client | null {
    if (!this.activeConnectionId) return null;
    return this.connections.get(this.activeConnectionId) || null;
  }

  /**
   * Get specific connection
   */
  getConnection(idOrName: string): Client | null {
    const connectionId = this.findConnectionId(idOrName);
    if (!connectionId) return null;
    return this.connections.get(connectionId) || null;
  }

  /**
   * Execute command on a connection
   */
  async executeCommand(
    command: string, 
    idOrName?: string
  ): Promise<{ stdout: string; stderr: string; code: number }> {
    const connectionId = idOrName ? this.findConnectionId(idOrName) : this.activeConnectionId;
    
    if (!connectionId) {
      throw new Error('No connection specified or active');
    }

    const client = this.connections.get(connectionId);
    if (!client) {
      throw new Error(`Connection '${connectionId}' is not established`);
    }

    return new Promise((resolve, reject) => {
      client.exec(command, (err: Error | undefined, stream: ClientChannel) => {
        if (err) {
          reject(err);
          return;
        }

        let stdout = '';
        let stderr = '';

        stream.on('close', (code: number) => {
          resolve({ stdout, stderr, code });
        });

        stream.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
      });
    });
  }

  /**
   * Test connection without saving
   */
  async testConnection(config: SSHConnectionConfig): Promise<boolean> {
    return new Promise((resolve) => {
      const client = new SSHClient();
      
      const timeout = setTimeout(() => {
        client.end();
        resolve(false);
      }, 10000); // 10 second timeout

      client.on('ready', () => {
        clearTimeout(timeout);
        client.end();
        resolve(true);
      });

      client.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });

      const connectConfig: ConnectConfig = {
        host: config.host,
        port: config.port,
        username: config.username,
        readyTimeout: 10000
      };

      if (config.password) {
        connectConfig.password = config.password;
      }

      if (config.privateKeyPath && existsSync(config.privateKeyPath)) {
        connectConfig.privateKey = readFileSync(config.privateKeyPath);
        if (config.passphrase) {
          connectConfig.passphrase = config.passphrase;
        }
      }

      client.connect(connectConfig);
    });
  }

  /**
   * Get connection configuration
   */
  getConfig(idOrName: string): SSHConnectionConfig | null {
    const connectionId = this.findConnectionId(idOrName);
    if (!connectionId) return null;
    return this.configs.get(connectionId) || null;
  }

  /**
   * Update connection configuration
   */
  updateConfig(idOrName: string, updates: Partial<SSHConnectionConfig>): boolean {
    const connectionId = this.findConnectionId(idOrName);
    if (!connectionId) return false;

    const config = this.configs.get(connectionId);
    if (!config) return false;

    Object.assign(config, updates);
    this.saveConfigs();
    return true;
  }

  /**
   * Search connections by tags
   */
  searchByTags(tags: string[]): SSHConnectionConfig[] {
    return Array.from(this.configs.values()).filter(config => {
      if (!config.tags) return false;
      return tags.some(tag => config.tags!.includes(tag));
    });
  }

  /**
   * Get connection statistics
   */
  getStatistics(): {
    total: number;
    connected: number;
    saved: number;
    activeConnection: string | null;
  } {
    const connected = Array.from(this.connectionStatus.values())
      .filter(s => s.isConnected).length;

    return {
      total: this.configs.size,
      connected,
      saved: this.configs.size,
      activeConnection: this.activeConnectionId
    };
  }
}
