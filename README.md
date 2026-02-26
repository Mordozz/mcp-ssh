# 🖥️ MCP SSH Server v2.0 — Multi-Server Management

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D16-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-purple.svg)](https://modelcontextprotocol.io/)

> A comprehensive **Model Context Protocol (MCP)** server that enables AI assistants (Claude, etc.) to autonomously manage multiple SSH connections simultaneously. Connect, execute commands, manage Docker containers, and administer remote servers — all through natural language.

---

## ✨ Key Features

### 🔄 Multi-Server Management (v2.0)
- **Unlimited simultaneous connections** — manage your entire infrastructure
- **Connection profiles** — save, tag, and organize server configurations
- **Auto-reconnection** — automatic recovery from connection losses
- **Parallel execution** — run commands on multiple servers at once
- **Smart switching** — instantly switch between active connections

### 🛠️ Core Capabilities
| Feature | Description |
|---------|-------------|
| **SSH Connections** | Password & SSH key authentication, SSH agent support |
| **Command Execution** | Run any shell command, parallel multi-server execution |
| **File Operations** | Read, write, delete, list directories, create/remove dirs |
| **Docker** | Full lifecycle: ps, run, stop, start, restart, logs, exec, build, pull, push |
| **System Management** | Services (systemctl), processes, network, firewall (ufw) |
| **SFTP Support** | Upload/download files, directory operations |

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/Mordozz/mcp-ssh.git
cd mcp-ssh

# Install dependencies
npm install

# Build TypeScript
npm run build
```

Or use the install scripts:
```bash
# Windows
.\install.ps1

# Linux/macOS
chmod +x install.sh && ./install.sh
```

### Claude Desktop Configuration

Add to your Claude config file:

| OS | Path |
|----|------|
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "ssh-server": {
      "command": "node",
      "args": ["/path/to/mcp-ssh/dist/index.js"]
    }
  }
}
```

Optionally set default connection via environment variables:

```json
{
  "mcpServers": {
    "ssh-server": {
      "command": "node",
      "args": ["/path/to/mcp-ssh/dist/index.js"],
      "env": {
        "SSH_HOST": "192.168.1.100",
        "SSH_USERNAME": "admin",
        "SSH_PASSWORD": "your-password"
      }
    }
  }
}
```

---

## 📖 Usage Examples

### Managing Multiple Web Servers
```
Claude, save connections to web1 (192.168.1.10), web2 (192.168.1.11), 
web3 (192.168.1.12) with username 'admin', connect to all three, 
and check nginx status on each.
```

### Parallel Command Execution
```
Claude, execute 'docker ps' on all connected servers simultaneously.
```

### Server Switching
```
Claude, switch to the database server and check MySQL status, 
then switch to the web server and check nginx logs.
```

---

## 🔧 Available Tools (15 tools)

### SSH Connection Management

| Tool | Description |
|------|-------------|
| `ssh_save_connection` | Save a connection profile with name, host, credentials, tags |
| `ssh_connect` | Connect to a saved or new server |
| `ssh_quick_connect` | Temporary connection without saving |
| `ssh_disconnect` | Disconnect from a specific or active connection |
| `ssh_disconnect_all` | Close all SSH connections |
| `ssh_list_connections` | List all connections and their status |
| `ssh_switch_connection` | Switch active connection |
| `ssh_remove_connection` | Delete a saved connection profile |
| `ssh_test_connection` | Test connectivity without connecting |
| `ssh_connection_info` | Get detailed info about a connection |

### Command Execution

| Tool | Description |
|------|-------------|
| `execute_command` | Execute a shell command on active/specified connection |
| `execute_on_multiple` | Run a command on multiple servers (parallel or sequential) |

### File, Docker & System

| Tool | Description |
|------|-------------|
| `file_operations` | read, write, delete, list, create_dir, remove_dir |
| `docker_command` | ps, images, run, stop, start, restart, remove, logs, exec, build, pull, push |
| `system_management` | service, process, network, firewall, system info/reboot |

---

## 🏗️ Architecture

```
src/
├── index.ts                 # Entry point (StdioTransport)
├── server.ts                # MCP Server setup & request routing
├── connection-manager.ts    # Multi-connection SSH manager
├── types.ts                 # Shared TypeScript types
├── handlers/
│   ├── connection-handlers.ts
│   ├── command-handlers.ts
│   ├── file-handlers.ts
│   ├── docker-handlers.ts
│   └── system-handlers.ts
├── tools/
│   ├── connection-tools.ts  # Tool definitions (JSON Schema)
│   ├── command-tools.ts
│   ├── file-tools.ts
│   ├── docker-tools.ts
│   └── system-tools.ts
└── utils/
    └── ssh-helpers.ts       # SFTP operations, command builders
```

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SSH_HOST` | Default server hostname | — |
| `SSH_PORT` | Default SSH port | `22` |
| `SSH_USERNAME` | Default username | — |
| `SSH_PASSWORD` | Default password | — |
| `SSH_PRIVATE_KEY_PATH` | Path to SSH private key | — |
| `SSH_PASSPHRASE` | Key passphrase | — |
| `SSH_DEBUG` | Enable debug logging | `false` |

---

## 🔒 Security

- **Prefer SSH key authentication** over passwords
- **Never commit `.env` files** — they are in `.gitignore`
- Connection configs are stored locally in `config/ssh-connections.json`
- Commands execute with the SSH user's permissions — be cautious with sudo
- Ensure SSH connections are made over trusted networks

---

## 🧑‍💻 Development

```bash
# Development mode (hot reload via tsx)
npm run dev

# Build for production
npm run build

# Watch mode
npm run watch
```

---

## 🐛 Troubleshooting

**Connection fails:**
- Verify SSH credentials and that the server is reachable
- Check if the SSH port is open (`ssh -p PORT user@host`)
- For key auth, ensure correct permissions (`chmod 600 ~/.ssh/id_rsa`)

**Permission errors:**
- Verify the SSH user has necessary permissions
- For system operations, ensure sudo is configured
- For Docker, ensure the user is in the `docker` group

**Debug mode:**
- Set `SSH_DEBUG=true` in your environment for detailed SSH logging

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📬 Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/Mordozz/mcp-ssh/issues).
