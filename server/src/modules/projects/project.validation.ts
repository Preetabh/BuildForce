import { z } from 'zod';

export const createProjectSchema = z
  .object({
    name: z.string().min(2, 'Project name must be at least 2 characters').max(250),
    code: z
      .string()
      .min(2, 'Project code must be at least 2 characters')
      .max(50)
      .regex(/^[A-Za-z0-9\-_]+$/, 'Project code may only contain letters, numbers, hyphens, and underscores')
      .optional(),
    clientName: z.string().max(200).optional().default(''),
    location: z.string().max(250).optional().default(''),
    department: z.string().max(150).optional().default(''),
    preparedBy: z.string().max(150).optional().default(''),
    parentId: z.string().nullable().optional().default(null),
    measurementUnit: z.string().max(50).optional().default('Metres (m)'),
    buildupArea: z.number().min(0).optional().default(0),
    defaultQcLevel: z.string().max(100).optional().default('Standard — recommended site checks'),
    description: z.string().max(2000).optional().default(''),
    projectType: z.string().optional().default('Residential Building'),
    status: z.enum(['draft', 'active', 'on_hold', 'completed', 'archived']).optional().default('draft'),
    progress: z.number().min(0).max(100).optional().default(0),
    estimatedValue: z.number().min(0, 'Estimated value cannot be negative').optional().default(0),
    contractValue: z.number().min(0, 'Contract value cannot be negative').optional().default(0),
    currency: z.string().min(1).max(10).optional().default('INR'),
    startDate: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val) : null)),
    endDate: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val) : null)),
    phases: z.number().int().min(1).optional().default(1),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'Expected End Date must be after or equal to Start Date',
      path: ['endDate'],
    }
  );

export const updateProjectSchema = z
  .object({
    name: z.string().min(2, 'Project name must be at least 2 characters').max(250).optional(),
    code: z
      .string()
      .min(2, 'Project code must be at least 2 characters')
      .max(50)
      .regex(/^[A-Za-z0-9\-_]+$/, 'Project code may only contain letters, numbers, hyphens, and underscores')
      .optional(),
    clientName: z.string().max(200).optional(),
    location: z.string().max(250).optional(),
    department: z.string().max(150).optional(),
    measurementUnit: z.string().max(50).optional(),
    buildupArea: z.number().min(0).optional(),
    description: z.string().max(2000).optional(),
    projectType: z
      .enum(['Residential', 'Commercial', 'Infrastructure', 'Industrial', 'Institutional', 'Other'])
      .optional(),
    status: z.enum(['draft', 'active', 'on_hold', 'completed', 'archived']).optional(),
    progress: z.number().min(0).max(100).optional(),
    estimatedValue: z.number().min(0).optional(),
    contractValue: z.number().min(0).optional(),
    currency: z.string().min(1).max(10).optional(),
    startDate: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val) : null)),
    endDate: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val) : null)),
    phases: z.number().int().min(1).optional(),
    isArchived: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'Expected End Date must be after or equal to Start Date',
      path: ['endDate'],
    }
  );

export const projectQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['all', 'draft', 'active', 'on_hold', 'completed', 'archived']).optional().default('all'),
  projectType: z
    .enum(['all', 'Residential', 'Commercial', 'Infrastructure', 'Industrial', 'Institutional', 'Other'])
    .optional()
    .default('all'),
  isArchived: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  sort: z.string().optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(12),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectQueryInput = z.infer<typeof projectQuerySchema>;
