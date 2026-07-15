-- CreateTable
CREATE TABLE "knowledge_documents" (
    "id" SERIAL NOT NULL,
    "restaurant_id" INTEGER NOT NULL,
    "uploaded_by_staff_id" INTEGER,
    "original_filename" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(255) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_document_chunks" (
    "id" SERIAL NOT NULL,
    "document_id" INTEGER NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3),

    CONSTRAINT "knowledge_document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "knowledge_documents_restaurant_id_status_idx"
ON "knowledge_documents"("restaurant_id", "status");

-- CreateIndex
CREATE INDEX "knowledge_documents_uploaded_by_staff_id_idx"
ON "knowledge_documents"("uploaded_by_staff_id");

-- CreateIndex
CREATE INDEX "knowledge_document_chunks_document_id_idx"
ON "knowledge_document_chunks"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_document_chunks_document_id_chunk_index_key"
ON "knowledge_document_chunks"("document_id", "chunk_index");

-- AddForeignKey
ALTER TABLE "knowledge_documents"
ADD CONSTRAINT "knowledge_documents_restaurant_id_fkey"
FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_documents"
ADD CONSTRAINT "knowledge_documents_uploaded_by_staff_id_fkey"
FOREIGN KEY ("uploaded_by_staff_id") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_document_chunks"
ADD CONSTRAINT "knowledge_document_chunks_document_id_fkey"
FOREIGN KEY ("document_id") REFERENCES "knowledge_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
