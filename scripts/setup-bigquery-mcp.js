#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// Paths
const configPath = path.join(__dirname, '..', 'config', 'mcp', 'bigquery-config.json');
const mcpSettingsPath = path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');

// Load BigQuery configuration
let bigqueryConfig;
try {
  bigqueryConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log('Loaded BigQuery configuration');
} catch (error) {
  console.error('Error loading BigQuery configuration:', error.message);
  process.exit(1);
}

// Load MCP settings
let mcpSettings;
try {
  if (fs.existsSync(mcpSettingsPath)) {
    mcpSettings = JSON.parse(fs.readFileSync(mcpSettingsPath, 'utf8'));
    console.log('Loaded existing MCP settings');
  } else {
    mcpSettings = { mcpServers: {} };
    console.log('No existing MCP settings found, creating new settings');
  }
} catch (error) {
  console.error('Error loading MCP settings:', error.message);
  mcpSettings = { mcpServers: {} };
}

// Update MCP settings with BigQuery server
mcpSettings.mcpServers = mcpSettings.mcpServers || {};
mcpSettings.mcpServers[bigqueryConfig.mcp.server_name] = {
  command: bigqueryConfig.mcp.command,
  args: bigqueryConfig.mcp.args,
  disabled: false,
  autoApprove: []
};

// Save updated MCP settings
try {
  // Create directory if it doesn't exist
  const settingsDir = path.dirname(mcpSettingsPath);
  if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir, { recursive: true });
  }
  
  fs.writeFileSync(mcpSettingsPath, JSON.stringify(mcpSettings, null, 2));
  console.log('Updated MCP settings with BigQuery server');
} catch (error) {
  console.error('Error saving MCP settings:', error.message);
  process.exit(1);
}

console.log('BigQuery MCP server setup complete!');
console.log('');
console.log('To use the BigQuery MCP server:');
console.log('1. Update the GCP project details in:', configPath);
console.log('2. Run this script again to update the MCP settings');
console.log('3. Restart VS Code to apply the changes');
