"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest } from "@/components/admin/client";
import { Panel } from "@/components/admin/ui";
import type { Role } from "@/lib/auth/roles";

export function InviteStaff() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Panel title="Invite a team member">
      <form
        className="grid gap-3 sm:grid-cols-4 text-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMsg(null);
          try {
            await adminRequest("/api/admin/staff", "POST", { email, name, role });
            setMsg({ ok: true, text: `Invite sent to ${email}. They'll get a temporary password by email, valid for 24 hours.` });
            setEmail("");
            setName("");
            router.refresh();
          } catch (err) {
            setMsg({ ok: false, text: (err as Error).message });
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block"><span className="label">Name</span><input className="input" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="block"><span className="label">Work email</span><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="block">
          <span className="label">Role</span>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="viewer">View only</option>
            <option value="staff">Staff</option>
            <option value="owner">Owner</option>
          </select>
        </label>
        <div className="flex items-end"><button className="btn-primary text-sm" disabled={busy}>Send invite</button></div>
        {msg ? <p role="status" className={`sm:col-span-4 ${msg.ok ? "text-emerald-700" : "text-danger"}`}>{msg.text}</p> : null}
      </form>
    </Panel>
  );
}

/** Inline name editor; the email is the sign-in identity and isn't editable. */
export function StaffName({ username, name }: { username: string; name?: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!editing) {
    return (
      <span className="inline-flex items-center gap-2">
        {name || <span className="text-ink/50">No name</span>}
        <button className="btn-ghost text-xs" onClick={() => setEditing(true)} aria-label={`Edit name for ${name ?? username}`}>Edit</button>
      </span>
    );
  }
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await adminRequest(`/api/admin/staff/${encodeURIComponent(username)}`, "PATCH", { action: "name", name: value });
          setEditing(false);
          router.refresh();
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <input className="input py-1 text-sm w-40" required maxLength={80} value={value} onChange={(e) => setValue(e.target.value)} aria-label="Name" autoFocus />
      <button className="btn-primary text-xs px-3 py-1" disabled={busy}>Save</button>
      <button type="button" className="btn-ghost text-xs" onClick={() => { setEditing(false); setValue(name ?? ""); }}>Cancel</button>
      {error ? <span className="w-full text-xs text-danger">{error}</span> : null}
    </form>
  );
}

export function StaffRowActions({ username, role, enabled, pending }: { username: string; role: Role | null; enabled: boolean; pending: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = `/api/admin/staff/${encodeURIComponent(username)}`;
  async function act(method: string, body?: unknown, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setError(null);
    try {
      await adminRequest(url, method, body);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap justify-end items-center gap-2">
      <select
        className="input py-1 text-xs w-auto"
        aria-label="Role"
        value={role ?? ""}
        disabled={busy}
        onChange={(e) => act("PATCH", { action: "role", role: e.target.value }, "Change this person's role? They'll be signed out everywhere.")}
      >
        {!role ? <option value="">No role</option> : null}
        <option value="viewer">View only</option>
        <option value="staff">Staff</option>
        <option value="owner">Owner</option>
      </select>
      {pending && enabled ? (
        <button className="btn-ghost text-xs" disabled={busy} onClick={() => act("PATCH", { action: "resend" }, "Email a new invite? The earlier temporary password stops working.")}>Resend invite</button>
      ) : null}
      {enabled ? (
        <button className="btn-ghost text-xs" disabled={busy} onClick={() => act("PATCH", { action: "disable" }, "Disable this login? They're signed out everywhere immediately.")}>Disable</button>
      ) : (
        <button className="btn-ghost text-xs" disabled={busy} onClick={() => act("PATCH", { action: "enable" })}>Enable</button>
      )}
      <button className="btn-ghost text-xs text-danger" disabled={busy} onClick={() => act("DELETE", undefined, "Delete this staff login permanently?")}>Delete</button>
      {error ? <span className="w-full text-right text-xs text-danger">{error}</span> : null}
    </div>
  );
}
