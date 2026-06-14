import CustomerChat from "@/components/customer/CustomerChat";

export default async function CustomerSessionPage({
  params,
}: {
  params: Promise<{ sessionToken: string }>;
}) {
  const { sessionToken } = await params;
  return <CustomerChat sessionToken={sessionToken} />;
}
