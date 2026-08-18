-- Add email column to User (nullable for existing rows)
ALTER TABLE "User" ADD COLUMN "email" TEXT;
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
