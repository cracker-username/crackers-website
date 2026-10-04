import { EnquiryStatus, Role } from "@prisma/client";

export const ALLOWED_TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]> = {
  NEW: ["CONTACTED", "QUOTE_SENT", "CANCELLED"],
  CONTACTED: ["QUOTE_SENT", "CONFIRMED", "CANCELLED"],
  QUOTE_SENT: ["AWAITING_CUSTOMER", "CONFIRMED", "CANCELLED"],
  AWAITING_CUSTOMER: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["READY", "CANCELLED"],
  READY: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [], // Completed cannot transition to anything unless reopened by SUPER_ADMIN
  CANCELLED: [], // Cancelled cannot transition to anything unless reopened by SUPER_ADMIN
};

/**
 * Validate whether a status transition is permitted given current status, target status,
 * user role, and whether a reopening reason was supplied.
 */
export function isStatusTransitionAllowed({
  from,
  to,
  role,
  reopenReason,
}: {
  from: EnquiryStatus;
  to: EnquiryStatus;
  role: Role;
  reopenReason?: string;
}): { allowed: boolean; reason?: string } {
  if (from === to) {
    return { allowed: false, reason: "Status is already set to " + to };
  }

  // Reopening from COMPLETED or CANCELLED
  if (from === "COMPLETED" || from === "CANCELLED") {
    if (role !== "SUPER_ADMIN") {
      return {
        allowed: false,
        reason: "Only SUPER_ADMIN can reopen a completed or cancelled enquiry",
      };
    }
    if (!reopenReason || reopenReason.trim().length < 5) {
      return {
        allowed: false,
        reason: "A mandatory justification of at least 5 characters is required to reopen an enquiry",
      };
    }
    return { allowed: true };
  }

  // Normal transitions
  const allowedNext = ALLOWED_TRANSITIONS[from] || [];
  if (allowedNext.includes(to)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Invalid status transition from ${from} to ${to}`,
  };
}
