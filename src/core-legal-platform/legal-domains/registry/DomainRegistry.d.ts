import { LegalDomain } from '../types';

export class DomainRegistry {
  private static instance: DomainRegistry;
  private domains: Map<string, LegalDomain>;

  private constructor();
  public static getInstance(): DomainRegistry;
  public getDomain(code: string): Promise<LegalDomain | null>;
  public registerDomain(domain: LegalDomain): Promise<void>;
  public unregisterDomain(code: string): Promise<void>;
} 