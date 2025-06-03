import { DomainRegistry } from '../registry/DomainRegistry';
import { DomainService } from '../registry/DomainService';
import { LegalDomain } from '../types';

jest.mock('../registry/DomainService');

const mockDomain: LegalDomain = {
  id: '1',
  code: 'energy',
  name: 'Energy Law',
  description: 'Energy law domain',
  active: true,
  documentTypes: ['law', 'regulation'],
  processingRules: [],
  complianceRequirements: [],
  metadata: {
    created_at: '2024-03-23T00:00:00Z',
    updated_at: '2024-03-23T00:00:00Z',
  },
};

describe('DomainRegistry', () => {
  let registry: DomainRegistry;
  let mockDomainService: jest.Mocked<DomainService>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the singleton instance for DomainRegistry
    (DomainRegistry as any).instance = undefined;
    mockDomainService = {
      registerDomain: jest.fn().mockResolvedValue(mockDomain),
      getDomain: jest.fn().mockResolvedValue(mockDomain),
      listDomains: jest.fn().mockResolvedValue([mockDomain]),
      updateDomain: jest.fn().mockResolvedValue(mockDomain),
    } as any;
    (DomainService.getInstance as jest.Mock).mockReturnValue(mockDomainService);
    registry = DomainRegistry.getInstance();
  });

  it('should register a new domain', async () => {
    const domain: Omit<LegalDomain, 'id' | 'metadata'> = {
      code: 'energy',
      name: 'Energy Law',
      description: 'Energy law domain',
      active: true,
      documentTypes: ['law', 'regulation'],
      processingRules: [],
      complianceRequirements: [],
    };
    const registered = await registry.registerDomain(domain);
    expect(registered).toEqual(mockDomain);
    expect(mockDomainService.registerDomain).toHaveBeenCalledWith(domain);
  });

  it('should retrieve a registered domain', async () => {
    await registry.getDomain('energy');
    expect(mockDomainService.getDomain).toHaveBeenCalledWith('energy');
  });

  it('should list all domains', async () => {
    await registry.listDomains();
    expect(mockDomainService.listDomains).toHaveBeenCalled();
  });

  it('should update a domain', async () => {
    const updates = {
      name: 'Updated Energy Law',
      description: 'Updated description',
    };
    await registry.updateDomain('energy', updates);
    expect(mockDomainService.updateDomain).toHaveBeenCalledWith('energy', updates);
  });

  it('should validate domain configuration', () => {
    const invalidDomain = {
      code: '',
      name: '',
      description: 'Invalid domain',
      active: true,
      documentTypes: [],
      processingRules: [],
      complianceRequirements: [],
    };
    // @ts-expect-error: Accessing private method for test
    expect(() => registry.validateDomain(invalidDomain)).toThrow('Domain must have a code, name, and description');
  });
}); 