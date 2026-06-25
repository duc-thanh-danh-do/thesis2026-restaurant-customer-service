interface TagSelectionFieldProps {
  legend: string;
  tags: string[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
}

export default function TagSelectionField({
  legend,
  tags,
  selectedTags,
  onToggle,
}: TagSelectionFieldProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <fieldset className="border border-slate-200 rounded-xl p-4 pt-2">
      <legend className="text-xs font-bold text-slate-500 px-2 tracking-wider uppercase">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2 mt-1">
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onToggle(tag)}
              className={`border px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isSelected
                  ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                  : "border-slate-200 text-slate-600 hover:border-slate-400"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
