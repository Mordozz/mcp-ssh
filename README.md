# MCP SSH Server v2.0 - Multi-Server Management

🚀 **Now with AI-driven multi-server management!**

A comprehensive Model Context Protocol (MCP) server that enables AI models to autonomously manage multiple SSH connections simultaneously. Version 2.0 introduces intelligent connection management, allowing Claude to independently connect, switch between, and execute commands across multiple servers - making it a powerful DevOps assistant.

## 🎯 Key Features (v2.0)

### New in Version 2.0
- **🔄 Multi-Server Management**: Connect to unlimited SSH servers simultaneously
- **💾 Connection Profiles**: Save and organize server configurations
- **🔁 Auto-Reconnection**: Automatic recovery from connection losses
- **⚡ Parallel Execution**: Run commands on multiple servers at once
- **🏷️ Server Tagging**: Organize servers with tags for group operations
- **🔀 Smart Switching**: Switch between servers without disconnecting

### Core Features
- **SSH Connection Management**: Password and key-based authentication
- **Command Execution**: Execute any shell command on remote servers
- **File Operations**: Complete file and directory management
- **Docker Integration**: Full Docker command support
- **System Management**: Services, processes, network, and firewall control
- **User Management**: Complete user and group administration
- **Package Management**: Support for apt, yum, npm, pip, and more

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mcp-ssh-server.git
cd mcp-ssh-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

4. Create a `.env` file based on `.env.example` (optional):
```bash
cp .env.example .env
```

## Configuration

### Claude Desktop Configuration

Add the server to your Claude Desktop configuration file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ssh-multi": {
      "command": "node",
      "args": ["C:\\Users\\your-username\\Projects\\mcp-ssh-server\\dist\\index.js"]
    }
  }
}
```

### Configuration Storage

Version 2.0 automatically saves connection configurations in `config/ssh-connections.json`. You can:
- Save multiple server profiles
- Tag servers for group operations  
- Enable auto-reconnection
- Store authentication credentials securely

Environment variables (optional) for default connection:
- `SSH_HOST`: Default SSH server hostname
- `SSH_PORT`: Default SSH port (default: 22)
- `SSH_USERNAME`: Default SSH username
- `SSH_PASSWORD`: SSH password
- `SSH_PRIVATE_KEY_PATH`: Path to private key file
- `SSH_PASSPHRASE`: Passphrase for the private key

## Quick Start Examples (v2.0)

### Example 1: Managing Multiple Web Servers
```
Claude, I need to manage my web servers:
1. Save connections to web1 (192.168.1.10), web2 (192.168.1.11), web3 (192.168.1.12) with username 'admin'
2. Connect to all three
3. Check nginx status on all servers
4. Restart nginx where needed
```

### Example 2: Parallel Command Execution
```
Claude, execute 'docker ps' on all connected servers simultaneously and show me the results
```

### Example 3: Server Switching
```
Claude, switch to the database server and check MySQL status, then switch to the web server and check nginx logs
```

## Available Tools

### 1. SSH Connection Management (Enhanced in v2.0)

#### ssh_connect
Establish an SSH connection to a remote server.

Parameters:
- `host` (required): SSH server hostname or IP
- `port`: SSH port (default: 22)
- `username` (required): SSH username
- `password`: SSH password
- `privateKeyPath`: Path to private key file
- `passphrase`: Private key passphrase

#### ssh_disconnect
Disconnect from the current SSH server.

#### ssh_status
Check the current SSH connection status.

### 2. Command Execution

#### execute_command
Execute any shell command on the remote server.

Parameters:
- `command` (required): Command to execute

Example:
```json
{
  "command": "ls -la /var/www"
}
```

### 3. File Operations

#### file_operations
Perform various file operations.

Parameters:
- `operation` (required): One of: read, write, delete, list, create_dir, remove_dir
- `path` (required): File or directory path
- `content`: Content for write operations
- `recursive`: For list operations, include subdirectories

Examples:
```json
// Read a file
{
  "operation": "read",
  "path": "/etc/nginx/nginx.conf"
}

// Write to a file
{
  "operation": "write",
  "path": "/home/user/test.txt",
  "content": "Hello, World!"
}

// List directory contents
{
  "operation": "list",
  "path": "/var/log",
  "recursive": true
}
```

### 4. Docker Commands

#### docker_command
Execute Docker operations.

Parameters:
- `action` (required): ps, images, run, stop, start, restart, remove, logs, exec, build, pull, push
- `container`: Container name or ID
- `image`: Docker image name
- `command`: Command for exec/run operations
- `options`: Additional Docker options

Examples:
```json
// List all containers
{
  "action": "ps",
  "options": "-a"
}

// Run a new container
{
  "action": "run",
  "image": "nginx:latest",
  "options": "-d -p 80:80 --name my-nginx"
}

// Execute command in container
{
  "action": "exec",
  "container": "my-nginx",
  "command": "nginx -s reload"
}
```

### 5. System Management

#### system_management
Manage system services, processes, and network.

Parameters:
- `category` (required): service, process, network, firewall, system
- `action` (required): Action to perform
- `target`: Target service, process, or port
- `options`: Additional options

Examples:
```json
// Restart a service
{
  "category": "service",
  "action": "restart",
  "target": "nginx"
}

// List network connections
{
  "category": "network",
  "action": "list"
}

// System information
{
  "category": "system",
  "action": "info"
}
```

### 6. User Management

#### user_management
Manage users and groups.

Parameters:
- `action` (required): create_user, delete_user, modify_user, list_users, create_group, delete_group, list_groups, change_password
- `username`: Username
- `groupname`: Group name
- `password`: Password for user
- `options`: Additional options

Examples:
```json
// Create a new user
{
  "action": "create_user",
  "username": "newuser",
  "options": "-m -s /bin/bash"
}

// Change user password
{
  "action": "change_password",
  "username": "newuser",
  "password": "newpassword123"
}
```

### 7. Package Management

#### package_management
Manage system packages.

Parameters:
- `manager` (required): apt, yum, dnf, npm, pip, composer, gem
- `action` (required): install, remove, update, upgrade, search, list
- `package`: Package name
- `options`: Additional options

Examples:
```json
// Install a package
{
  "manager": "apt",
  "action": "install",
  "package": "nginx"
}

// Update package lists
{
  "manager": "apt",
  "action": "update"
}

// Install npm package globally
{
  "manager": "npm",
  "action": "install",
  "package": "express",
  "options": "-g"
}
```

## Security Considerations

1. **Authentication**: Always use secure authentication methods. Prefer key-based authentication over passwords.

2. **Permissions**: The server executes commands with the permissions of the SSH user. Be cautious with sudo operations.

3. **Environment**: Never commit `.env` files with sensitive credentials to version control.

4. **Network**: Ensure SSH connections are made over secure networks.

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

## Troubleshooting

### Connection Issues

1. Verify SSH credentials are correct
2. Check if the SSH port is open on the remote server
3. Ensure the SSH service is running on the remote server
4. For key-based auth, verify the private key has correct permissions (600)

### Permission Errors

1. Check if the SSH user has necessary permissions
2. For system operations, ensure sudo access is configured
3. For Docker commands, ensure the user is in the docker group

### Command Execution Failures

1. Check if the command exists on the remote system
2. Verify PATH environment variable includes command locations
3. For package managers, ensure they are installed on the system

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and feature requests, please use the GitHub issue tracker.
