import ListingCard from "./ListingCard";

export type ListItem = {
  id: string;
} & Record<string, unknown>;

export default function ListingList({ items }: { items: ListItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((l) => (
        <ListingCard key={String(l.id)} listing={l} />
      ))}
    </div>
  );
}
