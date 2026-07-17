import { requireAdminUser } from "@/lib/auth";

export default async function KnowledgeBaseLayout({ children }: { children: React.ReactNode }) {
  await requireAdminUser();

  return children;
}
