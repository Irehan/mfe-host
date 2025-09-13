import { MicroFrontendConfig, ModuleLoadError, ModuleContainer } from '../types/types';

declare global {
  interface Window {
    [key: string]: any;
  }
  const __webpack_init_sharing__: (shareScope: string) => Promise<void>;
  const __webpack_share_scopes__: { [index: string]: any };
}

class ModuleLoader {
  private loadedModules = new Map<string, any>();
  private loadingPromises = new Map<string, Promise<any>>();
  private failedLoads = new Map<string, ModuleLoadError>();
  private maxRetries = 3;
  private retryDelay = 1000;

  private getCacheKey(config: MicroFrontendConfig): string {
    return `${config.scope}__${config.module}`;
  }

  async loadModule(config: MicroFrontendConfig, retries?: number): Promise<any> {
    const { name, url, scope, module } = config;
    const actualRetries = retries ?? this.maxRetries;
    const cacheKey = this.getCacheKey(config);
    if (this.loadedModules.has(cacheKey)) {
      console.log(`✅ Returning cached module: ${cacheKey}`);
      return this.loadedModules.get(cacheKey);
    }

    if (this.loadingPromises.has(cacheKey)) {
      console.log(`⏳ Waiting for existing load of ${cacheKey}`);
      return this.loadingPromises.get(cacheKey);
    }

    const failedLoad = this.failedLoads.get(cacheKey);
    if (failedLoad && Date.now() - failedLoad.timestamp < 30000) {
      throw new Error(`Module ${cacheKey} recently failed to load. Please wait before retrying.`);
    }

    const loadingPromise = this.loadRemoteModule(config, actualRetries);
    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const loadedModule = await loadingPromise;
      this.loadedModules.set(cacheKey, loadedModule);
      this.loadingPromises.delete(cacheKey);
      this.failedLoads.delete(cacheKey);
      console.log(`✅ Module ${cacheKey} loaded and cached successfully`);
      return loadedModule;
    } catch (error) {
      this.loadingPromises.delete(cacheKey);
      
      this.failedLoads.set(cacheKey, {
        module: name,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        retryCount: actualRetries
      });

      console.error(`❌ Module ${cacheKey} load failed:`, error);
      throw error;
    }
  }

  private async loadRemoteModule(config: MicroFrontendConfig, retries: number): Promise<any> {
    const { url, scope, module } = config;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${retries} to load ${scope}/${module} from ${url}`);
        

        await this.loadScript(url);
        
    
        await this.waitForContainer(scope);
        
        const container = window[scope] as ModuleContainer;
        
        if (typeof __webpack_init_sharing__ !== 'undefined') {
          await __webpack_init_sharing__('default');
        }
        
        if (typeof __webpack_share_scopes__ !== 'undefined' && __webpack_share_scopes__.default) {
          await container.init(__webpack_share_scopes__.default);
        } else {
          await container.init({});
        }


        const factory = await container.get(module);
        if (!factory) {
          throw new Error(`Module ${module} not found in container ${scope}`);
        }

        const Module = factory();
        console.log(`✅ ${scope}/${module} loaded successfully`);
        return Module;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`❌ Attempt ${attempt}/${retries} failed for ${scope}/${module}:`, errorMessage);
        
        if (attempt === retries) {
          throw new Error(`Failed to load ${scope}/${module} after ${retries} attempts. Last error: ${errorMessage}`);
        }
        
        const delay = this.retryDelay * attempt;
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await this.delay(delay);
      }
    }
  }

  private async waitForContainer(scope: string, maxWait: number = 5000): Promise<void> {
    const startTime = Date.now();
    
    while (!window[scope]) {
      if (Date.now() - startTime > maxWait) {
        throw new Error(`Container ${scope} not found after ${maxWait}ms`);
      }
      await this.delay(100);
    }
  }

  private loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${url}"]`) as HTMLScriptElement;
      if (existingScript) {
        if (existingScript.dataset.loaded === 'true') {
          console.log(`✅ Script ${url} already loaded`);
          resolve();
          return;
        }
        
        existingScript.addEventListener('load', () => {
          existingScript.dataset.loaded = 'true';
          resolve();
        });
        existingScript.addEventListener('error', () => reject(new Error(`Script load failed: ${url}`)));
        return;
      }

      console.log(`📥 Loading script: ${url}`);
      const script = document.createElement('script');
      script.src = url;
      script.type = 'text/javascript';
      script.async = true;

      script.onload = () => {
        script.dataset.loaded = 'true';
        console.log(`✅ Script ${url} loaded successfully`);
        resolve();
      };

      script.onerror = () => {
        console.error(`❌ Failed to load script: ${url}`);
        document.head.removeChild(script);
        reject(new Error(`Failed to load script: ${url}. Check if the remote application is running.`));
      };

      document.head.appendChild(script);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  unloadModule(name: string): void {
    // Clear all entries that start with this name
    for (const key of this.loadedModules.keys()) {
      if (key.startsWith(name)) {
        this.loadedModules.delete(key);
        console.log(`🗑️ Module ${key} unloaded`);
      }
    }
    for (const key of this.loadingPromises.keys()) {
      if (key.startsWith(name)) {
        this.loadingPromises.delete(key);
      }
    }
    for (const key of this.failedLoads.keys()) {
      if (key.startsWith(name)) {
        this.failedLoads.delete(key);
      }
    }
  }

  getLoadedModules(): string[] {
    return Array.from(this.loadedModules.keys());
  }

  getFailedLoads(): ModuleLoadError[] {
    return Array.from(this.failedLoads.values());
  }

  clearCache(): void {
    this.loadedModules.clear();
    this.loadingPromises.clear();
    this.failedLoads.clear();
    console.log('🧹 Module cache cleared');
  }

  async healthCheck(configs: MicroFrontendConfig[]): Promise<{
    healthy: string[];
    unhealthy: { name: string; error: string }[];
  }> {
    const results = await Promise.allSettled(
      configs.map(async (config) => {
        try {
          await fetch(config.url, { method: 'HEAD', mode: 'no-cors' });
          return { name: config.name, status: 'healthy' };
        } catch (error) {
          return { 
            name: config.name, 
            status: 'unhealthy', 
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const healthy: string[] = [];
    const unhealthy: { name: string; error: string }[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.status === 'healthy') {
          healthy.push(result.value.name);
        } else {
          unhealthy.push({
            name: result.value.name,
            error: result.value.error || 'Health check failed'
          });
        }
      } else {
        unhealthy.push({
          name: configs[index].name,
          error: result.reason?.message || 'Health check failed'
        });
      }
    });

    return { healthy, unhealthy };
  }

  getStats() {
    return {
      loaded: this.loadedModules.size,
      loading: this.loadingPromises.size,
      failed: this.failedLoads.size,
      loadedModules: this.getLoadedModules(),
      failedLoads: this.getFailedLoads()
    };
  }
}

export const moduleLoader = new ModuleLoader();