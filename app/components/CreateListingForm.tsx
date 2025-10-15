"use client";

import * as React from "react";

type FormState = {
  address: string;
  city: string;
  state: string;
  zip: string;
  beds: number | "";
  baths: number | "";
  sqft: number | "";
  price: number | "";
};

export default function CreateListingForm({ ownerId }: { ownerId?: string }) {
  const [form, setForm] = React.useState<FormState>({
    address: "",
    city: "",
    state: "",
    zip: "",
    beds: "",
    baths: "",
    sqft: "",
    price: "",
  });

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = { ...form, owner_id: ownerId ?? null };

    // Submit to your API here if desired:
    // await fetch("/api/listings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });

    console.log("Create listing:", payload);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input name="address" value={form.address} onChange={onChange} className="border rounded p-2" placeholder="Address" />
        <input name="city" value={form.city} onChange={onChange} className="border rounded p-2" placeholder="City" />
        <input name="state" value={form.state} onChange={onChange} className="border rounded p-2" placeholder="State" />
        <input name="zip" value={form.zip} onChange={onChange} className="border rounded p-2" placeholder="ZIP" />

        <input name="beds" type="number" value={form.beds} onChange={onChange} className="border rounded p-2" placeholder="Beds" />
        <input name="baths" type="number" value={form.baths} onChange={onChange} className="border rounded p-2" placeholder="Baths" />
        <input name="sqft" type="number" value={form.sqft} onChange={onChange} className="border rounded p-2" placeholder="Sq Ft" />
        <input name="price" type="number" value={form.price} onChange={onChange} className="border rounded p-2" placeholder="Price" />
      </div>

      <button type="submit" className="rounded-lg border px-3 py-2">
        Save listing
      </button>
    </form>
  );
}
