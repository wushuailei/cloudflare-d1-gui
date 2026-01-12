import type { AppConfig, DatabaseConnection } from '../types';

const DEFAULT_CONFIG: AppConfig = {
  version: '1.0',
  connections: [
    {
      id: 'local-dev',
      name: '本地开发数据库',
      mode: 'local',
      description: '使用 Worker 绑定的本地数据库',
    },
  ],
  activeConnectionId: 'local-dev',
  settings: {
    theme: 'light',
    autoSave: true,
    queryHistory: true,
    maxHistoryItems: 50,
  },
};

// Simple encryption/decryption (Base64 + XOR)
// Note: This is basic obfuscation, not cryptographic security
const ENCRYPTION_KEY = 'cloudflare-d1-gui-2026';

function encryptToken(token: string): string {
  const encrypted = token
    .split('')
    .map((char, i) => {
      const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
    })
    .join('');
  return btoa(encrypted);
}

function decryptToken(encrypted: string): string {
  try {
    const decoded = atob(encrypted);
    return decoded
      .split('')
      .map((char, i) => {
        const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
      })
      .join('');
  } catch {
    return encrypted; // Return as-is if decryption fails
  }
}

class ConfigService {
  private config: AppConfig = DEFAULT_CONFIG;
  private storageKey = 'cloudflare-d1-gui-config';

  constructor() {
    this.loadConfig();
  }

  // Load configuration from localStorage
  loadConfig(): AppConfig {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as AppConfig;
        // Decrypt API tokens
        parsed.connections = parsed.connections.map((conn) => ({
          ...conn,
          apiToken: conn.apiToken ? decryptToken(conn.apiToken) : undefined,
        }));
        this.config = { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      this.config = DEFAULT_CONFIG;
    }
    return this.config;
  }

  // Save configuration to localStorage
  saveConfig(config: AppConfig): void {
    try {
      // Encrypt API tokens before saving
      const toSave = {
        ...config,
        connections: config.connections.map((conn) => ({
          ...conn,
          apiToken: conn.apiToken ? encryptToken(conn.apiToken) : undefined,
        })),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(toSave));
      this.config = config;
    } catch (error) {
      console.error('Failed to save config:', error);
      throw new Error('保存配置失败');
    }
  }

  // Get current configuration
  getConfig(): AppConfig {
    return this.config;
  }

  // Get active connection
  getActiveConnection(): DatabaseConnection | undefined {
    return this.config.connections.find(
      (conn) => conn.id === this.config.activeConnectionId
    );
  }

  // Set active connection
  setActiveConnection(connectionId: string): void {
    if (this.config.connections.some((conn) => conn.id === connectionId)) {
      this.config.activeConnectionId = connectionId;
      this.saveConfig(this.config);
    }
  }

  // Add new connection
  addConnection(connection: DatabaseConnection): void {
    // Check if ID already exists
    if (this.config.connections.some((conn) => conn.id === connection.id)) {
      throw new Error('连接 ID 已存在');
    }
    this.config.connections.push(connection);
    this.saveConfig(this.config);
  }

  // Update connection
  updateConnection(connectionId: string, updates: Partial<DatabaseConnection>): void {
    const index = this.config.connections.findIndex((conn) => conn.id === connectionId);
    if (index === -1) {
      throw new Error('连接不存在');
    }
    this.config.connections[index] = {
      ...this.config.connections[index],
      ...updates,
    };
    this.saveConfig(this.config);
  }

  // Delete connection
  deleteConnection(connectionId: string): void {
    if (connectionId === 'local-dev') {
      throw new Error('不能删除本地开发连接');
    }
    this.config.connections = this.config.connections.filter(
      (conn) => conn.id !== connectionId
    );
    // If deleted connection was active, switch to local-dev
    if (this.config.activeConnectionId === connectionId) {
      this.config.activeConnectionId = 'local-dev';
    }
    this.saveConfig(this.config);
  }

  // Export configuration
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  // Import configuration
  importConfig(jsonString: string): void {
    try {
      const imported = JSON.parse(jsonString) as AppConfig;
      // Validate structure
      if (!imported.version || !imported.connections || !imported.settings) {
        throw new Error('无效的配置文件格式');
      }
      this.saveConfig(imported);
    } catch (error) {
      console.error('Failed to import config:', error);
      throw new Error('导入配置失败：' + (error as Error).message);
    }
  }

  // Update settings
  updateSettings(settings: Partial<AppConfig['settings']>): void {
    this.config.settings = { ...this.config.settings, ...settings };
    this.saveConfig(this.config);
  }

  // Reset to default
  resetConfig(): void {
    this.config = DEFAULT_CONFIG;
    this.saveConfig(this.config);
  }
}

// Export singleton instance
export const configService = new ConfigService();
