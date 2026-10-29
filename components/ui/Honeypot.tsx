import { HONEYPOT_FIELD } from "@/lib/honeypot";

/** Off-screen field that only bots fill in (see lib/honeypot.ts). Hidden from screen readers and the tab order. */
export function Honeypot() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
      <label>
        Leave this empty
        <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}
