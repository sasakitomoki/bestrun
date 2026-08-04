-- Add optional weather columns to Run for future achievement logic.
ALTER TABLE "Run" ADD COLUMN "weatherTemp" DOUBLE PRECISION;
ALTER TABLE "Run" ADD COLUMN "weatherCode" INTEGER;
