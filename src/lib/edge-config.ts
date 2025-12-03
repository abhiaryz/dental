import { get } from '@vercel/edge-config';

/**
 * Edge Config Client for read-only configuration
 * Used for feature flags, app settings, and static configuration
 */
export class EdgeConfigClient {
  private static instance: EdgeConfigClient;

  private constructor() {}

  static getInstance(): EdgeConfigClient {
    if (!EdgeConfigClient.instance) {
      EdgeConfigClient.instance = new EdgeConfigClient();
    }
    return EdgeConfigClient.instance;
  }

  /**
   * Get a value from Edge Config
   */
  async get<T = unknown>(key: string): Promise<T | undefined> {
    try {
      return await get<T>(key);
    } catch (error) {
      console.error(`Edge Config get error for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Get multiple values from Edge Config
   */
  async getAll<T = Record<string, unknown>>(keys: string[]): Promise<Partial<T>> {
    try {
      const values = await Promise.all(
        keys.map(async (key) => {
          const value = await get(key);
          return { key, value };
        })
      );

      return values.reduce((acc, { key, value }) => {
        if (value !== undefined) {
          acc[key as keyof T] = value as T[keyof T];
        }
        return acc;
      }, {} as Partial<T>);
    } catch (error) {
      console.error('Edge Config getAll error:', error);
      return {};
    }
  }

  /**
   * Get feature flag value
   */
  async getFeatureFlag(flagName: string): Promise<boolean> {
    const value = await this.get<boolean>(`feature_${flagName}`);
    return value ?? false;
  }

  /**
   * Get app configuration
   */
  async getConfig<T = unknown>(configKey: string): Promise<T | undefined> {
    return this.get<T>(`config_${configKey}`);
  }
}

export const edgeConfig = EdgeConfigClient.getInstance();

