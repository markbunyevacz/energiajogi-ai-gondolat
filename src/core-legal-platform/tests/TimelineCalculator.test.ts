import { describe, it, expect, vi } from 'vitest';
import { TimelineCalculator, HungarianLawType, NotificationPayload } from '../compliance/TimelineCalculator';

describe('TimelineCalculator', () => {
  it('should calculate the timeline for a standard government decree', () => {
    const options = {
      publicationDate: '2024-01-10T00:00:00.000Z',
      lawType: HungarianLawType.GovernmentDecree,
    };

    const result = TimelineCalculator.calculate(options);

    expect(result.effectiveDate).toBe('2024-01-25T00:00:00.000Z');
    expect(result.complianceDeadline).toBe('2024-01-25T00:00:00.000Z');
    expect(result.gracePeriodEnd).toBeUndefined();
    expect(result.notes).toContain("Standard implementation period of 15 calendar days applied for law type 'governmentDecree'.");
  });

  it('should handle retroactive provisions correctly', () => {
    const options = {
      publicationDate: '2024-01-10T00:00:00.000Z',
      lawType: HungarianLawType.Act,
      retroactive: true,
      retroactiveEffectiveDate: '2024-01-01T00:00:00.000Z',
    };

    const result = TimelineCalculator.calculate(options);

    expect(result.effectiveDate).toBe('2024-01-01T00:00:00.000Z');
    expect(result.complianceDeadline).toBe('2024-01-01T00:00:00.000Z');
    expect(result.notes).toContain("Retroactive provision. Effective from 2024-01-01T00:00:00.000Z.");
  });

  it('should apply a grace period using business days', () => {
    const options = {
      publicationDate: '2024-03-10T00:00:00.000Z', // Sunday
      lawType: HungarianLawType.MinisterialDecree, // 8 days
      gracePeriodDays: 5,
    };
    // Publication: 2024-03-10 (Sun)
    // Effective date: 2024-03-18 (Mon)
    // Grace period ends: 2024-03-25 (Mon)
    // Public holidays in March 2024: 15th (Fri), 29th (Fri, Good Friday)
    // March 18 (Mon) + 5 business days:
    // 19 (Tue), 20 (Wed), 21 (Thu), 22 (Fri), 25 (Mon)
    
    const result = TimelineCalculator.calculate(options);
    
    expect(result.effectiveDate).toBe('2024-03-18T00:00:00.000Z');
    expect(result.complianceDeadline).toBe('2024-03-18T00:00:00.000Z');
    expect(result.gracePeriodEnd).toBe('2024-03-25T00:00:00.000Z');
    expect(result.notes).toContain("A grace period of 5 business days applies, ending on 2024-03-25.");
  });
  
  it('should apply a sector-specific exemption', () => {
      const options = {
          publicationDate: '2024-05-01T00:00:00.000Z',
          lawType: HungarianLawType.Act,
          entityType: 'energy',
          sectorExemptions: [{ sector: 'energy', additionalDays: 60 }],
        };
        
    const result = TimelineCalculator.calculate(options);
    
    // Effective date: 2024-05-01 + 30 days = 2024-05-31
    // Compliance deadline: 2024-05-31 + 60 days = 2024-07-30
    expect(result.effectiveDate).toBe('2024-05-31T00:00:00.000Z');
    expect(result.complianceDeadline).toBe('2024-07-30T00:00:00.000Z');
    expect(result.notes).toContain("Applied 60-day sector exemption for 'energy'.");
  });

  it('should call the notification hook with the correct payload', () => {
    const notificationSpy = vi.fn();
    TimelineCalculator.notifyComplianceDeadline = notificationSpy;

    const options = {
      publicationDate: '2024-07-01T00:00:00.000Z',
      lawType: HungarianLawType.OmnibusBill,
      gracePeriodDays: 10,
      entityType: 'healthcare',
      documentId: 'doc-123'
    };

    TimelineCalculator.calculate(options);

    expect(notificationSpy).toHaveBeenCalledTimes(1);
    const payload: NotificationPayload = notificationSpy.mock.calls[0][0];
    
    expect(payload.lawType).toBe(HungarianLawType.OmnibusBill);
    expect(payload.entityType).toBe('healthcare');
    // More assertions can be added here to check dates in payload
  });
}); 