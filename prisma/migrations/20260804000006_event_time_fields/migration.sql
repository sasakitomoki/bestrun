-- Replace timeLabel with startTime / endTime on the Event table.
ALTER TABLE "Event" RENAME COLUMN "timeLabel" TO "startTime";
ALTER TABLE "Event" ADD COLUMN "endTime" TEXT;
