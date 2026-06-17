export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-[#f6f7f2]">{children}</div>;
}
