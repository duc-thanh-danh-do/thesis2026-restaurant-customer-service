-- DropIndex
DROP INDEX "ai_response_logs_handover_rule_id_idx";

-- CreateTable
CREATE TABLE "ingredient_catalog" (
    "id" SERIAL NOT NULL,
    "restaurant_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "ingredient_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dietary_catalog" (
    "id" SERIAL NOT NULL,
    "restaurant_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "dietary_catalog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ingredient_catalog" ADD CONSTRAINT "ingredient_catalog_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dietary_catalog" ADD CONSTRAINT "dietary_catalog_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
