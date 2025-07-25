import { WAMessage, WASocket } from '@whiskeysockets/baileys';

// Command context interface (reused from commandManager)
export interface CommandContext {
    message: WAMessage;
    socket: WASocket;
    sender: string;
    chatId: string;
    isGroup: boolean;
    messageText: string;
}

// Command interface (reused from commandManager)
export interface Command {
    name: string;
    description: string;
    usage: string;
    category: 'general' | 'store' | 'admin' | 'pterodactyl';
    adminOnly?: boolean;
    execute: (args: string[], context: CommandContext) => Promise<void>;
}

// Plugin metadata interface
export interface PluginMetadata {
    name: string;
    version: string;
    description: string;
    author?: string;
    category: 'general' | 'store' | 'admin' | 'pterodactyl';
    dependencies?: string[];
}

// Plugin interface that all plugins must implement
export interface IPlugin {
    metadata: PluginMetadata;
    commands: Map<string, Command>;

    // Plugin lifecycle methods
    initialize(): Promise<void>;
    shutdown(): Promise<void>;

    // Command registration
    registerCommand(command: Command): void;
    getCommands(): Map<string, Command>;

    // Plugin-specific configuration
    configure(config: any): void;
    isEnabled(): boolean
}

// Plugin configuration interface
export interface PluginConfig {
    enabled: boolean;
    priority?: number;
    settings?: Record<string, any>;
}

// Plugin loader interface
export interface IPluginLoader {
    loadPlugin(pluginPath: string): Promise<IPlugin>;
    loadAllPlugins(): Promise<Map<string, IPlugin>>;
    unloadPlugin(pluginName: string): Promise<void>;
    getPlugin(pluginName: string): IPlugin | undefined;
    getAllPlugins(): Map<string, IPlugin>;
}

// Plugin dependencies interface
export interface PluginDependencies {
    pterodactylAPI?: any;
    logger?: any;
    connectionManager?: any;
    commandManager?: any;
}