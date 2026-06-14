export default function AllergenNotice({ allergens }: { allergens: string[] }) {
  if (allergens.length === 0) return null;

  return (
    <p className="mt-3 text-xs leading-5 text-amber-800">
      Contains or may contain: {allergens.join(", ")}.
    </p>
  );
}
