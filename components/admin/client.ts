"use client";

/** Human messages for the error codes the admin API returns. */
const MESSAGES: Record<string, string> = {
  unauthenticated: "Your session ended. Please sign in again.",
  forbidden: "Your role doesn't allow this.",
  invalid_request: "Some fields are missing or not valid.",
  not_found: "That item no longer exists.",
  wrong_status: "This order's status changed. Reload and try again.",
  bad_amount: "That refund amount isn't valid.",
  code_exists: "A code with that name already exists.",
  in_use: "This code has been used, so it can only be expired.",
  already_cancelled: "Already cancelled.",
  already_staff: "That email already has a staff login.",
  cannot_change_self: "You can't change your own access.",
  last_owner_demote: "There must always be at least one active owner.",
  last_owner_disable: "There must always be at least one active owner.",
  last_owner_delete: "There must always be at least one active owner.",
  link_expired: "This page has expired. Reload it and try again.",
  confirmation_mismatch: "The email you typed doesn't match this customer.",
  request_mismatch: "That privacy request doesn't match this customer.",
  not_open: "This request is already closed.",
  wrong_type: "That action doesn't fit this request type.",
  bad_range: "Choose a valid date range of up to a year.",
  bad_origin: "Request blocked. Reload the page and try again.",
  rate_limited: "Too many requests. Wait a minute and try again.",
  server_error: "Something went wrong. Please try again.",
};

export async function adminRequest<T = Record<string, unknown>>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) {
    if (res.status === 401) window.location.assign("/admin/login");
    throw new Error(MESSAGES[data.error ?? ""] ?? MESSAGES.server_error);
  }
  return data;
}

/** Downloads a file returned by a POST (so the request body, not the URL, carries the token). */
export async function adminDownload(url: string, body: unknown, fallbackName: string) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(MESSAGES[data.error ?? ""] ?? MESSAGES.server_error);
  }
  const blob = await res.blob();
  const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? fallbackName;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
