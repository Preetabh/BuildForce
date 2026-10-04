import { z } from 'zod';

export const createMenuSchema = z.object({
  title: z.string().min(1, 'Menu title is required').max(100),
  route: z.string().min(1, 'Route is required').max(200),
  icon: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  isVisible: z.boolean().optional(),
  description: z.string().max(500).optional(),
});

export const updateMenuSchema = createMenuSchema.partial();

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100),
  description: z.string().max(500).optional(),
  isSystem: z.boolean().optional(),
  permissions: z
    .array(
      z.object({
        menuRoute: z.string().min(1),
        menuTitle: z.string().min(1),
        isAllowed: z.boolean(),
        canCreate: z.boolean().optional(),
        canRead: z.boolean().optional(),
        canUpdate: z.boolean().optional(),
        canDelete: z.boolean().optional(),
      })
    )
    .optional(),
});

export const updateRoleSchema = createRoleSchema.partial();

export const updateRolePermissionSchema = z.object({
  menuRoute: z.string().min(1, 'Menu route is required'),
  isAllowed: z.boolean({ required_error: 'isAllowed boolean is required' }),
});

export const batchUpdateRolePermissionsSchema = z.object({
  permissions: z.record(z.string(), z.boolean()).optional(),
  allowAll: z.boolean().optional(),
});

export const updateUserRoleAndPermissionsSchema = z.object({
  role: z.string().optional(),
  permissionOverrides: z.record(z.string(), z.boolean()).optional(),
  isActive: z.boolean().optional(),
});

export type CreateMenuInput = z.infer<typeof createMenuSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateRolePermissionInput = z.infer<typeof updateRolePermissionSchema>;
export type BatchUpdateRolePermissionsInput = z.infer<typeof batchUpdateRolePermissionsSchema>;
export type UpdateUserRoleAndPermissionsInput = z.infer<typeof updateUserRoleAndPermissionsSchema>;
