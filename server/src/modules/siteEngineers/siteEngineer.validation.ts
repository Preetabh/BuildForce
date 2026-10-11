import { z } from 'zod';

export const createSiteEngineerSchema = z.object({
  name: z.string().min(1, 'Engineer name is required').max(100),
  loginId: z.string().min(1, 'Login ID is required').max(100),
  mobile: z.string().optional(),
  expertise: z.string().optional(),
  projectsCount: z.number().int().nonnegative().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  assignedProjectIds: z.array(z.string()).optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  walletBalance: z.number().nonnegative().optional(),
});

export const updateSiteEngineerSchema = createSiteEngineerSchema.partial().extend({
  password: z.string().min(6).optional(),
  assignedProjectIds: z.array(z.string()).optional(),
});

export const updateWalletSchema = z.object({
  amount: z.number().nonnegative('Amount must be non-negative'),
  operation: z.enum(['add', 'deduct', 'set']),
  notes: z.string().max(500).optional(),
});

export type CreateSiteEngineerInput = z.infer<typeof createSiteEngineerSchema>;
export type UpdateSiteEngineerInput = z.infer<typeof updateSiteEngineerSchema>;
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>;
