import { z } from 'zod';

export const materialReceivedSchema = z.object({
  materialName: z.string().min(1, 'Material name is required'),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  unit: z.string().min(1, 'Unit is required'),
  supplier: z.string().optional().default(''),
  invoiceNo: z.string().optional().default(''),
});

export const materialConsumedSchema = z.object({
  materialName: z.string().min(1, 'Material name is required'),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  unit: z.string().min(1, 'Unit is required'),
  notes: z.string().optional().default(''),
});

export const equipmentUsedSchema = z.object({
  equipmentName: z.string().min(1, 'Equipment name is required'),
  count: z.number().int().min(1).default(1),
  hoursOperated: z.number().min(0).default(0),
  status: z.enum(['Operational', 'Breakdown', 'Idle']).default('Operational'),
});

export const photoSchema = z.object({
  url: z.string().min(1, 'Photo URL is required'),
  caption: z.string().optional().default(''),
  originalName: z.string().optional().default(''),
  timestamp: z.string().or(z.date()).optional(),
});

export const documentSchema = z.object({
  url: z.string().min(1, 'Document URL is required'),
  name: z.string().min(1, 'Document name is required'),
  size: z.number().optional().default(0),
  type: z.string().optional().default(''),
});

export const createDailyReportSchema = z.object({
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  clientCode: z.string().optional(),
  reportDate: z.string().min(1, 'Report date is required'),
  weather: z.string().optional().default('Sunny / Clear'),
  workingConditions: z.string().optional().default('Normal Operations'),
  workersCount: z.number().int().min(0, 'Workers count cannot be negative').default(0),
  workersBreakdown: z
    .object({
      skilled: z.number().int().min(0).optional().default(0),
      unskilled: z.number().int().min(0).optional().default(0),
      masons: z.number().int().min(0).optional().default(0),
      carpenters: z.number().int().min(0).optional().default(0),
      helpers: z.number().int().min(0).optional().default(0),
      others: z.number().int().min(0).optional().default(0),
      notes: z.string().optional().default(''),
    })
    .optional()
    .default({}),
  workCompletedToday: z.string().min(1, 'Work completed today is required'),
  workPlannedTomorrow: z.string().min(1, 'Work planned for next day is required'),
  materialsReceived: z.array(materialReceivedSchema).optional().default([]),
  materialsConsumed: z.array(materialConsumedSchema).optional().default([]),
  equipmentUsed: z.array(equipmentUsedSchema).optional().default([]),
  progressPercentage: z.number().min(0).max(100).default(0),
  safetyInspection: z
    .object({
      safetyGearCompliance: z.boolean().default(true),
      incidentsCount: z.number().int().min(0).default(0),
      incidentDetails: z.string().optional().default(''),
      notes: z.string().optional().default(''),
    })
    .optional()
    .default({ safetyGearCompliance: true, incidentsCount: 0 }),
  issuesAndDelays: z.string().optional().default(''),
  remarks: z.string().optional().default(''),
  photos: z.array(photoSchema).optional().default([]),
  documents: z.array(documentSchema).optional().default([]),
  status: z.enum(['Draft', 'Submitted']).optional().default('Submitted'),
});

export const updateDailyReportSchema = createDailyReportSchema.partial().extend({
  correctionSummary: z.string().optional(),
});

export const reviewDailyReportSchema = z.object({
  status: z.enum(['Reviewed', 'Needs Correction', 'Approved']),
  comments: z.string().optional().default(''),
  correctionRequested: z.boolean().optional().default(false),
  correctionDetails: z.string().optional().default(''),
});

export type CreateDailyReportInput = z.infer<typeof createDailyReportSchema>;
export type UpdateDailyReportInput = z.infer<typeof updateDailyReportSchema>;
export type ReviewDailyReportInput = z.infer<typeof reviewDailyReportSchema>;
