interface ProxyConfig {
  enabled: boolean;
  proxyList: string[];
  rotationInterval: number;
}

export class ProxyRotator {
  private config: ProxyConfig;
  private currentProxyIndex = 0;
  private lastRotationTime = Date.now();

  constructor(config: ProxyConfig) {
    this.config = config;
  }

  getCurrentProxy(): string | undefined {
    if (!this.config.enabled || this.config.proxyList.length === 0) {
      return undefined;
    }

    const now = Date.now();
    if (now - this.lastRotationTime >= this.config.rotationInterval) {
      this.rotateProxy();
    }

    return this.config.proxyList[this.currentProxyIndex];
  }

  private rotateProxy(): void {
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.config.proxyList.length;
    this.lastRotationTime = Date.now();
  }

  addProxy(proxy: string): void {
    if (!this.config.proxyList.includes(proxy)) {
      this.config.proxyList.push(proxy);
    }
  }

  removeProxy(proxy: string): void {
    const index = this.config.proxyList.indexOf(proxy);
    if (index !== -1) {
      this.config.proxyList.splice(index, 1);
      if (this.currentProxyIndex >= this.config.proxyList.length) {
        this.currentProxyIndex = 0;
      }
    }
  }
} 