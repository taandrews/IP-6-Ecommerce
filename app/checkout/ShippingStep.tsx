"use client";

import { useMemo, useState } from "react";
import { Input, Select } from "@/components/ui/Input";
import type { Address } from "@/types";
import { ADDRESS_BLOCK_MESSAGES, addressBlock, countryOptions, isSellableCountry, type AddressBlock } from "@/lib/countries";
import { WaitlistForm } from "@/components/store/WaitlistForm";


export function ShippingStep({
  email,
  onEmail,
  address,
  onContinue,
}: {
  email: string;
  onEmail: (v: string) => void;
  address: Address | null;
  onContinue: (a: Address) => void;
}) {
  const [form, setForm] = useState<Address>(
    address ?? {
      name: "",
      line1: "",
      line2: "",
      city: "",
      region: "",
      postalCode: "",
      country: "US",
      phone: "",
    },
  );

  const options = useMemo(() => countryOptions(), []);
  // Set when the address is outside the countries we sell to: checkout stops here and offers the waitlist.
  const [blocked, setBlocked] = useState<AddressBlock | null>(null);
  const countryBlocked = !isSellableCountry(form.country);

  function set<K extends keyof Address>(k: K, v: Address[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setBlocked(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const block = addressBlock(form);
    if (block) {
      setBlocked(block);
      return;
    }
    onContinue(form);
  }

  return (
    <>
    <form onSubmit={submit} className="card p-6 lg:p-8 space-y-5">
      <h2 className="font-display text-xl text-forest-800">Contact</h2>
      <Input
        id="c-email"
        type="email"
        label="Email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => onEmail(e.target.value)}
      />
      <h2 className="font-display text-xl text-forest-800 pt-4">Shipping address</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          id="c-name"
          label="Full name"
          required
          autoComplete="name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
        <Input
          id="c-phone"
          label="Phone"
          autoComplete="tel"
          value={form.phone ?? ""}
          onChange={(e) => set("phone", e.target.value)}
        />
      </div>
      <Input
        id="c-line1"
        label="Address"
        required
        autoComplete="address-line1"
        value={form.line1}
        onChange={(e) => set("line1", e.target.value)}
      />
      <Input
        id="c-line2"
        label="Apartment, suite, etc."
        autoComplete="address-line2"
        value={form.line2 ?? ""}
        onChange={(e) => set("line2", e.target.value)}
      />
      <div className="grid sm:grid-cols-3 gap-4">
        <Input
          id="c-city"
          label="City"
          required
          autoComplete="address-level2"
          value={form.city}
          onChange={(e) => set("city", e.target.value)}
        />
        <Input
          id="c-region"
          label="State / region"
          required
          autoComplete="address-level1"
          value={form.region}
          onChange={(e) => set("region", e.target.value)}
        />
        <Input
          id="c-postal"
          label="Postal code"
          required
          autoComplete="postal-code"
          value={form.postalCode}
          onChange={(e) => set("postalCode", e.target.value)}
        />
      </div>
      <Select
        id="c-country"
        label="Country"
        required
        value={form.country}
        onChange={(e) => set("country", e.target.value)}
      >
        {options.map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </Select>

      {blocked && blocked !== "country" ? (
        <p className="text-sm text-danger" role="alert">
          {ADDRESS_BLOCK_MESSAGES[blocked]}
        </p>
      ) : null}
      {countryBlocked || blocked ? null : (
        <div className="pt-2 flex justify-end">
          <button type="submit" className="btn-primary">Continue to shipping method</button>
        </div>
      )}
    </form>
    {countryBlocked || blocked ? (
      <WaitlistForm
        key={form.country}
        source="checkout"
        defaultEmail={email}
        defaultCountry={countryBlocked ? form.country : undefined}
        className="mt-4"
      />
    ) : null}
    </>
  );
}
