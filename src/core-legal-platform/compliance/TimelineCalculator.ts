/**
 * @file TimelineCalculator.ts
 * @description Implements a comprehensive compliance timeline system for Hungarian legal rules.
 * This class provides a static `calculate` method to determine effective dates, compliance deadlines,
 * and grace periods for various types of legal documents. It supports retroactive provisions,
 * entity-specific exemptions, and integrates with a notification system via a configurable hook.
 */
// TimelineCalculator.ts
// Implements advanced compliance timeline logic for Hungarian legal rules
import { addDays, parseISO } from 'date-fns';
import { addBusinessDays } from './HungarianHolidayUtils';

export enum HungarianLawType {
  Act = 'act',
  GovernmentDecree = 'governmentDecree',
  MinisterialDecree = 'ministerialDecree',
  LocalDecree = 'localDecree',
  AmendingAct = 'amendingAct', // Módosító törvény
  OmnibusBill = 'omnibusBill',   // Saláta törvény
}

export interface ComplianceTimelineOptions {
  publicationDate: string; // ISO string
  lawType: HungarianLawType;
  retroactive?: boolean;
  retroactiveEffectiveDate?: string; // ISO string
  gracePeriodDays?: number;
  entityType?: string; // e.g., 'energy', 'healthcare'
  sectorExemptions?: { sector: string; additionalDays: number }[];
}

export interface ComplianceDeadline {
  effectiveDate: string; // ISO string
  complianceDeadline: string; // ISO string
  gracePeriodEnd?: string; // ISO string
  notes: string[];
  details: {
    publicationDate: string;
    lawType: HungarianLawType;
    baseImplementationDays: number;
    isRetroactive: boolean;
    sectorExemptionDays: number;
    gracePeriodDays: number;
  }
}

// Standard implementation periods for Hungarian laws (in calendar days)
const IMPLEMENTATION_PERIODS: Record<HungarianLawType, number> = {
  [HungarianLawType.Act]: 30,
  [HungarianLawType.GovernmentDecree]: 15,
  [HungarianLawType.MinisterialDecree]: 8,
  [HungarianLawType.LocalDecree]: 15,
  [HungarianLawType.AmendingAct]: 15, // Often shorter
  [HungarianLawType.OmnibusBill]: 45,  // Often longer and more complex
};

export interface NotificationPayload {
  entityType?: string;
  lawType: HungarianLawType;
  effectiveDate: string;
  complianceDeadline: string;
  gracePeriodEnd?: string;
  documentId?: string; // For linking to the legal document
  notes: string[];
}

export class TimelineCalculator {
  static notifyComplianceDeadline?: (payload: NotificationPayload) => void;

  static calculate(options: ComplianceTimelineOptions): ComplianceDeadline {
    const notes: string[] = [];
    const { publicationDate, lawType, retroactive, retroactiveEffectiveDate, gracePeriodDays = 0, entityType, sectorExemptions = [] } = options;

    const { effectiveDate, baseImplementationDays, isRetroactive } = this.calculateEffectiveDate({
        publicationDate,
        lawType,
        retroactive,
        retroactiveEffectiveDate
    }, notes);

    const { complianceDeadline, sectorExemptionDays } = this.applySectorExemptions(effectiveDate, entityType, sectorExemptions, notes);

    const gracePeriodEnd = this.applyGracePeriod(complianceDeadline, gracePeriodDays, notes);
    
    const notificationPayload: NotificationPayload = {
      entityType,
      lawType,
      effectiveDate: effectiveDate.toISOString(),
      complianceDeadline: complianceDeadline.toISOString(),
      gracePeriodEnd: gracePeriodEnd?.toISOString(),
      notes,
    };
    
    if (TimelineCalculator.notifyComplianceDeadline) {
      TimelineCalculator.notifyComplianceDeadline(notificationPayload);
    }

    return {
      effectiveDate: effectiveDate.toISOString(),
      complianceDeadline: complianceDeadline.toISOString(),
      gracePeriodEnd: gracePeriodEnd?.toISOString(),
      notes,
      details: {
        publicationDate,
        lawType,
        baseImplementationDays,
        isRetroactive,
        sectorExemptionDays,
        gracePeriodDays,
      }
    };
  }

  private static calculateEffectiveDate(
    { publicationDate, lawType, retroactive, retroactiveEffectiveDate }: Pick<ComplianceTimelineOptions, 'publicationDate' | 'lawType' | 'retroactive' | 'retroactiveEffectiveDate'>,
    notes: string[]
  ): { effectiveDate: Date; baseImplementationDays: number, isRetroactive: boolean } {
    if (retroactive && retroactiveEffectiveDate) {
      notes.push(`Retroactive provision. Effective from ${retroactiveEffectiveDate}.`);
      return { effectiveDate: parseISO(retroactiveEffectiveDate), baseImplementationDays: 0, isRetroactive: true };
    }

    const period = IMPLEMENTATION_PERIODS[lawType] || 8;
    // Standard implementation period is calculated in calendar days from publication.
    const effectiveDate = addDays(parseISO(publicationDate), period);
    notes.push(`Standard implementation period of ${period} calendar days applied for law type '${lawType}'.`);
    
    return { effectiveDate, baseImplementationDays: period, isRetroactive: false };
  }

  private static applySectorExemptions(
    effectiveDate: Date,
    entityType: string | undefined,
    sectorExemptions: { sector: string; additionalDays: number }[],
    notes: string[]
  ): { complianceDeadline: Date, sectorExemptionDays: number } {
    let complianceDeadline = new Date(effectiveDate.getTime());
    let sectorExemptionDays = 0;

    if (entityType) {
        const exemption = sectorExemptions.find(e => e.sector === entityType);
        if (exemption) {
            // Using addBusinessDays for sector-specific extensions could be a business rule.
            // Here, we'll stick to addDays for consistency unless specified otherwise.
            complianceDeadline = addDays(complianceDeadline, exemption.additionalDays);
            sectorExemptionDays = exemption.additionalDays;
            notes.push(`Applied ${exemption.additionalDays}-day sector exemption for '${entityType}'.`);
        }
    }
    
    return { complianceDeadline, sectorExemptionDays };
  }

  private static applyGracePeriod(
    complianceDeadline: Date,
    gracePeriodDays: number,
    notes: string[]
  ): Date | undefined {
    if (gracePeriodDays > 0) {
      // Grace periods are often counted in business days.
      const gracePeriodEnd = addBusinessDays(complianceDeadline, gracePeriodDays);
      notes.push(`A grace period of ${gracePeriodDays} business days applies, ending on ${gracePeriodEnd.toISOString().split('T')[0]}.`);
      return gracePeriodEnd;
    }
    return undefined;
  }
} 