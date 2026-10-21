/**
 * Staff roles and what each may do. Pure data, safe to import anywhere.
 * Every admin API route checks a permission from this table on the server;
 * the UI uses the same table only to hide controls a role cannot use.
 *
 * Roles are Cognito groups in the separate STAFF user pool. Customer
 * accounts live in another pool and never carry a role, so a customer token
 * can never resolve to one.
 */

export type Role = "owner" | "staff" | "viewer";

export const ROLE_GROUPS: Record<Role, string> = {
  owner: "owner",
  staff: "staff",
  viewer: "viewer",
};

export const PERMISSIONS = {
  "dashboard:read": ["owner", "staff", "viewer"],
  "orders:read": ["owner", "staff", "viewer"],
  "orders:fulfill": ["owner", "staff"],
  "orders:refund": ["owner"],
  "orders:export": ["owner"],
  "preorder:manage": ["owner"],
  "products:write": ["owner"],
  "inventory:write": ["owner", "staff"],
  "customers:read": ["owner", "staff", "viewer"],
  /** Full name, email, phone and address. Viewers see masked values. */
  "customers:pii": ["owner", "staff"],
  "customers:export": ["owner"],
  "customers:delete": ["owner"],
  "privacy:manage": ["owner"],
  "discounts:write": ["owner"],
  "subscriptions:manage": ["owner", "staff"],
  "reviews:moderate": ["owner", "staff"],
  "banner:write": ["owner", "staff"],
  "staff:manage": ["owner"],
  "audit:read": ["owner"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function roleFromGroups(groups: readonly string[] | undefined): Role | null {
  if (!groups?.length) return null;
  if (groups.includes(ROLE_GROUPS.owner)) return "owner";
  if (groups.includes(ROLE_GROUPS.staff)) return "staff";
  if (groups.includes(ROLE_GROUPS.viewer)) return "viewer";
  return null;
}

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  staff: "Staff",
  viewer: "View only",
};
