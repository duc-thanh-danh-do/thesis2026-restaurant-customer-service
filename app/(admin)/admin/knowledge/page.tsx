import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import KnowledgeDocumentPanel from "@/components/knowledge-base/KnowledgeDocumentPanel";

export default function KnowledgePage() {
  return (
    <>
      <AdminPageHeader eyebrow="Knowledge" title="Knowledge documents" description="Upload, validate, approve, publish, deactivate, and replace the trusted documents used by the assistant." />
      <KnowledgeDocumentPanel />
    </>
  );
}
