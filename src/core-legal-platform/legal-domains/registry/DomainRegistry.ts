import { LegalDomain } from '../types';
import { DomainService } from './DomainService';
import NodeCache from 'node-cache';

export class DomainRegistry {
  private static instance: DomainRegistry;
  private domainService: DomainService;
  private cache: NodeCache;
  private domains: Map<string, LegalDomain> = new Map();

  private constructor() {
    this.domainService = DomainService.getInstance();
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes
      checkperiod: 60, // Check for expired keys every minute
    });
  }

  public static getInstance(): DomainRegistry {
    if (!DomainRegistry.instance) {
      DomainRegistry.instance = new DomainRegistry();
    }
    return DomainRegistry.instance;
  }

  async registerDomain(domain: Omit<LegalDomain, 'id' | 'metadata'>): Promise<LegalDomain> {
    const registered = await this.domainService.registerDomain(domain);
    this.domains.set(domain.code, registered);
    this.cache.set(domain.code, registered);
    return registered;
  }

  async getDomain(code: string): Promise<LegalDomain | null> {
    const cached = this.cache.get<LegalDomain>(code);
    if (cached) {
      return cached;
    }

    const domain = await this.domains.get(code) || await this.domainService.getDomain(code);
    if (domain) {
      this.cache.set(code, domain);
    }
    return domain;
  }

  async listDomains(): Promise<LegalDomain[]> {
    const domains = await this.domainService.listDomains();
    domains.forEach(domain => {
      this.domains.set(domain.code, domain);
      this.cache.set(domain.code, domain);
    });
    return domains;
  }

  async updateDomain(code: string, updates: Partial<LegalDomain>): Promise<LegalDomain> {
    const updated = await this.domainService.updateDomain(code, updates);
    this.domains.set(code, updated);
    this.cache.set(code, updated);
    return updated;
  }

  async unregisterDomain(code: string): Promise<void> {
    this.domains.delete(code);
    this.cache.del(code);
  }

  private validateDomain(domain: Omit<LegalDomain, 'id' | 'metadata'>): void {
    if (!domain.code || !domain.name || !domain.description) {
      throw new Error('Domain must have a code, name, and description');
    }

    if (!Array.isArray(domain.documentTypes)) {
      throw new Error('Document types must be an array');
    }

    if (!Array.isArray(domain.processingRules)) {
      throw new Error('Processing rules must be an array');
    }

    if (!Array.isArray(domain.complianceRequirements)) {
      throw new Error('Compliance requirements must be an array');
    }
  }
} 