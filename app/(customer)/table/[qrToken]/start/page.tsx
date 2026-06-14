import StartSession from "@/components/customer/StartSession";

export default async function StartSessionPage({
  params,
}: {
  params: Promise<{ qrToken: string }>;
}) {
  const { qrToken } = await params;
  return <StartSession qrToken={qrToken} />;
}
