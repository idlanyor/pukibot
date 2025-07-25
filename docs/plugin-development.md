# Plugin Development Guide

## Overview
The Pterodactyl WhatsApp Bot now uses a modular plugin system that allows commands to be organized into separate, maintainable modules. Each plugin is responsible for a specific category of functionality.

## Plugin Structure

### Directory Layout
```
src/plugins/
├── types.ts              # Plugin interfaces and types
├── BasePlugin.ts         # Base class for all plugins
├── PluginLoader.ts       # Plugin loading and management
├── index.ts              # Main plugin exports
├── general/
│   ├── GeneralPlugin.ts  # General commands (help, ping)
│   └── index.ts
├── store/
│   ├── StorePlugin.ts    # Store commands (katalog, harga, order)
│   └── index.ts
├── pterodactyl/
│   ├── PterodactylPlugin.ts  # Server management commands
│   └── index.ts
└── admin/
    ├── AdminPlugin.ts    # Admin commands (stats, plugins)
    └── index.ts
```

## Creating a New Plugin

### Step 1: Create Plugin Class
Create a new plugin by extending the `BasePlugin` class:

```typescript
import { BasePlugin } from '../BasePlugin';
import { Command, CommandContext, PluginMetadata, PluginDependencies } from '../types';

export class MyPlugin extends BasePlugin {
    public metadata: PluginMetadata = {
        name: 'MyPlugin',
        version: '1.0.0',
        description: 'Description of my plugin',
        author: 'Your Name',
        category: 'general' // or 'store', 'admin', 'pterodactyl'
    };

    constructor(dependencies: PluginDependencies = {}) {
        super(dependencies);
    }

    protected async onInitialize(): Promise<void> {
        // Initialize plugin-specific resources
    }

    protected async onShutdown(): Promise<void> {
        // Cleanup plugin-specific resources
    }

    protected registerCommands(): void {
        this.registerCommand({
            name: 'mycommand',
            description: 'My custom command',
            usage: '!mycommand [args]',
            category: 'general',
            execute: this.myCommandHandler.bind(this)
        });
    }

    private async myCommandHandler(args: string[], context: CommandContext) {
        this.logCommand('mycommand', context.sender);
        
        // Your command logic here
        await this.sendMessage(context.socket, context.chatId, 'Hello from my plugin!');
    }
}
```

### Step 2: Register Plugin in PluginLoader
Add your plugin to the `PluginLoader.ts` file:

```typescript
// Import your plugin
import { MyPlugin } from './my-plugin';

// Add to pluginClasses array
const pluginClasses = [
    GeneralPlugin,
    StorePlugin,
    PterodactylPlugin,
    AdminPlugin,
    MyPlugin  // Add your plugin here
];
```

### Step 3: Export Plugin
Create an `index.ts` file in your plugin directory:

```typescript
import { MyPlugin } from './MyPlugin';

export { MyPlugin };
export default MyPlugin;
```

## Plugin Features

### Base Plugin Methods
All plugins inherit these methods from `BasePlugin`:

- `sendMessage(socket, chatId, text)` - Send WhatsApp message
- `isAdmin(sender)` - Check if user is admin
- `logCommand(command, sender)` - Log command execution
- `validate()` - Validate plugin configuration
- `getInfo()` - Get plugin information string

### Command Context
Each command receives a `CommandContext` object with:

```typescript
interface CommandContext {
    message: WAMessage;      // Original WhatsApp message
    socket: WASocket;        // WhatsApp socket connection
    sender: string;          // Sender's WhatsApp ID
    chatId: string;          // Chat ID (group or private)
    isGroup: boolean;        // Whether message is from group
    messageText: string;     // Full message text
}
```

### Plugin Dependencies
Plugins can access these dependencies:

```typescript
interface PluginDependencies {
    pterodactylAPI?: PterodactylAPI;    // Pterodactyl API client
    logger?: Logger;                    // Logging utility
    connectionManager?: ConnectionManager; // Connection management
}
```

## Plugin Categories

### General
- **Purpose**: Basic bot functionality
- **Commands**: help, ping
- **Dependencies**: None

