// app/browse/page.tsx
import ListingsSplitClient from "@/components/ListingsSplitClient";

export const dynamic = "force-dynamic";

export default function BrowsePage() {
  // For now, render the split view with empty data; we’ll wire data next.
  return (
    <main className="p-4">
      <ListingsSplitClient points={[]} listings={[]} />
    </main>
  );
}
