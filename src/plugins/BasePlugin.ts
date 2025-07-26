import { Logger } from '../utils/logger';
import { ConnectionManager } from '../utils/connectionManager';
import { MessageFormatter } from '../utils/messageFormatter';
import { WASocket } from '@whiskeysockets/baileys';
import { 
    IPlugin, 
    PluginMetadata, 
    Command, 
    PluginConfig,
    PluginDependencies 
} from './types';

export abstract class BasePlugin implements IPlugin {
    public abstract metadata: PluginMetadata;
    public commands: Map<string, Command> = new Map();
    protected config: PluginConfig = { enabled: true };
    protected dependencies: PluginDependencies = {};

    constructor(dependencies: PluginDependencies = {}) {
        this.dependencies = dependencies;
    }

    // Plugin lifecycle methods
    async initialize(): Promise<void> {
        Logger.plugin(`Initializing plugin: ${this.metadata.name}`);
        await this.onInitialize();
        this.registerCommands();
        Logger.plugin(`Plugin ${this.metadata.name} initialized with ${this.commands.size} commands`, 'info');
    }

    async shutdown(): Promise<void> {
        Logger.info(`🔌 Shutting down plugin: ${this.metadata.name}`);
        await this.onShutdown();
        this.commands.clear();
    }

    // Abstract methods that plugins must implement
    protected abstract onInitialize(): Promise<void>;
    protected abstract onShutdown(): Promise<void>;
    protected abstract registerCommands(): void;

    // Command registration
    registerCommand(command: Command): void {
        if (this.commands.has(command.name)) {
            Logger.warn(`⚠️ Command ${command.name} already exists in plugin ${this.metadata.name}`);
            return;
        }

        // Ensure command category matches plugin category
        if (command.category !== this.metadata.category) {
            Logger.warn(`⚠️ Command ${command.name} category mismatch in plugin ${this.metadata.name}`);
        }

        this.commands.set(command.name, command);
        Logger.debug(`📝 Registered command: ${command.name} in plugin ${this.metadata.name}`);
    }

    getCommands(): Map<string, Command> {
        return new Map(this.commands);
    }

    // Configuration management
    configure(config: PluginConfig): void {
        this.config = { ...this.config, ...config };
        Logger.debug(`⚙️ Configured plugin ${this.metadata.name}:`, JSON.stringify(this.config));
    }

    // Utility methods for plugins
    protected async sendMessage(socket: WASocket, chatId: string, text: string): Promise<void> {
        await ConnectionManager.safeMessageSend(
            async () => {
                await socket.sendMessage(chatId, { text });
            },
            `send message from plugin ${this.metadata.name}`
        );
    }

    // Enhanced message sending with formatting
    protected async sendFormattedMessage(socket: WASocket, chatId: string, options: any): Promise<void> {
        const formattedMessage = MessageFormatter.formatMessage(options);
        await this.sendMessage(socket, chatId, formattedMessage);
    }

    protected async sendError(socket: WASocket, chatId: string, title: string, description?: string, suggestion?: string): Promise<void> {
        const errorMessage = MessageFormatter.formatError(title, description, suggestion);
        await this.sendMessage(socket, chatId, errorMessage);
    }

    protected async sendSuccess(socket: WASocket, chatId: string, title: string, description?: string, nextSteps?: string): Promise<void> {
        const successMessage = MessageFormatter.formatSuccess(title, description, nextSteps);
        await this.sendMessage(socket, chatId, successMessage);
    }

    protected isAdmin(sender: string): boolean {
        const ownerNumber = process.env.OWNER_NUMBER;
        const adminNumber = process.env.STORE_ADMIN;
        
        const senderNumber = sender.replace('@s.whatsapp.net', '');
        
        return senderNumber === ownerNumber || senderNumber === adminNumber;
    }

    protected logCommand(commandName: string, sender: string): void {
        Logger.command(`Executing command: ${commandName} by ${sender} (plugin: ${this.metadata.name})`);
    }

    // Plugin validation
    validate(): boolean {
        if (!this.metadata.name || !this.metadata.version || !this.metadata.category) {
            Logger.error(`❌ Plugin validation failed: missing required metadata`);
            return false;
        }

        if (this.commands.size === 0) {
            Logger.warn(`⚠️ Plugin ${this.metadata.name} has no commands`);
        }

        return true;
    }

    // Plugin information
    getInfo(): string {
        return `${this.metadata.name} v${this.metadata.version} - ${this.metadata.description} (${this.commands.size} commands)`;
    }

    // Check if plugin is enabled
    isEnabled(): boolean {
        return this.config.enabled;
    }

    // Get plugin priority for loading order
    getPriority(): number {
        return this.config.priority || 0;
    }
}