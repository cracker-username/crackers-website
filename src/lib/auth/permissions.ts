import { Role } from "@prisma/client";

export type Permission =
  | "ENQUIRIES_VIEW"
  | "ENQUIRIES_EDIT"
  | "ENQUIRIES_STATUS"
  | "PRODUCTS_VIEW"
  | "PRODUCTS_EDIT_BASIC"
  | "PRODUCTS_CRUD"
  | "PRODUCTS_BULK_PRICE"
  | "PRODUCTS_CSV_IMPORT"
  | "CATEGORIES_MANAGE"
  | "COMBOS_MANAGE"
  | "CONTENT_MANAGE"
  | "SETTINGS_MANAGE"
  | "USERS_MANAGE"
  | "DELIVERY_RULES_MANAGE"
  | "AUDIT_LOG_VIEW"
  | "NOTIFICATIONS_VIEW"
  | "NOTIFICATIONS_RETRY";

/**
 * Strict role-permission mapping.
 * SUPER_ADMIN has full permissions.
 * STAFF has limited operations (cannot touch settings, users, bulk price, CSV import, delivery rules, or audit log).
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "ENQUIRIES_VIEW",
    "ENQUIRIES_EDIT",
    "ENQUIRIES_STATUS",
    "PRODUCTS_VIEW",
    "PRODUCTS_EDIT_BASIC",
    "PRODUCTS_CRUD",
    "PRODUCTS_BULK_PRICE",
    "PRODUCTS_CSV_IMPORT",
    "CATEGORIES_MANAGE",
    "COMBOS_MANAGE",
    "CONTENT_MANAGE",
    "SETTINGS_MANAGE",
    "USERS_MANAGE",
    "DELIVERY_RULES_MANAGE",
    "AUDIT_LOG_VIEW",
    "NOTIFICATIONS_VIEW",
    "NOTIFICATIONS_RETRY",
  ],
  STAFF: [
    "ENQUIRIES_VIEW",
    "ENQUIRIES_EDIT",
    "ENQUIRIES_STATUS",
    "PRODUCTS_VIEW",
    "PRODUCTS_EDIT_BASIC",
    "NOTIFICATIONS_VIEW",
  ],
};

/**
 * Check whether a role has the required permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
