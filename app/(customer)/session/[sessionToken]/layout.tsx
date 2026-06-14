import CustomerBottomBar from "@/components/navigation/CustomerBottomBar";

export default async function SessionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ sessionToken: string }>;
}) {
  const { sessionToken } = await params;

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#f6f7f2]">
      <div className="flex-1">{children}</div>
      <CustomerBottomBar sessionToken={sessionToken} />
    </div>
  );
}
