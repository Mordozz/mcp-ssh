# MCP SSH Server Installation Script for Windows

Write-Host "MCP SSH Server Installation Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
    
    # Extract major version number
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -lt 16) {
        Write-Host "Error: Node.js version 16 or higher is required." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error: Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
npm install

Write-Host "`nBuilding TypeScript files..." -ForegroundColor Yellow
npm run build

Write-Host "`nInstallation complete!" -ForegroundColor Green

# Get the current directory
$currentDir = (Get-Location).Path

Write-Host "`nTo configure the server for Claude Desktop, add the following to your config file:" -ForegroundColor Cyan
Write-Host "Location: %APPDATA%\Claude\claude_desktop_config.json" -ForegroundColor Yellow

$configExample = @"
{
  "mcpServers": {
    "ssh-server": {
      "command": "node",
      "args": ["$currentDir\dist\index.js"],
      "env": {
        "SSH_HOST": "your-server.com",
        "SSH_USERNAME": "your-username",
        "SSH_PASSWORD": "your-password"
      }
    }
  }
}
"@

Write-Host "`nConfiguration example:" -ForegroundColor Yellow
Write-Host $configExample -ForegroundColor Gray

Write-Host "`nRemember to replace the SSH credentials with your own!" -ForegroundColor Red

# Ask if user wants to open the config file location
$response = Read-Host "`nWould you like to open the Claude config directory? (Y/N)"
if ($response -eq 'Y' -or $response -eq 'y') {
    $configPath = "$env:APPDATA\Claude"
    if (Test-Path $configPath) {
        explorer $configPath
    } else {
        Write-Host "Claude config directory not found. Please ensure Claude Desktop is installed." -ForegroundColor Yellow
    }
}
