import { requireAdminUser } from "@/lib/auth";

export default async function AllergensLayout({ children }: { children: React.ReactNode }) {
  await requireAdminUser();

  return children;
}