### Store
- **Purpose**: Product catalog and order management
- **Commands**: katalog, harga, order
- **Dependencies**: None

### Pterodactyl
- **Purpose**: Server management
- **Commands**: server, start, stop, restart
- **Dependencies**: pterodactylAPI

### Admin
- **Purpose**: Bot administration
- **Commands**: stats, plugins
- **Dependencies**: None
- **Permissions**: Admin only

## Plugin Lifecycle

### 1. Loading
- Plugin classes are imported by `PluginLoader`
- Instances are created with dependencies
- `validate()` is called to check plugin integrity

### 2. Initialization
- `onInitialize()` is called for setup
- `registerCommands()` is called to register commands
- Plugin is marked as active

### 3. Execution
- Commands are executed through the `CommandManager`
- Each command gets a `CommandContext` with message details
- Error handling is managed by the base plugin

### 4. Shutdown
- `onShutdown()` is called for cleanup
- Commands are unregistered
- Resources are released

## Best Practices

### 1. Error Handling
```typescript
private async myCommand(args: string[], context: CommandContext) {
    try {
        // Your command logic
    } catch (error) {
        this.logger.error('Command failed:', error);
        await this.sendMessage(context.socket, context.chatId, 
            '❌ Terjadi kesalahan saat menjalankan perintah.');
    }
}
```

### 2. Input Validation
```typescript
private async myCommand(args: string[], context: CommandContext) {
    if (!args[0]) {
        await this.sendMessage(context.socket, context.chatId,
            '❌ Format salah. Gunakan: !mycommand [parameter]');
        return;
    }
    
    // Process command
}
```

### 3. Admin Commands
```typescript
private async adminCommand(args: string[], context: CommandContext) {
    if (!this.isAdmin(context.sender)) {
        await this.sendMessage(context.socket, context.chatId,
            '❌ Perintah ini hanya untuk admin.');
        return;
    }
    
    // Admin-only logic
}
```

### 4. Logging
```typescript
private async myCommand(args: string[], context: CommandContext) {
    this.logCommand('mycommand', context.sender);
    
    // Command implementation
}
```

## Testing Plugins

### 1. Unit Testing
Test individual plugin methods:

```typescript
const plugin = new MyPlugin();
await plugin.initialize();
// Test plugin methods
```

### 2. Integration Testing
Use the provided test script:

```bash
./test-plugin-system.sh
```

### 3. Manual Testing
Start the bot and test commands:

```bash
bun src/index.ts
```

## Plugin Configuration

### Environment Variables
Plugins can access environment variables:

```typescript
const botName = process.env.BOT_NAME || 'Default Bot';
const adminNumber = process.env.STORE_ADMIN;
```

### Plugin-Specific Settings
Use the `configure()` method for plugin settings:

```typescript
plugin.configure({
    enabled: true,
    priority: 1,
    settings: {
        customSetting: 'value'
    }
});
```

## Troubleshooting

### Common Issues

1. **Plugin Not Loading**
   - Check if plugin is added to `PluginLoader`
   - Verify plugin exports in `index.ts`
   - Check for syntax errors

2. **Commands Not Working**
   - Ensure commands are registered in `registerCommands()`
   - Check command name conflicts
   - Verify command category matches plugin category

3. **Dependencies Missing**
   - Check if required dependencies are passed to plugin constructor
   - Verify dependency injection in `CommandManager`

### Debug Mode
Enable debug logging to see plugin loading details:

```bash
LOG_LEVEL=debug bun src/index.ts
```

## Migration from Old System

The old monolithic `commandManager.ts` has been replaced with the plugin system. All existing commands have been migrated to their respective plugins with identical functionality.

### Command Mapping
- `help`, `ping` → `GeneralPlugin`
- `katalog`, `harga`, `order` → `StorePlugin`
- `server`, `start`, `stop`, `restart` → `PterodactylPlugin`
- `stats` → `AdminPlugin`

### Backward Compatibility
All existing commands work exactly the same way. Users will not notice any difference in functionality.