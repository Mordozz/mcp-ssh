#!/bin/bash

echo "MCP SSH Server Installation Script"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "Error: Node.js version 16 or higher is required."
    exit 1
fi

echo "Installing dependencies..."
npm install

echo "Building TypeScript files..."
npm run build

echo ""
echo "Installation complete!"
echo ""
echo "To configure the server for Claude Desktop, add the following to your config file:"
echo ""
echo "Windows: %APPDATA%\\Claude\\claude_desktop_config.json"
echo "macOS: ~/Library/Application Support/Claude/claude_desktop_config.json"
echo "Linux: ~/.config/Claude/claude_desktop_config.json"
echo ""
echo '{'
echo '  "mcpServers": {'
echo '    "ssh-server": {'
echo '      "command": "node",'
echo '      "args": ["'$(pwd)'/dist/index.js"],'
echo '      "env": {'
echo '        "SSH_HOST": "your-server.com",'
echo '        "SSH_USERNAME": "your-username",'
echo '        "SSH_PASSWORD": "your-password"'
echo '      }'
echo '    }'
echo '  }'
echo '}'
echo ""
echo "Remember to replace the SSH credentials with your own!"
