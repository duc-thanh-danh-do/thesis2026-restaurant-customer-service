export default function MenuCategoryTabs({ categories }: { categories: string[] }) {
  return <div className="flex gap-2 text-sm">{categories.join(" / ")}</div>;
}
