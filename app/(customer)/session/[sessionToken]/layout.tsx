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
    <div className="flex h-dvh min-h-dvh w-full flex-col overflow-hidden bg-[#f6f7f2]">
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      <CustomerBottomBar sessionToken={sessionToken} />
    </div>
  );
}
