import { DomainService } from '../registry/DomainService';
import { LegalDomain } from '../types';
import { supabase } from '../../../integrations/supabase/client';

const mockDomainData = {
  id: '1',
  code: 'energy',
  name: 'Energy Law',
  description: 'Energy law domain',
  active: true,
  document_types: ['law', 'regulation'],
  processing_rules: JSON.stringify([]),
  compliance_requirements: JSON.stringify([]),
  created_at: '2024-03-23T00:00:00Z',
  updated_at: '2024-03-23T00:00:00Z',
};

jest.mock('../../../integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: mockDomainData,
            error: null,
          })),
        })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: mockDomainData,
            error: null,
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: mockDomainData,
              error: null,
            })),
          })),
        })),
      })),
    })),
  },
}));

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

describe('DomainService', () => {
  let service: DomainService;

  beforeEach(() => {
    service = DomainService.getInstance();
    jest.clearAllMocks();
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

    const registered = await service.registerDomain(domain);
    expect(registered).toEqual(mockDomain);
    expect(supabase.from).toHaveBeenCalledWith('legal_domains');
  });

  it('should get a domain by code', async () => {
    const domain = await service.getDomain('energy');
    expect(domain).toEqual(mockDomain);
    expect(supabase.from).toHaveBeenCalledWith('legal_domains');
  });

  it('should list all domains', async () => {
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [mockDomainData],
          error: null,
        })),
      })),
    }));

    const domains = await service.listDomains();
    expect(domains).toEqual([mockDomain]);
    expect(supabase.from).toHaveBeenCalledWith('legal_domains');
  });

  it('should update a domain', async () => {
    const updates = {
      name: 'Updated Energy Law',
      description: 'Updated description',
    };

    const updated = await service.updateDomain('energy', updates);
    expect(updated).toEqual(mockDomain);
    expect(supabase.from).toHaveBeenCalledWith('legal_domains');
  });

  it('should handle errors when registering a domain', async () => {
    const error = new Error('Database error');
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error,
          })),
        })),
      })),
    }));

    const domain: Omit<LegalDomain, 'id' | 'metadata'> = {
      code: 'energy',
      name: 'Energy Law',
      description: 'Energy law domain',
      active: true,
      documentTypes: ['law', 'regulation'],
      processingRules: [],
      complianceRequirements: [],
    };

    await expect(service.registerDomain(domain)).rejects.toThrow('Failed to register domain: Database error');
  });
}); 