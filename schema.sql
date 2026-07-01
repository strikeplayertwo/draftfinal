


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."benoni_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "base_line" "text" DEFAULT '''1. d4 Nf6 2. c4 c5 3. d5''::text'::"text",
    "main_line" "text" DEFAULT '''1. d4 Nf6 2. c4 c5 3. d5''::text'::"text"
);


ALTER TABLE "public"."benoni_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."caro_kann_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "base_line" "text" DEFAULT '''1. e4 c6''::text'::"text",
    "main_line" "text" DEFAULT '''1. e4 c6 2. d4 d5''::text'::"text"
);


ALTER TABLE "public"."caro_kann_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalan_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "base_line" "text" DEFAULT '''1. d4 Nf6 2. c4 e6 3. g3''::text'::"text",
    "main_line" "text" DEFAULT '''1. d4 Nf6 2. c4 e6 3. g3 d5 4. cxd5 exd5 5. Nf3''::text'::"text",
    "closed_main_line" "text" DEFAULT '1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 Be7 5. Nf3 O-O 6. O-O dxc4'::"text"
);


ALTER TABLE "public"."catalan_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."classic_game_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "gen_random_uuid"(),
    "accuracy" double precision,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "result" "text",
    "opening" "text"
);


ALTER TABLE "public"."classic_game_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_game_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "gen_random_uuid"(),
    "accuracy" double precision,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "daily_id" "text",
    "daily_score" real
);


ALTER TABLE "public"."daily_game_results" OWNER TO "postgres";


COMMENT ON TABLE "public"."daily_game_results" IS 'This is a duplicate of game_results';



CREATE TABLE IF NOT EXISTS "public"."english_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "base_line" "text" DEFAULT '''1. c4''::text'::"text",
    "main_line" "text" DEFAULT '''1. c4''::text'::"text",
    "agincourt" "text" DEFAULT '1. c4 e6 2. Nf3 d5 3. g3'::"text",
    "neo_catalan" "text" DEFAULT '1. c4 e6 2. Nf3 d5 3. g3 Nf6 4. Bg2 Be7 5. O-O'::"text"
);


ALTER TABLE "public"."english_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."french_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "base_line" "text" DEFAULT '''1. e4 e6 2. d4 d5''::text'::"text",
    "main_line" "text" DEFAULT '''1. e4 e6 2. d4 d5''::text'::"text"
);


ALTER TABLE "public"."french_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gruenfeld_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "base_line" "text" DEFAULT '''1. d4 Nf6 2. c4 g6 3. Nc3 d5''::text'::"text",
    "main_line" "text" DEFAULT '''1. d4 Nf6 2. c4 g6 3. Nc3 d5''::text'::"text"
);


ALTER TABLE "public"."gruenfeld_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."italian_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "base_line" "text" DEFAULT '''1. e4 e5 2. Nf3 Nc6 3. Bc4''::text'::"text",
    "main_line" "text" DEFAULT '''1. e4 e5 2. Nf3 Nc6 3. Bc4''::text'::"text"
);


ALTER TABLE "public"."italian_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kings_indian_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "base_line" "text" DEFAULT '''1. d4 Nf6 2. c4 g6''::text'::"text",
    "main_line" "text" DEFAULT '''1. d4 Nf6 2. c4 g6''::text'::"text"
);


ALTER TABLE "public"."kings_indian_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."opening_lines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "opening" "text" NOT NULL,
    "line_key" "text" NOT NULL,
    "moves" "text" NOT NULL,
    "source_line_key" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."opening_lines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."petrovs_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "base_line" "text" DEFAULT '''''''1. e4 e5 2. Nf3 Nf6''''::text''::text'::"text",
    "main_line" "text" DEFAULT '''''''1. e4 e5 2. Nf3 Nf6''''::text''::text'::"text",
    "modern" "text" DEFAULT '1. e4 e5 2. Nf3 Nf6 3. d4 exd4 4. e5 Ne4'::"text",
    "paulsen_attack" "text" DEFAULT '1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nc4'::"text",
    "classical_karklins_martinovsky" "text" DEFAULT '1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nd3'::"text",
    "kaufmann_attack" "text" DEFAULT '1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. c4'::"text"
);


ALTER TABLE "public"."petrovs_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."queens_bishop_game_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "base_line" "text" DEFAULT '''1. d4 d5 2. Nf3 Nf6 3. Bf4 c5 4. e3''::text'::"text",
    "main_line" "text" DEFAULT '''1. d4 d5 2. Nf3 Nf6 3. Bf4 c5 4. e3''::text'::"text"
);


ALTER TABLE "public"."queens_bishop_game_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."queens_gambit_declined_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "base_line" "text" DEFAULT '''1. d4 d5 2. c4''::text'::"text",
    "main_line" "text" DEFAULT '''1. d4 d5 2. c4 e6''::text'::"text",
    "charousek" "text" DEFAULT '1. d4 d5 2. c4 e6 3. Nc3 Be7'::"text",
    "three_knights" "text" DEFAULT '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3'::"text",
    "ragozin_defense" "text" DEFAULT '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 Bb4'::"text",
    "barmen" "text" DEFAULT '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 Nbd7'::"text",
    "modern" "text" DEFAULT '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5'::"text",
    "semi_tarrasch" "text" DEFAULT '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 c5'::"text",
    "semi_slav" "text" DEFAULT '1. d4 d5 2. c4 e6 3. Nf3 Nf6 4. e3 c6 5. Nbd2'::"text",
    "harrwitz_attack" "text" DEFAULT '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bf4'::"text"
);


ALTER TABLE "public"."queens_gambit_declined_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."queens_indian_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "base_line" "text" DEFAULT '''1. d4 Nf6 2. c4 e6 3. Nf3 b6''::text'::"text",
    "main_line" "text" DEFAULT '''1. d4 Nf6 2. c4 e6 3. Nf3 b6''::text'::"text"
);


ALTER TABLE "public"."queens_indian_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."queens_pawn_game_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "base_line" "text" DEFAULT '''1. d4 d5''::text'::"text",
    "main_line" "text" DEFAULT '''1. d4 d5''::text'::"text"
);


ALTER TABLE "public"."queens_pawn_game_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reti_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "base_line" "text" DEFAULT '''1. Nf3''::text'::"text",
    "main_line" "text" DEFAULT '''1. Nf3''::text'::"text"
);


ALTER TABLE "public"."reti_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sicilian_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "base_line" "text" DEFAULT '''1. e4 c5''::text'::"text",
    "main_line" "text" DEFAULT '''1. e4 c5''::text'::"text",
    "Najdorf" "text" DEFAULT '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6'::"text",
    "Najdorf_English_Attack" "text" DEFAULT '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3'::"text",
    "Najdorf_Main_Line" "text" DEFAULT '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6'::"text",
    "Najdorf_Classical" "text" DEFAULT '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2'::"text",
    "Dragon" "text" DEFAULT '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6'::"text",
    "Dragon_Yugoslav_Attack" "text" DEFAULT '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3'::"text",
    "Dragon_Classical" "text" DEFAULT '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be2'::"text",
    "Dragon_Fianchetto" "text" DEFAULT '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. g3'::"text",
    "Dragon_Levenfish" "text" DEFAULT '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. f4'::"text",
    "sveshnikov" "text" DEFAULT '1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5'::"text",
    "Sveshnikov_Main_Line" "text" DEFAULT '1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5 6. Ndb5 d6 7. Bg5 a6 8. Na3 b5'::"text",
    "scheveningen" "text" DEFAULT '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e6'::"text",
    "Scheveningen_Keres_Attack" "text" DEFAULT '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e6 6. g4'::"text",
    "Scheveningen_English_Attack" "text" DEFAULT '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e6 6. Be3'::"text",
    "Accelerated_Dragon" "text" DEFAULT '1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6'::"text",
    "alapin" "text" DEFAULT '1. e4 c5 2. c3'::"text",
    "Alapin_Barmen_Defense" "text" DEFAULT '1. e4 c5 2. c3 d5 3. exd5 Qxd5 4. d4'::"text",
    "Alapin_Main_Line" "text" DEFAULT '1. e4 c5 2. c3 Nf6'::"text",
    "Alapin_Nc6" "text" DEFAULT '1. e4 c5 2. c3 Nc6 3. d4 cxd4 4. cxd4 d5'::"text",
    "Rossolimo_Attack" "text" DEFAULT '1. e4 c5 2. Nf3 Nc6 3. Bb5'::"text",
    "Rossolimo_Attack_g6" "text" DEFAULT '1. e4 c5 2. Nf3 Nc6 3. Bb5 g6'::"text",
    "Rossolimo_Attack_e6" "text" DEFAULT '1. e4 c5 2. Nf3 Nc6 3. Bb5 e6'::"text",
    "Rossolimo_Attack_d6" "text" DEFAULT '1. e4 c5 2. Nf3 Nc6 3. Bb5 d6'::"text",
    "Rossolimo_Attack_Nf6" "text" DEFAULT '1. e4 c5 2. Nf3 Nc6 3. Bb5 Nf6'::"text",
    "closed" "text" DEFAULT '1. e4 c5 2. Nc3'::"text",
    "Closed_e6" "text" DEFAULT '1. e4 c5 2. Nc3 e6'::"text",
    "Closed_a6" "text" DEFAULT '1. e4 c5 2. Nc3 a6'::"text",
    "Grand_Prix" "text" DEFAULT '1. e4 c5 2. Nc3 Nc6 3. f4'::"text",
    "Grand_Prix_Accelerated" "text" DEFAULT '1. e4 c5 2. f4 d5'::"text"
);


ALTER TABLE "public"."sicilian_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."spanish_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "base_line" "text" DEFAULT '''1. e4 e5 2. Nf3 Nc6 3. Bb5''::text'::"text",
    "main_line" "text" DEFAULT '''1. e4 e5 2. Nf3 Nc6 3. Bb5''::text'::"text",
    "closed" "text" DEFAULT '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7'::"text",
    "berlin" "text" DEFAULT '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6'::"text",
    "exchange" "text" DEFAULT '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6'::"text",
    "open" "text" DEFAULT '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4'::"text",
    "marshall" "text" DEFAULT '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5'::"text"
);


ALTER TABLE "public"."spanish_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "level" integer DEFAULT 1,
    "unlocked_openings" "text"[] DEFAULT ARRAY['None'::"text"],
    "beaten_openings" "text"[] DEFAULT ARRAY[]::"text"[],
    "userMinPly" integer DEFAULT 4
);


ALTER TABLE "public"."user_progress" OWNER TO "postgres";


ALTER TABLE ONLY "public"."benoni_progress"
    ADD CONSTRAINT "benoni_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."benoni_progress"
    ADD CONSTRAINT "benoni_progress_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."caro_kann_progress"
    ADD CONSTRAINT "caro_kann_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."caro_kann_progress"
    ADD CONSTRAINT "caro_kann_progress_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."catalan_progress"
    ADD CONSTRAINT "catalan_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalan_progress"
    ADD CONSTRAINT "catalan_progress_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."daily_game_results"
    ADD CONSTRAINT "daily_game_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."english_progress"
    ADD CONSTRAINT "english_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."english_progress"
    ADD CONSTRAINT "english_progress_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."french_progress"
    ADD CONSTRAINT "french_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."french_progress"
    ADD CONSTRAINT "french_progress_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."classic_game_results"
    ADD CONSTRAINT "game_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gruenfeld_progress"
    ADD CONSTRAINT "gruenfeld_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gruenfeld_progress"
    ADD CONSTRAINT "gruenfeld_progress_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."italian_progress"
    ADD CONSTRAINT "italian_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."italian_progress"
    ADD CONSTRAINT "italian_progress_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."kings_indian_progress"
    ADD CONSTRAINT "kings_indian_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kings_indian_progress"
    ADD CONSTRAINT "kings_indian_progress_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."opening_lines"
    ADD CONSTRAINT "opening_lines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opening_lines"
    ADD CONSTRAINT "opening_lines_user_id_opening_line_key_key" UNIQUE ("user_id", "opening", "line_key");



ALTER TABLE ONLY "public"."petrovs_progress"
    ADD CONSTRAINT "petrovs_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."petrovs_progress"
    ADD CONSTRAINT "petrovs_progress_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."queens_bishop_game_progress"
    ADD CONSTRAINT "queens_bishop_game_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."queens_bishop_game_progress"
    ADD CONSTRAINT "queens_bishop_game_progress_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."queens_gambit_declined_progress"
    ADD CONSTRAINT "queens_gambit_declined_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."queens_gambit_declined_progress"
    ADD CONSTRAINT "queens_gambit_declined_progress_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."queens_indian_progress"
    ADD CONSTRAINT "queens_indian_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."queens_indian_progress"
    ADD CONSTRAINT "queens_indian_progress_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."queens_pawn_game_progress"
    ADD CONSTRAINT "queens_pawn_game_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."queens_pawn_game_progress"
    ADD CONSTRAINT "queens_pawn_game_progress_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."reti_progress"
    ADD CONSTRAINT "reti_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reti_progress"
    ADD CONSTRAINT "reti_progress_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."sicilian_progress"
    ADD CONSTRAINT "sicilian_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sicilian_progress"
    ADD CONSTRAINT "sicilian_progress_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."spanish_progress"
    ADD CONSTRAINT "spanish_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."spanish_progress"
    ADD CONSTRAINT "spanish_progress_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."benoni_progress"
    ADD CONSTRAINT "benoni_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."caro_kann_progress"
    ADD CONSTRAINT "caro_kann_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."catalan_progress"
    ADD CONSTRAINT "catalan_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."daily_game_results"
    ADD CONSTRAINT "daily_game_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."english_progress"
    ADD CONSTRAINT "english_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."french_progress"
    ADD CONSTRAINT "french_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."classic_game_results"
    ADD CONSTRAINT "game_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."gruenfeld_progress"
    ADD CONSTRAINT "gruenfeld_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."italian_progress"
    ADD CONSTRAINT "italian_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."kings_indian_progress"
    ADD CONSTRAINT "kings_indian_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."opening_lines"
    ADD CONSTRAINT "opening_lines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."petrovs_progress"
    ADD CONSTRAINT "petrovs_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."queens_bishop_game_progress"
    ADD CONSTRAINT "queens_bishop_game_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."queens_gambit_declined_progress"
    ADD CONSTRAINT "queens_gambit_declined_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."queens_indian_progress"
    ADD CONSTRAINT "queens_indian_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."queens_pawn_game_progress"
    ADD CONSTRAINT "queens_pawn_game_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."reti_progress"
    ADD CONSTRAINT "reti_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."sicilian_progress"
    ADD CONSTRAINT "sicilian_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."spanish_progress"
    ADD CONSTRAINT "spanish_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Users can insert own benoni progress" ON "public"."benoni_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own caro-kann progress" ON "public"."caro_kann_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own caro-kann progress" ON "public"."french_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own catalan progress" ON "public"."catalan_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own english progress" ON "public"."english_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own gruenfeld progress" ON "public"."gruenfeld_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own italian progress" ON "public"."italian_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own kings_indian progress" ON "public"."kings_indian_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own petrovs progress" ON "public"."petrovs_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own progress" ON "public"."user_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own queens_bishop_game progress" ON "public"."queens_bishop_game_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own queens_gambit_declined progress" ON "public"."queens_gambit_declined_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own queens_indian progress" ON "public"."queens_indian_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own queens_pawn_game progress" ON "public"."queens_pawn_game_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own results" ON "public"."classic_game_results" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own results" ON "public"."daily_game_results" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own reti progress" ON "public"."reti_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own sicilian progress" ON "public"."sicilian_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own spanish progress" ON "public"."spanish_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own opening lines" ON "public"."opening_lines" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own benoni progress" ON "public"."benoni_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own caro-kann progress" ON "public"."caro_kann_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own caro-kann progress" ON "public"."french_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own catalan progress" ON "public"."catalan_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own english progress" ON "public"."english_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own gruenfeld progress" ON "public"."gruenfeld_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own italian progress" ON "public"."italian_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own kings_indian progress" ON "public"."kings_indian_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own petrovs progress" ON "public"."petrovs_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own progress" ON "public"."user_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own queens_bishop_game progress" ON "public"."queens_bishop_game_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own queens_gambit_declined progress" ON "public"."queens_gambit_declined_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own queens_indian progress" ON "public"."queens_indian_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own queens_pawn_game progress" ON "public"."queens_pawn_game_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own results" ON "public"."classic_game_results" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own results" ON "public"."daily_game_results" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own reti progress" ON "public"."reti_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own sicilian progress" ON "public"."sicilian_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own spanish progress" ON "public"."spanish_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own benoni progress" ON "public"."benoni_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own caro-kann progress" ON "public"."caro_kann_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own caro-kann progress" ON "public"."french_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own catalan progress" ON "public"."catalan_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own english progress" ON "public"."english_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own gruenfeld progress" ON "public"."gruenfeld_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own italian progress" ON "public"."italian_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own kings_indian progress" ON "public"."kings_indian_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own petrovs progress" ON "public"."petrovs_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own progress" ON "public"."user_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own queens_bishop_game progress" ON "public"."queens_bishop_game_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own queens_gambit_declined progress" ON "public"."queens_gambit_declined_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own queens_indian progress" ON "public"."queens_indian_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own queens_pawn_game progress" ON "public"."queens_pawn_game_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own reti progress" ON "public"."reti_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own sicilian progress" ON "public"."sicilian_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own spanish progress" ON "public"."spanish_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."benoni_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."caro_kann_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."catalan_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."classic_game_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_game_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."english_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."french_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gruenfeld_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."italian_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kings_indian_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."opening_lines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."petrovs_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."queens_bishop_game_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."queens_gambit_declined_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."queens_indian_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."queens_pawn_game_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reti_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sicilian_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."spanish_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_progress" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";


















GRANT ALL ON TABLE "public"."benoni_progress" TO "anon";
GRANT ALL ON TABLE "public"."benoni_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."benoni_progress" TO "service_role";



GRANT ALL ON TABLE "public"."caro_kann_progress" TO "anon";
GRANT ALL ON TABLE "public"."caro_kann_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."caro_kann_progress" TO "service_role";



GRANT ALL ON TABLE "public"."catalan_progress" TO "anon";
GRANT ALL ON TABLE "public"."catalan_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."catalan_progress" TO "service_role";



GRANT ALL ON TABLE "public"."classic_game_results" TO "anon";
GRANT ALL ON TABLE "public"."classic_game_results" TO "authenticated";
GRANT ALL ON TABLE "public"."classic_game_results" TO "service_role";



GRANT ALL ON TABLE "public"."daily_game_results" TO "anon";
GRANT ALL ON TABLE "public"."daily_game_results" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_game_results" TO "service_role";



GRANT ALL ON TABLE "public"."english_progress" TO "anon";
GRANT ALL ON TABLE "public"."english_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."english_progress" TO "service_role";



GRANT ALL ON TABLE "public"."french_progress" TO "anon";
GRANT ALL ON TABLE "public"."french_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."french_progress" TO "service_role";



GRANT ALL ON TABLE "public"."gruenfeld_progress" TO "anon";
GRANT ALL ON TABLE "public"."gruenfeld_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."gruenfeld_progress" TO "service_role";



GRANT ALL ON TABLE "public"."italian_progress" TO "anon";
GRANT ALL ON TABLE "public"."italian_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."italian_progress" TO "service_role";



GRANT ALL ON TABLE "public"."kings_indian_progress" TO "anon";
GRANT ALL ON TABLE "public"."kings_indian_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."kings_indian_progress" TO "service_role";



GRANT ALL ON TABLE "public"."opening_lines" TO "anon";
GRANT ALL ON TABLE "public"."opening_lines" TO "authenticated";
GRANT ALL ON TABLE "public"."opening_lines" TO "service_role";



GRANT ALL ON TABLE "public"."petrovs_progress" TO "anon";
GRANT ALL ON TABLE "public"."petrovs_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."petrovs_progress" TO "service_role";



GRANT ALL ON TABLE "public"."queens_bishop_game_progress" TO "anon";
GRANT ALL ON TABLE "public"."queens_bishop_game_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."queens_bishop_game_progress" TO "service_role";



GRANT ALL ON TABLE "public"."queens_gambit_declined_progress" TO "anon";
GRANT ALL ON TABLE "public"."queens_gambit_declined_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."queens_gambit_declined_progress" TO "service_role";



GRANT ALL ON TABLE "public"."queens_indian_progress" TO "anon";
GRANT ALL ON TABLE "public"."queens_indian_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."queens_indian_progress" TO "service_role";



GRANT ALL ON TABLE "public"."queens_pawn_game_progress" TO "anon";
GRANT ALL ON TABLE "public"."queens_pawn_game_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."queens_pawn_game_progress" TO "service_role";



GRANT ALL ON TABLE "public"."reti_progress" TO "anon";
GRANT ALL ON TABLE "public"."reti_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."reti_progress" TO "service_role";



GRANT ALL ON TABLE "public"."sicilian_progress" TO "anon";
GRANT ALL ON TABLE "public"."sicilian_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."sicilian_progress" TO "service_role";



GRANT ALL ON TABLE "public"."spanish_progress" TO "anon";
GRANT ALL ON TABLE "public"."spanish_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."spanish_progress" TO "service_role";



GRANT ALL ON TABLE "public"."user_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_progress" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































