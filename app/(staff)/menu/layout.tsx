import { requireAdminUser } from "@/lib/auth";

export default async function MenuLayout({ children }: { children: React.ReactNode }) {
  await requireAdminUser();

  return children;
}
