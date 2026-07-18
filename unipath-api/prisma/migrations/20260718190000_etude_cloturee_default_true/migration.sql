-- Default: nouveaux concours verrouillés jusqu'à ouverture explicite DEC
ALTER TABLE "Concours" ALTER COLUMN "etudeCloturee" SET DEFAULT true;
