import { requireAdminUser } from "@/lib/auth";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireAdminUser();

  return children;
}
