export default function AllergenBadgeList({ allergens }: { allergens: string[] }) {
  return <div className="flex gap-2 text-xs">{allergens.join(", ")}</div>;
}
