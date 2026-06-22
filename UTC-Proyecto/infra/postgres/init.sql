-- Fase 0: solo extensiones. El esquema (tablas con PK/FK) se crea por
-- migraciones TypeORM en Fase 1 (rules §11), no aquí, para no duplicar fuente de verdad.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
