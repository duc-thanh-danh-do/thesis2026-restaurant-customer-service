export default function SubmitButton({ label }: { label: string }) {
  return <button className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white" type="submit">{label}</button>;
}
