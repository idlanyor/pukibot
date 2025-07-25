import { Logger } from '../utils/logger';
import { IPlugin, IPluginLoader, PluginDependencies } from './types';

// Import all plugins
import { GeneralPlugin } from './general';
import { StorePlugin } from './store';
import { PterodactylPlugin } from './pterodactyl';
import { AdminPlugin } from './admin';

export class PluginLoader implements IPluginLoader {
    private plugins: Map<string, IPlugin> = new Map();
    private dependencies: PluginDependencies;

    constructor(dependencies: PluginDependencies = {}) {
        this.dependencies = dependencies;
    }

    async loadPlugin(pluginPath: string): Promise<IPlugin> {
        throw new Error('Dynamic plugin loading not implemented. Use loadAllPlugins() instead.');
    }

    async loadAllPlugins(): Promise<Map<string, IPlugin>> {
        Logger.info('🔌 Loading all plugins...');

        const pluginClasses = [
            GeneralPlugin,
            StorePlugin,
            PterodactylPlugin,
            AdminPlugin
        ];

        for (const PluginClass of pluginClasses) {
            try {
                const plugin = new PluginClass(this.dependencies);
                
                // Validate plugin
                if (!plugin.validate()) {
                    Logger.error(`❌ Plugin validation failed for ${plugin.metadata.name}`);
                    continue;
                }

                // Check if plugin is enabled
                if (!plugin.isEnabled()) {
                    Logger.info(`⏭️ Plugin ${plugin.metadata.name} is disabled, skipping`);
                    continue;
                }

                // Initialize plugin
                await plugin.initialize();
                
                // Store plugin
                this.plugins.set(plugin.metadata.name, plugin);
                
                Logger.info(`✅ Loaded plugin: ${plugin.getInfo()}`);
                
            } catch (error) {
                Logger.error(`❌ Failed to load plugin ${PluginClass.name}:`, error);
            }
        }

        Logger.info(`🎯 Plugin loading complete. Loaded ${this.plugins.size} plugins.`);
        return new Map(this.plugins);
    }

    async unloadPlugin(pluginName: string): Promise<void> {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Plugin ${pluginName} not found`);
        }

        try {
            await plugin.shutdown();
            this.plugins.delete(pluginName);
            Logger.info(`🔌 Unloaded plugin: ${pluginName}`);
        } catch (error) {
            Logger.error(`❌ Failed to unload plugin ${pluginName}:`, error);
            throw error;
        }
    }

    getPlugin(pluginName: string): IPlugin | undefined {
        return this.plugins.get(pluginName);
    }

    getAllPlugins(): Map<string, IPlugin> {
        return new Map(this.plugins);
    }

    // Get all commands from all plugins
    getAllCommands(): Map<string, any> {
        const allCommands = new Map();
        
        for (const [pluginName, plugin] of this.plugins) {
            const commands = plugin.getCommands();
            for (const [commandName, command] of commands) {
                if (allCommands.has(commandName)) {
                    Logger.warn(`⚠️ Command conflict: ${commandName} exists in multiple plugins`);
                    continue;
                }
                allCommands.set(commandName, {
                    ...command,
                    plugin: pluginName
                });
            }
        }
        
        return allCommands;
    }

    // Get commands by category
    getCommandsByCategory(category: string): Map<string, any> {
        const categoryCommands = new Map();
        
        for (const [pluginName, plugin] of this.plugins) {
            if (plugin.metadata.category === category) {
                const commands = plugin.getCommands();
                for (const [commandName, command] of commands) {
                    categoryCommands.set(commandName, {
                        ...command,
                        plugin: pluginName
                    });
                }
            }
        }
        
        return categoryCommands;
    }

    // Get plugin statistics
    getPluginStats(): any {
        const stats = {
            totalPlugins: this.plugins.size,
            totalCommands: 0,
            pluginsByCategory: {} as Record<string, number>,
            plugins: [] as any[]
        };

        for (const [pluginName, plugin] of this.plugins) {
            const commandCount = plugin.getCommands().size;
            stats.totalCommands += commandCount;
            
            const category = plugin.metadata.category;
            stats.pluginsByCategory[category] = (stats.pluginsByCategory[category] || 0) + 1;
            
            stats.plugins.push({
                name: pluginName,
                version: plugin.metadata.version,
                category: category,
                commands: commandCount,
                enabled: plugin.isEnabled()
            });
        }

        return stats;
    }

    // Shutdown all plugins
    async shutdown(): Promise<void> {
        Logger.info('🔌 Shutting down all plugins...');
        
        for (const [pluginName, plugin] of this.plugins) {
            try {
                await plugin.shutdown();
                Logger.info(`✅ Shutdown plugin: ${pluginName}`);
            } catch (error) {
                Logger.error(`❌ Failed to shutdown plugin ${pluginName}:`, error);
            }
        }
        
        this.plugins.clear();
        Logger.info('🎯 All plugins shut down successfully');
    }
}