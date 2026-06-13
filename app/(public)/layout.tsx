import PublicNavbar from "@/components/navigation/PublicNavbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <PublicNavbar />
      {children}
    </div>
  );
}
