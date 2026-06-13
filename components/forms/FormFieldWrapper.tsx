export default function FormFieldWrapper({ children }: { children: React.ReactNode }) {
  return <label className="grid gap-1 text-sm">{children}</label>;
}
