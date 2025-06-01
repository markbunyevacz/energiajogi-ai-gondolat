import type { CrawlerProxy } from './types.js';
import { HttpsProxyAgent } from 'https-proxy-agent';

export class ProxyManager {
  private proxies: CrawlerProxy[] = [];
  private currentIndex = 0;

  constructor() {
    // Initialize with some default proxies if needed
    this.proxies = [];
  }

  public async getNextProxy(): Promise<CrawlerProxy | null> {
    if (this.proxies.length === 0) {
      return null;
    }

    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    return proxy;
  }

  public getProxyAgent(proxy: CrawlerProxy): HttpsProxyAgent<string> {
    const proxyUrl = new URL(proxy.server);
    if (proxy.username && proxy.password) {
      proxyUrl.username = proxy.username;
      proxyUrl.password = proxy.password;
    }
    return new HttpsProxyAgent(proxyUrl.toString());
  }
} 