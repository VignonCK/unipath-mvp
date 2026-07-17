--
-- PostgreSQL database dump
--

\restrict Lpfja9Iyye1oHRlGPOZ8xit5oFX0CiTGh4gWnKlQhhhx5GcgYB4vud3QREvnSJt

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE auth.oauth_authorization_status OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: AlertSeverity; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AlertSeverity" AS ENUM (
    'INFO',
    'WARNING',
    'ERROR',
    'CRITICAL'
);


ALTER TYPE public."AlertSeverity" OWNER TO postgres;

--
-- Name: AlertType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AlertType" AS ENUM (
    'HIGH_FAILURE_RATE',
    'QUEUE_OVERLOAD',
    'SMTP_ERROR',
    'DELIVERY_ISSUE',
    'SYSTEM_ERROR'
);


ALTER TYPE public."AlertType" OWNER TO postgres;

--
-- Name: ApplicationDocSource; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ApplicationDocSource" AS ENUM (
    'PROFILE_AUTO',
    'STUDENT_UPLOAD',
    'SYSTEM_GENERATED'
);


ALTER TYPE public."ApplicationDocSource" OWNER TO postgres;

--
-- Name: ApplicationDocStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ApplicationDocStatus" AS ENUM (
    'PENDING',
    'PROVIDED'
);


ALTER TYPE public."ApplicationDocStatus" OWNER TO postgres;

--
-- Name: ApplicationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ApplicationStatus" AS ENUM (
    'DRAFT',
    'DOSSIER_FEES_PAID',
    'PENDING_DOCUMENTS',
    'READY_FOR_PREINSCRIPTION',
    'FICHE_GENERATED'
);


ALTER TYPE public."ApplicationStatus" OWNER TO postgres;

--
-- Name: AuditEventType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AuditEventType" AS ENUM (
    'NOTIFICATION_CREATED',
    'NOTIFICATION_SENT',
    'NOTIFICATION_DELIVERED',
    'NOTIFICATION_FAILED',
    'NOTIFICATION_READ',
    'NOTIFICATION_DELETED',
    'TEMPLATE_CREATED',
    'TEMPLATE_UPDATED',
    'TEMPLATE_DELETED',
    'PREFERENCES_UPDATED',
    'DATA_ACCESSED',
    'RETRY_ATTEMPTED',
    'ALERT_CREATED'
);


ALTER TYPE public."AuditEventType" OWNER TO postgres;

--
-- Name: DeliveryStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DeliveryStatus" AS ENUM (
    'PENDING',
    'QUEUED',
    'PROCESSING',
    'SENT',
    'DELIVERED',
    'FAILED',
    'BOUNCED',
    'EXPIRED'
);


ALTER TYPE public."DeliveryStatus" OWNER TO postgres;

--
-- Name: Mention; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Mention" AS ENUM (
    'PASSABLE',
    'ASSEZ_BIEN',
    'BIEN',
    'TRES_BIEN',
    'EXCELLENT'
);


ALTER TYPE public."Mention" OWNER TO postgres;

--
-- Name: NiveauFiliere; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NiveauFiliere" AS ENUM (
    'LICENCE',
    'MASTER'
);


ALTER TYPE public."NiveauFiliere" OWNER TO postgres;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationType" AS ENUM (
    'PRE_INSCRIPTION',
    'VALIDATION',
    'CONVOCATION',
    'REJET',
    'NOUVEAU_DOSSIER',
    'RAPPORT_HEBDO',
    'RAPPORT_MENSUEL',
    'SYSTEME',
    'ALERTE'
);


ALTER TYPE public."NotificationType" OWNER TO postgres;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'PLATFORM_GATEWAY',
    'BANK_TRANSFER'
);


ALTER TYPE public."PaymentMethod" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'FAILED'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- Name: PaymentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentType" AS ENUM (
    'DOSSIER_FEES',
    'DROITS_INSCRIPTION'
);


ALTER TYPE public."PaymentType" OWNER TO postgres;

--
-- Name: PriorityLevel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PriorityLevel" AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."PriorityLevel" OWNER TO postgres;

--
-- Name: ReceiptType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReceiptType" AS ENUM (
    'DOSSIER_FEES_RECEIPT',
    'BANK_RECEIPT',
    'PREINSCRIPTION_FICHE'
);


ALTER TYPE public."ReceiptType" OWNER TO postgres;

--
-- Name: RequirementType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RequirementType" AS ENUM (
    'PROFILE_FIELD',
    'DOCUMENT_UPLOAD'
);


ALTER TYPE public."RequirementType" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'CANDIDAT',
    'COMMISSION',
    'CONTROLEUR',
    'DGES',
    'ADMIN_ETABLISSEMENT',
    'ETUDIANT'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: SousRoleCommission; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SousRoleCommission" AS ENUM (
    'EXAMINATEUR',
    'CONTROLEUR',
    'MEMBRE'
);


ALTER TYPE public."SousRoleCommission" OWNER TO postgres;

--
-- Name: StatutCampagne; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatutCampagne" AS ENUM (
    'BROUILLON',
    'PUBLIEE',
    'CLOTUREE',
    'ANNULEE'
);


ALTER TYPE public."StatutCampagne" OWNER TO postgres;

--
-- Name: StatutDossier; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatutDossier" AS ENUM (
    'EN_ATTENTE',
    'VALIDE_PAR_COMMISSION',
    'REJETE_PAR_COMMISSION',
    'SOUS_RESERVE_PAR_COMMISSION',
    'VALIDE',
    'REJETE',
    'SOUS_RESERVE'
);


ALTER TYPE public."StatutDossier" OWNER TO postgres;

--
-- Name: StatutInscriptionAcad; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatutInscriptionAcad" AS ENUM (
    'EN_COURS',
    'VALIDE',
    'REDOUBLANT',
    'ABANDONNE',
    'EN_ATTENTE_QUITTANCE',
    'QUITTANCE_SOUMISE'
);


ALTER TYPE public."StatutInscriptionAcad" OWNER TO postgres;

--
-- Name: StatutPreinscriptionEtablissement; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatutPreinscriptionEtablissement" AS ENUM (
    'EN_ATTENTE',
    'VALIDE',
    'SOUS_RESERVE',
    'REJETE'
);


ALTER TYPE public."StatutPreinscriptionEtablissement" OWNER TO postgres;

--
-- Name: TypeDiplome; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TypeDiplome" AS ENUM (
    'LICENCE',
    'MASTER'
);


ALTER TYPE public."TypeDiplome" OWNER TO postgres;

--
-- Name: TypeEtablissement; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TypeEtablissement" AS ENUM (
    'PUBLIC',
    'PRIVE'
);


ALTER TYPE public."TypeEtablissement" OWNER TO postgres;

--
-- Name: Verdict; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Verdict" AS ENUM (
    'VALIDE',
    'REJETE',
    'SOUS_RESERVE'
);


ALTER TYPE public."Verdict" OWNER TO postgres;

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_admin;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in',
    'like',
    'ilike',
    'is',
    'match',
    'imatch',
    'isdistinct'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_admin;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text,
	negate boolean
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_admin;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_admin;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_admin;

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: supabase_admin
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;


ALTER FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) OWNER TO supabase_admin;

--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- Name: check_progression(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_progression() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE prev_inscription RECORD;
BEGIN
  SELECT * INTO prev_inscription FROM "InscriptionAcademique"
  WHERE "candidatId" = NEW."candidatId"
    AND "filiereId" = NEW."filiereId"
    AND niveau = NEW.niveau - 1;
  IF FOUND AND prev_inscription.statut != 'VALIDE' THEN
    RAISE EXCEPTION 'Progression bloquee : annee precedente non validee';
  END IF;
  RETURN NEW;
END; $$;


ALTER FUNCTION public.check_progression() OWNER TO postgres;

--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
    -- Regclass of the table e.g. public.notes
    entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

    -- I, U, D, T: insert, update ...
    action realtime.action = (
        case wal ->> 'action'
            when 'I' then 'INSERT'
            when 'U' then 'UPDATE'
            when 'D' then 'DELETE'
            else 'ERROR'
        end
    );

    -- Is row level security enabled for the table
    is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

    subscriptions realtime.subscription[] = array_agg(subs)
        from
            realtime.subscription subs
        where
            subs.entity = entity_
            -- Filter by action early - only get subscriptions interested in this action
            -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
            and (subs.action_filter = '*' or subs.action_filter = action::text);

    -- Subscription vars
    working_role regrole;
    working_selected_columns text[];
    claimed_role regrole;
    claims jsonb;

    subscription_id uuid;
    subscription_has_access bool;
    visible_to_subscription_ids uuid[] = '{}';

    -- structured info for wal's columns
    columns realtime.wal_column[];
    -- previous identity values for update/delete
    old_columns realtime.wal_column[];

    error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

    -- Primary jsonb output for record
    output jsonb;

    -- Loop record for iterating unique roles (outer loop)
    role_record record;
    -- Loop record for iterating unique selected_columns within a role (inner loop)
    cols_record record;
    -- Subscription ids visible at the role level (before fanning out by selected_columns)
    visible_role_sub_ids uuid[] = '{}';

begin
    perform set_config('role', null, true);

    columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'columns') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    old_columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'identity') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    for role_record in
        select claims_role
        from (select distinct claims_role from unnest(subscriptions)) t
        order by claims_role::text
    loop
        working_role := role_record.claims_role;

        -- Update `is_selectable` for columns and old_columns (once per role)
        columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(columns) c;

        old_columns =
                array_agg(
                    (
                        c.name,
                        c.type_name,
                        c.type_oid,
                        c.value,
                        c.is_pkey,
                        pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                    )::realtime.wal_column
                )
                from
                    unnest(old_columns) c;

        if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
            -- Fan out 400 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 400: Bad Request, no primary key']
                )::realtime.wal_rls;
            end loop;

        -- The claims role does not have SELECT permission to the primary key of entity
        elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
            -- Fan out 401 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 401: Unauthorized']
                )::realtime.wal_rls;
            end loop;

        else
            -- Create the prepared statement (once per role)
            if is_rls_enabled and action <> 'DELETE' then
                if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                    deallocate walrus_rls_stmt;
                end if;
                execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
            end if;

            -- Collect all visible subscription IDs for this role (filter check + RLS check)
            visible_role_sub_ids = '{}';

            for subscription_id, claims in (
                    select
                        subs.subscription_id,
                        subs.claims
                    from
                        unnest(subscriptions) subs
                    where
                        subs.entity = entity_
                        and subs.claims_role = working_role
                        and (
                            realtime.is_visible_through_filters(columns, subs.filters)
                            or (
                              action = 'DELETE'
                              and realtime.is_visible_through_filters(old_columns, subs.filters)
                            )
                        )
            ) loop

                if not is_rls_enabled or action = 'DELETE' then
                    visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                else
                    -- Check if RLS allows the role to see the record
                    perform
                        -- Trim leading and trailing quotes from working_role because set_config
                        -- doesn't recognize the role as valid if they are included
                        set_config('role', trim(both '"' from working_role::text), true),
                        set_config('request.jwt.claims', claims::text, true);

                    execute 'execute walrus_rls_stmt' into subscription_has_access;

                    if subscription_has_access then
                        visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                    end if;
                end if;
            end loop;

            perform set_config('role', null, true);

            -- Inner loop: per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;

                output = jsonb_build_object(
                    'schema', wal ->> 'schema',
                    'table', wal ->> 'table',
                    'type', action,
                    'commit_timestamp', to_char(
                        ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                    ),
                    'columns', (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'name', pa.attname,
                                    'type', pt.typname
                                )
                                order by pa.attnum asc
                            )
                        from
                            pg_attribute pa
                            join pg_type pt
                                on pa.atttypid = pt.oid
                            left join (
                                select unnest(conkey) as pkey_attnum
                                from pg_constraint
                                where conrelid = entity_ and contype = 'p'
                            ) pk on pk.pkey_attnum = pa.attnum
                        where
                            attrelid = entity_
                            and attnum > 0
                            and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
                            and (working_selected_columns is null or pa.attname = any(working_selected_columns) or pk.pkey_attnum is not null)
                    )
                )
                -- Add "record" key for insert and update
                || case
                    when action in ('INSERT', 'UPDATE') then
                        jsonb_build_object(
                            'record',
                            (
                                select
                                    jsonb_object_agg(
                                        -- if unchanged toast, get column name and value from old record
                                        coalesce((c).name, (oc).name),
                                        case
                                            when (c).name is null then (oc).value
                                            else (c).value
                                        end
                                    )
                                from
                                    unnest(columns) c
                                    full outer join unnest(old_columns) oc
                                        on (c).name = (oc).name
                                where
                                    coalesce((c).is_selectable, (oc).is_selectable)
                                    and (working_selected_columns is null or coalesce((c).name, (oc).name) = any(working_selected_columns) or coalesce((c).is_pkey, (oc).is_pkey))
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            )
                        )
                    else '{}'::jsonb
                end
                -- Add "old_record" key for update and delete
                || case
                    when action = 'UPDATE' then
                        jsonb_build_object(
                                'old_record',
                                (
                                    select jsonb_object_agg((c).name, (c).value)
                                    from unnest(old_columns) c
                                    where
                                        (c).is_selectable
                                        and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                        and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                )
                            )
                    when action = 'DELETE' then
                        jsonb_build_object(
                            'old_record',
                            (
                                select jsonb_object_agg((c).name, (c).value)
                                from unnest(old_columns) c
                                where
                                    (c).is_selectable
                                    and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                    and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                            )
                        )
                    else '{}'::jsonb
                end;

                -- Filter visible_role_sub_ids to those matching the current selected_columns group
                visible_to_subscription_ids = coalesce(
                    (
                        select array_agg(s.subscription_id)
                        from unnest(subscriptions) s
                        where s.claims_role = working_role
                          and (s.selected_columns is not distinct from working_selected_columns)
                          and s.subscription_id = any(visible_role_sub_ids)
                    ),
                    '{}'::uuid[]
                );

                return next (
                    output,
                    is_rls_enabled,
                    visible_to_subscription_ids,
                    case
                        when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                        else '{}'
                    end
                )::realtime.wal_rls;
            end loop;

        end if;
    end loop;

    perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_admin;

--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_admin;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
/*
Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
*/
declare
    op_symbol text = (
        case
            when op = 'eq' then '='
            when op = 'neq' then '!='
            when op = 'lt' then '<'
            when op = 'lte' then '<='
            when op = 'gt' then '>'
            when op = 'gte' then '>='
            when op = 'in' then '= any'
            else 'UNKNOWN OP'
        end
    );
    res boolean;
begin
    execute format(
        'select %L::'|| type_::text || ' ' || op_symbol
        || ' ( %L::'
        || (
            case
                when op = 'in' then type_::text || '[]'
                else type_::text end
        )
        || ')', val_1, val_2) into res;
    return res;
end;
$$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$
declare
    op_symbol text;
    res boolean;
begin
    -- IS DISTINCT FROM / IS NOT DISTINCT FROM: infix, both sides typed literals
    if op = 'isdistinct' then
        execute format(
            'select %L::%s %s %L::%s',
            val_1,
            type_::text,
            case when negate then 'IS NOT DISTINCT FROM' else 'IS DISTINCT FROM' end,
            val_2,
            type_::text
        ) into res;
        return res;
    end if;

    -- IS requires a keyword RHS (NULL, TRUE, FALSE, UNKNOWN), not a typed literal
    if op = 'is' then
        if val_2 not in ('null', 'true', 'false', 'unknown') then
            raise exception 'invalid value for is filter: must be null, true, false, or unknown';
        end if;
        execute format(
            'select %L::%s %s %s',
            val_1,
            type_::text,
            case when negate then 'IS NOT' else 'IS' end,
            upper(val_2)
        ) into res;
        return res;
    end if;

    op_symbol = case
        when op = 'eq'    then '='
        when op = 'neq'   then '!='
        when op = 'lt'    then '<'
        when op = 'lte'   then '<='
        when op = 'gt'    then '>'
        when op = 'gte'   then '>='
        when op = 'in'    then '= any'
        when op = 'like'   then 'LIKE'
        when op = 'ilike'  then 'ILIKE'
        when op = 'match'  then '~'
        when op = 'imatch' then '~*'
        else null
    end;

    if op_symbol is null then
        raise exception 'unsupported equality operator: %', op::text;
    end if;

    execute format(
        'select %L::%s %s (%L::%s)',
        val_1,
        type_::text,
        op_symbol,
        val_2,
        case when op = 'in' then type_::text || '[]' else type_::text end
    ) into res;

    return case when negate then not res else res end;
end;
$$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) OWNER TO supabase_admin;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
    select
        filters is null
        or array_length(filters, 1) is null
        or coalesce(
            count(col.name) = count(1)
            and sum(
                realtime.check_equality_op(
                    op:=f.op,
                    type_:=coalesce(col.type_oid::regtype, col.type_name::regtype),
                    val_1:=col.value #>> '{}',
                    val_2:=f.value,
                    negate:=coalesce(f.negate, false)
                )::int
            ) filter (where col.name is not null) = count(col.name),
            false
        )
    from
        unnest(filters) f
        left join unnest(columns) col
            on f.column_name = col.name;
$$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  SELECT
    realtime.wal2json_escape_identifier(nsp.nspname::text)
    || '.'
    || realtime.wal2json_escape_identifier(pc.relname::text)
  FROM pg_class pc
  JOIN pg_namespace nsp ON pc.relnamespace = nsp.oid
  WHERE pc.oid = entity
$$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_admin;

--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_admin;

--
-- Name: send_binary(bytea, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, binary_payload, event, topic, private, extension)
    VALUES (generated_id, payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) OWNER TO supabase_admin;

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
    col_names text[] = coalesce(
            array_agg(a.attname order by a.attnum),
            '{}'::text[]
        )
        from
            pg_catalog.pg_attribute a
        where
            a.attrelid = new.entity
            and a.attnum > 0
            and not a.attisdropped
            and pg_catalog.has_column_privilege(
                (new.claims ->> 'role'),
                a.attrelid,
                a.attnum,
                'SELECT'
            );
    filter realtime.user_defined_filter;
    col_type regtype;
    in_val jsonb;
    selected_col text;
begin
    for filter in select * from unnest(new.filters) loop
        if not filter.column_name = any(col_names) then
            raise exception 'invalid column for filter %', filter.column_name;
        end if;

        col_type = (
            select atttypid::regtype
            from pg_catalog.pg_attribute
            where attrelid = new.entity
                  and attname = filter.column_name
        );
        if col_type is null then
            raise exception 'failed to lookup type for column %', filter.column_name;
        end if;

        if filter.op = 'in'::realtime.equality_op then
            in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
            if coalesce(jsonb_array_length(in_val), 0) > 100 then
                raise exception 'too many values for `in` filter. Maximum 100';
            end if;
        elsif filter.op = 'is'::realtime.equality_op then
            -- `is` requires a keyword RHS rather than a typed literal
            if filter.value not in ('null', 'true', 'false', 'unknown') then
                raise exception 'invalid value for is filter: must be null, true, false, or unknown';
            end if;
            -- IS NULL works for any type, but IS TRUE/FALSE/UNKNOWN require a boolean
            -- operand. Reject the non-null keywords on non-boolean columns here so they
            -- don't abort apply_rls at WAL time.
            if filter.value <> 'null' and col_type <> 'boolean'::regtype then
                raise exception 'is % filter requires a boolean column, got %', filter.value, col_type::text;
            end if;
        elsif filter.op in ('like'::realtime.equality_op, 'ilike'::realtime.equality_op) then
            -- like/ilike apply the text pattern operator (~~); reject column types that
            -- have no such operator instead of failing at WAL time
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = '~~' and oprleft = col_type
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
        elsif filter.op in ('match'::realtime.equality_op, 'imatch'::realtime.equality_op) then
            -- match/imatch apply the regex operators ~ / ~*; reject column types that have
            -- no such operator (e.g. integer) instead of failing at WAL time, mirroring the
            -- like/ilike guard above.
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = case when filter.op = 'imatch'::realtime.equality_op then '~*' else '~' end
                  and oprleft = col_type
                  and oprright = col_type
                  and oprresult = 'boolean'::regtype
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
            -- validate the regex eagerly so a bad pattern is rejected here, not inside
            -- apply_rls where it would abort the WAL stream for the entity
            begin
                perform '' ~ filter.value;
            exception when others then
                raise exception 'invalid regular expression for % filter: %', filter.op::text, sqlerrm;
            end;
        else
            -- eq/neq/lt/lte/gt/gte: value must be coercable to the type
            perform realtime.cast(filter.value, col_type);
        end if;
    end loop;

    if new.selected_columns is not null then
        for selected_col in select * from unnest(new.selected_columns) loop
            if not selected_col = any(col_names) then
                raise exception 'invalid column for select %', selected_col;
            end if;
        end loop;
    end if;

    -- Apply consistent order to filters so the unique constraint can't be tricked by a
    -- different filter order. negate is part of the sort key.
    new.filters = coalesce(
        array_agg(f order by f.column_name, f.op, f.value, f.negate),
        '{}'
    ) from unnest(new.filters) f;

    new.selected_columns = (
        select array_agg(c order by c)
        from unnest(new.selected_columns) c
    );

    return new;
end;
$$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_admin;

--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_admin;

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- Name: wal2json_escape_identifier(text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.wal2json_escape_identifier(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  -- Prefix `\`, `,`, `.`, and any whitespace with `\`
  SELECT regexp_replace(name, '([\\,.[:space:]])', '\\\1', 'g')
$$;


ALTER FUNCTION realtime.wal2json_escape_identifier(name text) OWNER TO supabase_admin;

--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


ALTER FUNCTION storage.allow_any_operation(expected_operations text[]) OWNER TO supabase_storage_admin;

--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


ALTER FUNCTION storage.allow_only_operation(expected_operation text) OWNER TO supabase_storage_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


ALTER FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text, sort_order text) OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.protect_delete() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


ALTER FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_claims_allowlist text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


ALTER TABLE auth.custom_oauth_providers OWNER TO supabase_auth_admin;

--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


ALTER TABLE auth.oauth_authorizations OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.oauth_client_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


ALTER TABLE auth.oauth_consents OWNER TO supabase_auth_admin;

--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


ALTER TABLE auth.webauthn_challenges OWNER TO supabase_auth_admin;

--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


ALTER TABLE auth.webauthn_credentials OWNER TO supabase_auth_admin;

--
-- Name: ActionHistory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ActionHistory" (
    id text NOT NULL,
    "utilisateurId" text NOT NULL,
    "typeAction" text NOT NULL,
    details jsonb,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "dossierInscriptionId" text NOT NULL
);


ALTER TABLE public."ActionHistory" OWNER TO postgres;

--
-- Name: TABLE "ActionHistory"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public."ActionHistory" IS 'Table de traçabilité des actions effectuées sur les dossiers';


--
-- Name: COLUMN "ActionHistory"."utilisateurId"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."ActionHistory"."utilisateurId" IS 'ID de l''utilisateur qui a effectué l''action';


--
-- Name: COLUMN "ActionHistory"."typeAction"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."ActionHistory"."typeAction" IS 'Type d''action: DOSSIER_CREE, PIECE_AJOUTEE, PIECE_SUPPRIMEE, DOSSIER_VALIDE, DOSSIER_REJETE, DOSSIER_SOUMIS';


--
-- Name: COLUMN "ActionHistory".details; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."ActionHistory".details IS 'Détails optionnels de l''action au format JSON';


--
-- Name: COLUMN "ActionHistory"."ipAddress"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."ActionHistory"."ipAddress" IS 'Adresse IP de l''utilisateur (pour audit)';


--
-- Name: COLUMN "ActionHistory"."userAgent"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."ActionHistory"."userAgent" IS 'User Agent du navigateur (pour audit)';


--
-- Name: AdminEtablissement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AdminEtablissement" (
    id text NOT NULL,
    nom text NOT NULL,
    prenom text NOT NULL,
    email text NOT NULL,
    telephone text,
    role public."Role" DEFAULT 'ADMIN_ETABLISSEMENT'::public."Role" NOT NULL,
    "etablissementId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AdminEtablissement" OWNER TO postgres;

--
-- Name: AdministrateurDGES; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AdministrateurDGES" (
    id text NOT NULL,
    nom text NOT NULL,
    prenom text NOT NULL,
    email text NOT NULL,
    telephone text,
    role public."Role" DEFAULT 'DGES'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AdministrateurDGES" OWNER TO postgres;

--
-- Name: Application; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Application" (
    id text NOT NULL,
    "numeroApplication" text NOT NULL,
    "candidatId" text NOT NULL,
    "etablissementId" text NOT NULL,
    "filiereId" text NOT NULL,
    "anneeAcademique" text NOT NULL,
    niveau integer NOT NULL,
    status public."ApplicationStatus" DEFAULT 'DRAFT'::public."ApplicationStatus" NOT NULL,
    "preinscriptionId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "campagneFiliereId" text
);


ALTER TABLE public."Application" OWNER TO postgres;

--
-- Name: ApplicationDocument; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ApplicationDocument" (
    id text NOT NULL,
    "applicationId" text NOT NULL,
    "schoolRequirementId" text,
    code text NOT NULL,
    label text NOT NULL,
    source public."ApplicationDocSource" NOT NULL,
    "documentUrl" text,
    status public."ApplicationDocStatus" DEFAULT 'PENDING'::public."ApplicationDocStatus" NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ApplicationDocument" OWNER TO postgres;

--
-- Name: CampagneFiliere; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CampagneFiliere" (
    id text NOT NULL,
    "campagneId" text NOT NULL,
    "filiereId" text NOT NULL,
    "fraisDossier" integer NOT NULL,
    "placesDisponibles" integer,
    "criteresSelection" text,
    "seriesAcceptees" text[] DEFAULT ARRAY[]::text[],
    "niveauMinBac" text,
    "autresCriteres" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CampagneFiliere" OWNER TO postgres;

--
-- Name: CampagneInscription; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CampagneInscription" (
    id text NOT NULL,
    "etablissementId" text NOT NULL,
    titre text NOT NULL,
    "anneeAcademique" text NOT NULL,
    "dateOuverture" timestamp(3) without time zone NOT NULL,
    "dateCloture" timestamp(3) without time zone NOT NULL,
    description text,
    statut public."StatutCampagne" DEFAULT 'BROUILLON'::public."StatutCampagne" NOT NULL,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CampagneInscription" OWNER TO postgres;

--
-- Name: Candidat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Candidat" (
    id text NOT NULL,
    matricule text NOT NULL,
    nom text NOT NULL,
    prenom text NOT NULL,
    anip text,
    serie text,
    sexe text,
    nationalite text,
    email text NOT NULL,
    "emailConfirme" boolean DEFAULT false NOT NULL,
    telephone text,
    "dateNaiss" timestamp(3) without time zone,
    "lieuNaiss" text,
    role public."Role" DEFAULT 'ETUDIANT'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "emailConfirmToken" text,
    "emailConfirmExpires" timestamp(3) without time zone
);


ALTER TABLE public."Candidat" OWNER TO postgres;

--
-- Name: CentreComposition; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CentreComposition" (
    id text NOT NULL,
    nom text NOT NULL,
    ville text NOT NULL,
    adresse text,
    telephone text,
    actif boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CentreComposition" OWNER TO postgres;

--
-- Name: Concours; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Concours" (
    id text NOT NULL,
    libelle text NOT NULL,
    etablissement text,
    "dateDebut" timestamp(3) without time zone NOT NULL,
    "dateFin" timestamp(3) without time zone NOT NULL,
    "dateComposition" timestamp(3) without time zone,
    description text,
    "fraisParticipation" integer,
    "seriesAcceptees" text[] DEFAULT ARRAY[]::text[],
    matieres text[] DEFAULT ARRAY[]::text[],
    "piecesRequises" jsonb,
    "dateDebutDepot" timestamp(3) without time zone,
    "dateFinDepot" timestamp(3) without time zone,
    "dateDebutComposition" timestamp(3) without time zone,
    "dateFinComposition" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "criteresEligibilite" jsonb,
    "centresComposition" jsonb,
    "etablissementId" text,
    "inscriptionCompteur" integer DEFAULT 0 NOT NULL,
    "inscriptionCompteurAnnee" integer,
    sigle text
);


ALTER TABLE public."Concours" OWNER TO postgres;

--
-- Name: ConcourscentreComposition; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ConcourscentreComposition" (
    id text NOT NULL,
    "concoursId" text NOT NULL,
    "centreId" text NOT NULL,
    "anneeAcademique" text NOT NULL,
    capacite integer,
    "estActif" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ConcourscentreComposition" OWNER TO postgres;

--
-- Name: Controleur; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Controleur" (
    id text NOT NULL,
    nom text NOT NULL,
    prenom text NOT NULL,
    email text NOT NULL,
    telephone text,
    role public."Role" DEFAULT 'CONTROLEUR'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Controleur" OWNER TO postgres;

--
-- Name: Diplome; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Diplome" (
    id text NOT NULL,
    "candidatId" text NOT NULL,
    type public."TypeDiplome" NOT NULL,
    filiere text NOT NULL,
    "filiereId" text,
    etablissement text NOT NULL,
    annee text NOT NULL,
    mention public."Mention",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Diplome" OWNER TO postgres;

--
-- Name: Dossier; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Dossier" (
    id text NOT NULL,
    "candidatId" text NOT NULL,
    "acteNaissance" text,
    "carteIdentite" text,
    photo text,
    releve text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Dossier" OWNER TO postgres;

--
-- Name: DossierInscription; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DossierInscription" (
    id text NOT NULL,
    "inscriptionId" text NOT NULL,
    "quittanceUrl" text,
    "piecesExtras" jsonb,
    statut public."StatutDossier" DEFAULT 'EN_ATTENTE'::public."StatutDossier" NOT NULL,
    "verdict1Par" text,
    verdict1 public."Verdict",
    "verdict1Motif" text,
    "verdict1Date" timestamp(3) without time zone,
    "verdict1ModifieCount" integer DEFAULT 0 NOT NULL,
    "verdict2Par" text,
    verdict2 public."Verdict",
    "verdict2Motif" text,
    "verdict2Date" timestamp(3) without time zone,
    "verdict2ModifieCount" integer DEFAULT 0 NOT NULL,
    "decisionControleur" public."Verdict",
    "decisionControleurMotif" text,
    "decisionControleurDate" timestamp(3) without time zone,
    "decisionControleurPar" text,
    "commentaireRejet" text,
    "commentaireSousReserve" text,
    "decisionCommissionPar" text,
    "decisionCommissionDate" timestamp(3) without time zone,
    "commentaireControleur" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "documentsCompl" jsonb,
    "historiqueStatuts" jsonb,
    "centreCompositionChoisi" jsonb,
    "concoursCentreId" text,
    "decisionControleurModifieCount" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."DossierInscription" OWNER TO postgres;

--
-- Name: EmailDelivery; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EmailDelivery" (
    id text NOT NULL,
    "notificationId" text,
    "userId" text,
    recipient text NOT NULL,
    subject text NOT NULL,
    status public."DeliveryStatus" DEFAULT 'PENDING'::public."DeliveryStatus" NOT NULL,
    "messageId" text,
    attempts integer DEFAULT 0 NOT NULL,
    "lastAttemptAt" timestamp(3) without time zone,
    "sentAt" timestamp(3) without time zone,
    "deliveredAt" timestamp(3) without time zone,
    "bouncedAt" timestamp(3) without time zone,
    "errorMessage" text,
    "smtpCode" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "htmlBody" text,
    "textBody" text,
    attachments jsonb,
    "nextRetryAt" timestamp(3) without time zone
);


ALTER TABLE public."EmailDelivery" OWNER TO postgres;

--
-- Name: Etablissement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Etablissement" (
    id text NOT NULL,
    nom text NOT NULL,
    type public."TypeEtablissement" NOT NULL,
    ville text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    adresse text,
    email text,
    "matriculeFormat" text,
    telephone text,
    "siteWeb" text,
    description text,
    "agrementMESRS" text,
    "anneeCreation" integer,
    "logoUrl" text,
    facebook text,
    instagram text,
    linkedin text
);


ALTER TABLE public."Etablissement" OWNER TO postgres;

--
-- Name: Filiere; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Filiere" (
    id text NOT NULL,
    nom text NOT NULL,
    "etablissementId" text NOT NULL,
    "dureeAnnees" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    code text NOT NULL,
    niveau public."NiveauFiliere" NOT NULL,
    "matriculeCompteur" integer DEFAULT 0 NOT NULL,
    sigle text,
    "fraisScolariteAnnuels" integer,
    "fraisInscriptionEffective" integer,
    "fraisAutres" text,
    debouches text,
    "partenariatsEntreprises" text,
    "partenariatsUniversites" text,
    "tauxReussite" double precision,
    "dureeStage" text,
    "langueEnseignement" text
);


ALTER TABLE public."Filiere" OWNER TO postgres;

--
-- Name: Inscription; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Inscription" (
    id text NOT NULL,
    "numeroInscription" text,
    "candidatId" text NOT NULL,
    "concoursId" text NOT NULL,
    note double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Inscription" OWNER TO postgres;

--
-- Name: InscriptionAcademique; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."InscriptionAcademique" (
    id text NOT NULL,
    "candidatId" text NOT NULL,
    "etablissementId" text NOT NULL,
    "filiereId" text NOT NULL,
    "anneeAcademique" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    niveau integer NOT NULL,
    statut public."StatutInscriptionAcad" DEFAULT 'EN_COURS'::public."StatutInscriptionAcad" NOT NULL,
    matricule text,
    "quittanceBancaire" text,
    "quittanceSoumiseLe" timestamp(3) without time zone,
    "quittanceValideeLe" timestamp(3) without time zone
);


ALTER TABLE public."InscriptionAcademique" OWNER TO postgres;

--
-- Name: MembreCommission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MembreCommission" (
    id text NOT NULL,
    nom text NOT NULL,
    prenom text NOT NULL,
    email text NOT NULL,
    telephone text,
    role public."Role" DEFAULT 'COMMISSION'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "sousRole" public."SousRoleCommission" DEFAULT 'MEMBRE'::public."SousRoleCommission" NOT NULL,
    "etablissementId" text
);


ALTER TABLE public."MembreCommission" OWNER TO postgres;

--
-- Name: Note; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Note" (
    id text NOT NULL,
    "inscriptionAcadId" text NOT NULL,
    matiere text NOT NULL,
    "noteCC" double precision,
    "noteExamen" double precision,
    "noteMoyenne" double precision,
    credits integer NOT NULL,
    semestre integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Note" OWNER TO postgres;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."NotificationType" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb,
    read boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    priority public."PriorityLevel" DEFAULT 'NORMAL'::public."PriorityLevel" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "expiresAt" timestamp(3) without time zone
);


ALTER TABLE public."Notification" OWNER TO postgres;

--
-- Name: NotificationAuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."NotificationAuditLog" (
    id text NOT NULL,
    "eventType" public."AuditEventType" NOT NULL,
    "userId" text,
    "actorId" text,
    "resourceId" text,
    "resourceType" text,
    details jsonb,
    "ipAddress" text,
    "userAgent" text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."NotificationAuditLog" OWNER TO postgres;

--
-- Name: NotificationTemplate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."NotificationTemplate" (
    id text NOT NULL,
    name text NOT NULL,
    type public."NotificationType" NOT NULL,
    subject text NOT NULL,
    "htmlBody" text NOT NULL,
    "textBody" text,
    variables jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."NotificationTemplate" OWNER TO postgres;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "applicationId" text NOT NULL,
    "paymentType" public."PaymentType" NOT NULL,
    amount integer NOT NULL,
    currency text DEFAULT 'XOF'::text NOT NULL,
    "paymentProvider" text,
    "paymentMethod" public."PaymentMethod" NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "externalRef" text,
    "providerPayload" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Payment" OWNER TO postgres;

--
-- Name: PreinscriptionEtablissement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PreinscriptionEtablissement" (
    id text NOT NULL,
    "numeroPreinscription" text NOT NULL,
    "candidatId" text NOT NULL,
    "filiereId" text NOT NULL,
    "etablissementId" text NOT NULL,
    "anneeAcademique" text NOT NULL,
    niveau integer NOT NULL,
    statut public."StatutPreinscriptionEtablissement" DEFAULT 'EN_ATTENTE'::public."StatutPreinscriptionEtablissement" NOT NULL,
    "motifDecision" text,
    "decidedAt" timestamp(3) without time zone,
    "decidedBy" text,
    "inscriptionAcadId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "commentaireAdmin" text,
    "documentsCompl" jsonb,
    "historiqueStatuts" jsonb
);


ALTER TABLE public."PreinscriptionEtablissement" OWNER TO postgres;

--
-- Name: Receipt; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Receipt" (
    id text NOT NULL,
    "paymentId" text,
    "applicationId" text NOT NULL,
    "receiptNumber" text NOT NULL,
    "receiptType" public."ReceiptType" NOT NULL,
    "receiptUrl" text,
    "issuedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Receipt" OWNER TO postgres;

--
-- Name: SchoolRequirement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SchoolRequirement" (
    id text NOT NULL,
    "etablissementId" text NOT NULL,
    code text NOT NULL,
    label text NOT NULL,
    "requirementType" public."RequirementType" NOT NULL,
    "profileFieldKey" text,
    "isRequired" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SchoolRequirement" OWNER TO postgres;

--
-- Name: SystemAlert; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SystemAlert" (
    id text NOT NULL,
    type public."AlertType" NOT NULL,
    severity public."AlertSeverity" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb,
    resolved boolean DEFAULT false NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
    "resolvedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SystemAlert" OWNER TO postgres;

--
-- Name: UserPreferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserPreferences" (
    id text NOT NULL,
    "userId" text NOT NULL,
    preferences jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserPreferences" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: v_statistiques_dges; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_statistiques_dges AS
 SELECT c.id AS concours_id,
    c.libelle AS concours,
    c.description,
    c."dateDebut",
    c."dateFin",
    (count(i.id))::integer AS total_inscrits,
    (count(
        CASE
            WHEN (di.statut = 'VALIDE'::public."StatutDossier") THEN 1
            ELSE NULL::integer
        END))::integer AS dossiers_valides,
    (count(
        CASE
            WHEN (di.statut = 'REJETE'::public."StatutDossier") THEN 1
            ELSE NULL::integer
        END))::integer AS dossiers_rejetes,
    (count(
        CASE
            WHEN ((di.id IS NULL) OR (di.statut <> ALL (ARRAY['VALIDE'::public."StatutDossier", 'REJETE'::public."StatutDossier"]))) THEN 1
            ELSE NULL::integer
        END))::integer AS en_attente,
    (round((((count(
        CASE
            WHEN (di.statut = 'VALIDE'::public."StatutDossier") THEN 1
            ELSE NULL::integer
        END))::numeric / (NULLIF(count(i.id), 0))::numeric) * (100)::numeric), 2))::double precision AS taux_validation_pct
   FROM ((public."Concours" c
     LEFT JOIN public."Inscription" i ON ((i."concoursId" = c.id)))
     LEFT JOIN public."DossierInscription" di ON ((di."inscriptionId" = i.id)))
  GROUP BY c.id, c.libelle, c.description, c."dateDebut", c."dateFin";


ALTER VIEW public.v_statistiques_dges OWNER TO postgres;

--
-- Name: v_statistiques_module2; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_statistiques_module2 AS
 SELECT e.nom AS etablissement,
    e.type,
    f.nom AS filiere,
    f.niveau,
    ia."anneeAcademique" AS annee,
    count(ia.id) AS total_inscrits,
    count(
        CASE
            WHEN (ia.statut = 'VALIDE'::public."StatutInscriptionAcad") THEN 1
            ELSE NULL::integer
        END) AS valides,
    count(
        CASE
            WHEN (ia.statut = 'REDOUBLANT'::public."StatutInscriptionAcad") THEN 1
            ELSE NULL::integer
        END) AS redoublants,
    round((((count(
        CASE
            WHEN (ia.statut = 'VALIDE'::public."StatutInscriptionAcad") THEN 1
            ELSE NULL::integer
        END))::numeric / (NULLIF(count(ia.id), 0))::numeric) * (100)::numeric), 2) AS taux_reussite
   FROM ((public."Etablissement" e
     LEFT JOIN public."Filiere" f ON ((f."etablissementId" = e.id)))
     LEFT JOIN public."InscriptionAcademique" ia ON ((ia."filiereId" = f.id)))
  GROUP BY e.id, e.nom, e.type, f.nom, f.niveau, ia."anneeAcademique";


ALTER VIEW public.v_statistiques_module2 OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    selected_columns text[],
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


ALTER TABLE realtime.subscription OWNER TO supabase_admin;

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_vectors OWNER TO supabase_storage_admin;

--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.vector_indexes OWNER TO supabase_storage_admin;

--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at, custom_claims_allowlist) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
bf121994-42f1-4e88-8ac6-1309d6d208a2	bf121994-42f1-4e88-8ac6-1309d6d208a2	{"sub": "bf121994-42f1-4e88-8ac6-1309d6d208a2", "email": "harry.test@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-09 17:39:30.237692+00	2026-04-09 17:39:30.237742+00	2026-04-09 17:39:30.237742+00	a2a23be3-6ac2-4096-8f94-b58c21a759f6
1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	{"sub": "1edb2bf5-83ef-46f1-b926-ea889ef8cf7c", "email": "harrydedji@gmail.com", "email_verified": true, "phone_verified": false}	email	2026-04-09 17:43:24.232169+00	2026-04-09 17:43:24.232218+00	2026-04-09 17:43:24.232218+00	79a45f44-13f0-46e9-bbb3-b1ca43fe1ce8
ec032fe4-9093-4825-a3ff-af8a8c4b2fad	ec032fe4-9093-4825-a3ff-af8a8c4b2fad	{"sub": "ec032fe4-9093-4825-a3ff-af8a8c4b2fad", "email": "candidat.test@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-16 05:47:39.479802+00	2026-04-16 05:47:39.479855+00	2026-04-16 05:47:39.479855+00	389c1679-2617-495f-83a3-15ce4b737541
c121a8d7-589a-48d4-bae2-134a826c5856	c121a8d7-589a-48d4-bae2-134a826c5856	{"sub": "c121a8d7-589a-48d4-bae2-134a826c5856", "email": "test.unipath@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-21 13:37:41.752534+00	2026-04-21 13:37:41.752587+00	2026-04-21 13:37:41.752587+00	b37d8f69-119e-4453-bd88-d5511af31e00
0b31e734-c377-426f-9618-fa73b50675d8	0b31e734-c377-426f-9618-fa73b50675d8	{"sub": "0b31e734-c377-426f-9618-fa73b50675d8", "email": "unipath@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-22 08:46:28.188756+00	2026-04-22 08:46:28.18882+00	2026-04-22 08:46:28.18882+00	643913cd-eb96-40ca-8557-7b8c409a1668
50924558-a5a0-4ccd-ab7c-9bddbb1252dd	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	{"sub": "50924558-a5a0-4ccd-ab7c-9bddbb1252dd", "email": "candidat@test.com", "email_verified": false, "phone_verified": false}	email	2026-04-24 13:54:46.853753+00	2026-04-24 13:54:46.853815+00	2026-04-24 13:54:46.853815+00	6b071882-4eac-421d-a81b-932607ccacb7
7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	{"sub": "7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef", "email": "commission@test.com", "email_verified": false, "phone_verified": false}	email	2026-04-24 13:54:50.759337+00	2026-04-24 13:54:50.759403+00	2026-04-24 13:54:50.759403+00	ffac3cd5-3849-4f4f-a296-c8f19ae358c4
cf3f6aea-e532-40f2-a5d6-4ebe67a91250	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	{"sub": "cf3f6aea-e532-40f2-a5d6-4ebe67a91250", "email": "dges@test.com", "email_verified": false, "phone_verified": false}	email	2026-04-24 13:54:51.293226+00	2026-04-24 13:54:51.293279+00	2026-04-24 13:54:51.293279+00	63e893e9-a8e7-4cc3-a631-cf742c86e654
12a044fe-0847-4643-9c20-95ade843d316	12a044fe-0847-4643-9c20-95ade843d316	{"sub": "12a044fe-0847-4643-9c20-95ade843d316", "email": "test@test.com", "email_verified": false, "phone_verified": false}	email	2026-04-26 12:06:50.262364+00	2026-04-26 12:06:50.262416+00	2026-04-26 12:06:50.262416+00	0f24c6e0-9e0d-4470-8a7d-12e464be6386
590cfa64-d397-403c-96d0-dc975cf2a149	590cfa64-d397-403c-96d0-dc975cf2a149	{"sub": "590cfa64-d397-403c-96d0-dc975cf2a149", "email": "kanlinhanonvignon@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-26 18:37:07.021754+00	2026-04-26 18:37:07.021808+00	2026-04-26 18:37:07.021808+00	46c2cd67-7eac-41a6-8d58-5c0c27bf4b8d
054f38ee-7af7-4bd5-b9b4-5a1dceb84a99	054f38ee-7af7-4bd5-b9b4-5a1dceb84a99	{"sub": "054f38ee-7af7-4bd5-b9b4-5a1dceb84a99", "email": "vignonkanlinhanon5@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-26 18:54:49.633784+00	2026-04-26 18:54:49.633835+00	2026-04-26 18:54:49.633835+00	5cf68c1b-7569-48bc-a5e7-33ab82f34513
16eaa1a5-477b-4b43-b73e-e2373b69dc3f	16eaa1a5-477b-4b43-b73e-e2373b69dc3f	{"sub": "16eaa1a5-477b-4b43-b73e-e2373b69dc3f", "email": "cad@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-26 18:55:54.053539+00	2026-04-26 18:55:54.053581+00	2026-04-26 18:55:54.053581+00	143bf228-18e1-4da6-aaf0-2772f21fbb17
40f13c4d-8b63-443e-8191-0b4df12645fb	40f13c4d-8b63-443e-8191-0b4df12645fb	{"sub": "40f13c4d-8b63-443e-8191-0b4df12645fb", "email": "themcdhy@gmail.com", "email_verified": true, "phone_verified": false}	email	2026-05-01 16:50:44.531676+00	2026-05-01 16:50:44.531731+00	2026-05-01 16:50:44.531731+00	254c7039-2561-437b-b2e2-0916834ab2f6
c93e16a6-b9fc-4739-b0fe-b1e96315422b	c93e16a6-b9fc-4739-b0fe-b1e96315422b	{"sub": "c93e16a6-b9fc-4739-b0fe-b1e96315422b", "email": "testunipath@gmail.com", "email_verified": true, "phone_verified": false}	email	2026-05-01 16:41:14.601171+00	2026-05-01 16:41:14.601218+00	2026-05-01 16:41:14.601218+00	32f35172-cbad-447f-b2ef-8dce2bd34427
ec4ec11c-a798-45a5-9ee8-79a9bee08e39	ec4ec11c-a798-45a5-9ee8-79a9bee08e39	{"sub": "ec4ec11c-a798-45a5-9ee8-79a9bee08e39", "email": "dedjiharry@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-05-02 16:00:35.652728+00	2026-05-02 16:00:35.65278+00	2026-05-02 16:00:35.65278+00	b5c15686-b456-4d3b-8f4e-b2e7e1eea014
47f79776-a2d5-497b-80fa-8b38670461f4	47f79776-a2d5-497b-80fa-8b38670461f4	{"sub": "47f79776-a2d5-497b-80fa-8b38670461f4", "email": "emlagbaguidi@gmail.com", "email_verified": true, "phone_verified": false}	email	2026-05-02 16:49:59.107205+00	2026-05-02 16:49:59.107253+00	2026-05-02 16:49:59.107253+00	1cb3f8f2-eb96-413e-91a8-c6220c4cf860
8e237b3f-2e09-4938-899b-b97d12deee1a	8e237b3f-2e09-4938-899b-b97d12deee1a	{"sub": "8e237b3f-2e09-4938-899b-b97d12deee1a", "email": "elnissoskafu@gmail.com", "email_verified": true, "phone_verified": false}	email	2026-05-05 22:53:29.477283+00	2026-05-05 22:53:29.477337+00	2026-05-05 22:53:29.477337+00	a8ad751e-03ba-4e74-afc4-0ab41d6bde92
18f6be90-ed86-4bfb-8360-443d70852cc9	18f6be90-ed86-4bfb-8360-443d70852cc9	{"nom": "DEDJI", "sub": "18f6be90-ed86-4bfb-8360-443d70852cc9", "anip": "177980297435", "email": "test-first-1779802974360@example.com", "prenom": "Harry", "email_verified": false, "phone_verified": false}	email	2026-05-26 13:43:09.745821+00	2026-05-26 13:43:09.745881+00	2026-05-26 13:43:09.745881+00	244e1fb5-4e11-4170-8469-c70806a0244e
f12eb176-bb43-4432-b3ec-9ce3735e1226	f12eb176-bb43-4432-b3ec-9ce3735e1226	{"nom": "DEDJI", "sub": "f12eb176-bb43-4432-b3ec-9ce3735e1226", "anip": "177980297936", "email": "test-user1-1779802979366@example.com", "prenom": "Harry", "email_verified": false, "phone_verified": false}	email	2026-05-26 13:43:15.28124+00	2026-05-26 13:43:15.281308+00	2026-05-26 13:43:15.281308+00	524ee2de-90f0-4b44-bc9e-b67e3a4c21b4
caf0b663-7b1b-41ef-ac7c-9022b80c41c8	caf0b663-7b1b-41ef-ac7c-9022b80c41c8	{"nom": "DEDJI", "sub": "caf0b663-7b1b-41ef-ac7c-9022b80c41c8", "anip": "000000000000", "email": "test-1779802994402@example.com", "prenom": "Harry", "email_verified": false, "phone_verified": false}	email	2026-05-26 13:43:19.742372+00	2026-05-26 13:43:19.742416+00	2026-05-26 13:43:19.742416+00	609a6ef9-b465-4d69-b10e-3b278457913d
cc087f51-4754-47cf-97eb-1d372599abf7	cc087f51-4754-47cf-97eb-1d372599abf7	{"nom": "TEST", "sub": "cc087f51-4754-47cf-97eb-1d372599abf7", "anip": "000123456789", "email": "test-1779802999407@example.com", "prenom": "User", "email_verified": false, "phone_verified": false}	email	2026-05-26 13:43:27.05069+00	2026-05-26 13:43:27.050749+00	2026-05-26 13:43:27.050749+00	e1c1f285-4951-4a45-83ae-041d533434ab
0099a5d1-7ca2-456d-9136-9535a9cdf13e	0099a5d1-7ca2-456d-9136-9535a9cdf13e	{"nom": "PERF", "sub": "0099a5d1-7ca2-456d-9136-9535a9cdf13e", "anip": "177980300444", "email": "perf-1779803004441@example.com", "prenom": "Test", "email_verified": false, "phone_verified": false}	email	2026-05-26 13:43:29.289487+00	2026-05-26 13:43:29.289531+00	2026-05-26 13:43:29.289531+00	3ff53e9b-49af-4a78-ad87-460ac076f1e8
adad5263-20b1-4f82-8650-e2011ed199ab	adad5263-20b1-4f82-8650-e2011ed199ab	{"sub": "adad5263-20b1-4f82-8650-e2011ed199ab", "email": "examinateur@test.com", "email_verified": false, "phone_verified": false}	email	2026-06-16 07:26:18.871668+00	2026-06-16 07:26:18.871726+00	2026-06-16 07:26:18.871726+00	69f98add-02b6-48b6-a4e1-3719c5ed51e6
754671cd-2b76-4ccb-a0bb-690adcf34443	754671cd-2b76-4ccb-a0bb-690adcf34443	{"sub": "754671cd-2b76-4ccb-a0bb-690adcf34443", "email": "controleur-commission@test.com", "email_verified": false, "phone_verified": false}	email	2026-06-16 07:26:24.573001+00	2026-06-16 07:26:24.573101+00	2026-06-16 07:26:24.573101+00	065fa5fc-5a24-470e-a819-01a894ad85f7
20a05243-32ba-41d2-b61f-635df62e2173	20a05243-32ba-41d2-b61f-635df62e2173	{"sub": "20a05243-32ba-41d2-b61f-635df62e2173", "email": "examinateur2@test.com", "email_verified": false, "phone_verified": false}	email	2026-06-16 07:32:37.741049+00	2026-06-16 07:32:37.741104+00	2026-06-16 07:32:37.741104+00	125f2518-ed5e-4776-833b-a6fc01cd2d95
4de3adcd-e444-403d-8036-a5525129d2d6	4de3adcd-e444-403d-8036-a5525129d2d6	{"nom": "ASSOGBA", "sub": "4de3adcd-e444-403d-8036-a5525129d2d6", "anip": "111111111111", "email": "lebg30794@gmail.com", "prenom": "Urgarte", "email_verified": false, "phone_verified": false}	email	2026-06-21 23:32:35.92653+00	2026-06-21 23:32:35.926588+00	2026-06-21 23:32:35.926588+00	42fe5c56-117d-43dc-ba28-44152c68d05f
f4bf7644-7d51-4764-a6ff-a4a3b450b0fc	f4bf7644-7d51-4764-a6ff-a4a3b450b0fc	{"sub": "f4bf7644-7d51-4764-a6ff-a4a3b450b0fc", "email": "candidat.test1@unipath.test", "email_verified": false, "phone_verified": false}	email	2026-06-23 08:21:42.098976+00	2026-06-23 08:21:42.09905+00	2026-06-23 08:21:42.09905+00	b8575bc5-1fc6-468e-952d-575cd5e82300
219b295c-5172-4950-b50c-d6138d275770	219b295c-5172-4950-b50c-d6138d275770	{"sub": "219b295c-5172-4950-b50c-d6138d275770", "email": "candidat.test2@unipath.test", "email_verified": false, "phone_verified": false}	email	2026-06-23 08:21:51.5767+00	2026-06-23 08:21:51.576748+00	2026-06-23 08:21:51.576748+00	629c62e0-9405-4710-8bfb-e3a905f98f79
9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	{"nom": "DEVI", "sub": "9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f", "anip": "122334567890", "email": "unipathepac@gmail.com", "prenom": "Sidney", "email_verified": true, "phone_verified": false}	email	2026-06-23 08:34:04.741081+00	2026-06-23 08:34:04.741161+00	2026-06-23 08:34:04.741161+00	ca6940e8-054e-4cf1-aeef-c132099ad7d1
362a8b1a-9e81-4c91-b477-c6183394f42f	362a8b1a-9e81-4c91-b477-c6183394f42f	{"nom": "TestNom", "sub": "362a8b1a-9e81-4c91-b477-c6183394f42f", "anip": "665232289311", "email": "test_candidat_1782243862275@example.com", "prenom": "TestPrenom", "email_verified": false, "phone_verified": false}	email	2026-06-23 19:44:26.25415+00	2026-06-23 19:44:26.254203+00	2026-06-23 19:44:26.254203+00	fd9a7562-4ab1-4fd5-bf19-db9f70e41090
8b6f294e-f2b8-4611-82f7-63d59df1804a	8b6f294e-f2b8-4611-82f7-63d59df1804a	{"nom": "TestNom", "sub": "8b6f294e-f2b8-4611-82f7-63d59df1804a", "anip": "808303535200", "email": "test_candidat_1782243949123@example.com", "prenom": "TestPrenom", "email_verified": false, "phone_verified": false}	email	2026-06-23 19:45:53.873838+00	2026-06-23 19:45:53.8739+00	2026-06-23 19:45:53.8739+00	0f81aaf3-a3b3-447b-a1f8-78c66d006df0
d953f6f7-2cb6-445d-9356-f51141f6916c	d953f6f7-2cb6-445d-9356-f51141f6916c	{"sub": "d953f6f7-2cb6-445d-9356-f51141f6916c", "email": "jerzeyshop8@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-06-24 12:32:17.898674+00	2026-06-24 12:32:17.89874+00	2026-06-24 12:32:17.89874+00	b95c43f7-d60c-4d1f-9202-e8bd9a51e276
2ceb478d-1a3b-49e7-a64c-bab998d8aa3f	2ceb478d-1a3b-49e7-a64c-bab998d8aa3f	{"sub": "2ceb478d-1a3b-49e7-a64c-bab998d8aa3f", "email": "dhvrris@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-06-24 12:36:29.40301+00	2026-06-24 12:36:29.403063+00	2026-06-24 12:36:29.403063+00	65f25693-a840-4ec7-b3e2-3c34be8c6463
1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	{"nom": "FAVI", "sub": "1f1bc8d1-5f57-47ae-8b9c-952c45ffde14", "anip": "146266863878", "email": "thechill000@gmail.com", "prenom": "Keren", "email_verified": false, "phone_verified": false}	email	2026-06-28 08:05:43.976371+00	2026-06-28 08:05:43.976421+00	2026-06-28 08:05:43.976421+00	465c9d25-3a64-40ad-b312-eb2929e9f17d
3e1050d6-a7b8-47d6-8142-68a6ce1e3de8	3e1050d6-a7b8-47d6-8142-68a6ce1e3de8	{"sub": "3e1050d6-a7b8-47d6-8142-68a6ce1e3de8", "email": "forfait199@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-06-28 14:54:59.958887+00	2026-06-28 14:54:59.958942+00	2026-06-28 14:54:59.958942+00	a61a8d91-c241-4c60-96db-8f122542e57c
6a2e2a2f-b49e-4dc1-b8e3-3e26fa46eedc	6a2e2a2f-b49e-4dc1-b8e3-3e26fa46eedc	{"sub": "6a2e2a2f-b49e-4dc1-b8e3-3e26fa46eedc", "email": "forsuree15@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-07-02 07:54:58.039334+00	2026-07-02 07:54:58.03939+00	2026-07-02 07:54:58.03939+00	2b152420-19b4-40c8-b947-9ec2e528efc8
dd569177-974b-44a6-a51b-e899cc479be1	dd569177-974b-44a6-a51b-e899cc479be1	{"sub": "dd569177-974b-44a6-a51b-e899cc479be1", "email": "harrydedji+candidat1@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-07-09 06:37:15.619505+00	2026-07-09 06:37:15.619562+00	2026-07-09 06:37:15.619562+00	fb450a86-0af5-4519-8501-7811c289746a
cea47adf-c2b4-42dc-85e1-f77a82853cb0	cea47adf-c2b4-42dc-85e1-f77a82853cb0	{"sub": "cea47adf-c2b4-42dc-85e1-f77a82853cb0", "email": "harrydedji+candidat2@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-07-09 06:37:32.2473+00	2026-07-09 06:37:32.248927+00	2026-07-09 06:37:32.248927+00	155df146-cd56-47e3-b309-55e94b7ed389
ce2842ec-13d7-4b9b-8491-26aa92080b35	ce2842ec-13d7-4b9b-8491-26aa92080b35	{"sub": "ce2842ec-13d7-4b9b-8491-26aa92080b35", "email": "harrydedji+candidat3@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-07-09 06:37:49.272469+00	2026-07-09 06:37:49.272515+00	2026-07-09 06:37:49.272515+00	0e7414c8-ae49-40fb-9d59-00d217a20e65
e22b8e9b-8d98-4316-bc74-49126b9f38e8	e22b8e9b-8d98-4316-bc74-49126b9f38e8	{"sub": "e22b8e9b-8d98-4316-bc74-49126b9f38e8", "email": "harrydedji+candidat4@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-07-09 06:38:08.295345+00	2026-07-09 06:38:08.29601+00	2026-07-09 06:38:08.29601+00	8d3a0e3d-0fa0-45b8-bba1-c687d68c3ab7
7a4993ea-5eb4-4ff8-9e66-c4c5f5d5acf2	7a4993ea-5eb4-4ff8-9e66-c4c5f5d5acf2	{"sub": "7a4993ea-5eb4-4ff8-9e66-c4c5f5d5acf2", "email": "harrydedji+candidat5@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-07-09 06:38:24.214601+00	2026-07-09 06:38:24.214655+00	2026-07-09 06:38:24.214655+00	f81af65e-a50a-4a60-b125-b3c03aaf04f5
acec5f54-1db7-44ab-abcd-514941a94b89	acec5f54-1db7-44ab-abcd-514941a94b89	{"sub": "acec5f54-1db7-44ab-abcd-514941a94b89", "email": "harrydedji+candidat6@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-07-09 06:38:37.733849+00	2026-07-09 06:38:37.733909+00	2026-07-09 06:38:37.733909+00	8a8ecdca-1e05-4b38-a6a4-9c99841f05fd
6a4e990b-48f6-4d80-a572-b24a6da10065	6a4e990b-48f6-4d80-a572-b24a6da10065	{"sub": "6a4e990b-48f6-4d80-a572-b24a6da10065", "email": "harrydedji+candidat7@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-07-09 06:38:51.262087+00	2026-07-09 06:38:51.262147+00	2026-07-09 06:38:51.262147+00	07e22490-8116-48f3-8d78-c82b628d192d
95798e76-e65d-4a9d-8e4d-6bc1dbe24169	95798e76-e65d-4a9d-8e4d-6bc1dbe24169	{"sub": "95798e76-e65d-4a9d-8e4d-6bc1dbe24169", "email": "harrydedji+candidat8@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-07-09 06:39:04.524501+00	2026-07-09 06:39:04.524548+00	2026-07-09 06:39:04.524548+00	1f89e8d3-e14d-4b53-8320-311577bae086
7dafd101-8703-4048-a7ac-b3e5a59a7a20	7dafd101-8703-4048-a7ac-b3e5a59a7a20	{"sub": "7dafd101-8703-4048-a7ac-b3e5a59a7a20", "email": "harrydedji+candidat9@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-07-09 06:39:18.478334+00	2026-07-09 06:39:18.47838+00	2026-07-09 06:39:18.47838+00	c78e29eb-1a3b-4875-a241-232642c81b81
63433950-de27-4e70-8f2f-5422ee728631	63433950-de27-4e70-8f2f-5422ee728631	{"sub": "63433950-de27-4e70-8f2f-5422ee728631", "email": "harrydedji+candidat10@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-07-09 06:39:32.245553+00	2026-07-09 06:39:32.245601+00	2026-07-09 06:39:32.245601+00	48a73c55-24cd-4850-9db9-1e7e25ac44c8
c61477fa-be86-447c-a001-5b043b58d3b3	c61477fa-be86-447c-a001-5b043b58d3b3	{"sub": "c61477fa-be86-447c-a001-5b043b58d3b3", "email": "harrydedji+candidat11@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-07-09 06:39:45.863933+00	2026-07-09 06:39:45.863978+00	2026-07-09 06:39:45.863978+00	caf38aed-9ce8-43fb-b9d2-4714507899e9
acf582c5-34a6-463f-9ded-c9ae33cec93c	acf582c5-34a6-463f-9ded-c9ae33cec93c	{"sub": "acf582c5-34a6-463f-9ded-c9ae33cec93c", "email": "harrydedji+candidat12@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-07-09 06:40:01.297912+00	2026-07-09 06:40:01.298533+00	2026-07-09 06:40:01.298533+00	d75d0314-d645-494f-91ca-45143b0e22bf
c489ab2e-1f30-4490-8da7-a4f3be59a9a3	c489ab2e-1f30-4490-8da7-a4f3be59a9a3	{"sub": "c489ab2e-1f30-4490-8da7-a4f3be59a9a3", "email": "harrydedji+candidat13@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-07-09 06:40:15.585413+00	2026-07-09 06:40:15.585472+00	2026-07-09 06:40:15.585472+00	c99fd308-748b-4185-85fe-197221e269f9
d4370a44-36c4-4a83-a694-9ce69b76226b	d4370a44-36c4-4a83-a694-9ce69b76226b	{"sub": "d4370a44-36c4-4a83-a694-9ce69b76226b", "email": "harrydedji+candidat14@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-07-09 06:40:28.969822+00	2026-07-09 06:40:28.969916+00	2026-07-09 06:40:28.969916+00	6d998810-b023-4031-9fb6-e4d05b06b23a
55c80461-24f9-44dd-b695-d700fba2c36d	55c80461-24f9-44dd-b695-d700fba2c36d	{"sub": "55c80461-24f9-44dd-b695-d700fba2c36d", "email": "harrydedji+candidat15@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-07-09 06:40:42.140235+00	2026-07-09 06:40:42.140281+00	2026-07-09 06:40:42.140281+00	34fcc3dd-8109-4844-980f-5f14773a373e
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
9fcf4b09-4718-47ba-a4d5-17c27dc34f17	2026-04-09 17:45:26.476595+00	2026-04-09 17:45:26.476595+00	otp	aa535567-51e9-41b7-b17c-872007b18254
2dea3843-c0fa-4493-af7f-7aebd3ed31ee	2026-04-10 14:34:35.53905+00	2026-04-10 14:34:35.53905+00	password	22b72aea-9299-4d1d-b07d-e555e38d2e5b
2a8b847a-d148-4921-978d-f9db671fca54	2026-04-10 15:28:02.682467+00	2026-04-10 15:28:02.682467+00	password	61e3e965-90c7-4779-84c4-b728756d0058
373a5446-bfcb-44b2-ba49-8cd63a719388	2026-04-11 10:33:39.155046+00	2026-04-11 10:33:39.155046+00	password	21f49d11-97cb-419b-9996-6bc2a68a76fc
bd51e60d-acf4-4225-9650-058ce4cb9781	2026-04-15 10:19:13.981185+00	2026-04-15 10:19:13.981185+00	password	87f59f42-96c0-4a20-9f87-314391234bfa
5a68def5-ea95-42a8-9233-d793b08a7bcb	2026-04-15 22:08:42.774637+00	2026-04-15 22:08:42.774637+00	password	d915d420-7171-4658-93f2-c77939501a00
01ac7088-a9d1-4899-a0c7-b22444c61d17	2026-04-15 22:52:25.522698+00	2026-04-15 22:52:25.522698+00	password	a1100252-5d0e-4c35-a33b-4d1cda4cd8c5
b36b74f2-8b95-48fc-9c2c-fe652ff14f18	2026-04-15 23:17:45.582009+00	2026-04-15 23:17:45.582009+00	password	95388441-2a21-4b4b-845f-d508d0387ee3
fde7420f-ae07-4df1-8e87-b8b7ca3fb667	2026-04-16 05:40:31.330984+00	2026-04-16 05:40:31.330984+00	password	e9ed518d-e858-43c5-a43c-6e530c6488b1
c0c984f9-f48f-4043-8287-8ae3a02f64c4	2026-04-16 05:47:39.498247+00	2026-04-16 05:47:39.498247+00	password	db1241a0-4651-4ba8-acda-b67ada22bea7
c1ba4abd-c35f-4909-bcd7-635b5d221bb9	2026-04-16 05:59:23.976581+00	2026-04-16 05:59:23.976581+00	password	ee161955-4b4b-4f76-8e8d-7ade43ce6e93
34fb5171-22b9-4f23-a931-e1f58bd011ca	2026-04-20 10:05:54.67673+00	2026-04-20 10:05:54.67673+00	password	74ebbed3-e997-4a79-9019-31bd02ce72ac
e5d7613f-f4cf-43cd-beb3-53204d621809	2026-04-21 08:08:27.067061+00	2026-04-21 08:08:27.067061+00	password	d5e8486d-ed61-4c87-a2d7-5c2fa4870618
844e9863-4004-4947-b3fd-27d45bb465cb	2026-04-21 08:24:33.16283+00	2026-04-21 08:24:33.16283+00	password	b8ee6059-fb4f-459c-abd0-11c8473e3f99
139b7ed4-ba65-40e2-835d-f24bcb18160f	2026-04-21 09:33:50.47904+00	2026-04-21 09:33:50.47904+00	password	668bddc6-65fd-426e-8e1c-96a940a6c7a5
a7068747-0115-4955-b1e1-04c6888a058b	2026-04-21 09:34:03.620978+00	2026-04-21 09:34:03.620978+00	password	d297d276-8b00-4ac0-bd45-0d72d0a94532
2b9279c0-4a4f-4eed-9695-024509f377a1	2026-04-21 09:43:16.462595+00	2026-04-21 09:43:16.462595+00	password	9769cbc2-a5f1-4620-b55c-8382d172db63
5bd091bb-3bed-48a1-a711-ae5efe05d596	2026-04-21 09:45:38.326437+00	2026-04-21 09:45:38.326437+00	password	98079d91-7c24-45dc-a730-1cbdcf68d2e2
aa2d84b3-9ce8-47ab-9a46-1c8f217f33c7	2026-04-21 10:05:18.212638+00	2026-04-21 10:05:18.212638+00	password	64362f92-cd72-460f-8aa8-3563b40c5f10
7afd0f31-2743-44ec-bb37-9c04c420ad76	2026-04-21 10:23:31.734769+00	2026-04-21 10:23:31.734769+00	password	53c5c204-7c3c-428b-8e60-92d7983847b1
2ec4f7ca-f30e-47e9-bca4-650e6fad1746	2026-04-21 11:23:58.985735+00	2026-04-21 11:23:58.985735+00	password	20d7c7db-56f6-4937-9963-01b4be04b02a
44c7088c-9d70-46fa-a1e9-926d32ce10f6	2026-04-21 11:44:41.617911+00	2026-04-21 11:44:41.617911+00	password	1b80e5ee-07d3-4cbe-8665-22b3386f17a7
101323b6-98fc-4195-8fc0-4ca1fbf47fde	2026-04-21 11:57:38.614916+00	2026-04-21 11:57:38.614916+00	password	b5071d66-5a6b-46e7-95dd-8776ff846e3a
0ae6e36f-62a7-4142-aa52-7368a29e83ec	2026-04-21 12:14:24.333511+00	2026-04-21 12:14:24.333511+00	password	61cd98ba-6889-432e-aef3-825994093bc5
0070aa1e-b3cf-4774-9bf9-485481593920	2026-04-21 12:34:09.801573+00	2026-04-21 12:34:09.801573+00	password	ce9197b2-e528-47d2-afc9-e3882a14d439
8ef551b5-c907-438f-8d81-600df81cc266	2026-04-21 13:22:51.40464+00	2026-04-21 13:22:51.40464+00	password	d682abe7-0af7-4612-8422-d88dc59b5ad4
ec12cd64-ab2f-488f-af18-9c6c95724bbb	2026-04-21 13:37:41.772699+00	2026-04-21 13:37:41.772699+00	password	d1be2c3a-2d98-4296-8ce1-537e8276e7c3
8461a33d-ff23-492a-a8af-cc3afc5cb47f	2026-04-21 13:40:58.905262+00	2026-04-21 13:40:58.905262+00	password	bbaa7b3c-195c-4956-b608-a1d8a4bca96a
43621fbb-2dc0-4c3c-9d2d-a4596294b98f	2026-04-21 14:03:34.054554+00	2026-04-21 14:03:34.054554+00	password	86f4c90e-db5f-444d-9616-e4f9fbc1a5f0
4659c0c3-9d21-42d5-a6c0-5afbd49d2f97	2026-04-22 08:12:27.635557+00	2026-04-22 08:12:27.635557+00	password	40acb7cc-fff6-43d1-a90e-935fdfae9012
8eaf4ea0-3ec7-4db8-86cf-47742b902aa1	2026-04-22 08:16:15.387749+00	2026-04-22 08:16:15.387749+00	password	fa912557-487c-46c3-8544-51b332d6ab5f
0ef9c846-ccce-454d-9db8-d92647947e81	2026-04-22 08:20:58.222407+00	2026-04-22 08:20:58.222407+00	password	68329a5d-373c-4548-b4ed-5ddfab95a990
faabf82b-2fff-4557-a6ea-c66c01311ec5	2026-04-22 08:46:28.20404+00	2026-04-22 08:46:28.20404+00	password	1ae9c726-795c-4edc-98c9-019b9ad3c103
da879ca8-521e-4a26-8dbd-1ff07d6b9471	2026-04-22 08:47:25.044012+00	2026-04-22 08:47:25.044012+00	password	65e1bf47-28d9-4622-976e-4ae7524739e7
48f231ea-f49e-4945-9be4-b66dbe03fdfb	2026-04-22 08:52:11.739278+00	2026-04-22 08:52:11.739278+00	password	4a8722af-35db-40c7-9e5d-29a1eea4a531
2cfe6afd-44ba-49e2-a473-9dff758b101c	2026-04-22 09:02:43.062071+00	2026-04-22 09:02:43.062071+00	password	767e6d7b-bc1c-4989-929d-883d9cce8007
999b6e97-d7be-4cfa-968c-1acf22d0583f	2026-04-22 09:27:41.476496+00	2026-04-22 09:27:41.476496+00	password	d26e1744-8c0f-4dba-972a-c4fd47e36be7
f1bb8e8d-b384-455c-aebf-37f700f708b1	2026-04-22 09:41:24.917593+00	2026-04-22 09:41:24.917593+00	password	30f994be-6194-4645-bdd2-da5f6863aa4c
51c67077-6196-4e95-a31c-9c4f3b6ffb2f	2026-04-22 09:49:44.437179+00	2026-04-22 09:49:44.437179+00	password	ecc01367-bbbf-46e9-964d-ba1f9ae9af75
74608a90-7223-4d02-b769-6ddcd1b5205f	2026-04-22 10:03:30.907437+00	2026-04-22 10:03:30.907437+00	password	abd513a8-3106-4acb-b6a8-0b2f9efda93f
b6b26312-3a67-4c8f-9cfc-422b6958d90e	2026-04-22 10:05:13.684061+00	2026-04-22 10:05:13.684061+00	password	2c484799-ff56-48ff-8eba-06cbd98c6a1f
c2551781-c3ce-4ee1-8ec6-348b3fee7b96	2026-04-22 19:09:40.677484+00	2026-04-22 19:09:40.677484+00	password	add2c733-f540-4e3e-a8fc-05d38b69d8f8
1e7a7642-12e6-454f-9891-6c30574c4e50	2026-04-22 19:43:01.845817+00	2026-04-22 19:43:01.845817+00	password	4f92b058-dba2-456a-abc4-0b7c16d59e67
da5ee521-195b-4d4b-841d-76376c22ce61	2026-04-22 20:04:49.757558+00	2026-04-22 20:04:49.757558+00	password	cfd35180-85f6-41f4-b718-cdb52511e178
3548e4f2-3080-465e-8dcc-2211c702d381	2026-04-22 21:22:22.936462+00	2026-04-22 21:22:22.936462+00	password	c0240234-712d-4b61-a4a5-a2555f9d4852
8f5329cd-ecc8-4e73-9de4-9c443850db33	2026-04-23 02:37:56.685453+00	2026-04-23 02:37:56.685453+00	password	0a5bf6e0-c311-4184-b29c-ab7819cdaddb
6b5facc7-6e1d-4d89-9b17-b08f116058a3	2026-04-23 16:36:00.718899+00	2026-04-23 16:36:00.718899+00	password	8cc62cfc-e7e6-448c-aa5f-9b5efe84a94e
c632cad4-d363-4c2f-911a-6875ed2c45a3	2026-04-24 14:49:34.594661+00	2026-04-24 14:49:34.594661+00	password	1408f778-3aab-49c8-863a-458c1d725f07
9b48f8c6-c5c6-423d-8fc6-40249d752595	2026-04-25 16:34:09.925635+00	2026-04-25 16:34:09.925635+00	password	cdd3ffdd-124b-4361-beab-2378dbe37404
44f8976b-5b60-4567-a016-b9bfbc9fb281	2026-04-25 18:06:44.486143+00	2026-04-25 18:06:44.486143+00	password	b353625a-0f0b-4bab-aced-cf87b7fec728
790d441b-81bf-4b44-af87-3158ed4f5926	2026-04-25 18:18:01.815578+00	2026-04-25 18:18:01.815578+00	password	a528d475-d7ae-473a-b3e4-80771c95f271
34a75b38-5214-4510-b45e-3d75febf9619	2026-04-26 12:06:50.289887+00	2026-04-26 12:06:50.289887+00	password	22938ad1-1f04-486a-b212-af12a22b3f0f
9a95ead5-91a4-428d-9d40-12358ef48022	2026-04-26 18:37:07.040116+00	2026-04-26 18:37:07.040116+00	password	c84baf6e-fa60-4a9c-8c97-58d417623110
30c0acf0-342c-4a5b-a707-896ac20f9729	2026-04-26 18:39:16.178312+00	2026-04-26 18:39:16.178312+00	password	edb38421-7772-4b3c-a698-93477c920b8a
b1ae6216-3c5f-464c-b116-438f9f17a001	2026-04-26 18:39:23.801737+00	2026-04-26 18:39:23.801737+00	password	742445be-80d0-497c-8347-3c6ab1d79e2f
cd103e49-1e7f-42d0-9cca-1a9e13778d34	2026-04-26 18:41:09.902455+00	2026-04-26 18:41:09.902455+00	password	7cd14e8f-a09d-4a2e-afbb-8457ad451a9d
bb0a2b06-8f8f-4272-90ab-eac66b00d606	2026-04-26 18:52:13.486651+00	2026-04-26 18:52:13.486651+00	password	0ff37628-cf67-4fbf-9c1c-0bc9b9d4cdec
cf236015-c95f-4f89-a554-ef0bc6f6f83d	2026-04-26 18:54:49.663884+00	2026-04-26 18:54:49.663884+00	password	204cfff9-f065-44fb-8a95-bcca8c741e52
f818fd3e-a6bc-4560-9b0e-0ff50e1ca196	2026-04-26 18:55:54.059844+00	2026-04-26 18:55:54.059844+00	password	c2ed2146-f48a-4d31-b6d8-f9e0c6de9598
8f0e57f5-d71b-4fc0-8f7d-40655006e4b0	2026-04-26 18:56:17.55298+00	2026-04-26 18:56:17.55298+00	password	ba9ade02-9d08-4bc0-9edd-55378e4b9d4e
ce58031b-6602-452a-ae69-f108aba02795	2026-04-26 18:56:20.878708+00	2026-04-26 18:56:20.878708+00	password	0f1c66bf-1a55-408b-9e69-c9346a9b7b91
b71ce566-ec1a-4701-94d3-ddde63c6d2b2	2026-04-26 18:56:23.078618+00	2026-04-26 18:56:23.078618+00	password	cab81ede-524c-423a-bf84-388bcacdb520
14ac23b7-eb0a-40a0-af5f-6f73e9a11b29	2026-04-26 19:10:57.390216+00	2026-04-26 19:10:57.390216+00	password	049baad9-f726-4696-9f7b-e201890b1644
c4ab8657-2ad2-48d8-b705-0fc19601d054	2026-04-26 19:11:04.797563+00	2026-04-26 19:11:04.797563+00	password	b3e33c4a-fab0-489a-b276-2628c72b914c
e99aaf32-919b-4a77-868d-b85306b0f3b0	2026-04-26 19:14:33.852953+00	2026-04-26 19:14:33.852953+00	password	0ef72aaa-0c98-49cb-91a9-11e5aa594509
b3f18405-aad8-4fc2-a1ef-4e3ae00cf523	2026-04-27 01:22:57.305636+00	2026-04-27 01:22:57.305636+00	password	27bd53a7-b6ab-4fae-a646-d32f22711b93
23a717e4-bab4-4685-b9b9-436c7b0dbe8a	2026-04-27 09:11:33.735373+00	2026-04-27 09:11:33.735373+00	password	30322b05-c221-4362-928f-25a04784f100
cd15abb3-054f-4f32-a66d-3123dcfa2b6f	2026-04-27 09:14:34.650652+00	2026-04-27 09:14:34.650652+00	password	5f2d78c7-5a62-4826-a34c-96d8c5c73543
5a76bd93-a59a-47ef-9d27-f19a3f7476e5	2026-04-27 09:18:52.287984+00	2026-04-27 09:18:52.287984+00	password	cb4941d3-b95f-408a-b47a-4450b90befd6
9fd2b7d9-7e35-482a-a0e4-181fafff35b4	2026-04-27 09:19:34.830206+00	2026-04-27 09:19:34.830206+00	password	a6284624-7954-4906-a364-a90352612598
48f5ae62-0000-4d3c-a1dd-e3d71bf321a4	2026-04-27 09:19:56.285461+00	2026-04-27 09:19:56.285461+00	password	2232ac97-9e3f-47e5-a0e0-4d263067c27d
0e51970c-4cf9-4168-8a09-b8ee8a97aeab	2026-04-27 09:24:19.750427+00	2026-04-27 09:24:19.750427+00	password	5642ff24-a8f9-4266-a04d-515afcb5ac9a
2cfe5268-b632-4977-9eae-277af40534d3	2026-04-27 10:18:48.223191+00	2026-04-27 10:18:48.223191+00	password	4b612c87-6d65-4ceb-b7e4-69bf139809b8
d1ddc40b-366d-4c60-a165-fe06433aedca	2026-04-27 13:27:56.529903+00	2026-04-27 13:27:56.529903+00	password	84743040-6530-42a7-992c-ca4e8b6c07ca
0b89d36d-d364-486f-8a43-aa08792c4568	2026-04-27 13:28:16.208172+00	2026-04-27 13:28:16.208172+00	password	41de613f-3cd9-43ef-9f4e-7dd29f8e2991
a5c8cc11-5c6c-4ced-aca8-398d3b3b0fbc	2026-04-27 13:29:21.566374+00	2026-04-27 13:29:21.566374+00	password	f133d638-56dc-45b1-bbc5-09c6de9bad2f
17f3d22e-91e3-40de-91b7-fda82795622d	2026-04-27 13:35:18.450327+00	2026-04-27 13:35:18.450327+00	password	2d23f961-479c-4948-b9d7-444264a28f50
17c72666-2fbd-4a58-ba3d-f4dfe732cea2	2026-04-27 13:41:39.650658+00	2026-04-27 13:41:39.650658+00	password	ccf466e4-bb5e-4967-a44f-84490a140e37
e4c5c6f5-ca14-4ef7-ae0f-fb4a798e473d	2026-04-27 14:11:56.277173+00	2026-04-27 14:11:56.277173+00	password	041f4aa7-df89-4c38-8127-d39cac001bb1
0fd0925e-b20f-4912-8a3f-a89a45ff3190	2026-04-27 14:12:26.896925+00	2026-04-27 14:12:26.896925+00	password	38f3d32c-bbe4-46d0-a273-ee1f2a736e29
01bf26c7-ea3d-45cb-bc1b-1bc585132186	2026-04-28 07:59:40.049129+00	2026-04-28 07:59:40.049129+00	password	8505cd2b-4e43-44cf-9e16-ef2227f9fdec
a06bc414-86cd-46f7-8b5c-63053c5c4272	2026-04-28 07:59:56.556271+00	2026-04-28 07:59:56.556271+00	password	2e9d271b-0307-4186-9337-377f8efa31a9
c73642c6-34e8-4e3d-848d-ad089694a4a5	2026-04-28 08:01:50.007423+00	2026-04-28 08:01:50.007423+00	password	9f7b5a05-49cd-4dc9-a6df-12a584ad44fb
8f268403-ba44-4c2e-90fd-37cc23dcb81e	2026-04-28 08:01:55.696905+00	2026-04-28 08:01:55.696905+00	password	87c2f308-353b-49ca-b1a0-2e62c98e563e
6e22b5a4-c044-4229-ad99-5dea6c484d75	2026-04-28 09:08:34.050167+00	2026-04-28 09:08:34.050167+00	password	b31fc4a3-85d9-42dc-bbac-e40b994d83c8
0c24e091-2b09-48f4-8145-2d1d3e019fa8	2026-05-01 16:55:35.600714+00	2026-05-01 16:55:35.600714+00	otp	c60bdd04-942e-4228-bf99-9e665ee08ed4
92e48ce7-94d6-463a-9aa3-baf7e4374824	2026-05-02 14:40:53.284344+00	2026-05-02 14:40:53.284344+00	password	865bfbac-f6b2-49bd-a5d1-e58f39178809
183862ea-4727-4972-8177-b6066dabef66	2026-05-02 15:28:10.532837+00	2026-05-02 15:28:10.532837+00	otp	966b3c87-ef74-4470-8281-3ecbadcce622
ca325812-c0fa-4939-abd2-45ef4e88dda6	2026-05-02 15:31:52.391335+00	2026-05-02 15:31:52.391335+00	password	fb92ced3-2876-403c-8630-dfcf796e4fe4
7b3ca30e-371e-4af2-9ed4-0b7f7a850eb8	2026-05-02 15:32:06.65491+00	2026-05-02 15:32:06.65491+00	password	366e5d05-045b-417a-b140-abb1b3b4a0a0
a2bc3220-6376-4b57-9242-d38327872906	2026-05-02 15:34:14.659628+00	2026-05-02 15:34:14.659628+00	otp	4d871afc-cb50-4295-87f2-3f8867839c91
d5a85c46-5d8b-483d-83e2-061f3ea3d7d5	2026-05-02 15:47:00.863852+00	2026-05-02 15:47:00.863852+00	password	b972feb9-bac9-46a1-a178-35d32fd3bf83
6a5167b5-9ec3-496b-9706-d5f56ed42e33	2026-05-02 15:53:24.697956+00	2026-05-02 15:53:24.697956+00	otp	4928fe27-f6b3-4f9e-aa9c-d479dd950cf9
37c166e3-c5fa-497f-b429-3f6b6ce6fbf9	2026-05-02 15:54:04.727162+00	2026-05-02 15:54:04.727162+00	password	54c64e42-a1a4-4285-9166-a1e476ec90d6
11c09db5-72fd-49c8-9cec-cf232f92ce2a	2026-05-02 16:39:12.5232+00	2026-05-02 16:39:12.5232+00	password	2c7fb9f8-446e-471c-86f4-a56118c0a841
d0e9fcb7-ffaa-4219-9906-cf1014b96dbf	2026-05-02 16:50:41.802225+00	2026-05-02 16:50:41.802225+00	otp	71a29ec5-55f9-4583-90cc-0ea468382a16
d523ee02-0673-4b35-92f6-e47d571975cf	2026-05-02 16:52:32.649323+00	2026-05-02 16:52:32.649323+00	password	a9260c5c-9ab3-4103-818b-f1584455d021
ba7cf3da-872f-4b74-b2c2-b832971a8531	2026-05-02 17:05:42.985658+00	2026-05-02 17:05:42.985658+00	password	578815e8-279c-4099-8391-877d8444084f
185dc509-667a-471b-bffd-29b79d825f40	2026-05-05 16:27:42.375643+00	2026-05-05 16:27:42.375643+00	password	1b0fda78-68ed-495e-a082-515d91d8db3f
9b67b961-cf8c-48af-8626-f693cf42d588	2026-05-05 16:28:58.341226+00	2026-05-05 16:28:58.341226+00	password	f77d19c6-80c8-4e00-a0ad-45cc1547523e
290aa276-829e-4bb3-983c-244c7eafbaf6	2026-05-05 16:52:43.28809+00	2026-05-05 16:52:43.28809+00	password	2bd397da-0843-4644-80b8-b23fe62f5276
f531028b-4cb7-4a5e-8c22-e783e8a43fdf	2026-05-05 16:52:58.911545+00	2026-05-05 16:52:58.911545+00	password	98103762-ef0a-4289-a5fa-b6605472bd00
d974503c-1fbd-4873-bf31-6d2467b6d512	2026-05-05 16:54:36.105151+00	2026-05-05 16:54:36.105151+00	password	7425d47d-68f3-4fec-a436-91d0f4381078
5a3c12ae-f861-4b14-adf0-c34acf861c2f	2026-05-05 23:00:43.476709+00	2026-05-05 23:00:43.476709+00	otp	0dfd02a8-1ada-4e70-93ea-eb3d9434367e
9dc3538f-a6e0-41fc-8b24-8672957b9492	2026-05-05 23:01:51.135244+00	2026-05-05 23:01:51.135244+00	password	cb3bb0df-f3b0-4a3f-bea8-6f4f6dfef3a9
c3cddd93-2bac-4943-bab1-d567b666ba11	2026-05-05 23:20:55.888103+00	2026-05-05 23:20:55.888103+00	password	2e79b613-53d1-4abd-b0e3-24cc129767dc
454df8cd-c5f7-48c8-af45-0b36645962b4	2026-05-05 23:25:27.671462+00	2026-05-05 23:25:27.671462+00	password	16ab13b9-4876-41ba-9e0d-f7ad2fc34190
2093b213-238e-4dff-ab1a-8c354b8ed3cc	2026-05-05 23:28:54.533904+00	2026-05-05 23:28:54.533904+00	password	629305af-4e97-4075-ab54-2ef8365940b7
5676f747-d120-489d-bb6a-3af591c092dc	2026-05-06 11:12:44.205161+00	2026-05-06 11:12:44.205161+00	password	3bb9e3c7-5aff-461a-85c6-f61c56c8abdf
c01b9115-e64a-42ed-8f5e-43d05d1f96f1	2026-05-06 12:26:39.784735+00	2026-05-06 12:26:39.784735+00	password	a1f65904-cfab-4364-9923-c54cc5c85240
a04acb19-310c-410b-87f7-aa5e05b9660b	2026-05-06 12:27:00.806344+00	2026-05-06 12:27:00.806344+00	password	dc52a7db-15dc-41cd-ab75-f774c4f623e3
69f6fdb9-62b7-43ee-a815-68981406f461	2026-05-06 13:27:21.164655+00	2026-05-06 13:27:21.164655+00	password	bc35f395-4ff5-4578-aab7-66777b61644f
4a2906ea-5021-4f36-8521-0f8253b7cb03	2026-05-06 13:33:37.39866+00	2026-05-06 13:33:37.39866+00	password	fd1136ae-7cd2-4a3e-b03d-84832ffb8bfe
b06ddd01-48b9-447e-8cfa-86243b62daa9	2026-05-06 13:40:17.739156+00	2026-05-06 13:40:17.739156+00	password	c3b68560-7b2e-45a1-9f8d-586bc3ce1162
baeb1001-0408-4759-bf06-39c128796892	2026-05-06 13:57:05.349226+00	2026-05-06 13:57:05.349226+00	password	3081ed16-29ca-4804-be0c-4db5b764face
d6ed153a-8699-4d6d-be66-a80e0688dff2	2026-05-06 13:59:42.449727+00	2026-05-06 13:59:42.449727+00	password	31ee81e3-9e2f-4485-83db-3d2a9c6a3297
19286646-f4a5-4bfe-9111-8727a3d63951	2026-05-06 17:53:18.809983+00	2026-05-06 17:53:18.809983+00	password	72d07e8e-ba23-4986-8477-e10a91908502
03c0a08f-129f-40d6-a57f-5808ba76f762	2026-05-06 17:56:16.772478+00	2026-05-06 17:56:16.772478+00	password	aa772476-a96e-4df0-bffb-0f7ff5628ed8
9c727d13-6eaa-4513-aaac-ddb86b384542	2026-05-06 18:13:42.734033+00	2026-05-06 18:13:42.734033+00	password	d3129255-6766-46ba-b32c-5386780498dd
d0594a16-ce8f-4492-970b-38198b59593e	2026-05-06 18:23:50.805649+00	2026-05-06 18:23:50.805649+00	password	73e6a459-bb5f-4604-b407-a4248c14b675
06745cf3-f2e2-401d-a58b-40c38d04a049	2026-05-06 18:54:19.089418+00	2026-05-06 18:54:19.089418+00	password	7b72f890-b664-44b5-b994-b9f290d10e75
e0cf72ee-6063-4ee4-899f-e2307ef94de1	2026-05-06 19:02:12.859879+00	2026-05-06 19:02:12.859879+00	password	ecd1192e-f7aa-4a39-ac6c-393ff433c6c0
a60799c1-c90c-4b06-af10-c45e8a3c6172	2026-05-06 19:28:11.266968+00	2026-05-06 19:28:11.266968+00	password	62b1f3f0-b0ab-40a5-a1f7-a641a75bbf98
a6640a81-cc2d-445c-a5b3-af96e8972927	2026-05-06 19:32:02.049668+00	2026-05-06 19:32:02.049668+00	password	3313208a-cb53-476e-a4c9-5bee0845cdad
f6b76586-888d-4ccb-85f9-e481a494f50c	2026-05-06 19:45:13.128652+00	2026-05-06 19:45:13.128652+00	password	c3b69dbb-dc02-4232-8f6f-52ad32295a38
2ca5094f-d5a1-4e73-8989-e6eb4e4a3827	2026-05-06 21:27:43.304436+00	2026-05-06 21:27:43.304436+00	password	86123614-f9ff-4b8a-a1b6-cdd7fd123ac2
098bc351-31a2-4eed-abf6-2cb3b45b25a4	2026-05-06 21:29:17.302544+00	2026-05-06 21:29:17.302544+00	password	cc3e0c95-522f-4ffa-86d5-24adb8c2fd4c
77911b5f-1545-4af2-b2f4-304a84bc932d	2026-05-06 21:40:32.288179+00	2026-05-06 21:40:32.288179+00	password	6a5bde55-97c5-4ddf-97d0-8e24210f30ae
99be4e3a-7f9b-424c-93d9-d4fb98520715	2026-05-06 21:41:27.07158+00	2026-05-06 21:41:27.07158+00	password	91413ba9-883f-4402-93cd-3300da9af0a8
ae234f65-1f04-4ae1-b04e-3e58ee7d8c3f	2026-05-06 22:13:35.700006+00	2026-05-06 22:13:35.700006+00	password	5fedca2d-69d1-4494-837f-d6722fadf1e4
3589cc9a-7daa-4bca-a9a0-03ab5682fe3a	2026-05-06 22:35:44.169899+00	2026-05-06 22:35:44.169899+00	password	ec8d7a5d-9a0b-4b81-a10d-4e7e8640958a
1862011f-8561-40a2-852d-eda6574bc4ef	2026-05-06 23:29:13.683606+00	2026-05-06 23:29:13.683606+00	password	29035256-9c17-414b-9879-b27f1a1f10e1
c3d13b14-2b54-4d78-86bf-2317c39010aa	2026-05-07 05:32:03.722215+00	2026-05-07 05:32:03.722215+00	password	2df3c232-89d7-4646-9a46-19524e2c4269
1fd609e2-6165-43a7-b943-5b5478ebce35	2026-05-07 06:07:20.273274+00	2026-05-07 06:07:20.273274+00	password	132d83e4-68bb-4870-b9e9-cc42a03cee8c
974f5670-9ae0-4ab8-b0d3-542b7832f36c	2026-05-07 06:31:47.035856+00	2026-05-07 06:31:47.035856+00	password	ce5d9c42-ba0e-4209-af07-d172b0f77507
aec72b55-d2cc-4ed3-9119-686d94ca66e5	2026-05-07 06:38:15.854491+00	2026-05-07 06:38:15.854491+00	password	dfae85df-5ca1-48b9-a207-1b1ab07fc73a
001bb9d8-a1a4-4934-9f14-fff589def86d	2026-05-07 06:43:33.096307+00	2026-05-07 06:43:33.096307+00	password	64a137f0-1cbe-46bf-a7bb-ad6b70c0b690
5c5db3eb-1ed8-4b13-981a-c33a762f24f7	2026-05-07 08:48:29.220066+00	2026-05-07 08:48:29.220066+00	password	5b774051-d550-487c-947d-afd5ff1e48f5
964215c7-37f6-47ca-9fb7-b9b897c9d787	2026-05-14 17:35:32.955039+00	2026-05-14 17:35:32.955039+00	otp	75f789c9-4e8f-4a41-adad-3634d6e323bf
9a1ab8e0-b88a-41f0-970d-0c41d65a4976	2026-05-28 16:14:23.056446+00	2026-05-28 16:14:23.056446+00	password	20049cbe-fbe5-43cb-a9d7-56c185583870
4428c425-2ab0-42c3-a138-db02b62d7299	2026-05-28 16:29:32.642126+00	2026-05-28 16:29:32.642126+00	password	7d0f5ec1-313d-418f-8192-4590251bb9c0
3b2e73b8-20ba-47e2-9bf7-1e00c0c6a0ab	2026-05-29 18:00:27.335887+00	2026-05-29 18:00:27.335887+00	password	6f378836-39bb-4ae9-a99e-deb0a9ddbd0d
ac73f2c4-861c-4e41-b137-3180e719d10d	2026-05-29 18:01:13.721236+00	2026-05-29 18:01:13.721236+00	password	bee56172-1038-486b-bba7-87cd9874605f
a9b47e58-51a7-4617-8efe-52cd2714f58b	2026-06-16 01:57:29.286051+00	2026-06-16 01:57:29.286051+00	password	debcce42-1795-4981-a6f4-609ab28d6d69
ab8f8c69-325c-4b02-87d0-3f168cf037a1	2026-06-16 02:37:59.469539+00	2026-06-16 02:37:59.469539+00	password	cb519fed-14db-4a5a-b40e-911182c75e84
a2e95855-fca4-4f3e-b444-58218c527ca7	2026-06-16 02:50:42.810102+00	2026-06-16 02:50:42.810102+00	password	cb52504a-9e82-4cb4-a5bf-44be4573b35b
672cc515-9d2d-491f-a8a2-afaef289b4a1	2026-06-16 02:53:35.846498+00	2026-06-16 02:53:35.846498+00	password	f9abf661-8a2d-4ffd-9617-b1274ff5043b
3bb08b99-3018-4e73-a7fe-987d315c9b9f	2026-06-16 02:56:58.947817+00	2026-06-16 02:56:58.947817+00	password	14ebf580-d93f-4a6f-8546-d40ffb6709b5
f0669765-a810-4363-afbe-f5b39adacb3d	2026-06-16 07:41:17.999754+00	2026-06-16 07:41:17.999754+00	password	b584ddcb-ca91-4d42-b903-10f81285c4b3
3691e00d-68a8-4685-9518-aac799c15572	2026-06-16 09:45:48.066695+00	2026-06-16 09:45:48.066695+00	password	c373ae5c-1ae1-446e-81c5-c7e1c05973b8
d8518ea2-33ab-4758-bca3-9cc0811a671f	2026-06-16 09:50:53.583243+00	2026-06-16 09:50:53.583243+00	password	3bae50a0-bef9-4443-96ca-4f94d54df970
3216b3b8-25d2-4f3b-9dc6-f90621016ec0	2026-06-16 09:51:59.315478+00	2026-06-16 09:51:59.315478+00	password	e8c9db52-3937-4809-a7f7-27fabff913b3
e0848fdb-c73a-490e-bb56-a56cad885199	2026-06-16 09:53:53.550564+00	2026-06-16 09:53:53.550564+00	password	b1fa8e90-8bcf-4ad6-b2d9-6eefd9afbb2f
0b97748c-ad45-4813-b3f0-f49755807239	2026-06-16 09:53:57.10829+00	2026-06-16 09:53:57.10829+00	password	32814ff2-7bf5-41a7-9389-210541b66569
9020a286-887f-4093-95a4-06f3ae509cae	2026-06-16 09:54:00.825581+00	2026-06-16 09:54:00.825581+00	password	962a4b7e-c5e4-44bc-95ae-5e9aabf436e0
946587e6-d4f8-4686-9c43-e5228df3a1ed	2026-06-16 09:54:19.675379+00	2026-06-16 09:54:19.675379+00	password	34f63af2-d27d-4249-909a-9adfb0eb46d4
4ba6a66a-d1be-4700-88a2-8379f8d38d38	2026-06-16 10:00:43.480028+00	2026-06-16 10:00:43.480028+00	password	e1818304-c0d1-4863-8945-5ebf5f381fb1
3718d672-abbe-40c8-9ba9-f6574b8be2fd	2026-06-16 10:01:10.216992+00	2026-06-16 10:01:10.216992+00	password	1b95fc71-e881-4e26-99f8-e4e842587b5c
66d00bfa-52a8-46a4-a664-f9dc6b3937d8	2026-06-16 10:01:34.4109+00	2026-06-16 10:01:34.4109+00	password	396679d2-44bc-4b9a-96cc-8562974f6f21
346dfe1c-bc0a-4069-87e4-4a81ae852af0	2026-06-16 10:02:09.285531+00	2026-06-16 10:02:09.285531+00	password	b9269d01-2e38-42af-8735-0549e8e7875a
56e5c6d1-9af7-4787-b8dd-38ee672c2001	2026-06-16 10:02:52.588231+00	2026-06-16 10:02:52.588231+00	password	78eac14c-cd32-4bc4-8b7b-1ff0055500c1
e6b25c9b-5e03-4d3a-b096-d8e15f81641d	2026-06-16 10:03:12.056109+00	2026-06-16 10:03:12.056109+00	password	5e079d3d-9738-4e83-87e1-a5a10ade2098
d98704f5-9067-4aa4-8a4e-598b3a02efa5	2026-06-16 10:06:13.188472+00	2026-06-16 10:06:13.188472+00	password	ee44b302-7e97-4a29-81c9-70681878a5a6
60f1f219-097a-4f1a-a87b-e983b8e129a0	2026-06-16 10:27:40.463908+00	2026-06-16 10:27:40.463908+00	password	d77aa0be-1765-498c-8da7-d0c63813719a
c7284af3-89e4-4ef4-9f80-9677fcf996d1	2026-06-16 10:29:18.563135+00	2026-06-16 10:29:18.563135+00	password	a5a94e3e-6f05-4562-9ecf-5937e4db6d8d
f7ed7a83-acba-4a03-bd10-9036a316ca34	2026-06-16 10:57:26.83488+00	2026-06-16 10:57:26.83488+00	password	15759ed9-215c-4bde-93c3-045c9eda8028
1620a02f-df61-4cab-ad77-3caaed8aa86d	2026-06-16 11:01:34.721515+00	2026-06-16 11:01:34.721515+00	password	53840e28-c8e8-4105-8ada-84aa98e71ed3
c1f0c4d8-c958-43d2-ba1c-251d260d96a2	2026-06-16 11:12:21.810072+00	2026-06-16 11:12:21.810072+00	password	7f58e5b7-baab-4c37-8fe1-43ff2b1ca3f0
9e8dd69c-099b-43b1-ad82-b1ef654c2aea	2026-06-16 11:17:56.021303+00	2026-06-16 11:17:56.021303+00	password	32f47a29-4681-4642-84e9-03cae1080ed6
1f0b8520-1620-410b-a82d-bca0d6ef6b5d	2026-06-16 11:28:03.595627+00	2026-06-16 11:28:03.595627+00	password	cfa07613-8a59-4920-82bd-3c3dc0c74ff3
10b12a90-4971-452d-807a-548bc4dc8486	2026-06-16 11:35:04.704046+00	2026-06-16 11:35:04.704046+00	password	58746121-96ba-478e-82aa-fcfc4e2c83d2
6729aa92-73e7-4861-b63e-067d589a2b3e	2026-06-18 07:42:35.379076+00	2026-06-18 07:42:35.379076+00	password	f84c7117-a4a9-4dee-8143-dd28c7e39d51
09d3ae6b-f13e-4db8-b73c-75c697e00dd7	2026-06-18 09:19:01.991274+00	2026-06-18 09:19:01.991274+00	password	20e35380-4a93-4cb3-9eac-71e34b3f77ad
016b3e68-b87b-49e4-8a6c-59775e3dda6d	2026-06-18 13:23:15.580106+00	2026-06-18 13:23:15.580106+00	password	497e4bdd-1860-4f7a-8a3c-f3dc7caddce2
6a512da5-2aaa-4a86-971e-f4da822116f1	2026-06-18 13:37:35.712947+00	2026-06-18 13:37:35.712947+00	password	97d61463-a9c3-41d2-ba43-6b346ea999b3
5b19b13c-bbc3-4603-b974-314428e4e383	2026-06-18 14:33:54.29701+00	2026-06-18 14:33:54.29701+00	password	b83ec517-636c-49bf-83eb-08b5ec65f7cb
13373f67-e667-407f-9c9d-1cf6632ab432	2026-06-18 14:39:10.025866+00	2026-06-18 14:39:10.025866+00	password	d03dc8ae-c094-4703-bdeb-c00459126bc0
147517e3-4cf4-4eb4-80a2-a15209ee21a5	2026-06-18 15:35:17.881903+00	2026-06-18 15:35:17.881903+00	password	23bbf24e-6706-4a7f-a5d5-7677439a15af
ce16c67e-cd9a-4a29-9a8a-7ad7c50995d7	2026-06-18 15:39:37.143326+00	2026-06-18 15:39:37.143326+00	password	a875b0f0-fe4b-4095-a71c-6ff6b9a1c7da
3abb80de-4452-411e-a3b7-c0b7483a953d	2026-06-18 15:43:06.422711+00	2026-06-18 15:43:06.422711+00	password	14d03c63-924f-4903-8b6c-13baec28194f
c58dc233-3d1b-4ad6-8eb7-adb3a45fc041	2026-06-18 15:50:06.169744+00	2026-06-18 15:50:06.169744+00	password	a99ebefc-01c6-44fa-ab3d-ad2e4a2e2b61
a851c3b3-e807-410b-8614-117bdebce239	2026-06-18 15:56:33.809881+00	2026-06-18 15:56:33.809881+00	password	c5db1597-6510-435e-8ee3-6618364dd832
51c4cecc-a7cd-49b1-abf9-5972446612dd	2026-06-18 15:56:57.766085+00	2026-06-18 15:56:57.766085+00	password	ef8d80ef-4963-4d9f-8fd3-92440fb6e466
7f86b4b7-a247-4486-91f5-baa9449b69d6	2026-06-18 15:57:40.429632+00	2026-06-18 15:57:40.429632+00	password	7efc0c67-1ef8-44f1-964d-ac17dbdca5b5
dd00f352-4442-4bd8-902b-9c813f56a95e	2026-06-18 15:57:59.073788+00	2026-06-18 15:57:59.073788+00	password	c5e1535c-bb8b-4f85-8f4f-5ee82a496c90
9fe72ef4-a9bc-404e-94ed-c0e20714a701	2026-06-18 15:58:58.101913+00	2026-06-18 15:58:58.101913+00	password	b5fa066c-fd55-43b0-a8d6-a1903ab773df
1336a58c-748f-4faa-a3e7-04d82a0e544a	2026-06-18 16:34:52.598591+00	2026-06-18 16:34:52.598591+00	password	e6ec1bcf-4844-40f9-82f0-8cb1139753a5
82fa1d6e-9a3b-46d4-a376-45de0d0935d1	2026-06-22 08:09:57.326452+00	2026-06-22 08:09:57.326452+00	password	4d3495ed-1a38-4dd8-a5ab-4c628b824c4e
5b6c48f6-ee0b-401a-9b70-03c902c8d08b	2026-06-22 15:24:53.866726+00	2026-06-22 15:24:53.866726+00	password	223e1d03-5d29-4212-9aec-b36f3bfcb1a7
17f6b45b-c2cd-4e22-9ce8-cba4d1dd3180	2026-06-23 08:14:53.369108+00	2026-06-23 08:14:53.369108+00	password	1f3d4a69-6f52-4b18-a4b6-1fd3ae782e3e
49b0da04-d076-4a5b-a247-41607dee0317	2026-06-23 08:26:30.021747+00	2026-06-23 08:26:30.021747+00	password	5d96349c-2b72-41b4-bdfb-93fca58606a3
b2bf7dde-32fd-4e53-b42f-87e4b7bbaec0	2026-06-23 08:34:38.686307+00	2026-06-23 08:34:38.686307+00	otp	32ca6484-2864-4234-8147-3a27ec4eb100
e304f791-828b-494d-aa78-0ed23c58263d	2026-06-23 09:13:41.907851+00	2026-06-23 09:13:41.907851+00	password	e90d3f16-d307-4c7b-9ba5-efef7b2cf05f
086c918d-c3fb-4c1f-8c7f-17af0fe25208	2026-06-23 19:53:51.453417+00	2026-06-23 19:53:51.453417+00	password	d45039ef-8bcf-408b-8edb-a485506ff8ca
9fae5eb6-f3db-4b1d-b787-c96e32ff7a84	2026-06-23 19:57:53.270396+00	2026-06-23 19:57:53.270396+00	password	5e179173-d6bd-4241-9bfc-b243dd8bfe45
a97872cc-b21f-4ae0-9f15-4598b6f4d541	2026-06-23 21:06:41.684924+00	2026-06-23 21:06:41.684924+00	password	22d8919f-6870-425f-9bf9-ad7bf105e4cc
08a492df-078a-46b0-ab64-b3e292017f2b	2026-06-23 21:06:59.723542+00	2026-06-23 21:06:59.723542+00	password	bd4c7285-df03-4009-b07b-1b236f48afb7
347af834-4e9e-47c6-a414-0365e53473b2	2026-06-24 04:32:52.581661+00	2026-06-24 04:32:52.581661+00	password	57a1d4aa-3813-4ab4-909c-b111b50b9bde
d3e17673-34e2-49d1-adbc-70421d441351	2026-06-24 05:44:42.722049+00	2026-06-24 05:44:42.722049+00	password	62fbbfb3-4d80-457e-9570-aabf4398400a
438d43fd-5cb9-4d8c-a976-e89a6b0ecbc7	2026-06-24 07:25:36.333741+00	2026-06-24 07:25:36.333741+00	password	aa08c0c6-1d5c-44a9-843e-0fb802cacfb9
178bc92c-95f5-4147-a4ef-90a95c7ca23f	2026-06-24 07:27:41.951423+00	2026-06-24 07:27:41.951423+00	password	d28e3c9f-a90c-4030-a155-7d05b8fadbc9
d2de8e17-f3a8-405c-8750-6c23a014e9f4	2026-06-24 07:39:58.79835+00	2026-06-24 07:39:58.79835+00	password	88880ec4-1dea-4cef-8114-69c99786af47
03ee2572-6b54-4877-9fd1-0379f90b7c11	2026-06-24 07:43:42.791954+00	2026-06-24 07:43:42.791954+00	password	01c7bdff-58c0-4d04-be4a-616985c6c5ac
61950309-93ba-4cf4-8bd5-b06d28c22523	2026-06-24 07:45:14.549243+00	2026-06-24 07:45:14.549243+00	password	0ace9908-3185-42d5-9b9f-ba257c4b7fff
11fc9255-2578-438e-b1d5-8c2163259454	2026-06-24 07:50:31.80857+00	2026-06-24 07:50:31.80857+00	password	224964bb-a541-4d1f-8764-3254080fb842
369dfe74-d319-4dd7-93b8-efeb00e35b4b	2026-06-24 09:13:18.316227+00	2026-06-24 09:13:18.316227+00	password	cf5f1aac-cd81-4a91-8917-ee8970c3215b
a8a32673-c279-4a03-b2ae-1682e13f86d3	2026-06-24 10:04:21.988122+00	2026-06-24 10:04:21.988122+00	password	50ff2566-7980-4690-b095-578559542bec
9e243095-0770-4fa5-b105-94604cd29405	2026-06-24 11:15:26.434983+00	2026-06-24 11:15:26.434983+00	password	b8e7c250-b8f1-40da-bf12-b8e2e1cdc5d4
05b087b9-005c-4261-9411-428968b60b53	2026-06-24 11:23:01.01703+00	2026-06-24 11:23:01.01703+00	password	4780efd9-0ef4-4fbc-a215-287011153b97
12ccbe00-4f42-4abf-a8a4-cf4368d0b23c	2026-06-24 11:40:03.395936+00	2026-06-24 11:40:03.395936+00	password	af69133a-cc59-4be1-961a-685f484cd379
def6cf54-03d5-4ff6-9424-1b36de105103	2026-06-24 11:40:41.126301+00	2026-06-24 11:40:41.126301+00	password	080d0527-e822-4400-b2c4-8a7fb5c3b3b1
44685fd7-0313-4ff8-a606-abcfd560dd2e	2026-06-24 11:44:39.89308+00	2026-06-24 11:44:39.89308+00	password	44f58a77-dbb5-4a2a-b92f-e12be6352a8a
d638375c-919e-4de9-a9a1-eebcab1f53b7	2026-06-24 11:46:25.951547+00	2026-06-24 11:46:25.951547+00	password	154e5369-7034-4d4c-9b0d-d4a9b83e3170
812b311d-0fe6-49f7-901e-212e23a2be7a	2026-06-24 11:48:44.895176+00	2026-06-24 11:48:44.895176+00	password	d660564d-1831-4df5-a5fa-18beab1ceb74
def3f7b6-c681-46d6-9c0c-35b3edacd666	2026-06-24 11:53:08.50267+00	2026-06-24 11:53:08.50267+00	password	204c60d3-59db-462e-9f39-fdd6472e28d1
7a409f45-0bc7-471b-b714-16907305c52d	2026-06-24 12:06:56.661328+00	2026-06-24 12:06:56.661328+00	password	15e374de-ecf7-4efe-bcdc-7bbd4ef7e786
c7611fe8-8933-47a9-b39a-115c167f8da0	2026-06-24 12:27:10.857265+00	2026-06-24 12:27:10.857265+00	password	690c6d5b-7284-4263-9db3-9f9d36a36192
c211b568-6517-487e-a4d7-9d3f0cf2a715	2026-06-24 13:27:36.715135+00	2026-06-24 13:27:36.715135+00	password	48516586-ace3-4439-9066-72e289f30a49
9a818d3c-95c2-4058-b55a-543cf13ccf44	2026-06-25 11:04:43.878446+00	2026-06-25 11:04:43.878446+00	password	4f7a1568-b7da-485a-9c2d-ffa1152f2a12
3217c3f5-eaef-4c2d-8cd2-54b7d8d65da4	2026-06-25 14:26:12.428021+00	2026-06-25 14:26:12.428021+00	password	1715c89c-7307-4873-a369-a01f549a2406
c7c7fd48-ab90-47ef-bce9-a68fb844053b	2026-06-25 15:32:23.026216+00	2026-06-25 15:32:23.026216+00	password	7ec40b0c-6e4c-4f68-a87a-01195f3d488f
e6237a83-84b8-46fc-8d96-7104fe5e7523	2026-06-26 10:30:26.059306+00	2026-06-26 10:30:26.059306+00	password	7d1fa81a-7e36-4236-8347-cd1c4209bc3e
d25968cf-710a-465d-8728-9cad7399fe75	2026-06-26 12:48:37.323099+00	2026-06-26 12:48:37.323099+00	password	3e2a8cb4-937c-410b-9794-7fc38b96bb12
27eef67a-77c5-409e-9fea-966e01700270	2026-06-26 12:49:39.697334+00	2026-06-26 12:49:39.697334+00	password	9ec9efd2-7cba-45fe-8166-8aa7205dc53b
a2c0e8ee-5be5-4a83-a075-7255333e5171	2026-06-26 17:40:34.552924+00	2026-06-26 17:40:34.552924+00	password	ef2f6888-8275-4667-b8ba-40ad04f31239
a292b143-868d-4364-9d18-b29c2f042f75	2026-06-26 17:51:32.940361+00	2026-06-26 17:51:32.940361+00	password	c94e6f5b-445c-4c33-b0bc-9056dc6a0527
dee66597-2029-47d7-9473-cb494067d746	2026-06-26 17:56:36.874065+00	2026-06-26 17:56:36.874065+00	password	3f32a39a-7ad0-4bfe-a992-13857c129c8d
0dfdeb60-ce1b-418c-92a6-b2f051d1115e	2026-06-27 07:59:18.961763+00	2026-06-27 07:59:18.961763+00	password	cd4104f1-a719-4340-a1cc-a51a3c5f2126
36d86707-40a8-405c-844c-101effaaf511	2026-06-27 08:07:45.169803+00	2026-06-27 08:07:45.169803+00	password	d88e6cee-99ed-4631-b922-b3f7831f059c
270fa836-0345-41d9-90ef-b29d05bd3e70	2026-06-27 08:15:46.417068+00	2026-06-27 08:15:46.417068+00	password	78c36d20-89ca-43fb-a96a-7038b3b8fbfb
c37b3084-9ef2-4cec-b322-11173127c5e8	2026-06-27 09:25:21.166489+00	2026-06-27 09:25:21.166489+00	password	8827f193-2f1d-4733-a7ad-1737138164f9
a183883b-48c0-4d9b-ab19-d033887855b1	2026-06-27 10:51:27.828358+00	2026-06-27 10:51:27.828358+00	password	99e7dc6c-361e-4b20-89f9-a1b93071d6a1
a00d3d0f-9262-45cc-8efa-e0bb58321ba6	2026-06-27 11:30:24.892512+00	2026-06-27 11:30:24.892512+00	password	b3e9501d-56c9-4fc9-a653-cf210c2936cd
d34b1d5a-31f1-47cc-850a-ec60d7f79461	2026-06-27 11:34:11.665499+00	2026-06-27 11:34:11.665499+00	password	5e13924a-b9a0-4c2d-9369-5f7b8a1a565c
dc1404a4-64ca-4120-aaa4-6af6e81e72f9	2026-06-27 11:36:05.151451+00	2026-06-27 11:36:05.151451+00	password	e6907a83-7c04-45d7-a1de-982daec72621
7726b4dc-9e2a-4b06-a215-4c468242af9d	2026-06-27 13:53:10.713023+00	2026-06-27 13:53:10.713023+00	password	78329fd4-313f-4cdd-b13f-2c8f0ab5a8de
093d184a-2895-4d9b-b2e9-fbcf150ade4e	2026-06-28 06:48:48.205247+00	2026-06-28 06:48:48.205247+00	password	015a7803-87d6-4417-bc22-8a09f58beb1f
2e12a7f2-bbd8-4eb1-b9c1-a46b19725af2	2026-06-28 09:08:31.523161+00	2026-06-28 09:08:31.523161+00	password	9b45cfec-c554-4997-a9e3-dcc8b5e3b2e3
9a25567d-d027-4843-b137-260cd474ff43	2026-06-28 13:02:27.429762+00	2026-06-28 13:02:27.429762+00	password	ff7411dc-5a61-4d6e-a07e-ee759a03120f
6a8a0199-84c9-40e5-bb59-5ec21d04419a	2026-06-28 13:08:36.733535+00	2026-06-28 13:08:36.733535+00	password	df21ab05-8c83-4fbc-9c19-3f9809306357
7d420141-0c30-4f95-a61a-f2d7d34c3116	2026-06-28 14:23:37.843056+00	2026-06-28 14:23:37.843056+00	password	77a7df34-02c1-49ab-8106-99ede6a57621
23b9a56c-7f68-4a50-b7c4-ae0d9509327d	2026-06-28 14:45:16.137288+00	2026-06-28 14:45:16.137288+00	password	38e3caba-8eae-4b4a-95f5-b42ffd69fb27
62c5ba4f-b8c9-4e7e-bfc0-29ea74e40a64	2026-06-28 14:50:10.354358+00	2026-06-28 14:50:10.354358+00	password	b5c34aaf-a902-4432-9e86-0b2abb6f89e5
9e691df4-4d12-4f5b-935c-3dee3be436f1	2026-06-28 14:59:42.839121+00	2026-06-28 14:59:42.839121+00	password	1dcea5f9-297b-42e3-9ac3-fde86d7706af
c6b4abbd-020e-49b5-bad2-e3b7d5d0fb52	2026-06-28 16:04:00.448689+00	2026-06-28 16:04:00.448689+00	password	0f2159af-dd10-45d0-8e2f-b1fffb205263
76e72c65-c8e1-4ea2-960e-f877d838e954	2026-06-28 16:18:23.526839+00	2026-06-28 16:18:23.526839+00	password	e6cd9a70-5bf9-4262-a71c-9cb59946f14e
eb81acd5-6448-495b-ace4-1558e39bc12f	2026-06-28 16:26:06.289772+00	2026-06-28 16:26:06.289772+00	password	f5ba77d8-0d54-4cf5-949d-1b9fe43cc96f
2634b991-6f48-4dd6-bf6d-797475e0185c	2026-06-28 16:28:06.347378+00	2026-06-28 16:28:06.347378+00	password	1994a177-8ce5-4bdd-9a52-4f52f808d173
57a1936f-620c-4cec-95f5-57b9485d9598	2026-06-28 16:45:13.260407+00	2026-06-28 16:45:13.260407+00	password	aa497226-38ab-4af1-a599-a4ae41c603ed
9e42e1d5-d975-498e-a90e-14ee2a43e693	2026-06-28 16:45:21.227078+00	2026-06-28 16:45:21.227078+00	password	c4c07d81-1943-4ef2-99ad-0e6cba44b96a
ff71a1ac-f6fe-4865-bf58-4e00b1a48e1d	2026-06-28 16:59:26.456354+00	2026-06-28 16:59:26.456354+00	password	242b8955-e9e1-4f9f-a538-9e76de6284e2
40d37eed-04e8-45eb-bd79-6dded3a9c40c	2026-07-01 05:05:33.328047+00	2026-07-01 05:05:33.328047+00	password	d9430cb8-b5c2-4040-8a55-6a18bfd96248
aef8b3d5-aeda-42be-bfb3-66ed21687b83	2026-07-01 12:22:12.60405+00	2026-07-01 12:22:12.60405+00	password	7ce66bd5-3245-4143-822b-7f8e18031d88
a47701cd-e6e0-4358-bc19-960216cac6dc	2026-07-01 12:28:21.546569+00	2026-07-01 12:28:21.546569+00	password	e12ce73f-4e59-4489-ad03-89cc7fc6e34c
0484b60c-16fb-4929-bf20-d4d398622afb	2026-07-01 12:30:58.537523+00	2026-07-01 12:30:58.537523+00	password	f9ffd34f-47b5-4516-9e8f-72d7dc669afa
dff19de4-faa3-4a02-a4c6-145be6dcb134	2026-07-01 12:35:52.642718+00	2026-07-01 12:35:52.642718+00	password	35f354be-fbfb-401a-a81e-dc4bc588db28
effe1c99-e5ae-46ae-968f-4c6738c9a5dc	2026-07-01 12:43:54.97142+00	2026-07-01 12:43:54.97142+00	password	e4703a1b-bdbb-4a23-af8f-36ad8bbc9d7e
8fa90260-7b1b-4422-8cb8-94d5d3afe959	2026-07-01 12:45:24.246462+00	2026-07-01 12:45:24.246462+00	password	1f14ebfb-e301-43d6-b6e0-3f8a3f6c5bf9
dd8f2dd3-c3f9-4c18-8b51-0c572ba5b941	2026-07-01 12:48:15.182101+00	2026-07-01 12:48:15.182101+00	password	1ea9acdf-f625-471e-acb4-0864d553a0a4
d4cf4307-b027-4379-bb76-c0f4a70dba66	2026-07-01 12:57:34.575739+00	2026-07-01 12:57:34.575739+00	password	db01eecb-c70c-4f06-aa65-15e4a755d863
b22262d4-b36d-4f33-b418-2a1ef937483d	2026-07-02 00:20:16.092512+00	2026-07-02 00:20:16.092512+00	password	5b43306d-3508-496d-aceb-b6d7216dba8a
25ed5edd-0ff4-49b7-839f-be90a7e2b882	2026-07-02 05:35:22.729687+00	2026-07-02 05:35:22.729687+00	password	0e2bc07d-be10-4e47-b69e-d1a9702217a5
60834222-f8d7-4021-af19-a895ad0b43d0	2026-07-02 05:49:45.810385+00	2026-07-02 05:49:45.810385+00	password	0e227d47-d6fc-4c24-b3f1-d4af143895c7
339b80af-0801-4629-b7e9-96f497769bc6	2026-07-02 05:56:05.121191+00	2026-07-02 05:56:05.121191+00	password	512925b4-002e-437d-9746-0bbfd0a79bf5
f41ea936-d28c-4876-89e2-bb4706bd27b3	2026-07-02 05:58:44.13842+00	2026-07-02 05:58:44.13842+00	password	567f0c8f-be67-4b8a-b4d7-3952be0e26f1
30abb730-0f9d-454d-8b6d-431fc498e12b	2026-07-02 06:04:56.607518+00	2026-07-02 06:04:56.607518+00	password	ba073c62-608e-4c80-ae67-39af562b2eee
9dab6eac-0400-44a6-b9c2-f19bd82ecfdb	2026-07-02 06:18:25.859573+00	2026-07-02 06:18:25.859573+00	password	fac2e4ff-e550-439f-9a01-df90eb5de27b
00e259f1-20df-4f3c-92ea-20842564d02a	2026-07-02 06:19:37.655828+00	2026-07-02 06:19:37.655828+00	password	230e7cda-f519-42a3-b465-aaa3c229b489
f0ae6279-dc80-44ba-8c5a-6bf63164a250	2026-07-02 06:48:32.276519+00	2026-07-02 06:48:32.276519+00	password	8a73a3d5-f364-43ec-ae70-8cc21b1fb876
2dba5aab-4028-4718-8a4b-887badc6c2bf	2026-07-02 06:50:51.206999+00	2026-07-02 06:50:51.206999+00	password	4658cac6-e3cd-47e7-b518-fb6d6a6d78a6
25794285-5eef-471f-baa9-0f0facdff7b8	2026-07-02 07:14:37.063483+00	2026-07-02 07:14:37.063483+00	password	3b788eed-4fa2-4105-9f14-43484974a7da
61c31b01-30a8-4f95-9d08-74f639ed6d9b	2026-07-02 07:28:49.878995+00	2026-07-02 07:28:49.878995+00	password	ad148925-6a1c-4819-a7d7-7112db34d2e5
6eeb59f8-5c9d-4020-a6bb-f65647eb786e	2026-07-02 07:49:13.789409+00	2026-07-02 07:49:13.789409+00	password	b645d775-9bf5-4548-80c0-976409ef2e0a
74eb08b6-a9ae-4ae1-a934-cbee1cbd064e	2026-07-02 08:09:37.104491+00	2026-07-02 08:09:37.104491+00	password	4eae8199-0c64-40d9-80cd-23dc2b7e0fba
facbc276-531d-4d31-a306-3ec0ee140a1d	2026-07-02 08:22:50.902756+00	2026-07-02 08:22:50.902756+00	password	a2960111-1ff4-4368-b7ee-ceb79a42bb42
456c12a1-6046-4418-9c6f-7db79e705be1	2026-07-02 08:27:09.133883+00	2026-07-02 08:27:09.133883+00	password	f0e2b5d7-c528-4116-be0f-5bf31971c7d6
8be8629c-0cbf-4119-86e2-4c68e325a804	2026-07-02 08:35:02.214728+00	2026-07-02 08:35:02.214728+00	password	21ebb586-27d3-4ad0-96e8-1edd6c33bdfd
4ff0ae0a-99c3-4c2f-b4c9-e7dc76724178	2026-07-02 08:41:16.503273+00	2026-07-02 08:41:16.503273+00	password	dbd2f63e-009a-4157-aa5b-33de5a56043c
fa77b1d4-17f5-4246-b27f-129e337e75cc	2026-07-02 08:49:23.461124+00	2026-07-02 08:49:23.461124+00	password	df0903b9-7491-4ae0-a800-6757b79913b8
67ae1b0b-d9c3-42e0-b7d9-60225f0e9282	2026-07-03 10:31:09.391699+00	2026-07-03 10:31:09.391699+00	password	9c1fbf20-225b-42aa-9a47-31678310b808
6c9bf39c-c441-4cd9-aa22-e598f7b34c99	2026-07-03 11:50:45.495585+00	2026-07-03 11:50:45.495585+00	password	b755e5c6-36d0-4572-a396-e57d785aba5f
7bbdbebf-44e9-4084-9e07-5e7797ec6cd5	2026-07-03 11:57:56.432131+00	2026-07-03 11:57:56.432131+00	password	b2020f3c-a73c-4191-aa08-65428eeec273
bd7ddb97-15e8-45ab-9008-a1fa6353ff89	2026-07-03 13:56:24.801583+00	2026-07-03 13:56:24.801583+00	password	2718aa5d-0290-4e19-bdfe-b3c12e64f318
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
2c59989e-59f4-42dd-914c-0b9e12750aa7	bf121994-42f1-4e88-8ac6-1309d6d208a2	confirmation_token	05f086fb220c38e32e65eb2fe57194c9033f85d7401a4c1b4615fd27	harry.test@gmail.com	2026-04-09 17:39:31.233964	2026-04-09 17:39:31.233964
9a1b0489-a294-4880-a0af-35a9fc898ea6	ec4ec11c-a798-45a5-9ee8-79a9bee08e39	confirmation_token	c906d08dd409d072fa89a8100e75cff5d3c44eb7a99f73a68b1c7803	dedjiharry@gmail.com	2026-05-07 09:30:59.744541	2026-05-07 09:30:59.744541
11de5018-702e-468e-ba04-9bdf60176e90	18f6be90-ed86-4bfb-8360-443d70852cc9	confirmation_token	79a31e7472b3b252e32f94afe2cbb59ad5cbb3b4061329773170135b	test-first-1779802974360@example.com	2026-05-26 13:43:10.168669	2026-05-26 13:43:10.168669
69f9a2ff-4413-485c-862c-5a0e7f9a3c75	f12eb176-bb43-4432-b3ec-9ce3735e1226	confirmation_token	f3ec4bc078319a6e6a10d0e7ecd7864d667d9b96740dc6b7f60be001	test-user1-1779802979366@example.com	2026-05-26 13:43:15.638713	2026-05-26 13:43:15.638713
8e6c1d45-da89-4e43-a814-eeb9dcd3e8d0	caf0b663-7b1b-41ef-ac7c-9022b80c41c8	confirmation_token	fc56d4cc27f409171e2bc8ae0a19927545f8c6bd430a64e94db3a0eb	test-1779802994402@example.com	2026-05-26 13:43:20.058289	2026-05-26 13:43:20.058289
7ecbddde-b1c9-40e9-9e36-09ed10bfd9e5	cc087f51-4754-47cf-97eb-1d372599abf7	confirmation_token	5f7d461b82a3f5c53b0bff1f26b8c1b5a77d62b1d747ebef24f8ca70	test-1779802999407@example.com	2026-05-26 13:43:27.383548	2026-05-26 13:43:27.383548
e41b7641-1810-4b98-ba23-927a93aeb4e0	0099a5d1-7ca2-456d-9136-9535a9cdf13e	confirmation_token	cb1a02d83ce999301098e82fd39b5335ac42a4314e61733d201df5ed	perf-1779803004441@example.com	2026-05-26 13:43:29.571065	2026-05-26 13:43:29.571065
dcc9d511-e10d-4024-bd83-0a05eb2672fb	4de3adcd-e444-403d-8036-a5525129d2d6	confirmation_token	aadb129ca5148fe34c8a667729880b908272b1107e877af2ed037c4e	lebg30794@gmail.com	2026-06-21 23:34:04.895384	2026-06-21 23:34:04.895384
28cb7381-aeae-4d4d-983f-dca591ca1110	362a8b1a-9e81-4c91-b477-c6183394f42f	confirmation_token	0e62112f29c128c9335ced845d69d86e217e3d3c240ab885caaf7864	test_candidat_1782243862275@example.com	2026-06-23 19:44:26.92067	2026-06-23 19:44:26.92067
528dde40-d844-4368-a415-767afc3553a8	8b6f294e-f2b8-4611-82f7-63d59df1804a	confirmation_token	5e355182f9fe0c65456aaef89cda3dd9a127e37e4b5e6343d3f5de2c	test_candidat_1782243949123@example.com	2026-06-23 19:45:54.186132	2026-06-23 19:45:54.186132
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
00000000-0000-0000-0000-000000000000	1	go6gdp5j6jva	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-09 17:45:26.454346+00	2026-04-09 17:45:26.454346+00	\N	9fcf4b09-4718-47ba-a4d5-17c27dc34f17
00000000-0000-0000-0000-000000000000	2	7xad3toe2l6y	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-10 14:34:35.526082+00	2026-04-10 14:34:35.526082+00	\N	2dea3843-c0fa-4493-af7f-7aebd3ed31ee
00000000-0000-0000-0000-000000000000	3	n6epvgxopiy5	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-10 15:28:02.674473+00	2026-04-10 15:28:02.674473+00	\N	2a8b847a-d148-4921-978d-f9db671fca54
00000000-0000-0000-0000-000000000000	4	mtx2fz6boa3z	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-11 10:33:39.125819+00	2026-04-11 10:33:39.125819+00	\N	373a5446-bfcb-44b2-ba49-8cd63a719388
00000000-0000-0000-0000-000000000000	385	tmeirvg5pj2b	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-06-25 11:04:43.850713+00	2026-06-25 11:04:43.850713+00	\N	9a818d3c-95c2-4058-b55a-543cf13ccf44
00000000-0000-0000-0000-000000000000	394	pvzivajvhtmu	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	t	2026-06-26 12:49:39.691994+00	2026-06-26 13:48:04.520884+00	\N	27eef67a-77c5-409e-9fea-966e01700270
00000000-0000-0000-0000-000000000000	201	vou3y22uiarf	47f79776-a2d5-497b-80fa-8b38670461f4	t	2026-05-05 18:51:35.020972+00	2026-05-05 19:50:05.386045+00	sbr3sc74fgey	d974503c-1fbd-4873-bf31-6d2467b6d512
00000000-0000-0000-0000-000000000000	9	u46hfa67gpd2	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-15 10:19:13.978061+00	2026-04-15 10:19:13.978061+00	\N	bd51e60d-acf4-4225-9650-058ce4cb9781
00000000-0000-0000-0000-000000000000	402	3fxvd2pwtm6p	2ceb478d-1a3b-49e7-a64c-bab998d8aa3f	t	2026-06-26 21:50:14.028274+00	2026-06-26 22:48:44.359096+00	qt5exl43etib	dee66597-2029-47d7-9473-cb494067d746
00000000-0000-0000-0000-000000000000	206	qn4uyxgj3uxm	8e237b3f-2e09-4938-899b-b97d12deee1a	f	2026-05-05 23:01:51.131234+00	2026-05-05 23:01:51.131234+00	\N	9dc3538f-a6e0-41fc-8b24-8672957b9492
00000000-0000-0000-0000-000000000000	409	xo4trt2dcae5	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-27 10:23:43.456656+00	2026-06-27 10:23:43.456656+00	z2k7d2brcfxb	c37b3084-9ef2-4cec-b322-11173127c5e8
00000000-0000-0000-0000-000000000000	417	a63xap2pvtqh	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-27 17:40:29.024573+00	2026-06-27 18:38:59.281633+00	ce5ik2kh5vo4	7726b4dc-9e2a-4b06-a215-4c468242af9d
00000000-0000-0000-0000-000000000000	211	utrevltufc24	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-05-06 01:25:38.499816+00	2026-05-06 02:27:33.000727+00	vbilpanq7ypw	2093b213-238e-4dff-ab1a-8c354b8ed3cc
00000000-0000-0000-0000-000000000000	424	jnlcsn3nikk2	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-28 00:29:59.923461+00	2026-06-28 01:28:30.091832+00	nuyiudegd2rx	7726b4dc-9e2a-4b06-a215-4c468242af9d
00000000-0000-0000-0000-000000000000	431	tvgcjlleal4p	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-28 06:48:48.18632+00	2026-06-28 06:48:48.18632+00	\N	093d184a-2895-4d9b-b2e9-fbcf150ade4e
00000000-0000-0000-0000-000000000000	216	hdom2la3pz4t	8e237b3f-2e09-4938-899b-b97d12deee1a	t	2026-05-06 11:12:44.195021+00	2026-05-06 12:11:06.750172+00	\N	5676f747-d120-489d-bb6a-3af591c092dc
00000000-0000-0000-0000-000000000000	437	hmgdpzclpiut	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	f	2026-06-28 14:06:57.920834+00	2026-06-28 14:06:57.920834+00	j3izcfau2nzx	6a8a0199-84c9-40e5-bb59-5ec21d04419a
00000000-0000-0000-0000-000000000000	222	uenvlcj3ikz5	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-05-06 13:40:17.736266+00	2026-05-06 13:40:17.736266+00	\N	b06ddd01-48b9-447e-8cfa-86243b62daa9
00000000-0000-0000-0000-000000000000	444	iijwx4i37qu3	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-06-28 16:04:00.418206+00	2026-06-28 16:04:00.418206+00	\N	c6b4abbd-020e-49b5-bad2-e3b7d5d0fb52
00000000-0000-0000-0000-000000000000	228	by6dklvd3ftt	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-05-06 18:13:42.709557+00	2026-05-06 18:13:42.709557+00	\N	9c727d13-6eaa-4513-aaac-ddb86b384542
00000000-0000-0000-0000-000000000000	233	zyq5vi3orgci	8e237b3f-2e09-4938-899b-b97d12deee1a	f	2026-05-06 19:32:02.044699+00	2026-05-06 19:32:02.044699+00	\N	a6640a81-cc2d-445c-a5b3-af96e8972927
00000000-0000-0000-0000-000000000000	451	vyf6igtui3xq	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	t	2026-06-28 17:53:20.277402+00	2026-06-28 18:51:37.436233+00	r3yfowh3yerl	9e42e1d5-d975-498e-a90e-14ee2a43e693
00000000-0000-0000-0000-000000000000	456	cq4oeztgfdbu	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-07-01 06:03:40.928879+00	2026-07-01 06:03:40.928879+00	ow5xs5yv2i56	40d37eed-04e8-45eb-bd79-6dded3a9c40c
00000000-0000-0000-0000-000000000000	19	hmedk4sy3z56	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-15 22:08:42.753025+00	2026-04-15 22:08:42.753025+00	\N	5a68def5-ea95-42a8-9233-d793b08a7bcb
00000000-0000-0000-0000-000000000000	20	ikhac2nwzjam	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-15 22:52:25.518888+00	2026-04-15 22:52:25.518888+00	\N	01ac7088-a9d1-4899-a0c7-b22444c61d17
00000000-0000-0000-0000-000000000000	21	3csvhuxqsfrj	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-15 23:17:45.577507+00	2026-04-15 23:17:45.577507+00	\N	b36b74f2-8b95-48fc-9c2c-fe652ff14f18
00000000-0000-0000-0000-000000000000	22	22x4fr2avew7	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-16 05:40:31.298785+00	2026-04-16 05:40:31.298785+00	\N	fde7420f-ae07-4df1-8e87-b8b7ca3fb667
00000000-0000-0000-0000-000000000000	23	2ydcs4bhhslo	ec032fe4-9093-4825-a3ff-af8a8c4b2fad	f	2026-04-16 05:47:39.496066+00	2026-04-16 05:47:39.496066+00	\N	c0c984f9-f48f-4043-8287-8ae3a02f64c4
00000000-0000-0000-0000-000000000000	24	4nmngiofsz7y	ec032fe4-9093-4825-a3ff-af8a8c4b2fad	f	2026-04-16 05:59:23.973484+00	2026-04-16 05:59:23.973484+00	\N	c1ba4abd-c35f-4909-bcd7-635b5d221bb9
00000000-0000-0000-0000-000000000000	25	ujpr6nmuacqz	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-20 10:05:54.644126+00	2026-04-20 10:05:54.644126+00	\N	34fb5171-22b9-4f23-a931-e1f58bd011ca
00000000-0000-0000-0000-000000000000	26	qvgardxyiye7	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-21 08:08:27.03169+00	2026-04-21 08:08:27.03169+00	\N	e5d7613f-f4cf-43cd-beb3-53204d621809
00000000-0000-0000-0000-000000000000	27	kq7gvkyf3wrb	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-21 08:24:33.154944+00	2026-04-21 08:24:33.154944+00	\N	844e9863-4004-4947-b3fd-27d45bb465cb
00000000-0000-0000-0000-000000000000	28	y7od5adq3pqo	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-21 09:33:50.475659+00	2026-04-21 09:33:50.475659+00	\N	139b7ed4-ba65-40e2-835d-f24bcb18160f
00000000-0000-0000-0000-000000000000	29	rgq3qrdbgh3m	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-21 09:34:03.619625+00	2026-04-21 09:34:03.619625+00	\N	a7068747-0115-4955-b1e1-04c6888a058b
00000000-0000-0000-0000-000000000000	30	sl76r2zfwn36	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-21 09:43:16.459756+00	2026-04-21 09:43:16.459756+00	\N	2b9279c0-4a4f-4eed-9695-024509f377a1
00000000-0000-0000-0000-000000000000	31	ais7nhm55pbq	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-21 09:45:38.323255+00	2026-04-21 09:45:38.323255+00	\N	5bd091bb-3bed-48a1-a711-ae5efe05d596
00000000-0000-0000-0000-000000000000	32	zflitdpipkz3	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-21 10:05:18.209252+00	2026-04-21 10:05:18.209252+00	\N	aa2d84b3-9ce8-47ab-9a46-1c8f217f33c7
00000000-0000-0000-0000-000000000000	33	vmtypvfstkgw	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-21 10:23:31.731439+00	2026-04-21 10:23:31.731439+00	\N	7afd0f31-2743-44ec-bb37-9c04c420ad76
00000000-0000-0000-0000-000000000000	34	dg4llm72kqid	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-21 11:23:58.982008+00	2026-04-21 11:23:58.982008+00	\N	2ec4f7ca-f30e-47e9-bca4-650e6fad1746
00000000-0000-0000-0000-000000000000	35	lmtas5ffayxz	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-21 11:44:41.614673+00	2026-04-21 11:44:41.614673+00	\N	44c7088c-9d70-46fa-a1e9-926d32ce10f6
00000000-0000-0000-0000-000000000000	36	unbl2ebjice3	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-21 11:57:38.611814+00	2026-04-21 11:57:38.611814+00	\N	101323b6-98fc-4195-8fc0-4ca1fbf47fde
00000000-0000-0000-0000-000000000000	37	lydbnkuha64j	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-21 12:14:24.330644+00	2026-04-21 12:14:24.330644+00	\N	0ae6e36f-62a7-4142-aa52-7368a29e83ec
00000000-0000-0000-0000-000000000000	38	ux3asem2d4dt	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-21 12:34:09.798269+00	2026-04-21 12:34:09.798269+00	\N	0070aa1e-b3cf-4774-9bf9-485481593920
00000000-0000-0000-0000-000000000000	39	vmpvdyf4s2ig	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-21 13:22:51.401673+00	2026-04-21 13:22:51.401673+00	\N	8ef551b5-c907-438f-8d81-600df81cc266
00000000-0000-0000-0000-000000000000	40	vl37nx5wdzh6	c121a8d7-589a-48d4-bae2-134a826c5856	f	2026-04-21 13:37:41.770153+00	2026-04-21 13:37:41.770153+00	\N	ec12cd64-ab2f-488f-af18-9c6c95724bbb
00000000-0000-0000-0000-000000000000	41	fupedokeeti6	c121a8d7-589a-48d4-bae2-134a826c5856	f	2026-04-21 13:40:58.901523+00	2026-04-21 13:40:58.901523+00	\N	8461a33d-ff23-492a-a8af-cc3afc5cb47f
00000000-0000-0000-0000-000000000000	239	kg6jss557gxg	47f79776-a2d5-497b-80fa-8b38670461f4	f	2026-05-06 22:13:35.676995+00	2026-05-06 22:13:35.676995+00	\N	ae234f65-1f04-4ae1-b04e-3e58ee7d8c3f
00000000-0000-0000-0000-000000000000	460	447oaxour76i	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	f	2026-07-01 12:35:52.637569+00	2026-07-01 12:35:52.637569+00	\N	dff19de4-faa3-4a02-a4c6-145be6dcb134
00000000-0000-0000-0000-000000000000	464	jvsa3mwvqpx4	754671cd-2b76-4ccb-a0bb-690adcf34443	f	2026-07-01 12:57:34.572785+00	2026-07-01 12:57:34.572785+00	\N	d4cf4307-b027-4379-bb76-c0f4a70dba66
00000000-0000-0000-0000-000000000000	42	sy6e3agvimqg	c121a8d7-589a-48d4-bae2-134a826c5856	t	2026-04-21 14:03:34.051505+00	2026-04-21 16:26:32.999529+00	\N	43621fbb-2dc0-4c3c-9d2d-a4596294b98f
00000000-0000-0000-0000-000000000000	467	yiyiawpypcjg	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-07-02 05:35:22.723561+00	2026-07-02 05:35:22.723561+00	\N	25ed5edd-0ff4-49b7-839f-be90a7e2b882
00000000-0000-0000-0000-000000000000	243	vvetec5rjfc3	47f79776-a2d5-497b-80fa-8b38670461f4	t	2026-05-07 01:26:07.159832+00	2026-05-07 02:24:38.636305+00	kkag56tr7wyl	1862011f-8561-40a2-852d-eda6574bc4ef
00000000-0000-0000-0000-000000000000	470	tz36pkcuqyev	754671cd-2b76-4ccb-a0bb-690adcf34443	f	2026-07-02 05:58:44.130078+00	2026-07-02 05:58:44.130078+00	\N	f41ea936-d28c-4876-89e2-bb4706bd27b3
00000000-0000-0000-0000-000000000000	395	iwtpehj6xlpw	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-26 13:48:04.540269+00	2026-06-26 13:48:04.540269+00	pvzivajvhtmu	27eef67a-77c5-409e-9fea-966e01700270
00000000-0000-0000-0000-000000000000	202	y5auivf4sdzn	47f79776-a2d5-497b-80fa-8b38670461f4	t	2026-05-05 19:50:05.401133+00	2026-05-05 20:48:35.641824+00	vou3y22uiarf	d974503c-1fbd-4873-bf31-6d2467b6d512
00000000-0000-0000-0000-000000000000	403	qe2dvzebm64i	2ceb478d-1a3b-49e7-a64c-bab998d8aa3f	t	2026-06-26 22:48:44.369245+00	2026-06-26 23:47:14.721434+00	3fxvd2pwtm6p	dee66597-2029-47d7-9473-cb494067d746
00000000-0000-0000-0000-000000000000	207	xcqgv6xdihhi	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	f	2026-05-05 23:20:55.880992+00	2026-05-05 23:20:55.880992+00	\N	c3cddd93-2bac-4943-bab1-d567b666ba11
00000000-0000-0000-0000-000000000000	410	2n2nsmvmr3zq	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-27 10:51:27.823789+00	2026-06-27 10:51:27.823789+00	\N	a183883b-48c0-4d9b-ab19-d033887855b1
00000000-0000-0000-0000-000000000000	48	f5htlwhmsl3z	c121a8d7-589a-48d4-bae2-134a826c5856	t	2026-04-21 16:26:33.006027+00	2026-04-21 18:24:43.97642+00	sy6e3agvimqg	43621fbb-2dc0-4c3c-9d2d-a4596294b98f
00000000-0000-0000-0000-000000000000	418	x4dd2bepw7ec	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-27 18:38:59.28999+00	2026-06-27 19:37:29.313973+00	a63xap2pvtqh	7726b4dc-9e2a-4b06-a215-4c468242af9d
00000000-0000-0000-0000-000000000000	212	f4gr7dny25i2	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-05-06 02:27:33.009983+00	2026-05-06 03:25:38.15697+00	utrevltufc24	2093b213-238e-4dff-ab1a-8c354b8ed3cc
00000000-0000-0000-0000-000000000000	425	ac4udehb5lgf	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-28 01:28:30.098536+00	2026-06-28 02:27:00.236875+00	jnlcsn3nikk2	7726b4dc-9e2a-4b06-a215-4c468242af9d
00000000-0000-0000-0000-000000000000	51	e2fa2hzwanvz	c121a8d7-589a-48d4-bae2-134a826c5856	t	2026-04-21 18:24:43.98192+00	2026-04-21 20:23:14.460305+00	f5htlwhmsl3z	43621fbb-2dc0-4c3c-9d2d-a4596294b98f
00000000-0000-0000-0000-000000000000	217	xntv7vyhjpyg	8e237b3f-2e09-4938-899b-b97d12deee1a	f	2026-05-06 12:11:06.766186+00	2026-05-06 12:11:06.766186+00	hdom2la3pz4t	5676f747-d120-489d-bb6a-3af591c092dc
00000000-0000-0000-0000-000000000000	223	vp57wj7n6t3c	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	f	2026-05-06 13:57:05.324363+00	2026-05-06 13:57:05.324363+00	\N	baeb1001-0408-4759-bf06-39c128796892
00000000-0000-0000-0000-000000000000	229	g5kzd2n6bgpm	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	f	2026-05-06 18:23:50.787724+00	2026-05-06 18:23:50.787724+00	\N	d0594a16-ce8f-4492-970b-38198b59593e
00000000-0000-0000-0000-000000000000	54	cqfyydxevfxl	c121a8d7-589a-48d4-bae2-134a826c5856	t	2026-04-21 20:23:14.468599+00	2026-04-21 22:21:44.712271+00	e2fa2hzwanvz	43621fbb-2dc0-4c3c-9d2d-a4596294b98f
00000000-0000-0000-0000-000000000000	57	wezddl2m3e52	c121a8d7-589a-48d4-bae2-134a826c5856	f	2026-04-21 22:21:44.71793+00	2026-04-21 22:21:44.71793+00	cqfyydxevfxl	43621fbb-2dc0-4c3c-9d2d-a4596294b98f
00000000-0000-0000-0000-000000000000	432	weqlb4oboeb2	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	t	2026-06-28 09:08:31.496592+00	2026-06-28 11:33:58.244572+00	\N	2e12a7f2-bbd8-4eb1-b9c1-a46b19725af2
00000000-0000-0000-0000-000000000000	234	mli3rwqnuse5	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-05-06 19:45:13.123828+00	2026-05-06 19:45:13.123828+00	\N	f6b76586-888d-4ccb-85f9-e481a494f50c
00000000-0000-0000-0000-000000000000	438	oynpnup5sefa	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	f	2026-06-28 14:23:37.837641+00	2026-06-28 14:23:37.837641+00	\N	7d420141-0c30-4f95-a61a-f2d7d34c3116
00000000-0000-0000-0000-000000000000	240	g2opeale7ewf	47f79776-a2d5-497b-80fa-8b38670461f4	f	2026-05-06 22:35:44.164915+00	2026-05-06 22:35:44.164915+00	\N	3589cc9a-7daa-4bca-a9a0-03ab5682fe3a
00000000-0000-0000-0000-000000000000	445	xwsbyfas25iw	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-06-28 16:18:23.500965+00	2026-06-28 16:18:23.500965+00	\N	76e72c65-c8e1-4ea2-960e-f877d838e954
00000000-0000-0000-0000-000000000000	452	o7c3hpw2cjrp	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	t	2026-06-28 18:51:37.462804+00	2026-06-28 19:49:43.188772+00	vyf6igtui3xq	9e42e1d5-d975-498e-a90e-14ee2a43e693
00000000-0000-0000-0000-000000000000	457	n5jwinetporx	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-07-01 12:22:12.567814+00	2026-07-01 12:22:12.567814+00	\N	aef8b3d5-aeda-42be-bfb3-66ed21687b83
00000000-0000-0000-0000-000000000000	461	2ipenvzegt5p	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-07-01 12:43:54.966076+00	2026-07-01 12:43:54.966076+00	\N	effe1c99-e5ae-46ae-968f-4c6738c9a5dc
00000000-0000-0000-0000-000000000000	462	xluver4gslrf	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	f	2026-07-01 12:45:24.243785+00	2026-07-01 12:45:24.243785+00	\N	8fa90260-7b1b-4422-8cb8-94d5d3afe959
00000000-0000-0000-0000-000000000000	63	uurar5fhgrsf	c121a8d7-589a-48d4-bae2-134a826c5856	f	2026-04-22 08:12:27.630737+00	2026-04-22 08:12:27.630737+00	\N	4659c0c3-9d21-42d5-a6c0-5afbd49d2f97
00000000-0000-0000-0000-000000000000	465	olcljwbdf2ik	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-07-02 00:20:16.063086+00	2026-07-02 05:32:10.958835+00	\N	b22262d4-b36d-4f33-b418-2a1ef937483d
00000000-0000-0000-0000-000000000000	65	xbzdey4fisff	c121a8d7-589a-48d4-bae2-134a826c5856	f	2026-04-22 08:16:15.386454+00	2026-04-22 08:16:15.386454+00	\N	8eaf4ea0-3ec7-4db8-86cf-47742b902aa1
00000000-0000-0000-0000-000000000000	66	iuwkvawuermq	c121a8d7-589a-48d4-bae2-134a826c5856	f	2026-04-22 08:20:58.219831+00	2026-04-22 08:20:58.219831+00	\N	0ef9c846-ccce-454d-9db8-d92647947e81
00000000-0000-0000-0000-000000000000	468	yencioqizsb3	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	f	2026-07-02 05:49:45.802515+00	2026-07-02 05:49:45.802515+00	\N	60834222-f8d7-4021-af19-a895ad0b43d0
00000000-0000-0000-0000-000000000000	68	mffziwlz2jvn	0b31e734-c377-426f-9618-fa73b50675d8	f	2026-04-22 08:46:28.201739+00	2026-04-22 08:46:28.201739+00	\N	faabf82b-2fff-4557-a6ea-c66c01311ec5
00000000-0000-0000-0000-000000000000	69	tcgk2znztydt	0b31e734-c377-426f-9618-fa73b50675d8	f	2026-04-22 08:47:25.04078+00	2026-04-22 08:47:25.04078+00	\N	da879ca8-521e-4a26-8dbd-1ff07d6b9471
00000000-0000-0000-0000-000000000000	70	z4ihbyzaalrg	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-22 08:52:11.735332+00	2026-04-22 08:52:11.735332+00	\N	48f231ea-f49e-4945-9be4-b66dbe03fdfb
00000000-0000-0000-0000-000000000000	71	ifdlsq65ub6a	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-22 09:02:43.058949+00	2026-04-22 09:02:43.058949+00	\N	2cfe6afd-44ba-49e2-a473-9dff758b101c
00000000-0000-0000-0000-000000000000	471	sup3fogfpcin	754671cd-2b76-4ccb-a0bb-690adcf34443	f	2026-07-02 06:04:56.603472+00	2026-07-02 06:04:56.603472+00	\N	30abb730-0f9d-454d-8b6d-431fc498e12b
00000000-0000-0000-0000-000000000000	473	32i6whpqjmae	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	f	2026-07-02 06:19:37.649399+00	2026-07-02 06:19:37.649399+00	\N	00e259f1-20df-4f3c-92ea-20842564d02a
00000000-0000-0000-0000-000000000000	73	bvrxq2swtkkc	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-22 09:27:41.473484+00	2026-04-22 09:27:41.473484+00	\N	999b6e97-d7be-4cfa-968c-1acf22d0583f
00000000-0000-0000-0000-000000000000	74	yciuugxwgzbq	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-22 09:41:24.914618+00	2026-04-22 09:41:24.914618+00	\N	f1bb8e8d-b384-455c-aebf-37f700f708b1
00000000-0000-0000-0000-000000000000	75	uoo73pmxas5w	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-22 09:49:44.434109+00	2026-04-22 09:49:44.434109+00	\N	51c67077-6196-4e95-a31c-9c4f3b6ffb2f
00000000-0000-0000-0000-000000000000	76	dvuss6dv6jif	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-22 10:03:30.904362+00	2026-04-22 10:03:30.904362+00	\N	74608a90-7223-4d02-b769-6ddcd1b5205f
00000000-0000-0000-0000-000000000000	475	p4x4xoilha4j	754671cd-2b76-4ccb-a0bb-690adcf34443	f	2026-07-02 06:50:51.200915+00	2026-07-02 06:50:51.200915+00	\N	2dba5aab-4028-4718-8a4b-887badc6c2bf
00000000-0000-0000-0000-000000000000	77	naccr3lzy6hj	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-22 10:05:13.68105+00	2026-04-22 12:10:13.419164+00	\N	b6b26312-3a67-4c8f-9cfc-422b6958d90e
00000000-0000-0000-0000-000000000000	78	z4r3ck742zfz	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-22 12:10:13.430422+00	2026-04-22 12:10:13.430422+00	naccr3lzy6hj	b6b26312-3a67-4c8f-9cfc-422b6958d90e
00000000-0000-0000-0000-000000000000	80	62hzxj7po37p	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-22 19:09:40.660311+00	2026-04-22 19:09:40.660311+00	\N	c2551781-c3ce-4ee1-8ec6-348b3fee7b96
00000000-0000-0000-0000-000000000000	81	srpy5moh4pes	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-22 19:43:01.834734+00	2026-04-22 19:43:01.834734+00	\N	1e7a7642-12e6-454f-9891-6c30574c4e50
00000000-0000-0000-0000-000000000000	82	rdazeqwzuuo7	0b31e734-c377-426f-9618-fa73b50675d8	f	2026-04-22 20:04:49.751948+00	2026-04-22 20:04:49.751948+00	\N	da5ee521-195b-4d4b-841d-76376c22ce61
00000000-0000-0000-0000-000000000000	86	k3melzcrelmi	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-22 21:22:22.928858+00	2026-04-22 22:20:28.876311+00	\N	3548e4f2-3080-465e-8dcc-2211c702d381
00000000-0000-0000-0000-000000000000	87	xxpuxihsasuu	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-22 22:20:28.883091+00	2026-04-22 23:18:30.297151+00	k3melzcrelmi	3548e4f2-3080-465e-8dcc-2211c702d381
00000000-0000-0000-0000-000000000000	88	i4u7xicqflrs	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-22 23:18:30.3065+00	2026-04-23 00:17:01.10269+00	xxpuxihsasuu	3548e4f2-3080-465e-8dcc-2211c702d381
00000000-0000-0000-0000-000000000000	89	ug6o6bp7sy4g	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-23 00:17:01.10864+00	2026-04-23 01:15:32.219453+00	i4u7xicqflrs	3548e4f2-3080-465e-8dcc-2211c702d381
00000000-0000-0000-0000-000000000000	90	klfzqzrqv6da	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-23 01:15:32.229591+00	2026-04-23 02:14:02.938027+00	ug6o6bp7sy4g	3548e4f2-3080-465e-8dcc-2211c702d381
00000000-0000-0000-0000-000000000000	91	7uadhmvcf2lw	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-23 02:14:02.945478+00	2026-04-23 02:14:02.945478+00	klfzqzrqv6da	3548e4f2-3080-465e-8dcc-2211c702d381
00000000-0000-0000-0000-000000000000	92	rcvcwsczjpei	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-23 02:37:56.682594+00	2026-04-23 02:37:56.682594+00	\N	8f5329cd-ecc8-4e73-9de4-9c443850db33
00000000-0000-0000-0000-000000000000	203	tehxzwaqbia4	47f79776-a2d5-497b-80fa-8b38670461f4	t	2026-05-05 20:48:35.650516+00	2026-05-05 21:47:05.837789+00	y5auivf4sdzn	d974503c-1fbd-4873-bf31-6d2467b6d512
00000000-0000-0000-0000-000000000000	208	sgt3a5j3rha3	8e237b3f-2e09-4938-899b-b97d12deee1a	f	2026-05-05 23:25:27.667615+00	2026-05-05 23:25:27.667615+00	\N	454df8cd-c5f7-48c8-af45-0b36645962b4
00000000-0000-0000-0000-000000000000	99	nismxkske7xc	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-23 16:36:00.704053+00	2026-04-23 16:36:00.704053+00	\N	6b5facc7-6e1d-4d89-9b17-b08f116058a3
00000000-0000-0000-0000-000000000000	388	f6smdwr65cmc	2ceb478d-1a3b-49e7-a64c-bab998d8aa3f	f	2026-06-25 14:26:12.424744+00	2026-06-25 14:26:12.424744+00	\N	3217c3f5-eaef-4c2d-8cd2-54b7d8d65da4
00000000-0000-0000-0000-000000000000	100	xai7pedv5avt	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	t	2026-04-24 14:49:34.570873+00	2026-04-24 17:31:12.959974+00	\N	c632cad4-d363-4c2f-911a-6875ed2c45a3
00000000-0000-0000-0000-000000000000	101	aa3ea3y5rttv	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	f	2026-04-24 17:31:12.979407+00	2026-04-24 17:31:12.979407+00	xai7pedv5avt	c632cad4-d363-4c2f-911a-6875ed2c45a3
00000000-0000-0000-0000-000000000000	213	xrqivumaxkvl	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-05-06 03:25:38.162905+00	2026-05-06 04:24:08.405455+00	f4gr7dny25i2	2093b213-238e-4dff-ab1a-8c354b8ed3cc
00000000-0000-0000-0000-000000000000	102	uil5yc3ecr7t	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-25 16:34:09.891117+00	2026-04-25 18:00:28.644174+00	\N	9b48f8c6-c5c6-423d-8fc6-40249d752595
00000000-0000-0000-0000-000000000000	103	7xbqvisqkmrl	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-25 18:00:28.651461+00	2026-04-25 18:00:28.651461+00	uil5yc3ecr7t	9b48f8c6-c5c6-423d-8fc6-40249d752595
00000000-0000-0000-0000-000000000000	104	hw5nogdwbwwi	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	f	2026-04-25 18:06:44.48317+00	2026-04-25 18:06:44.48317+00	\N	44f8976b-5b60-4567-a016-b9bfbc9fb281
00000000-0000-0000-0000-000000000000	218	qe2l5jozhqzh	8e237b3f-2e09-4938-899b-b97d12deee1a	f	2026-05-06 12:26:39.780412+00	2026-05-06 12:26:39.780412+00	\N	c01b9115-e64a-42ed-8f5e-43d05d1f96f1
00000000-0000-0000-0000-000000000000	105	642cnz2qb2av	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-25 18:18:01.811575+00	2026-04-25 19:16:21.462275+00	\N	790d441b-81bf-4b44-af87-3158ed4f5926
00000000-0000-0000-0000-000000000000	219	h7ftq2laepiv	8e237b3f-2e09-4938-899b-b97d12deee1a	f	2026-05-06 12:27:00.805109+00	2026-05-06 12:27:00.805109+00	\N	a04acb19-310c-410b-87f7-aa5e05b9660b
00000000-0000-0000-0000-000000000000	106	7sowlxezc5jq	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-25 19:16:21.483304+00	2026-04-25 20:14:51.784585+00	642cnz2qb2av	790d441b-81bf-4b44-af87-3158ed4f5926
00000000-0000-0000-0000-000000000000	396	5fbbzpno7owl	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-26 17:40:34.519739+00	2026-06-26 17:40:34.519739+00	\N	a2c0e8ee-5be5-4a83-a075-7255333e5171
00000000-0000-0000-0000-000000000000	107	3cvpqln2oao7	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-25 20:14:51.793046+00	2026-04-25 21:13:21.879309+00	7sowlxezc5jq	790d441b-81bf-4b44-af87-3158ed4f5926
00000000-0000-0000-0000-000000000000	224	s2wgh6b2mhin	8e237b3f-2e09-4938-899b-b97d12deee1a	t	2026-05-06 13:59:42.44557+00	2026-05-06 14:57:46.91749+00	\N	d6ed153a-8699-4d6d-be66-a80e0688dff2
00000000-0000-0000-0000-000000000000	108	k2hsyj2y334o	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-25 21:13:21.884079+00	2026-04-25 22:11:22.045819+00	3cvpqln2oao7	790d441b-81bf-4b44-af87-3158ed4f5926
00000000-0000-0000-0000-000000000000	230	sxngeusmz7gs	47f79776-a2d5-497b-80fa-8b38670461f4	f	2026-05-06 18:54:18.983647+00	2026-05-06 18:54:18.983647+00	\N	06745cf3-f2e2-401d-a58b-40c38d04a049
00000000-0000-0000-0000-000000000000	109	uhu3d27kzoff	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-25 22:11:22.051888+00	2026-04-25 23:09:52.863792+00	k2hsyj2y334o	790d441b-81bf-4b44-af87-3158ed4f5926
00000000-0000-0000-0000-000000000000	235	57swtdhi7lzd	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-05-06 21:27:43.287696+00	2026-05-06 21:27:43.287696+00	\N	2ca5094f-d5a1-4e73-8989-e6eb4e4a3827
00000000-0000-0000-0000-000000000000	110	cfemqgi475ai	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-25 23:09:52.87198+00	2026-04-26 00:08:22.540628+00	uhu3d27kzoff	790d441b-81bf-4b44-af87-3158ed4f5926
00000000-0000-0000-0000-000000000000	111	m6gziihmybft	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-26 00:08:22.546805+00	2026-04-26 01:06:52.696946+00	cfemqgi475ai	790d441b-81bf-4b44-af87-3158ed4f5926
00000000-0000-0000-0000-000000000000	241	psgc7d4iluju	47f79776-a2d5-497b-80fa-8b38670461f4	t	2026-05-06 23:29:13.671022+00	2026-05-07 00:27:37.75435+00	\N	1862011f-8561-40a2-852d-eda6574bc4ef
00000000-0000-0000-0000-000000000000	112	m7nu5n6t66bh	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-26 01:06:52.704601+00	2026-04-26 02:05:22.886513+00	m6gziihmybft	790d441b-81bf-4b44-af87-3158ed4f5926
00000000-0000-0000-0000-000000000000	244	zq5i45qi3sbf	47f79776-a2d5-497b-80fa-8b38670461f4	f	2026-05-07 02:24:38.651351+00	2026-05-07 02:24:38.651351+00	vvetec5rjfc3	1862011f-8561-40a2-852d-eda6574bc4ef
00000000-0000-0000-0000-000000000000	113	7upvt2ibxlp7	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-26 02:05:22.896475+00	2026-04-26 03:03:53.008597+00	m7nu5n6t66bh	790d441b-81bf-4b44-af87-3158ed4f5926
00000000-0000-0000-0000-000000000000	246	c7mapkjupxx3	47f79776-a2d5-497b-80fa-8b38670461f4	f	2026-05-07 06:07:20.268012+00	2026-05-07 06:07:20.268012+00	\N	1fd609e2-6165-43a7-b943-5b5478ebce35
00000000-0000-0000-0000-000000000000	114	hpnsgcrzz4hu	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-26 03:03:53.016702+00	2026-04-26 04:02:23.81195+00	7upvt2ibxlp7	790d441b-81bf-4b44-af87-3158ed4f5926
00000000-0000-0000-0000-000000000000	248	pfo6tvr2f6qz	47f79776-a2d5-497b-80fa-8b38670461f4	f	2026-05-07 06:38:15.851151+00	2026-05-07 06:38:15.851151+00	\N	aec72b55-d2cc-4ed3-9119-686d94ca66e5
00000000-0000-0000-0000-000000000000	115	m47eqi7tmx7p	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-26 04:02:23.818471+00	2026-04-26 06:47:42.751077+00	hpnsgcrzz4hu	790d441b-81bf-4b44-af87-3158ed4f5926
00000000-0000-0000-0000-000000000000	250	mzdo4mpjgtnt	47f79776-a2d5-497b-80fa-8b38670461f4	f	2026-05-07 08:22:47.437557+00	2026-05-07 08:22:47.437557+00	fmg7vbbata5e	001bb9d8-a1a4-4934-9f14-fff589def86d
00000000-0000-0000-0000-000000000000	116	6lpeszdnyixi	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-26 06:47:42.763157+00	2026-04-26 07:46:00.704645+00	m47eqi7tmx7p	790d441b-81bf-4b44-af87-3158ed4f5926
00000000-0000-0000-0000-000000000000	117	r5r6oakrko6m	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-26 07:46:00.71143+00	2026-04-26 10:25:31.229309+00	6lpeszdnyixi	790d441b-81bf-4b44-af87-3158ed4f5926
00000000-0000-0000-0000-000000000000	118	lxnqbwrsshio	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-26 10:25:31.239556+00	2026-04-26 11:23:44.583429+00	r5r6oakrko6m	790d441b-81bf-4b44-af87-3158ed4f5926
00000000-0000-0000-0000-000000000000	119	4ahl7buluaqf	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-26 11:23:44.590437+00	2026-04-26 11:23:44.590437+00	lxnqbwrsshio	790d441b-81bf-4b44-af87-3158ed4f5926
00000000-0000-0000-0000-000000000000	256	72k6wnckb2h5	40f13c4d-8b63-443e-8191-0b4df12645fb	f	2026-05-14 17:35:32.938119+00	2026-05-14 17:35:32.938119+00	\N	964215c7-37f6-47ca-9fb7-b9b897c9d787
00000000-0000-0000-0000-000000000000	120	dz5kl7z5fnji	12a044fe-0847-4643-9c20-95ade843d316	t	2026-04-26 12:06:50.287268+00	2026-04-26 13:05:05.887586+00	\N	34a75b38-5214-4510-b45e-3d75febf9619
00000000-0000-0000-0000-000000000000	121	fa3ggun5r64t	12a044fe-0847-4643-9c20-95ade843d316	f	2026-04-26 13:05:05.894806+00	2026-04-26 13:05:05.894806+00	dz5kl7z5fnji	34a75b38-5214-4510-b45e-3d75febf9619
00000000-0000-0000-0000-000000000000	258	u7vhhxph6k7l	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-05-28 16:14:23.037699+00	2026-05-28 16:14:23.037699+00	\N	9a1ab8e0-b88a-41f0-970d-0c41d65a4976
00000000-0000-0000-0000-000000000000	260	gwtdxltnmkxm	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-05-29 18:00:27.310319+00	2026-05-29 18:00:27.310319+00	\N	3b2e73b8-20ba-47e2-9bf7-1e00c0c6a0ab
00000000-0000-0000-0000-000000000000	262	cmctpu6f6grk	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-05-29 18:59:24.676078+00	2026-05-29 20:29:50.810855+00	lrcob6vymdgv	ac73f2c4-861c-4e41-b137-3180e719d10d
00000000-0000-0000-0000-000000000000	129	agabrhnss3t3	590cfa64-d397-403c-96d0-dc975cf2a149	f	2026-04-26 18:37:07.037534+00	2026-04-26 18:37:07.037534+00	\N	9a95ead5-91a4-428d-9d40-12358ef48022
00000000-0000-0000-0000-000000000000	130	2rjjrhk5tmed	590cfa64-d397-403c-96d0-dc975cf2a149	f	2026-04-26 18:39:16.176108+00	2026-04-26 18:39:16.176108+00	\N	30c0acf0-342c-4a5b-a707-896ac20f9729
00000000-0000-0000-0000-000000000000	264	inp2ufl4sjp7	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-05-29 22:14:27.60196+00	2026-05-29 22:14:27.60196+00	elagmv3jcj4j	ac73f2c4-861c-4e41-b137-3180e719d10d
00000000-0000-0000-0000-000000000000	266	7postgjpwkgy	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-06-16 02:37:59.464086+00	2026-06-16 02:37:59.464086+00	\N	ab8f8c69-325c-4b02-87d0-3f168cf037a1
00000000-0000-0000-0000-000000000000	268	lk54ep657djq	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-06-16 02:53:35.8426+00	2026-06-16 02:53:35.8426+00	\N	672cc515-9d2d-491f-a8a2-afaef289b4a1
00000000-0000-0000-0000-000000000000	270	zlzzz3v5nmnn	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-06-16 03:55:24.72851+00	2026-06-16 04:53:25.839256+00	phfrzdmlvysx	3bb08b99-3018-4e73-a7fe-987d315c9b9f
00000000-0000-0000-0000-000000000000	272	25zzbhvujdzx	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-06-16 05:51:26.659558+00	2026-06-16 06:49:27.999254+00	miuydqmnizhw	3bb08b99-3018-4e73-a7fe-987d315c9b9f
00000000-0000-0000-0000-000000000000	274	5tfav7uuxoaj	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-06-16 07:41:17.983113+00	2026-06-16 07:41:17.983113+00	\N	f0669765-a810-4363-afbe-f5b39adacb3d
00000000-0000-0000-0000-000000000000	276	6kbv36twnxt2	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-16 09:50:53.577876+00	2026-06-16 09:50:53.577876+00	\N	d8518ea2-33ab-4758-bca3-9cc0811a671f
00000000-0000-0000-0000-000000000000	278	jhlsnfvaah2h	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-16 09:53:53.54685+00	2026-06-16 09:53:53.54685+00	\N	e0848fdb-c73a-490e-bb56-a56cad885199
00000000-0000-0000-0000-000000000000	131	wqrv7wxez7a7	590cfa64-d397-403c-96d0-dc975cf2a149	f	2026-04-26 18:39:23.79851+00	2026-04-26 18:39:23.79851+00	\N	b1ae6216-3c5f-464c-b116-438f9f17a001
00000000-0000-0000-0000-000000000000	132	imk7zju4ix4e	590cfa64-d397-403c-96d0-dc975cf2a149	f	2026-04-26 18:41:09.900082+00	2026-04-26 18:41:09.900082+00	\N	cd103e49-1e7f-42d0-9cca-1a9e13778d34
00000000-0000-0000-0000-000000000000	133	bef46sod67vz	590cfa64-d397-403c-96d0-dc975cf2a149	f	2026-04-26 18:52:13.483411+00	2026-04-26 18:52:13.483411+00	\N	bb0a2b06-8f8f-4272-90ab-eac66b00d606
00000000-0000-0000-0000-000000000000	134	qbseffi7otye	054f38ee-7af7-4bd5-b9b4-5a1dceb84a99	f	2026-04-26 18:54:49.661571+00	2026-04-26 18:54:49.661571+00	\N	cf236015-c95f-4f89-a554-ef0bc6f6f83d
00000000-0000-0000-0000-000000000000	135	dfkvld5p46ca	16eaa1a5-477b-4b43-b73e-e2373b69dc3f	f	2026-04-26 18:55:54.058575+00	2026-04-26 18:55:54.058575+00	\N	f818fd3e-a6bc-4560-9b0e-0ff50e1ca196
00000000-0000-0000-0000-000000000000	136	edjeeonqqtqa	16eaa1a5-477b-4b43-b73e-e2373b69dc3f	f	2026-04-26 18:56:17.551074+00	2026-04-26 18:56:17.551074+00	\N	8f0e57f5-d71b-4fc0-8f7d-40655006e4b0
00000000-0000-0000-0000-000000000000	137	yilx7qsc6swg	16eaa1a5-477b-4b43-b73e-e2373b69dc3f	f	2026-04-26 18:56:20.877361+00	2026-04-26 18:56:20.877361+00	\N	ce58031b-6602-452a-ae69-f108aba02795
00000000-0000-0000-0000-000000000000	138	4v3xhevfo7r5	16eaa1a5-477b-4b43-b73e-e2373b69dc3f	f	2026-04-26 18:56:23.074397+00	2026-04-26 18:56:23.074397+00	\N	b71ce566-ec1a-4701-94d3-ddde63c6d2b2
00000000-0000-0000-0000-000000000000	389	nhoni45p2kat	2ceb478d-1a3b-49e7-a64c-bab998d8aa3f	f	2026-06-25 15:32:22.992853+00	2026-06-25 15:32:22.992853+00	\N	c7c7fd48-ab90-47ef-bce9-a68fb844053b
00000000-0000-0000-0000-000000000000	397	yzctipgqdva7	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-06-26 17:51:32.932018+00	2026-06-26 17:51:32.932018+00	\N	a292b143-868d-4364-9d18-b29c2f042f75
00000000-0000-0000-0000-000000000000	404	oopkv4phili5	2ceb478d-1a3b-49e7-a64c-bab998d8aa3f	f	2026-06-26 23:47:14.735127+00	2026-06-26 23:47:14.735127+00	qe2dvzebm64i	dee66597-2029-47d7-9473-cb494067d746
00000000-0000-0000-0000-000000000000	142	3kozqw6pnpuy	16eaa1a5-477b-4b43-b73e-e2373b69dc3f	f	2026-04-26 19:10:57.388096+00	2026-04-26 19:10:57.388096+00	\N	14ac23b7-eb0a-40a0-af5f-6f73e9a11b29
00000000-0000-0000-0000-000000000000	143	w5d3hwoztwjo	16eaa1a5-477b-4b43-b73e-e2373b69dc3f	f	2026-04-26 19:11:04.796316+00	2026-04-26 19:11:04.796316+00	\N	c4ab8657-2ad2-48d8-b705-0fc19601d054
00000000-0000-0000-0000-000000000000	144	ujfvjlwxgqht	16eaa1a5-477b-4b43-b73e-e2373b69dc3f	f	2026-04-26 19:14:33.850218+00	2026-04-26 19:14:33.850218+00	\N	e99aaf32-919b-4a77-868d-b85306b0f3b0
00000000-0000-0000-0000-000000000000	411	vcj7r2vaxkit	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-06-27 11:30:24.868311+00	2026-06-27 11:30:24.868311+00	\N	a00d3d0f-9262-45cc-8efa-e0bb58321ba6
00000000-0000-0000-0000-000000000000	412	6yfed3ntkcgb	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-27 11:34:11.662368+00	2026-06-27 11:34:11.662368+00	\N	d34b1d5a-31f1-47cc-850a-ec60d7f79461
00000000-0000-0000-0000-000000000000	204	i2hi4a3tlyum	47f79776-a2d5-497b-80fa-8b38670461f4	f	2026-05-05 21:47:05.848005+00	2026-05-05 21:47:05.848005+00	tehxzwaqbia4	d974503c-1fbd-4873-bf31-6d2467b6d512
00000000-0000-0000-0000-000000000000	148	qa74iphmlm6o	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-27 01:22:57.262738+00	2026-04-27 02:20:59.907211+00	\N	b3f18405-aad8-4fc2-a1ef-4e3ae00cf523
00000000-0000-0000-0000-000000000000	419	butolk5g2odr	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-27 19:37:29.320181+00	2026-06-27 20:35:59.488822+00	x4dd2bepw7ec	7726b4dc-9e2a-4b06-a215-4c468242af9d
00000000-0000-0000-0000-000000000000	149	tvgwqq5totpp	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-27 02:20:59.922648+00	2026-04-27 03:19:29.873511+00	qa74iphmlm6o	b3f18405-aad8-4fc2-a1ef-4e3ae00cf523
00000000-0000-0000-0000-000000000000	150	fgcpg6frofti	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-27 03:19:29.881222+00	2026-04-27 03:19:29.881222+00	tvgwqq5totpp	b3f18405-aad8-4fc2-a1ef-4e3ae00cf523
00000000-0000-0000-0000-000000000000	209	i6o77m4u2tdv	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-05-05 23:28:54.528653+00	2026-05-06 00:27:06.893365+00	\N	2093b213-238e-4dff-ab1a-8c354b8ed3cc
00000000-0000-0000-0000-000000000000	214	grawtddchtbr	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-05-06 04:24:08.414278+00	2026-05-06 10:11:34.321273+00	xrqivumaxkvl	2093b213-238e-4dff-ab1a-8c354b8ed3cc
00000000-0000-0000-0000-000000000000	154	epughmkrhcq4	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-27 09:11:33.728318+00	2026-04-27 09:11:33.728318+00	\N	23a717e4-bab4-4685-b9b9-436c7b0dbe8a
00000000-0000-0000-0000-000000000000	155	bn27dxes5l7v	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-27 09:14:34.647876+00	2026-04-27 09:14:34.647876+00	\N	cd15abb3-054f-4f32-a66d-3123dcfa2b6f
00000000-0000-0000-0000-000000000000	156	slx3kiaa3sxt	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-27 09:18:52.283356+00	2026-04-27 09:18:52.283356+00	\N	5a76bd93-a59a-47ef-9d27-f19a3f7476e5
00000000-0000-0000-0000-000000000000	157	ipjf2b2vkcs2	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-27 09:19:34.828853+00	2026-04-27 09:19:34.828853+00	\N	9fd2b7d9-7e35-482a-a0e4-181fafff35b4
00000000-0000-0000-0000-000000000000	158	ysmtrn75d7hh	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-27 09:19:56.284162+00	2026-04-27 09:19:56.284162+00	\N	48f5ae62-0000-4d3c-a1dd-e3d71bf321a4
00000000-0000-0000-0000-000000000000	159	vsd66ckdwufp	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-27 09:24:19.748292+00	2026-04-27 09:24:19.748292+00	\N	0e51970c-4cf9-4168-8a09-b8ee8a97aeab
00000000-0000-0000-0000-000000000000	160	d56khcajbqfi	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-27 10:18:48.220169+00	2026-04-27 10:18:48.220169+00	\N	2cfe5268-b632-4977-9eae-277af40534d3
00000000-0000-0000-0000-000000000000	220	xtfnironvfgt	8e237b3f-2e09-4938-899b-b97d12deee1a	f	2026-05-06 13:27:21.136546+00	2026-05-06 13:27:21.136546+00	\N	69f6fdb9-62b7-43ee-a815-68981406f461
00000000-0000-0000-0000-000000000000	225	bs6tyavf7owf	8e237b3f-2e09-4938-899b-b97d12deee1a	f	2026-05-06 14:57:46.931478+00	2026-05-06 14:57:46.931478+00	s2wgh6b2mhin	d6ed153a-8699-4d6d-be66-a80e0688dff2
00000000-0000-0000-0000-000000000000	231	6vcwvyf4c5gb	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-05-06 19:02:12.855221+00	2026-05-06 19:02:12.855221+00	\N	e0cf72ee-6063-4ee4-899f-e2307ef94de1
00000000-0000-0000-0000-000000000000	236	i7vy2v4azumy	8e237b3f-2e09-4938-899b-b97d12deee1a	f	2026-05-06 21:29:17.300423+00	2026-05-06 21:29:17.300423+00	\N	098bc351-31a2-4eed-abf6-2cb3b45b25a4
00000000-0000-0000-0000-000000000000	426	qgn3bjatlikd	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-28 02:27:00.247785+00	2026-06-28 03:25:30.503136+00	ac4udehb5lgf	7726b4dc-9e2a-4b06-a215-4c468242af9d
00000000-0000-0000-0000-000000000000	166	sixnb4wygzpr	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-27 13:27:56.508895+00	2026-04-27 13:27:56.508895+00	\N	d1ddc40b-366d-4c60-a165-fe06433aedca
00000000-0000-0000-0000-000000000000	167	62ian4hmg5uf	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-27 13:28:16.205317+00	2026-04-27 13:28:16.205317+00	\N	0b89d36d-d364-486f-8a43-aa08792c4568
00000000-0000-0000-0000-000000000000	168	4ll4rma7slin	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-27 13:29:21.563834+00	2026-04-27 13:29:21.563834+00	\N	a5c8cc11-5c6c-4ced-aca8-398d3b3b0fbc
00000000-0000-0000-0000-000000000000	169	llbdh72gukvn	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-27 13:35:18.446914+00	2026-04-27 13:35:18.446914+00	\N	17f3d22e-91e3-40de-91b7-fda82795622d
00000000-0000-0000-0000-000000000000	170	oojp2yqokuwu	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-27 13:41:39.647336+00	2026-04-27 13:41:39.647336+00	\N	17c72666-2fbd-4a58-ba3d-f4dfe732cea2
00000000-0000-0000-0000-000000000000	171	bdzyibhnairb	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-27 14:11:56.274255+00	2026-04-27 14:11:56.274255+00	\N	e4c5c6f5-ca14-4ef7-ae0f-fb4a798e473d
00000000-0000-0000-0000-000000000000	172	4g3ezciarizb	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-27 14:12:26.893587+00	2026-04-27 15:10:48.749276+00	\N	0fd0925e-b20f-4912-8a3f-a89a45ff3190
00000000-0000-0000-0000-000000000000	173	gtfwn66nhpou	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-04-27 15:10:48.762495+00	2026-04-27 16:09:05.309133+00	4g3ezciarizb	0fd0925e-b20f-4912-8a3f-a89a45ff3190
00000000-0000-0000-0000-000000000000	175	jzrqfdsrynen	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-27 16:09:05.318097+00	2026-04-27 16:09:05.318097+00	gtfwn66nhpou	0fd0925e-b20f-4912-8a3f-a89a45ff3190
00000000-0000-0000-0000-000000000000	176	xmyftpesf7o5	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-28 07:59:40.010004+00	2026-04-28 07:59:40.010004+00	\N	01bf26c7-ea3d-45cb-bc1b-1bc585132186
00000000-0000-0000-0000-000000000000	177	3gt7vkyakojv	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-28 07:59:56.554935+00	2026-04-28 07:59:56.554935+00	\N	a06bc414-86cd-46f7-8b5c-63053c5c4272
00000000-0000-0000-0000-000000000000	178	duzul3yf4jjx	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-28 08:01:50.003217+00	2026-04-28 08:01:50.003217+00	\N	c73642c6-34e8-4e3d-848d-ad089694a4a5
00000000-0000-0000-0000-000000000000	179	pkkidz2ypn3m	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-28 08:01:55.695596+00	2026-04-28 08:01:55.695596+00	\N	8f268403-ba44-4c2e-90fd-37cc23dcb81e
00000000-0000-0000-0000-000000000000	180	jpasvzxgsssq	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-04-28 09:08:34.04351+00	2026-04-28 09:08:34.04351+00	\N	6e22b5a4-c044-4229-ad99-5dea6c484d75
00000000-0000-0000-0000-000000000000	181	rpd4ryokylzd	40f13c4d-8b63-443e-8191-0b4df12645fb	f	2026-05-01 16:55:35.591476+00	2026-05-01 16:55:35.591476+00	\N	0c24e091-2b09-48f4-8145-2d1d3e019fa8
00000000-0000-0000-0000-000000000000	182	frbfbtov3u55	40f13c4d-8b63-443e-8191-0b4df12645fb	f	2026-05-02 14:40:53.253814+00	2026-05-02 14:40:53.253814+00	\N	92e48ce7-94d6-463a-9aa3-baf7e4374824
00000000-0000-0000-0000-000000000000	183	3znprbvtzefa	40f13c4d-8b63-443e-8191-0b4df12645fb	f	2026-05-02 15:28:10.523387+00	2026-05-02 15:28:10.523387+00	\N	183862ea-4727-4972-8177-b6066dabef66
00000000-0000-0000-0000-000000000000	184	miumidbwozvf	40f13c4d-8b63-443e-8191-0b4df12645fb	f	2026-05-02 15:31:52.387721+00	2026-05-02 15:31:52.387721+00	\N	ca325812-c0fa-4939-abd2-45ef4e88dda6
00000000-0000-0000-0000-000000000000	185	4yapxq5xnr7a	40f13c4d-8b63-443e-8191-0b4df12645fb	f	2026-05-02 15:32:06.64982+00	2026-05-02 15:32:06.64982+00	\N	7b3ca30e-371e-4af2-9ed4-0b7f7a850eb8
00000000-0000-0000-0000-000000000000	186	rwha7v3gdhaw	40f13c4d-8b63-443e-8191-0b4df12645fb	f	2026-05-02 15:34:14.657321+00	2026-05-02 15:34:14.657321+00	\N	a2bc3220-6376-4b57-9242-d38327872906
00000000-0000-0000-0000-000000000000	187	zyv2cbfnjvtw	40f13c4d-8b63-443e-8191-0b4df12645fb	f	2026-05-02 15:47:00.85724+00	2026-05-02 15:47:00.85724+00	\N	d5a85c46-5d8b-483d-83e2-061f3ea3d7d5
00000000-0000-0000-0000-000000000000	188	hbbv35oj6mpv	c93e16a6-b9fc-4739-b0fe-b1e96315422b	f	2026-05-02 15:53:24.694001+00	2026-05-02 15:53:24.694001+00	\N	6a5167b5-9ec3-496b-9706-d5f56ed42e33
00000000-0000-0000-0000-000000000000	189	w4p4wtj24s56	c93e16a6-b9fc-4739-b0fe-b1e96315422b	f	2026-05-02 15:54:04.72292+00	2026-05-02 15:54:04.72292+00	\N	37c166e3-c5fa-497f-b429-3f6b6ce6fbf9
00000000-0000-0000-0000-000000000000	190	667r7ycwycqa	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-05-02 16:39:12.509069+00	2026-05-02 16:39:12.509069+00	\N	11c09db5-72fd-49c8-9cec-cf232f92ce2a
00000000-0000-0000-0000-000000000000	191	l7t6o5o5xkfz	47f79776-a2d5-497b-80fa-8b38670461f4	f	2026-05-02 16:50:41.799177+00	2026-05-02 16:50:41.799177+00	\N	d0e9fcb7-ffaa-4219-9906-cf1014b96dbf
00000000-0000-0000-0000-000000000000	192	ca3ucxwlyflr	47f79776-a2d5-497b-80fa-8b38670461f4	f	2026-05-02 16:52:32.64641+00	2026-05-02 16:52:32.64641+00	\N	d523ee02-0673-4b35-92f6-e47d571975cf
00000000-0000-0000-0000-000000000000	200	sbr3sc74fgey	47f79776-a2d5-497b-80fa-8b38670461f4	t	2026-05-05 17:53:05.141452+00	2026-05-05 18:51:35.015566+00	fjz5j5rkzy4l	d974503c-1fbd-4873-bf31-6d2467b6d512
00000000-0000-0000-0000-000000000000	193	skfu7nvmfemd	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-05-02 17:05:42.980437+00	2026-05-02 18:04:06.515616+00	\N	ba7cf3da-872f-4b74-b2c2-b832971a8531
00000000-0000-0000-0000-000000000000	194	vycbhqv2blwi	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-05-02 18:04:06.522406+00	2026-05-02 18:04:06.522406+00	skfu7nvmfemd	ba7cf3da-872f-4b74-b2c2-b832971a8531
00000000-0000-0000-0000-000000000000	195	v6qddok6q4ha	47f79776-a2d5-497b-80fa-8b38670461f4	f	2026-05-05 16:27:42.340418+00	2026-05-05 16:27:42.340418+00	\N	185dc509-667a-471b-bffd-29b79d825f40
00000000-0000-0000-0000-000000000000	196	po3qh5vch4rm	47f79776-a2d5-497b-80fa-8b38670461f4	f	2026-05-05 16:28:58.338993+00	2026-05-05 16:28:58.338993+00	\N	9b67b961-cf8c-48af-8626-f693cf42d588
00000000-0000-0000-0000-000000000000	197	4rl3i6at3tyu	47f79776-a2d5-497b-80fa-8b38670461f4	f	2026-05-05 16:52:43.283691+00	2026-05-05 16:52:43.283691+00	\N	290aa276-829e-4bb3-983c-244c7eafbaf6
00000000-0000-0000-0000-000000000000	198	grurfps5a27i	47f79776-a2d5-497b-80fa-8b38670461f4	f	2026-05-05 16:52:58.909942+00	2026-05-05 16:52:58.909942+00	\N	f531028b-4cb7-4a5e-8c22-e783e8a43fdf
00000000-0000-0000-0000-000000000000	205	maeh5rpyczxc	8e237b3f-2e09-4938-899b-b97d12deee1a	f	2026-05-05 23:00:43.454087+00	2026-05-05 23:00:43.454087+00	\N	5a3c12ae-f861-4b14-adf0-c34acf861c2f
00000000-0000-0000-0000-000000000000	199	fjz5j5rkzy4l	47f79776-a2d5-497b-80fa-8b38670461f4	t	2026-05-05 16:54:36.102236+00	2026-05-05 17:53:05.126094+00	\N	d974503c-1fbd-4873-bf31-6d2467b6d512
00000000-0000-0000-0000-000000000000	390	djcp4n4fdfoe	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	t	2026-06-26 10:30:26.021998+00	2026-06-26 11:28:57.665909+00	\N	e6237a83-84b8-46fc-8d96-7104fe5e7523
00000000-0000-0000-0000-000000000000	210	vbilpanq7ypw	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-05-06 00:27:06.91192+00	2026-05-06 01:25:38.48385+00	i6o77m4u2tdv	2093b213-238e-4dff-ab1a-8c354b8ed3cc
00000000-0000-0000-0000-000000000000	215	vgpgi2qpvxb2	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-05-06 10:11:34.346643+00	2026-05-06 10:11:34.346643+00	grawtddchtbr	2093b213-238e-4dff-ab1a-8c354b8ed3cc
00000000-0000-0000-0000-000000000000	221	eg2jhiifejuq	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	f	2026-05-06 13:33:37.392414+00	2026-05-06 13:33:37.392414+00	\N	4a2906ea-5021-4f36-8521-0f8253b7cb03
00000000-0000-0000-0000-000000000000	226	35tr2kqyg7dq	8e237b3f-2e09-4938-899b-b97d12deee1a	f	2026-05-06 17:53:18.777563+00	2026-05-06 17:53:18.777563+00	\N	19286646-f4a5-4bfe-9111-8727a3d63951
00000000-0000-0000-0000-000000000000	227	3r4wurukw7ko	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	f	2026-05-06 17:56:16.769554+00	2026-05-06 17:56:16.769554+00	\N	03c0a08f-129f-40d6-a57f-5808ba76f762
00000000-0000-0000-0000-000000000000	232	ny3icf7by6of	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-05-06 19:28:11.259905+00	2026-05-06 19:28:11.259905+00	\N	a60799c1-c90c-4b06-af10-c45e8a3c6172
00000000-0000-0000-0000-000000000000	237	uu7tfhoctxi7	8e237b3f-2e09-4938-899b-b97d12deee1a	f	2026-05-06 21:40:32.283289+00	2026-05-06 21:40:32.283289+00	\N	77911b5f-1545-4af2-b2f4-304a84bc932d
00000000-0000-0000-0000-000000000000	238	b7ur6u2flcvh	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-05-06 21:41:27.066578+00	2026-05-06 21:41:27.066578+00	\N	99be4e3a-7f9b-424c-93d9-d4fb98520715
00000000-0000-0000-0000-000000000000	242	kkag56tr7wyl	47f79776-a2d5-497b-80fa-8b38670461f4	t	2026-05-07 00:27:37.767609+00	2026-05-07 01:26:07.146741+00	psgc7d4iluju	1862011f-8561-40a2-852d-eda6574bc4ef
00000000-0000-0000-0000-000000000000	245	iiq6dhkch7ea	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-05-07 05:32:03.704654+00	2026-05-07 05:32:03.704654+00	\N	c3d13b14-2b54-4d78-86bf-2317c39010aa
00000000-0000-0000-0000-000000000000	247	mlcrrxtwxtzr	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-05-07 06:31:47.032221+00	2026-05-07 06:31:47.032221+00	\N	974f5670-9ae0-4ab8-b0d3-542b7832f36c
00000000-0000-0000-0000-000000000000	398	66gvsmybg2f2	2ceb478d-1a3b-49e7-a64c-bab998d8aa3f	t	2026-06-26 17:56:36.868758+00	2026-06-26 18:54:43.329519+00	\N	dee66597-2029-47d7-9473-cb494067d746
00000000-0000-0000-0000-000000000000	249	fmg7vbbata5e	47f79776-a2d5-497b-80fa-8b38670461f4	t	2026-05-07 06:43:33.093498+00	2026-05-07 08:22:47.424664+00	\N	001bb9d8-a1a4-4934-9f14-fff589def86d
00000000-0000-0000-0000-000000000000	251	z6563efktwyo	47f79776-a2d5-497b-80fa-8b38670461f4	f	2026-05-07 08:48:29.199799+00	2026-05-07 08:48:29.199799+00	\N	5c5db3eb-1ed8-4b13-981a-c33a762f24f7
00000000-0000-0000-0000-000000000000	405	bbx5ym2nz5uj	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-27 07:59:18.929241+00	2026-06-27 07:59:18.929241+00	\N	0dfdeb60-ce1b-418c-92a6-b2f051d1115e
00000000-0000-0000-0000-000000000000	413	b2q237xezt65	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	t	2026-06-27 11:36:05.145243+00	2026-06-27 12:34:23.285116+00	\N	dc1404a4-64ca-4120-aaa4-6af6e81e72f9
00000000-0000-0000-0000-000000000000	259	6c3i5mgj3arf	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-05-28 16:29:32.637305+00	2026-05-28 16:29:32.637305+00	\N	4428c425-2ab0-42c3-a138-db02b62d7299
00000000-0000-0000-0000-000000000000	261	lrcob6vymdgv	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-05-29 18:01:13.716155+00	2026-05-29 18:59:24.652309+00	\N	ac73f2c4-861c-4e41-b137-3180e719d10d
00000000-0000-0000-0000-000000000000	420	pmx4i4spowb6	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-27 20:35:59.506729+00	2026-06-27 21:34:29.680223+00	butolk5g2odr	7726b4dc-9e2a-4b06-a215-4c468242af9d
00000000-0000-0000-0000-000000000000	263	elagmv3jcj4j	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-05-29 20:29:50.825213+00	2026-05-29 22:14:27.581216+00	cmctpu6f6grk	ac73f2c4-861c-4e41-b137-3180e719d10d
00000000-0000-0000-0000-000000000000	265	er75r66j3dv6	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-06-16 01:57:29.242114+00	2026-06-16 01:57:29.242114+00	\N	a9b47e58-51a7-4617-8efe-52cd2714f58b
00000000-0000-0000-0000-000000000000	267	funhrmevpe56	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	f	2026-06-16 02:50:42.805061+00	2026-06-16 02:50:42.805061+00	\N	a2e95855-fca4-4f3e-b444-58218c527ca7
00000000-0000-0000-0000-000000000000	269	phfrzdmlvysx	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-06-16 02:56:58.944011+00	2026-06-16 03:55:24.709899+00	\N	3bb08b99-3018-4e73-a7fe-987d315c9b9f
00000000-0000-0000-0000-000000000000	427	svrldquvjw6y	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-28 03:25:30.523223+00	2026-06-28 04:24:00.593739+00	qgn3bjatlikd	7726b4dc-9e2a-4b06-a215-4c468242af9d
00000000-0000-0000-0000-000000000000	271	miuydqmnizhw	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	t	2026-06-16 04:53:25.845554+00	2026-06-16 05:51:26.651626+00	zlzzz3v5nmnn	3bb08b99-3018-4e73-a7fe-987d315c9b9f
00000000-0000-0000-0000-000000000000	273	7hlpmjgynz6v	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-06-16 06:49:28.0086+00	2026-06-16 06:49:28.0086+00	25zzbhvujdzx	3bb08b99-3018-4e73-a7fe-987d315c9b9f
00000000-0000-0000-0000-000000000000	275	3k75qdiomcvb	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-16 09:45:48.043079+00	2026-06-16 09:45:48.043079+00	\N	3691e00d-68a8-4685-9518-aac799c15572
00000000-0000-0000-0000-000000000000	277	3uwjn7ub5qpm	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-16 09:51:59.313287+00	2026-06-16 09:51:59.313287+00	\N	3216b3b8-25d2-4f3b-9dc6-f90621016ec0
00000000-0000-0000-0000-000000000000	279	askfrwaevsrk	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-16 09:53:57.107002+00	2026-06-16 09:53:57.107002+00	\N	0b97748c-ad45-4813-b3f0-f49755807239
00000000-0000-0000-0000-000000000000	280	nfod3tyrtzld	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-16 09:54:00.824223+00	2026-06-16 09:54:00.824223+00	\N	9020a286-887f-4093-95a4-06f3ae509cae
00000000-0000-0000-0000-000000000000	281	rq7n7wwqpzvh	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-16 09:54:19.670812+00	2026-06-16 09:54:19.670812+00	\N	946587e6-d4f8-4686-9c43-e5228df3a1ed
00000000-0000-0000-0000-000000000000	433	edrujr6jglcg	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	t	2026-06-28 11:33:58.271012+00	2026-06-28 12:32:00.420153+00	weqlb4oboeb2	2e12a7f2-bbd8-4eb1-b9c1-a46b19725af2
00000000-0000-0000-0000-000000000000	439	peegwmfnmoye	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	f	2026-06-28 14:45:16.113445+00	2026-06-28 14:45:16.113445+00	\N	23b9a56c-7f68-4a50-b7c4-ae0d9509327d
00000000-0000-0000-0000-000000000000	446	kcn33kpmotgg	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-28 16:26:06.286644+00	2026-06-28 16:26:06.286644+00	\N	eb81acd5-6448-495b-ace4-1558e39bc12f
00000000-0000-0000-0000-000000000000	453	6vdsorbqlnny	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	t	2026-06-28 19:49:43.206022+00	2026-06-28 23:41:56.121973+00	o7c3hpw2cjrp	9e42e1d5-d975-498e-a90e-14ee2a43e693
00000000-0000-0000-0000-000000000000	282	cnjctv4q6zfs	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-16 10:00:43.473378+00	2026-06-16 10:00:43.473378+00	\N	4ba6a66a-d1be-4700-88a2-8379f8d38d38
00000000-0000-0000-0000-000000000000	283	6dwy4t22oh3f	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-16 10:01:10.21556+00	2026-06-16 10:01:10.21556+00	\N	3718d672-abbe-40c8-9ba9-f6574b8be2fd
00000000-0000-0000-0000-000000000000	284	a37ljxynf2vo	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-16 10:01:34.409554+00	2026-06-16 10:01:34.409554+00	\N	66d00bfa-52a8-46a4-a664-f9dc6b3937d8
00000000-0000-0000-0000-000000000000	285	b7kszc5sxlfa	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-16 10:02:09.283852+00	2026-06-16 10:02:09.283852+00	\N	346dfe1c-bc0a-4069-87e4-4a81ae852af0
00000000-0000-0000-0000-000000000000	286	4sbq6s6yo4ky	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-16 10:02:52.586749+00	2026-06-16 10:02:52.586749+00	\N	56e5c6d1-9af7-4787-b8dd-38ee672c2001
00000000-0000-0000-0000-000000000000	287	ilkzvirgm72v	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-16 10:03:12.050615+00	2026-06-16 10:03:12.050615+00	\N	e6b25c9b-5e03-4d3a-b096-d8e15f81641d
00000000-0000-0000-0000-000000000000	288	fsnxckx2e7rg	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-16 10:06:13.185268+00	2026-06-16 10:06:13.185268+00	\N	d98704f5-9067-4aa4-8a4e-598b3a02efa5
00000000-0000-0000-0000-000000000000	289	wqk3dojcbqrc	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-16 10:27:40.460702+00	2026-06-16 10:27:40.460702+00	\N	60f1f219-097a-4f1a-a87b-e983b8e129a0
00000000-0000-0000-0000-000000000000	291	jn5eodjc37v3	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-06-16 10:57:26.82597+00	2026-06-16 10:57:26.82597+00	\N	f7ed7a83-acba-4a03-bd10-9036a316ca34
00000000-0000-0000-0000-000000000000	292	3yxtytdhh7i5	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-06-16 11:01:34.714894+00	2026-06-16 11:01:34.714894+00	\N	1620a02f-df61-4cab-ad77-3caaed8aa86d
00000000-0000-0000-0000-000000000000	293	gwlu25olwevh	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-06-16 11:12:21.806109+00	2026-06-16 11:12:21.806109+00	\N	c1f0c4d8-c958-43d2-ba1c-251d260d96a2
00000000-0000-0000-0000-000000000000	391	fxei5xkqvy4s	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	t	2026-06-26 11:28:57.688602+00	2026-06-26 12:29:41.368868+00	djcp4n4fdfoe	e6237a83-84b8-46fc-8d96-7104fe5e7523
00000000-0000-0000-0000-000000000000	290	trzxyuvl7jtl	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	t	2026-06-16 10:29:18.560137+00	2026-06-16 11:27:28.366049+00	\N	c7284af3-89e4-4ef4-9f80-9677fcf996d1
00000000-0000-0000-0000-000000000000	295	oaabo7xabiap	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-16 11:27:28.373366+00	2026-06-16 11:27:28.373366+00	trzxyuvl7jtl	c7284af3-89e4-4ef4-9f80-9677fcf996d1
00000000-0000-0000-0000-000000000000	296	bo6prnztjuhm	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-16 11:28:03.594332+00	2026-06-16 11:28:03.594332+00	\N	1f0b8520-1620-410b-a82d-bca0d6ef6b5d
00000000-0000-0000-0000-000000000000	297	vd32gy7hqyqj	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-16 11:35:04.699546+00	2026-06-16 11:35:04.699546+00	\N	10b12a90-4971-452d-807a-548bc4dc8486
00000000-0000-0000-0000-000000000000	294	zrfimsv2r7ab	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-16 11:17:56.017266+00	2026-06-16 13:18:55.980699+00	\N	9e8dd69c-099b-43b1-ad82-b1ef654c2aea
00000000-0000-0000-0000-000000000000	298	34n4wnzwubzi	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-16 13:18:56.003287+00	2026-06-16 17:09:36.01902+00	zrfimsv2r7ab	9e8dd69c-099b-43b1-ad82-b1ef654c2aea
00000000-0000-0000-0000-000000000000	399	c2kez22as3g3	2ceb478d-1a3b-49e7-a64c-bab998d8aa3f	t	2026-06-26 18:54:43.347262+00	2026-06-26 19:53:13.516121+00	66gvsmybg2f2	dee66597-2029-47d7-9473-cb494067d746
00000000-0000-0000-0000-000000000000	299	jsr62tfbfmw5	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-16 17:09:36.034699+00	2026-06-16 18:07:53.173513+00	34n4wnzwubzi	9e8dd69c-099b-43b1-ad82-b1ef654c2aea
00000000-0000-0000-0000-000000000000	406	isk7aye33cke	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-27 08:07:45.165197+00	2026-06-27 08:07:45.165197+00	\N	36d86707-40a8-405c-844c-101effaaf511
00000000-0000-0000-0000-000000000000	300	xrhekmdl266p	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-16 18:07:53.18036+00	2026-06-16 19:06:25.061849+00	jsr62tfbfmw5	9e8dd69c-099b-43b1-ad82-b1ef654c2aea
00000000-0000-0000-0000-000000000000	301	355ndij3zdpi	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-16 19:06:25.067909+00	2026-06-16 20:04:54.664967+00	xrhekmdl266p	9e8dd69c-099b-43b1-ad82-b1ef654c2aea
00000000-0000-0000-0000-000000000000	414	djcwbecevnz7	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	t	2026-06-27 12:34:23.303103+00	2026-06-27 13:32:38.09136+00	b2q237xezt65	dc1404a4-64ca-4120-aaa4-6af6e81e72f9
00000000-0000-0000-0000-000000000000	302	awx5eygbaefp	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-16 20:04:54.674626+00	2026-06-16 21:03:24.316755+00	355ndij3zdpi	9e8dd69c-099b-43b1-ad82-b1ef654c2aea
00000000-0000-0000-0000-000000000000	303	7ypmv5vuhjiu	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-16 21:03:24.324847+00	2026-06-16 22:01:53.821714+00	awx5eygbaefp	9e8dd69c-099b-43b1-ad82-b1ef654c2aea
00000000-0000-0000-0000-000000000000	421	epezpzxsrynv	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-27 21:34:29.69595+00	2026-06-27 22:32:59.751909+00	pmx4i4spowb6	7726b4dc-9e2a-4b06-a215-4c468242af9d
00000000-0000-0000-0000-000000000000	304	2atqqigujgkh	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-16 22:01:53.834367+00	2026-06-16 23:00:23.967639+00	7ypmv5vuhjiu	9e8dd69c-099b-43b1-ad82-b1ef654c2aea
00000000-0000-0000-0000-000000000000	305	noomwsdq57sx	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-16 23:00:23.978771+00	2026-06-16 23:58:54.214676+00	2atqqigujgkh	9e8dd69c-099b-43b1-ad82-b1ef654c2aea
00000000-0000-0000-0000-000000000000	428	sapyabhitinx	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-28 04:24:00.619637+00	2026-06-28 05:22:30.672246+00	svrldquvjw6y	7726b4dc-9e2a-4b06-a215-4c468242af9d
00000000-0000-0000-0000-000000000000	306	nhayjtt7wole	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-16 23:58:54.220125+00	2026-06-17 00:57:24.209095+00	noomwsdq57sx	9e8dd69c-099b-43b1-ad82-b1ef654c2aea
00000000-0000-0000-0000-000000000000	434	vvpuls4yqj47	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	f	2026-06-28 12:32:00.429307+00	2026-06-28 12:32:00.429307+00	edrujr6jglcg	2e12a7f2-bbd8-4eb1-b9c1-a46b19725af2
00000000-0000-0000-0000-000000000000	307	znafx3hciey5	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-17 00:57:24.219051+00	2026-06-17 01:55:54.372792+00	nhayjtt7wole	9e8dd69c-099b-43b1-ad82-b1ef654c2aea
00000000-0000-0000-0000-000000000000	440	hszssdpofd6s	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-06-28 14:50:10.349685+00	2026-06-28 14:50:10.349685+00	\N	62c5ba4f-b8c9-4e7e-bfc0-29ea74e40a64
00000000-0000-0000-0000-000000000000	308	if5urhkwlpkw	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-17 01:55:54.379695+00	2026-06-17 02:54:25.043468+00	znafx3hciey5	9e8dd69c-099b-43b1-ad82-b1ef654c2aea
00000000-0000-0000-0000-000000000000	447	wrwv4fa2mecl	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-28 16:28:06.339978+00	2026-06-28 16:28:06.339978+00	\N	2634b991-6f48-4dd6-bf6d-797475e0185c
00000000-0000-0000-0000-000000000000	309	vlzc4d7rhhc4	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-17 02:54:25.06411+00	2026-06-17 10:52:27.974736+00	if5urhkwlpkw	9e8dd69c-099b-43b1-ad82-b1ef654c2aea
00000000-0000-0000-0000-000000000000	454	lbpw5c5ukogl	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-28 23:41:56.135014+00	2026-06-28 23:41:56.135014+00	6vdsorbqlnny	9e42e1d5-d975-498e-a90e-14ee2a43e693
00000000-0000-0000-0000-000000000000	310	34ipqeqfggrb	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-17 10:52:28.003713+00	2026-06-17 11:50:56.165545+00	vlzc4d7rhhc4	9e8dd69c-099b-43b1-ad82-b1ef654c2aea
00000000-0000-0000-0000-000000000000	311	sfrb7ggkuqns	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-06-17 11:50:56.178392+00	2026-06-17 11:50:56.178392+00	34ipqeqfggrb	9e8dd69c-099b-43b1-ad82-b1ef654c2aea
00000000-0000-0000-0000-000000000000	458	s56z2xtomivk	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	f	2026-07-01 12:28:21.537624+00	2026-07-01 12:28:21.537624+00	\N	a47701cd-e6e0-4358-bc19-960216cac6dc
00000000-0000-0000-0000-000000000000	312	q3szpn7iohtr	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-18 07:42:35.353445+00	2026-06-18 08:41:04.380304+00	\N	6729aa92-73e7-4861-b63e-067d589a2b3e
00000000-0000-0000-0000-000000000000	313	otl6mpnfz26e	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-06-18 08:41:04.406944+00	2026-06-18 08:41:04.406944+00	q3szpn7iohtr	6729aa92-73e7-4861-b63e-067d589a2b3e
00000000-0000-0000-0000-000000000000	314	nwzljjz22ydv	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-06-18 09:19:01.987962+00	2026-06-18 09:19:01.987962+00	\N	09d3ae6b-f13e-4db8-b73c-75c697e00dd7
00000000-0000-0000-0000-000000000000	315	w7uq4tdamg2b	754671cd-2b76-4ccb-a0bb-690adcf34443	f	2026-06-18 13:23:15.555783+00	2026-06-18 13:23:15.555783+00	\N	016b3e68-b87b-49e4-8a6c-59775e3dda6d
00000000-0000-0000-0000-000000000000	316	rejmaywwetbs	754671cd-2b76-4ccb-a0bb-690adcf34443	f	2026-06-18 13:37:35.708708+00	2026-06-18 13:37:35.708708+00	\N	6a512da5-2aaa-4a86-971e-f4da822116f1
00000000-0000-0000-0000-000000000000	317	cqd5whpsxpcx	adad5263-20b1-4f82-8650-e2011ed199ab	f	2026-06-18 14:33:54.280399+00	2026-06-18 14:33:54.280399+00	\N	5b19b13c-bbc3-4603-b974-314428e4e383
00000000-0000-0000-0000-000000000000	318	w2l7mhmxu3mz	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	f	2026-06-18 14:39:10.020356+00	2026-06-18 14:39:10.020356+00	\N	13373f67-e667-407f-9c9d-1cf6632ab432
00000000-0000-0000-0000-000000000000	319	4tmi2of3zyhm	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	f	2026-06-18 15:35:17.859264+00	2026-06-18 15:35:17.859264+00	\N	147517e3-4cf4-4eb4-80a2-a15209ee21a5
00000000-0000-0000-0000-000000000000	320	e4nfgolype4t	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	f	2026-06-18 15:39:37.140297+00	2026-06-18 15:39:37.140297+00	\N	ce16c67e-cd9a-4a29-9a8a-7ad7c50995d7
00000000-0000-0000-0000-000000000000	321	4apnulqwuyc6	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	f	2026-06-18 15:43:06.419704+00	2026-06-18 15:43:06.419704+00	\N	3abb80de-4452-411e-a3b7-c0b7483a953d
00000000-0000-0000-0000-000000000000	322	b6tgug52fjzl	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-18 15:50:06.165665+00	2026-06-18 15:50:06.165665+00	\N	c58dc233-3d1b-4ad6-8eb7-adb3a45fc041
00000000-0000-0000-0000-000000000000	323	gtvxgwe2pewg	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-18 15:56:33.805643+00	2026-06-18 15:56:33.805643+00	\N	a851c3b3-e807-410b-8614-117bdebce239
00000000-0000-0000-0000-000000000000	324	bw5fg5upcunf	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-18 15:56:57.764713+00	2026-06-18 15:56:57.764713+00	\N	51c4cecc-a7cd-49b1-abf9-5972446612dd
00000000-0000-0000-0000-000000000000	325	we7p5wyjsevh	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-18 15:57:40.4283+00	2026-06-18 15:57:40.4283+00	\N	7f86b4b7-a247-4486-91f5-baa9449b69d6
00000000-0000-0000-0000-000000000000	326	y25g7cl57lwd	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-18 15:57:59.07184+00	2026-06-18 15:57:59.07184+00	\N	dd00f352-4442-4bd8-902b-9c813f56a95e
00000000-0000-0000-0000-000000000000	327	pwbgrhcmpsmq	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-18 15:58:58.097478+00	2026-06-18 15:58:58.097478+00	\N	9fe72ef4-a9bc-404e-94ed-c0e20714a701
00000000-0000-0000-0000-000000000000	328	733ayduszhsf	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	f	2026-06-18 16:34:52.571321+00	2026-06-18 16:34:52.571321+00	\N	1336a58c-748f-4faa-a3e7-04d82a0e544a
00000000-0000-0000-0000-000000000000	392	f4wzlosluc3y	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-26 12:29:41.37436+00	2026-06-26 12:29:41.37436+00	fxei5xkqvy4s	e6237a83-84b8-46fc-8d96-7104fe5e7523
00000000-0000-0000-0000-000000000000	329	ykuomqo4jk3p	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	t	2026-06-22 08:09:57.303838+00	2026-06-22 09:08:26.510603+00	\N	82fa1d6e-9a3b-46d4-a376-45de0d0935d1
00000000-0000-0000-0000-000000000000	330	v5gv755c7ver	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	t	2026-06-22 09:08:26.524807+00	2026-06-22 10:07:36.591793+00	ykuomqo4jk3p	82fa1d6e-9a3b-46d4-a376-45de0d0935d1
00000000-0000-0000-0000-000000000000	400	jnupbstdyqcr	2ceb478d-1a3b-49e7-a64c-bab998d8aa3f	t	2026-06-26 19:53:13.52135+00	2026-06-26 20:51:43.854808+00	c2kez22as3g3	dee66597-2029-47d7-9473-cb494067d746
00000000-0000-0000-0000-000000000000	331	ao6kvkd2chnj	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	t	2026-06-22 10:07:36.597929+00	2026-06-22 12:07:14.487682+00	v5gv755c7ver	82fa1d6e-9a3b-46d4-a376-45de0d0935d1
00000000-0000-0000-0000-000000000000	407	r6v5f625jg4u	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-27 08:15:46.413926+00	2026-06-27 08:15:46.413926+00	\N	270fa836-0345-41d9-90ef-b29d05bd3e70
00000000-0000-0000-0000-000000000000	332	dqmjd3q5dhxe	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	t	2026-06-22 12:07:14.498536+00	2026-06-22 14:40:23.567343+00	ao6kvkd2chnj	82fa1d6e-9a3b-46d4-a376-45de0d0935d1
00000000-0000-0000-0000-000000000000	333	nl6qngo22epv	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-22 14:40:23.576995+00	2026-06-22 14:40:23.576995+00	dqmjd3q5dhxe	82fa1d6e-9a3b-46d4-a376-45de0d0935d1
00000000-0000-0000-0000-000000000000	334	rbun4tdywmue	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-22 15:24:53.861491+00	2026-06-22 15:24:53.861491+00	\N	5b6c48f6-ee0b-401a-9b70-03c902c8d08b
00000000-0000-0000-0000-000000000000	335	hiq42g6jzfns	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-23 08:14:53.339305+00	2026-06-23 08:14:53.339305+00	\N	17f6b45b-c2cd-4e22-9ce8-cba4d1dd3180
00000000-0000-0000-0000-000000000000	336	t65kev2w7ojk	f4bf7644-7d51-4764-a6ff-a4a3b450b0fc	f	2026-06-23 08:26:30.016729+00	2026-06-23 08:26:30.016729+00	\N	49b0da04-d076-4a5b-a247-41607dee0317
00000000-0000-0000-0000-000000000000	337	ihztjlhx4ici	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-23 08:34:38.682557+00	2026-06-23 08:34:38.682557+00	\N	b2bf7dde-32fd-4e53-b42f-87e4b7bbaec0
00000000-0000-0000-0000-000000000000	415	7wyonv3uf2wp	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-27 13:32:38.103018+00	2026-06-27 13:32:38.103018+00	djcwbecevnz7	dc1404a4-64ca-4120-aaa4-6af6e81e72f9
00000000-0000-0000-0000-000000000000	338	jjf75bjcsimy	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	t	2026-06-23 09:13:41.902354+00	2026-06-23 12:41:57.128961+00	\N	e304f791-828b-494d-aa78-0ed23c58263d
00000000-0000-0000-0000-000000000000	339	ob7tq2qtgbym	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	t	2026-06-23 12:41:57.158635+00	2026-06-23 13:40:21.105585+00	jjf75bjcsimy	e304f791-828b-494d-aa78-0ed23c58263d
00000000-0000-0000-0000-000000000000	422	sffjy6ycoade	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-27 22:32:59.762965+00	2026-06-27 23:31:29.750469+00	epezpzxsrynv	7726b4dc-9e2a-4b06-a215-4c468242af9d
00000000-0000-0000-0000-000000000000	340	l7gzzigimdzm	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	t	2026-06-23 13:40:21.112681+00	2026-06-23 15:10:26.55307+00	ob7tq2qtgbym	e304f791-828b-494d-aa78-0ed23c58263d
00000000-0000-0000-0000-000000000000	341	dzfdf3zs5u2t	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-23 15:10:26.569965+00	2026-06-23 15:10:26.569965+00	l7gzzigimdzm	e304f791-828b-494d-aa78-0ed23c58263d
00000000-0000-0000-0000-000000000000	342	djf5xa3vscw7	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-23 19:53:51.430458+00	2026-06-23 19:53:51.430458+00	\N	086c918d-c3fb-4c1f-8c7f-17af0fe25208
00000000-0000-0000-0000-000000000000	343	qlztm6qcohmv	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-23 19:57:53.266284+00	2026-06-23 19:57:53.266284+00	\N	9fae5eb6-f3db-4b1d-b787-c96e32ff7a84
00000000-0000-0000-0000-000000000000	344	pwty2z3vjk3f	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-23 21:06:41.657198+00	2026-06-23 21:06:41.657198+00	\N	a97872cc-b21f-4ae0-9f15-4598b6f4d541
00000000-0000-0000-0000-000000000000	345	rfawzdgtftoz	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-23 21:06:59.722276+00	2026-06-23 21:06:59.722276+00	\N	08a492df-078a-46b0-ab64-b3e292017f2b
00000000-0000-0000-0000-000000000000	346	ernmgqq5x7hn	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	t	2026-06-24 04:32:52.566184+00	2026-06-24 05:31:09.195943+00	\N	347af834-4e9e-47c6-a414-0365e53473b2
00000000-0000-0000-0000-000000000000	347	3zl6j7z7g6ra	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-24 05:31:09.223509+00	2026-06-24 05:31:09.223509+00	ernmgqq5x7hn	347af834-4e9e-47c6-a414-0365e53473b2
00000000-0000-0000-0000-000000000000	429	kx52fq2xzlee	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-28 05:22:30.686211+00	2026-06-28 06:21:00.710057+00	sapyabhitinx	7726b4dc-9e2a-4b06-a215-4c468242af9d
00000000-0000-0000-0000-000000000000	348	j6ceiz7srz4j	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	t	2026-06-24 05:44:42.71748+00	2026-06-24 06:43:12.617752+00	\N	d3e17673-34e2-49d1-adbc-70421d441351
00000000-0000-0000-0000-000000000000	349	d4uctpum6mel	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-24 06:43:12.631304+00	2026-06-24 06:43:12.631304+00	j6ceiz7srz4j	d3e17673-34e2-49d1-adbc-70421d441351
00000000-0000-0000-0000-000000000000	350	bc76gg56mkze	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-24 07:25:36.330807+00	2026-06-24 07:25:36.330807+00	\N	438d43fd-5cb9-4d8c-a976-e89a6b0ecbc7
00000000-0000-0000-0000-000000000000	351	dylbt2sjjhpl	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-06-24 07:27:41.947409+00	2026-06-24 07:27:41.947409+00	\N	178bc92c-95f5-4147-a4ef-90a95c7ca23f
00000000-0000-0000-0000-000000000000	352	w2qyoyx5acxh	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-06-24 07:39:58.791934+00	2026-06-24 07:39:58.791934+00	\N	d2de8e17-f3a8-405c-8750-6c23a014e9f4
00000000-0000-0000-0000-000000000000	353	2dntyd6ennxt	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-24 07:43:42.787109+00	2026-06-24 07:43:42.787109+00	\N	03ee2572-6b54-4877-9fd1-0379f90b7c11
00000000-0000-0000-0000-000000000000	354	iwkgf5fyde5z	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-06-24 07:45:14.547915+00	2026-06-24 07:45:14.547915+00	\N	61950309-93ba-4cf4-8bd5-b06d28c22523
00000000-0000-0000-0000-000000000000	435	wdv74qpgr5fp	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	f	2026-06-28 13:02:27.425188+00	2026-06-28 13:02:27.425188+00	\N	9a25567d-d027-4843-b137-260cd474ff43
00000000-0000-0000-0000-000000000000	355	xzamuboyxgt3	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	t	2026-06-24 07:50:31.805945+00	2026-06-24 08:48:57.313558+00	\N	11fc9255-2578-438e-b1d5-8c2163259454
00000000-0000-0000-0000-000000000000	356	p3tyi4hmib77	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-24 08:48:57.334177+00	2026-06-24 08:48:57.334177+00	xzamuboyxgt3	11fc9255-2578-438e-b1d5-8c2163259454
00000000-0000-0000-0000-000000000000	357	5aih2docix4r	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-24 09:13:18.31163+00	2026-06-24 09:13:18.31163+00	\N	369dfe74-d319-4dd7-93b8-efeb00e35b4b
00000000-0000-0000-0000-000000000000	358	gtfvxglu45vm	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-24 10:04:21.969304+00	2026-06-24 10:04:21.969304+00	\N	a8a32673-c279-4a03-b2ae-1682e13f86d3
00000000-0000-0000-0000-000000000000	359	roia54etthmz	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-24 11:15:26.413967+00	2026-06-24 11:15:26.413967+00	\N	9e243095-0770-4fa5-b105-94604cd29405
00000000-0000-0000-0000-000000000000	360	diauuebnmakt	adad5263-20b1-4f82-8650-e2011ed199ab	f	2026-06-24 11:23:01.011831+00	2026-06-24 11:23:01.011831+00	\N	05b087b9-005c-4261-9411-428968b60b53
00000000-0000-0000-0000-000000000000	361	mxmd535ajn62	adad5263-20b1-4f82-8650-e2011ed199ab	f	2026-06-24 11:40:03.389991+00	2026-06-24 11:40:03.389991+00	\N	12ccbe00-4f42-4abf-a8a4-cf4368d0b23c
00000000-0000-0000-0000-000000000000	362	tda47brf4dsg	adad5263-20b1-4f82-8650-e2011ed199ab	f	2026-06-24 11:40:41.124046+00	2026-06-24 11:40:41.124046+00	\N	def6cf54-03d5-4ff6-9424-1b36de105103
00000000-0000-0000-0000-000000000000	448	ra5knhofloss	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	f	2026-06-28 16:45:13.245782+00	2026-06-28 16:45:13.245782+00	\N	57a1936f-620c-4cec-95f5-57b9485d9598
00000000-0000-0000-0000-000000000000	449	r3yfowh3yerl	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	t	2026-06-28 16:45:21.225787+00	2026-06-28 17:53:20.260329+00	\N	9e42e1d5-d975-498e-a90e-14ee2a43e693
00000000-0000-0000-0000-000000000000	363	xhs6yt7gcm5z	adad5263-20b1-4f82-8650-e2011ed199ab	f	2026-06-24 11:44:39.887847+00	2026-06-24 11:44:39.887847+00	\N	44685fd7-0313-4ff8-a606-abcfd560dd2e
00000000-0000-0000-0000-000000000000	364	kplzz4bwljtp	20a05243-32ba-41d2-b61f-635df62e2173	f	2026-06-24 11:46:25.947788+00	2026-06-24 11:46:25.947788+00	\N	d638375c-919e-4de9-a9a1-eebcab1f53b7
00000000-0000-0000-0000-000000000000	365	xrm42gege47p	754671cd-2b76-4ccb-a0bb-690adcf34443	f	2026-06-24 11:48:44.891268+00	2026-06-24 11:48:44.891268+00	\N	812b311d-0fe6-49f7-901e-212e23a2be7a
00000000-0000-0000-0000-000000000000	366	3juwugsqzir5	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-24 11:53:08.496315+00	2026-06-24 11:53:08.496315+00	\N	def3f7b6-c681-46d6-9c0c-35b3edacd666
00000000-0000-0000-0000-000000000000	393	jh2cyraeqrgb	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-06-26 12:48:37.318412+00	2026-06-26 12:48:37.318412+00	\N	d25968cf-710a-465d-8728-9cad7399fe75
00000000-0000-0000-0000-000000000000	368	7otqgmieeffk	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-06-24 12:27:10.853637+00	2026-06-24 12:27:10.853637+00	\N	c7611fe8-8933-47a9-b39a-115c167f8da0
00000000-0000-0000-0000-000000000000	367	ywjyklqmlwbg	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	t	2026-06-24 12:06:56.653022+00	2026-06-24 13:04:58.528625+00	\N	7a409f45-0bc7-471b-b714-16907305c52d
00000000-0000-0000-0000-000000000000	370	st6oygj3n5yx	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-24 13:04:58.536549+00	2026-06-24 13:04:58.536549+00	ywjyklqmlwbg	7a409f45-0bc7-471b-b714-16907305c52d
00000000-0000-0000-0000-000000000000	401	qt5exl43etib	2ceb478d-1a3b-49e7-a64c-bab998d8aa3f	t	2026-06-26 20:51:43.877726+00	2026-06-26 21:50:14.017303+00	jnupbstdyqcr	dee66597-2029-47d7-9473-cb494067d746
00000000-0000-0000-0000-000000000000	371	xnfu4dae32ip	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	t	2026-06-24 13:27:36.712061+00	2026-06-24 14:32:46.1161+00	\N	c211b568-6517-487e-a4d7-9d3f0cf2a715
00000000-0000-0000-0000-000000000000	372	javnvojk7xvd	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	t	2026-06-24 14:32:46.12395+00	2026-06-24 15:30:51.314763+00	xnfu4dae32ip	c211b568-6517-487e-a4d7-9d3f0cf2a715
00000000-0000-0000-0000-000000000000	408	z2k7d2brcfxb	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	t	2026-06-27 09:25:21.140728+00	2026-06-27 10:23:43.439979+00	\N	c37b3084-9ef2-4cec-b322-11173127c5e8
00000000-0000-0000-0000-000000000000	373	6z2wg7gckjkd	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	t	2026-06-24 15:30:51.321744+00	2026-06-24 16:29:23.05755+00	javnvojk7xvd	c211b568-6517-487e-a4d7-9d3f0cf2a715
00000000-0000-0000-0000-000000000000	374	4fzchht7bgd2	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	f	2026-06-24 16:29:23.065961+00	2026-06-24 16:29:23.065961+00	6z2wg7gckjkd	c211b568-6517-487e-a4d7-9d3f0cf2a715
00000000-0000-0000-0000-000000000000	416	ce5ik2kh5vo4	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-27 13:53:10.703584+00	2026-06-27 17:40:28.995912+00	\N	7726b4dc-9e2a-4b06-a215-4c468242af9d
00000000-0000-0000-0000-000000000000	423	nuyiudegd2rx	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-06-27 23:31:29.757612+00	2026-06-28 00:29:59.917517+00	sffjy6ycoade	7726b4dc-9e2a-4b06-a215-4c468242af9d
00000000-0000-0000-0000-000000000000	430	rzkyb3co2xym	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-06-28 06:21:00.718603+00	2026-06-28 06:21:00.718603+00	kx52fq2xzlee	7726b4dc-9e2a-4b06-a215-4c468242af9d
00000000-0000-0000-0000-000000000000	436	j3izcfau2nzx	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	t	2026-06-28 13:08:36.728739+00	2026-06-28 14:06:57.900404+00	\N	6a8a0199-84c9-40e5-bb59-5ec21d04419a
00000000-0000-0000-0000-000000000000	443	dtkgphnlwxg7	3e1050d6-a7b8-47d6-8142-68a6ce1e3de8	f	2026-06-28 14:59:42.837711+00	2026-06-28 14:59:42.837711+00	\N	9e691df4-4d12-4f5b-935c-3dee3be436f1
00000000-0000-0000-0000-000000000000	450	ogusdhixo7pe	3e1050d6-a7b8-47d6-8142-68a6ce1e3de8	f	2026-06-28 16:59:26.450977+00	2026-06-28 16:59:26.450977+00	\N	ff71a1ac-f6fe-4865-bf58-4e00b1a48e1d
00000000-0000-0000-0000-000000000000	455	ow5xs5yv2i56	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-07-01 05:05:33.302396+00	2026-07-01 06:03:40.918452+00	\N	40d37eed-04e8-45eb-bd79-6dded3a9c40c
00000000-0000-0000-0000-000000000000	459	kdayg3o5ktjc	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-07-01 12:30:58.532167+00	2026-07-01 12:30:58.532167+00	\N	0484b60c-16fb-4929-bf20-d4d398622afb
00000000-0000-0000-0000-000000000000	463	yvesjolptea7	adad5263-20b1-4f82-8650-e2011ed199ab	f	2026-07-01 12:48:15.174815+00	2026-07-01 12:48:15.174815+00	\N	dd8f2dd3-c3f9-4c18-8b51-0c572ba5b941
00000000-0000-0000-0000-000000000000	466	bkbyh34y66ck	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-07-02 05:32:10.981158+00	2026-07-02 05:32:10.981158+00	olcljwbdf2ik	b22262d4-b36d-4f33-b418-2a1ef937483d
00000000-0000-0000-0000-000000000000	469	x64zymh73vlu	20a05243-32ba-41d2-b61f-635df62e2173	f	2026-07-02 05:56:05.111604+00	2026-07-02 05:56:05.111604+00	\N	339b80af-0801-4629-b7e9-96f497769bc6
00000000-0000-0000-0000-000000000000	472	ixwi4ngimqnr	754671cd-2b76-4ccb-a0bb-690adcf34443	f	2026-07-02 06:18:25.854658+00	2026-07-02 06:18:25.854658+00	\N	9dab6eac-0400-44a6-b9c2-f19bd82ecfdb
00000000-0000-0000-0000-000000000000	474	ybx7h5ubc7aq	20a05243-32ba-41d2-b61f-635df62e2173	f	2026-07-02 06:48:32.269854+00	2026-07-02 06:48:32.269854+00	\N	f0ae6279-dc80-44ba-8c5a-6bf63164a250
00000000-0000-0000-0000-000000000000	476	36soybcg6b3b	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-07-02 07:14:37.040018+00	2026-07-02 07:14:37.040018+00	\N	25794285-5eef-471f-baa9-0f0facdff7b8
00000000-0000-0000-0000-000000000000	477	psow27guov3t	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	f	2026-07-02 07:28:49.860032+00	2026-07-02 07:28:49.860032+00	\N	61c31b01-30a8-4f95-9d08-74f639ed6d9b
00000000-0000-0000-0000-000000000000	478	dynmxpbtstec	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-07-02 07:49:13.77635+00	2026-07-02 07:49:13.77635+00	\N	6eeb59f8-5c9d-4020-a6bb-f65647eb786e
00000000-0000-0000-0000-000000000000	479	qsj3ocrjy462	754671cd-2b76-4ccb-a0bb-690adcf34443	f	2026-07-02 08:09:37.096799+00	2026-07-02 08:09:37.096799+00	\N	74eb08b6-a9ae-4ae1-a934-cbee1cbd064e
00000000-0000-0000-0000-000000000000	480	thwg5n475uss	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-07-02 08:22:50.895527+00	2026-07-02 08:22:50.895527+00	\N	facbc276-531d-4d31-a306-3ec0ee140a1d
00000000-0000-0000-0000-000000000000	481	gtk6vscbvcf7	2ceb478d-1a3b-49e7-a64c-bab998d8aa3f	f	2026-07-02 08:27:09.129394+00	2026-07-02 08:27:09.129394+00	\N	456c12a1-6046-4418-9c6f-7db79e705be1
00000000-0000-0000-0000-000000000000	482	rgwxsp5bsnwd	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	f	2026-07-02 08:35:02.208912+00	2026-07-02 08:35:02.208912+00	\N	8be8629c-0cbf-4119-86e2-4c68e325a804
00000000-0000-0000-0000-000000000000	483	zklmlaubzfkh	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	f	2026-07-02 08:41:16.497365+00	2026-07-02 08:41:16.497365+00	\N	4ff0ae0a-99c3-4c2f-b4c9-e7dc76724178
00000000-0000-0000-0000-000000000000	484	zmbuyu7xyfb6	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-07-02 08:49:23.455287+00	2026-07-02 09:47:55.728662+00	\N	fa77b1d4-17f5-4246-b27f-129e337e75cc
00000000-0000-0000-0000-000000000000	485	zhtbjffppd6p	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-07-02 09:47:55.750947+00	2026-07-02 10:46:24.905301+00	zmbuyu7xyfb6	fa77b1d4-17f5-4246-b27f-129e337e75cc
00000000-0000-0000-0000-000000000000	486	ocspsd57udwj	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-07-02 10:46:24.920886+00	2026-07-02 11:44:55.156231+00	zhtbjffppd6p	fa77b1d4-17f5-4246-b27f-129e337e75cc
00000000-0000-0000-0000-000000000000	487	tlpomroe56dk	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-07-02 11:44:55.163164+00	2026-07-02 13:42:38.744093+00	ocspsd57udwj	fa77b1d4-17f5-4246-b27f-129e337e75cc
00000000-0000-0000-0000-000000000000	488	pu4y3p4y5p4n	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-07-02 13:42:38.751687+00	2026-07-02 17:49:57.823512+00	tlpomroe56dk	fa77b1d4-17f5-4246-b27f-129e337e75cc
00000000-0000-0000-0000-000000000000	489	n5x43mqoth7s	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-07-02 17:49:57.840415+00	2026-07-02 18:48:24.06138+00	pu4y3p4y5p4n	fa77b1d4-17f5-4246-b27f-129e337e75cc
00000000-0000-0000-0000-000000000000	490	bc5km2wp4wmf	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-07-02 18:48:24.077791+00	2026-07-02 19:46:54.322724+00	n5x43mqoth7s	fa77b1d4-17f5-4246-b27f-129e337e75cc
00000000-0000-0000-0000-000000000000	491	7zdlwajgviil	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-07-02 19:46:54.343853+00	2026-07-02 20:45:24.56082+00	bc5km2wp4wmf	fa77b1d4-17f5-4246-b27f-129e337e75cc
00000000-0000-0000-0000-000000000000	492	ahls6ulfqckn	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-07-02 20:45:24.568701+00	2026-07-02 21:43:54.757615+00	7zdlwajgviil	fa77b1d4-17f5-4246-b27f-129e337e75cc
00000000-0000-0000-0000-000000000000	493	bvl6sglfa4xh	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-07-02 21:43:54.774422+00	2026-07-02 22:42:24.661687+00	ahls6ulfqckn	fa77b1d4-17f5-4246-b27f-129e337e75cc
00000000-0000-0000-0000-000000000000	494	mjacjefl45x7	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-07-02 22:42:24.672952+00	2026-07-02 23:40:55.007432+00	bvl6sglfa4xh	fa77b1d4-17f5-4246-b27f-129e337e75cc
00000000-0000-0000-0000-000000000000	495	g6sxrevfm5da	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-07-02 23:40:55.026115+00	2026-07-03 00:39:25.544271+00	mjacjefl45x7	fa77b1d4-17f5-4246-b27f-129e337e75cc
00000000-0000-0000-0000-000000000000	496	z33rkxu34kmr	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-07-03 00:39:25.551266+00	2026-07-03 01:37:49.765001+00	g6sxrevfm5da	fa77b1d4-17f5-4246-b27f-129e337e75cc
00000000-0000-0000-0000-000000000000	497	stp2ekxbniku	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-07-03 01:37:49.789945+00	2026-07-03 02:36:20.673905+00	z33rkxu34kmr	fa77b1d4-17f5-4246-b27f-129e337e75cc
00000000-0000-0000-0000-000000000000	498	kqjoqduinv5a	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-07-03 02:36:20.685967+00	2026-07-03 07:02:06.290263+00	stp2ekxbniku	fa77b1d4-17f5-4246-b27f-129e337e75cc
00000000-0000-0000-0000-000000000000	499	zzzg57phxjrr	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-07-03 07:02:06.313051+00	2026-07-03 08:00:35.728166+00	kqjoqduinv5a	fa77b1d4-17f5-4246-b27f-129e337e75cc
00000000-0000-0000-0000-000000000000	500	qvosvbtvqxuz	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-07-03 08:00:35.762906+00	2026-07-03 09:32:22.854572+00	zzzg57phxjrr	fa77b1d4-17f5-4246-b27f-129e337e75cc
00000000-0000-0000-0000-000000000000	501	ynf3fr7agb2t	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	t	2026-07-03 09:32:22.874067+00	2026-07-03 10:30:22.580734+00	qvosvbtvqxuz	fa77b1d4-17f5-4246-b27f-129e337e75cc
00000000-0000-0000-0000-000000000000	502	xaxml2mm2h2e	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	f	2026-07-03 10:30:22.598545+00	2026-07-03 10:30:22.598545+00	ynf3fr7agb2t	fa77b1d4-17f5-4246-b27f-129e337e75cc
00000000-0000-0000-0000-000000000000	503	aws6likaqhly	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	t	2026-07-03 10:31:09.386428+00	2026-07-03 11:47:43.850041+00	\N	67ae1b0b-d9c3-42e0-b7d9-60225f0e9282
00000000-0000-0000-0000-000000000000	504	e6blitr67kx6	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-07-03 11:47:43.875615+00	2026-07-03 11:47:43.875615+00	aws6likaqhly	67ae1b0b-d9c3-42e0-b7d9-60225f0e9282
00000000-0000-0000-0000-000000000000	505	23yc55mgrhcx	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-07-03 11:50:45.489662+00	2026-07-03 11:50:45.489662+00	\N	6c9bf39c-c441-4cd9-aa22-e598f7b34c99
00000000-0000-0000-0000-000000000000	506	7nvddrpfeddk	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	t	2026-07-03 11:57:56.428472+00	2026-07-03 13:53:03.303635+00	\N	7bbdbebf-44e9-4084-9e07-5e7797ec6cd5
00000000-0000-0000-0000-000000000000	507	tqyvvni3yvha	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-07-03 13:53:03.321719+00	2026-07-03 13:53:03.321719+00	7nvddrpfeddk	7bbdbebf-44e9-4084-9e07-5e7797ec6cd5
00000000-0000-0000-0000-000000000000	508	vyopuui4xuod	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	f	2026-07-03 13:56:24.798797+00	2026-07-03 13:56:24.798797+00	\N	bd7ddb97-15e8-45ab-9008-a1fa6353ff89
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
20260302000000
20260625000000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
9fcf4b09-4718-47ba-a4d5-17c27dc34f17	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-09 17:45:26.436847+00	2026-04-09 17:45:26.436847+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	156.0.214.240	\N	\N	\N	\N	\N
2dea3843-c0fa-4493-af7f-7aebd3ed31ee	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-10 14:34:35.494583+00	2026-04-10 14:34:35.494583+00	\N	aal1	\N	\N	node	41.138.89.205	\N	\N	\N	\N	\N
2a8b847a-d148-4921-978d-f9db671fca54	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-10 15:28:02.661845+00	2026-04-10 15:28:02.661845+00	\N	aal1	\N	\N	node	41.138.89.205	\N	\N	\N	\N	\N
373a5446-bfcb-44b2-ba49-8cd63a719388	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-11 10:33:39.089291+00	2026-04-11 10:33:39.089291+00	\N	aal1	\N	\N	node	41.138.89.205	\N	\N	\N	\N	\N
48f231ea-f49e-4945-9be4-b66dbe03fdfb	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-22 08:52:11.720352+00	2026-04-22 08:52:11.720352+00	\N	aal1	\N	\N	node	156.0.213.166	\N	\N	\N	\N	\N
bd51e60d-acf4-4225-9650-058ce4cb9781	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-15 10:19:13.968314+00	2026-04-15 10:19:13.968314+00	\N	aal1	\N	\N	node	156.0.212.154	\N	\N	\N	\N	\N
2cfe6afd-44ba-49e2-a473-9dff758b101c	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-22 09:02:43.052061+00	2026-04-22 09:02:43.052061+00	\N	aal1	\N	\N	node	156.0.213.166	\N	\N	\N	\N	\N
999b6e97-d7be-4cfa-968c-1acf22d0583f	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-22 09:27:41.46512+00	2026-04-22 09:27:41.46512+00	\N	aal1	\N	\N	node	41.138.89.227	\N	\N	\N	\N	\N
f1bb8e8d-b384-455c-aebf-37f700f708b1	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-22 09:41:24.904098+00	2026-04-22 09:41:24.904098+00	\N	aal1	\N	\N	node	41.138.89.227	\N	\N	\N	\N	\N
51c67077-6196-4e95-a31c-9c4f3b6ffb2f	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-22 09:49:44.424176+00	2026-04-22 09:49:44.424176+00	\N	aal1	\N	\N	node	41.138.89.227	\N	\N	\N	\N	\N
74608a90-7223-4d02-b769-6ddcd1b5205f	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-22 10:03:30.891505+00	2026-04-22 10:03:30.891505+00	\N	aal1	\N	\N	node	41.138.89.227	\N	\N	\N	\N	\N
b6b26312-3a67-4c8f-9cfc-422b6958d90e	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-22 10:05:13.669728+00	2026-04-22 12:10:13.453064+00	\N	aal1	\N	2026-04-22 12:10:13.452954	node	41.138.89.227	\N	\N	\N	\N	\N
5a68def5-ea95-42a8-9233-d793b08a7bcb	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-15 22:08:42.725637+00	2026-04-15 22:08:42.725637+00	\N	aal1	\N	\N	node	156.0.212.130	\N	\N	\N	\N	\N
01ac7088-a9d1-4899-a0c7-b22444c61d17	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-15 22:52:25.508819+00	2026-04-15 22:52:25.508819+00	\N	aal1	\N	\N	node	156.0.212.130	\N	\N	\N	\N	\N
b36b74f2-8b95-48fc-9c2c-fe652ff14f18	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-15 23:17:45.558279+00	2026-04-15 23:17:45.558279+00	\N	aal1	\N	\N	node	156.0.212.130	\N	\N	\N	\N	\N
fde7420f-ae07-4df1-8e87-b8b7ca3fb667	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-16 05:40:31.263746+00	2026-04-16 05:40:31.263746+00	\N	aal1	\N	\N	node	156.0.212.130	\N	\N	\N	\N	\N
c0c984f9-f48f-4043-8287-8ae3a02f64c4	ec032fe4-9093-4825-a3ff-af8a8c4b2fad	2026-04-16 05:47:39.494525+00	2026-04-16 05:47:39.494525+00	\N	aal1	\N	\N	node	156.0.212.130	\N	\N	\N	\N	\N
c1ba4abd-c35f-4909-bcd7-635b5d221bb9	ec032fe4-9093-4825-a3ff-af8a8c4b2fad	2026-04-16 05:59:23.964069+00	2026-04-16 05:59:23.964069+00	\N	aal1	\N	\N	node	156.0.212.130	\N	\N	\N	\N	\N
34fb5171-22b9-4f23-a931-e1f58bd011ca	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-20 10:05:54.613169+00	2026-04-20 10:05:54.613169+00	\N	aal1	\N	\N	node	156.0.212.136	\N	\N	\N	\N	\N
e5d7613f-f4cf-43cd-beb3-53204d621809	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-21 08:08:27.007608+00	2026-04-21 08:08:27.007608+00	\N	aal1	\N	\N	node	156.0.214.209	\N	\N	\N	\N	\N
844e9863-4004-4947-b3fd-27d45bb465cb	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-21 08:24:33.149015+00	2026-04-21 08:24:33.149015+00	\N	aal1	\N	\N	node	156.0.214.209	\N	\N	\N	\N	\N
139b7ed4-ba65-40e2-835d-f24bcb18160f	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-21 09:33:50.465936+00	2026-04-21 09:33:50.465936+00	\N	aal1	\N	\N	node	41.79.219.143	\N	\N	\N	\N	\N
a7068747-0115-4955-b1e1-04c6888a058b	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-21 09:34:03.618349+00	2026-04-21 09:34:03.618349+00	\N	aal1	\N	\N	node	41.79.219.143	\N	\N	\N	\N	\N
2b9279c0-4a4f-4eed-9695-024509f377a1	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-21 09:43:16.446821+00	2026-04-21 09:43:16.446821+00	\N	aal1	\N	\N	node	41.79.219.143	\N	\N	\N	\N	\N
5bd091bb-3bed-48a1-a711-ae5efe05d596	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-21 09:45:38.308998+00	2026-04-21 09:45:38.308998+00	\N	aal1	\N	\N	node	41.79.219.143	\N	\N	\N	\N	\N
aa2d84b3-9ce8-47ab-9a46-1c8f217f33c7	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-21 10:05:18.202813+00	2026-04-21 10:05:18.202813+00	\N	aal1	\N	\N	node	41.79.219.143	\N	\N	\N	\N	\N
7afd0f31-2743-44ec-bb37-9c04c420ad76	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-21 10:23:31.717422+00	2026-04-21 10:23:31.717422+00	\N	aal1	\N	\N	node	41.79.219.143	\N	\N	\N	\N	\N
2ec4f7ca-f30e-47e9-bca4-650e6fad1746	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-21 11:23:58.972453+00	2026-04-21 11:23:58.972453+00	\N	aal1	\N	\N	node	41.79.219.143	\N	\N	\N	\N	\N
44c7088c-9d70-46fa-a1e9-926d32ce10f6	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-21 11:44:41.604636+00	2026-04-21 11:44:41.604636+00	\N	aal1	\N	\N	node	156.0.213.174	\N	\N	\N	\N	\N
101323b6-98fc-4195-8fc0-4ca1fbf47fde	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-21 11:57:38.601561+00	2026-04-21 11:57:38.601561+00	\N	aal1	\N	\N	node	156.0.213.174	\N	\N	\N	\N	\N
0ae6e36f-62a7-4142-aa52-7368a29e83ec	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-21 12:14:24.320672+00	2026-04-21 12:14:24.320672+00	\N	aal1	\N	\N	node	156.0.213.174	\N	\N	\N	\N	\N
0070aa1e-b3cf-4774-9bf9-485481593920	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-21 12:34:09.780526+00	2026-04-21 12:34:09.780526+00	\N	aal1	\N	\N	node	156.0.214.209	\N	\N	\N	\N	\N
8ef551b5-c907-438f-8d81-600df81cc266	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-21 13:22:51.396873+00	2026-04-21 13:22:51.396873+00	\N	aal1	\N	\N	node	156.0.214.209	\N	\N	\N	\N	\N
ec12cd64-ab2f-488f-af18-9c6c95724bbb	c121a8d7-589a-48d4-bae2-134a826c5856	2026-04-21 13:37:41.767023+00	2026-04-21 13:37:41.767023+00	\N	aal1	\N	\N	node	156.0.214.209	\N	\N	\N	\N	\N
8461a33d-ff23-492a-a8af-cc3afc5cb47f	c121a8d7-589a-48d4-bae2-134a826c5856	2026-04-21 13:40:58.889475+00	2026-04-21 13:40:58.889475+00	\N	aal1	\N	\N	node	156.0.214.209	\N	\N	\N	\N	\N
c2551781-c3ce-4ee1-8ec6-348b3fee7b96	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-22 19:09:40.636722+00	2026-04-22 19:09:40.636722+00	\N	aal1	\N	\N	node	41.138.89.227	\N	\N	\N	\N	\N
1e7a7642-12e6-454f-9891-6c30574c4e50	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-22 19:43:01.813058+00	2026-04-22 19:43:01.813058+00	\N	aal1	\N	\N	node	41.138.89.227	\N	\N	\N	\N	\N
da5ee521-195b-4d4b-841d-76376c22ce61	0b31e734-c377-426f-9618-fa73b50675d8	2026-04-22 20:04:49.73657+00	2026-04-22 20:04:49.73657+00	\N	aal1	\N	\N	node	41.138.89.227	\N	\N	\N	\N	\N
43621fbb-2dc0-4c3c-9d2d-a4596294b98f	c121a8d7-589a-48d4-bae2-134a826c5856	2026-04-21 14:03:34.042853+00	2026-04-21 22:21:44.729478+00	\N	aal1	\N	2026-04-21 22:21:44.729372	node	156.0.214.244	\N	\N	\N	\N	\N
34a75b38-5214-4510-b45e-3d75febf9619	12a044fe-0847-4643-9c20-95ade843d316	2026-04-26 12:06:50.279052+00	2026-04-26 13:05:05.908789+00	\N	aal1	\N	2026-04-26 13:05:05.908668	node	41.138.91.142	\N	\N	\N	\N	\N
4659c0c3-9d21-42d5-a6c0-5afbd49d2f97	c121a8d7-589a-48d4-bae2-134a826c5856	2026-04-22 08:12:27.616227+00	2026-04-22 08:12:27.616227+00	\N	aal1	\N	\N	node	156.0.213.166	\N	\N	\N	\N	\N
8eaf4ea0-3ec7-4db8-86cf-47742b902aa1	c121a8d7-589a-48d4-bae2-134a826c5856	2026-04-22 08:16:15.380176+00	2026-04-22 08:16:15.380176+00	\N	aal1	\N	\N	node	156.0.213.166	\N	\N	\N	\N	\N
0ef9c846-ccce-454d-9db8-d92647947e81	c121a8d7-589a-48d4-bae2-134a826c5856	2026-04-22 08:20:58.214336+00	2026-04-22 08:20:58.214336+00	\N	aal1	\N	\N	node	156.0.213.166	\N	\N	\N	\N	\N
faabf82b-2fff-4557-a6ea-c66c01311ec5	0b31e734-c377-426f-9618-fa73b50675d8	2026-04-22 08:46:28.19879+00	2026-04-22 08:46:28.19879+00	\N	aal1	\N	\N	node	156.0.213.166	\N	\N	\N	\N	\N
da879ca8-521e-4a26-8dbd-1ff07d6b9471	0b31e734-c377-426f-9618-fa73b50675d8	2026-04-22 08:47:25.033022+00	2026-04-22 08:47:25.033022+00	\N	aal1	\N	\N	node	156.0.213.166	\N	\N	\N	\N	\N
6b5facc7-6e1d-4d89-9b17-b08f116058a3	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-23 16:36:00.681887+00	2026-04-23 16:36:00.681887+00	\N	aal1	\N	\N	node	41.79.219.66	\N	\N	\N	\N	\N
3548e4f2-3080-465e-8dcc-2211c702d381	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-22 21:22:22.912892+00	2026-04-23 02:14:02.960521+00	\N	aal1	\N	2026-04-23 02:14:02.960406	node	41.138.89.227	\N	\N	\N	\N	\N
8f5329cd-ecc8-4e73-9de4-9c443850db33	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-23 02:37:56.660018+00	2026-04-23 02:37:56.660018+00	\N	aal1	\N	\N	node	41.138.89.227	\N	\N	\N	\N	\N
c632cad4-d363-4c2f-911a-6875ed2c45a3	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	2026-04-24 14:49:34.5501+00	2026-04-24 17:31:13.000149+00	\N	aal1	\N	2026-04-24 17:31:13.00004	node	156.0.212.140	\N	\N	\N	\N	\N
9b48f8c6-c5c6-423d-8fc6-40249d752595	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-25 16:34:09.855736+00	2026-04-25 18:00:28.667349+00	\N	aal1	\N	2026-04-25 18:00:28.667243	node	41.138.91.190	\N	\N	\N	\N	\N
44f8976b-5b60-4567-a016-b9bfbc9fb281	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	2026-04-25 18:06:44.476557+00	2026-04-25 18:06:44.476557+00	\N	aal1	\N	\N	node	41.138.91.190	\N	\N	\N	\N	\N
790d441b-81bf-4b44-af87-3158ed4f5926	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-25 18:18:01.805243+00	2026-04-26 11:23:44.604068+00	\N	aal1	\N	2026-04-26 11:23:44.603948	node	41.138.91.142	\N	\N	\N	\N	\N
9a95ead5-91a4-428d-9d40-12358ef48022	590cfa64-d397-403c-96d0-dc975cf2a149	2026-04-26 18:37:07.034583+00	2026-04-26 18:37:07.034583+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
30c0acf0-342c-4a5b-a707-896ac20f9729	590cfa64-d397-403c-96d0-dc975cf2a149	2026-04-26 18:39:16.161849+00	2026-04-26 18:39:16.161849+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
b1ae6216-3c5f-464c-b116-438f9f17a001	590cfa64-d397-403c-96d0-dc975cf2a149	2026-04-26 18:39:23.797278+00	2026-04-26 18:39:23.797278+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
cd103e49-1e7f-42d0-9cca-1a9e13778d34	590cfa64-d397-403c-96d0-dc975cf2a149	2026-04-26 18:41:09.898234+00	2026-04-26 18:41:09.898234+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
bb0a2b06-8f8f-4272-90ab-eac66b00d606	590cfa64-d397-403c-96d0-dc975cf2a149	2026-04-26 18:52:13.460989+00	2026-04-26 18:52:13.460989+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
cf236015-c95f-4f89-a554-ef0bc6f6f83d	054f38ee-7af7-4bd5-b9b4-5a1dceb84a99	2026-04-26 18:54:49.652675+00	2026-04-26 18:54:49.652675+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
f818fd3e-a6bc-4560-9b0e-0ff50e1ca196	16eaa1a5-477b-4b43-b73e-e2373b69dc3f	2026-04-26 18:55:54.057786+00	2026-04-26 18:55:54.057786+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
8f0e57f5-d71b-4fc0-8f7d-40655006e4b0	16eaa1a5-477b-4b43-b73e-e2373b69dc3f	2026-04-26 18:56:17.541243+00	2026-04-26 18:56:17.541243+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
ce58031b-6602-452a-ae69-f108aba02795	16eaa1a5-477b-4b43-b73e-e2373b69dc3f	2026-04-26 18:56:20.876305+00	2026-04-26 18:56:20.876305+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
b71ce566-ec1a-4701-94d3-ddde63c6d2b2	16eaa1a5-477b-4b43-b73e-e2373b69dc3f	2026-04-26 18:56:23.07311+00	2026-04-26 18:56:23.07311+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
14ac23b7-eb0a-40a0-af5f-6f73e9a11b29	16eaa1a5-477b-4b43-b73e-e2373b69dc3f	2026-04-26 19:10:57.383698+00	2026-04-26 19:10:57.383698+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
c4ab8657-2ad2-48d8-b705-0fc19601d054	16eaa1a5-477b-4b43-b73e-e2373b69dc3f	2026-04-26 19:11:04.795053+00	2026-04-26 19:11:04.795053+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
e99aaf32-919b-4a77-868d-b85306b0f3b0	16eaa1a5-477b-4b43-b73e-e2373b69dc3f	2026-04-26 19:14:33.841364+00	2026-04-26 19:14:33.841364+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
b06ddd01-48b9-447e-8cfa-86243b62daa9	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-05-06 13:40:17.725312+00	2026-05-06 13:40:17.725312+00	\N	aal1	\N	\N	node	41.138.89.196	\N	\N	\N	\N	\N
b3f18405-aad8-4fc2-a1ef-4e3ae00cf523	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-27 01:22:57.230025+00	2026-04-27 03:19:29.896437+00	\N	aal1	\N	2026-04-27 03:19:29.896332	node	156.0.212.173	\N	\N	\N	\N	\N
23a717e4-bab4-4685-b9b9-436c7b0dbe8a	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-27 09:11:33.717602+00	2026-04-27 09:11:33.717602+00	\N	aal1	\N	\N	node	41.138.91.153	\N	\N	\N	\N	\N
cd15abb3-054f-4f32-a66d-3123dcfa2b6f	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-27 09:14:34.629994+00	2026-04-27 09:14:34.629994+00	\N	aal1	\N	\N	node	41.138.91.153	\N	\N	\N	\N	\N
5a76bd93-a59a-47ef-9d27-f19a3f7476e5	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-27 09:18:52.279975+00	2026-04-27 09:18:52.279975+00	\N	aal1	\N	\N	node	41.138.91.153	\N	\N	\N	\N	\N
9fd2b7d9-7e35-482a-a0e4-181fafff35b4	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-27 09:19:34.827705+00	2026-04-27 09:19:34.827705+00	\N	aal1	\N	\N	node	41.138.91.153	\N	\N	\N	\N	\N
48f5ae62-0000-4d3c-a1dd-e3d71bf321a4	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-27 09:19:56.280713+00	2026-04-27 09:19:56.280713+00	\N	aal1	\N	\N	node	41.138.91.153	\N	\N	\N	\N	\N
0e51970c-4cf9-4168-8a09-b8ee8a97aeab	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-27 09:24:19.745044+00	2026-04-27 09:24:19.745044+00	\N	aal1	\N	\N	node	41.138.91.153	\N	\N	\N	\N	\N
2cfe5268-b632-4977-9eae-277af40534d3	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-27 10:18:48.211647+00	2026-04-27 10:18:48.211647+00	\N	aal1	\N	\N	node	197.234.221.136	\N	\N	\N	\N	\N
d1ddc40b-366d-4c60-a165-fe06433aedca	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-27 13:27:56.484724+00	2026-04-27 13:27:56.484724+00	\N	aal1	\N	\N	node	197.234.221.136	\N	\N	\N	\N	\N
0b89d36d-d364-486f-8a43-aa08792c4568	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-27 13:28:16.194356+00	2026-04-27 13:28:16.194356+00	\N	aal1	\N	\N	node	197.234.221.136	\N	\N	\N	\N	\N
a5c8cc11-5c6c-4ced-aca8-398d3b3b0fbc	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-27 13:29:21.560877+00	2026-04-27 13:29:21.560877+00	\N	aal1	\N	\N	node	197.234.221.136	\N	\N	\N	\N	\N
17f3d22e-91e3-40de-91b7-fda82795622d	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-27 13:35:18.439435+00	2026-04-27 13:35:18.439435+00	\N	aal1	\N	\N	node	197.234.221.136	\N	\N	\N	\N	\N
17c72666-2fbd-4a58-ba3d-f4dfe732cea2	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-27 13:41:39.639382+00	2026-04-27 13:41:39.639382+00	\N	aal1	\N	\N	node	197.234.221.136	\N	\N	\N	\N	\N
e4c5c6f5-ca14-4ef7-ae0f-fb4a798e473d	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-27 14:11:56.268968+00	2026-04-27 14:11:56.268968+00	\N	aal1	\N	\N	node	197.234.221.136	\N	\N	\N	\N	\N
2093b213-238e-4dff-ab1a-8c354b8ed3cc	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-05-05 23:28:54.50417+00	2026-05-06 10:11:34.376739+00	\N	aal1	\N	2026-05-06 10:11:34.376617	node	41.138.89.196	\N	\N	\N	\N	\N
0fd0925e-b20f-4912-8a3f-a89a45ff3190	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-27 14:12:26.886212+00	2026-04-27 16:09:05.334955+00	\N	aal1	\N	2026-04-27 16:09:05.334828	node	197.234.221.136	\N	\N	\N	\N	\N
01bf26c7-ea3d-45cb-bc1b-1bc585132186	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-28 07:59:39.975903+00	2026-04-28 07:59:39.975903+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
a06bc414-86cd-46f7-8b5c-63053c5c4272	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-28 07:59:56.553573+00	2026-04-28 07:59:56.553573+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
c73642c6-34e8-4e3d-848d-ad089694a4a5	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-28 08:01:49.997846+00	2026-04-28 08:01:49.997846+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
8f268403-ba44-4c2e-90fd-37cc23dcb81e	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-28 08:01:55.694226+00	2026-04-28 08:01:55.694226+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
6e22b5a4-c044-4229-ad99-5dea6c484d75	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-04-28 09:08:34.033468+00	2026-04-28 09:08:34.033468+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
0c24e091-2b09-48f4-8145-2d1d3e019fa8	40f13c4d-8b63-443e-8191-0b4df12645fb	2026-05-01 16:55:35.579004+00	2026-05-01 16:55:35.579004+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	197.234.221.8	\N	\N	\N	\N	\N
92e48ce7-94d6-463a-9aa3-baf7e4374824	40f13c4d-8b63-443e-8191-0b4df12645fb	2026-05-02 14:40:53.218697+00	2026-05-02 14:40:53.218697+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
183862ea-4727-4972-8177-b6066dabef66	40f13c4d-8b63-443e-8191-0b4df12645fb	2026-05-02 15:28:10.507606+00	2026-05-02 15:28:10.507606+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	156.0.213.158	\N	\N	\N	\N	\N
ca325812-c0fa-4939-abd2-45ef4e88dda6	40f13c4d-8b63-443e-8191-0b4df12645fb	2026-05-02 15:31:52.381054+00	2026-05-02 15:31:52.381054+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
7b3ca30e-371e-4af2-9ed4-0b7f7a850eb8	40f13c4d-8b63-443e-8191-0b4df12645fb	2026-05-02 15:32:06.648507+00	2026-05-02 15:32:06.648507+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
a2bc3220-6376-4b57-9242-d38327872906	40f13c4d-8b63-443e-8191-0b4df12645fb	2026-05-02 15:34:14.653916+00	2026-05-02 15:34:14.653916+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	156.0.213.158	\N	\N	\N	\N	\N
d5a85c46-5d8b-483d-83e2-061f3ea3d7d5	40f13c4d-8b63-443e-8191-0b4df12645fb	2026-05-02 15:47:00.836819+00	2026-05-02 15:47:00.836819+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
6a5167b5-9ec3-496b-9706-d5f56ed42e33	c93e16a6-b9fc-4739-b0fe-b1e96315422b	2026-05-02 15:53:24.685206+00	2026-05-02 15:53:24.685206+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	156.0.213.158	\N	\N	\N	\N	\N
37c166e3-c5fa-497f-b429-3f6b6ce6fbf9	c93e16a6-b9fc-4739-b0fe-b1e96315422b	2026-05-02 15:54:04.721575+00	2026-05-02 15:54:04.721575+00	\N	aal1	\N	\N	node	74.220.49.7	\N	\N	\N	\N	\N
11c09db5-72fd-49c8-9cec-cf232f92ce2a	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-05-02 16:39:12.487552+00	2026-05-02 16:39:12.487552+00	\N	aal1	\N	\N	node	156.0.213.158	\N	\N	\N	\N	\N
d0e9fcb7-ffaa-4219-9906-cf1014b96dbf	47f79776-a2d5-497b-80fa-8b38670461f4	2026-05-02 16:50:41.794841+00	2026-05-02 16:50:41.794841+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	137.255.100.95	\N	\N	\N	\N	\N
d523ee02-0673-4b35-92f6-e47d571975cf	47f79776-a2d5-497b-80fa-8b38670461f4	2026-05-02 16:52:32.642261+00	2026-05-02 16:52:32.642261+00	\N	aal1	\N	\N	node	156.0.213.158	\N	\N	\N	\N	\N
ba7cf3da-872f-4b74-b2c2-b832971a8531	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-05-02 17:05:42.970537+00	2026-05-02 18:04:06.530428+00	\N	aal1	\N	2026-05-02 18:04:06.530331	node	156.0.213.158	\N	\N	\N	\N	\N
185dc509-667a-471b-bffd-29b79d825f40	47f79776-a2d5-497b-80fa-8b38670461f4	2026-05-05 16:27:42.30541+00	2026-05-05 16:27:42.30541+00	\N	aal1	\N	\N	node	197.234.219.52	\N	\N	\N	\N	\N
9b67b961-cf8c-48af-8626-f693cf42d588	47f79776-a2d5-497b-80fa-8b38670461f4	2026-05-05 16:28:58.337394+00	2026-05-05 16:28:58.337394+00	\N	aal1	\N	\N	node	197.234.219.52	\N	\N	\N	\N	\N
290aa276-829e-4bb3-983c-244c7eafbaf6	47f79776-a2d5-497b-80fa-8b38670461f4	2026-05-05 16:52:43.274388+00	2026-05-05 16:52:43.274388+00	\N	aal1	\N	\N	node	197.234.219.52	\N	\N	\N	\N	\N
f531028b-4cb7-4a5e-8c22-e783e8a43fdf	47f79776-a2d5-497b-80fa-8b38670461f4	2026-05-05 16:52:58.908453+00	2026-05-05 16:52:58.908453+00	\N	aal1	\N	\N	node	197.234.219.52	\N	\N	\N	\N	\N
5676f747-d120-489d-bb6a-3af591c092dc	8e237b3f-2e09-4938-899b-b97d12deee1a	2026-05-06 11:12:44.173987+00	2026-05-06 12:11:06.782944+00	\N	aal1	\N	2026-05-06 12:11:06.782794	node	41.138.89.196	\N	\N	\N	\N	\N
d974503c-1fbd-4873-bf31-6d2467b6d512	47f79776-a2d5-497b-80fa-8b38670461f4	2026-05-05 16:54:36.085704+00	2026-05-05 21:47:05.863729+00	\N	aal1	\N	2026-05-05 21:47:05.863611	node	156.0.212.143	\N	\N	\N	\N	\N
5a3c12ae-f861-4b14-adf0-c34acf861c2f	8e237b3f-2e09-4938-899b-b97d12deee1a	2026-05-05 23:00:43.433579+00	2026-05-05 23:00:43.433579+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	154.72.112.198	\N	\N	\N	\N	\N
9dc3538f-a6e0-41fc-8b24-8672957b9492	8e237b3f-2e09-4938-899b-b97d12deee1a	2026-05-05 23:01:51.115464+00	2026-05-05 23:01:51.115464+00	\N	aal1	\N	\N	node	156.0.213.144	\N	\N	\N	\N	\N
c3cddd93-2bac-4943-bab1-d567b666ba11	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	2026-05-05 23:20:55.866302+00	2026-05-05 23:20:55.866302+00	\N	aal1	\N	\N	node	156.0.213.144	\N	\N	\N	\N	\N
454df8cd-c5f7-48c8-af45-0b36645962b4	8e237b3f-2e09-4938-899b-b97d12deee1a	2026-05-05 23:25:27.655121+00	2026-05-05 23:25:27.655121+00	\N	aal1	\N	\N	node	156.0.213.144	\N	\N	\N	\N	\N
c01b9115-e64a-42ed-8f5e-43d05d1f96f1	8e237b3f-2e09-4938-899b-b97d12deee1a	2026-05-06 12:26:39.766702+00	2026-05-06 12:26:39.766702+00	\N	aal1	\N	\N	node	41.138.89.196	\N	\N	\N	\N	\N
a04acb19-310c-410b-87f7-aa5e05b9660b	8e237b3f-2e09-4938-899b-b97d12deee1a	2026-05-06 12:27:00.804114+00	2026-05-06 12:27:00.804114+00	\N	aal1	\N	\N	node	41.138.89.196	\N	\N	\N	\N	\N
69f6fdb9-62b7-43ee-a815-68981406f461	8e237b3f-2e09-4938-899b-b97d12deee1a	2026-05-06 13:27:21.108895+00	2026-05-06 13:27:21.108895+00	\N	aal1	\N	\N	node	41.138.89.196	\N	\N	\N	\N	\N
baeb1001-0408-4759-bf06-39c128796892	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	2026-05-06 13:57:05.281747+00	2026-05-06 13:57:05.281747+00	\N	aal1	\N	\N	node	41.138.89.196	\N	\N	\N	\N	\N
4a2906ea-5021-4f36-8521-0f8253b7cb03	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	2026-05-06 13:33:37.383185+00	2026-05-06 13:33:37.383185+00	\N	aal1	\N	\N	node	41.138.89.196	\N	\N	\N	\N	\N
d6ed153a-8699-4d6d-be66-a80e0688dff2	8e237b3f-2e09-4938-899b-b97d12deee1a	2026-05-06 13:59:42.433963+00	2026-05-06 14:57:46.955069+00	\N	aal1	\N	2026-05-06 14:57:46.954953	node	41.138.89.196	\N	\N	\N	\N	\N
19286646-f4a5-4bfe-9111-8727a3d63951	8e237b3f-2e09-4938-899b-b97d12deee1a	2026-05-06 17:53:18.751817+00	2026-05-06 17:53:18.751817+00	\N	aal1	\N	\N	node	156.0.214.221	\N	\N	\N	\N	\N
03c0a08f-129f-40d6-a57f-5808ba76f762	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	2026-05-06 17:56:16.762416+00	2026-05-06 17:56:16.762416+00	\N	aal1	\N	\N	node	156.0.214.221	\N	\N	\N	\N	\N
9c727d13-6eaa-4513-aaac-ddb86b384542	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-05-06 18:13:42.68599+00	2026-05-06 18:13:42.68599+00	\N	aal1	\N	\N	node	156.0.214.221	\N	\N	\N	\N	\N
d0594a16-ce8f-4492-970b-38198b59593e	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	2026-05-06 18:23:50.730486+00	2026-05-06 18:23:50.730486+00	\N	aal1	\N	\N	node	156.0.214.221	\N	\N	\N	\N	\N
06745cf3-f2e2-401d-a58b-40c38d04a049	47f79776-a2d5-497b-80fa-8b38670461f4	2026-05-06 18:54:18.878879+00	2026-05-06 18:54:18.878879+00	\N	aal1	\N	\N	node	156.0.214.221	\N	\N	\N	\N	\N
e0cf72ee-6063-4ee4-899f-e2307ef94de1	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-05-06 19:02:12.843548+00	2026-05-06 19:02:12.843548+00	\N	aal1	\N	\N	node	156.0.214.221	\N	\N	\N	\N	\N
a60799c1-c90c-4b06-af10-c45e8a3c6172	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-05-06 19:28:11.242969+00	2026-05-06 19:28:11.242969+00	\N	aal1	\N	\N	node	156.0.214.221	\N	\N	\N	\N	\N
a6640a81-cc2d-445c-a5b3-af96e8972927	8e237b3f-2e09-4938-899b-b97d12deee1a	2026-05-06 19:32:02.029018+00	2026-05-06 19:32:02.029018+00	\N	aal1	\N	\N	node	156.0.214.221	\N	\N	\N	\N	\N
f6b76586-888d-4ccb-85f9-e481a494f50c	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-05-06 19:45:13.113966+00	2026-05-06 19:45:13.113966+00	\N	aal1	\N	\N	node	156.0.214.221	\N	\N	\N	\N	\N
2ca5094f-d5a1-4e73-8989-e6eb4e4a3827	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-05-06 21:27:43.272254+00	2026-05-06 21:27:43.272254+00	\N	aal1	\N	\N	node	156.0.214.221	\N	\N	\N	\N	\N
098bc351-31a2-4eed-abf6-2cb3b45b25a4	8e237b3f-2e09-4938-899b-b97d12deee1a	2026-05-06 21:29:17.296571+00	2026-05-06 21:29:17.296571+00	\N	aal1	\N	\N	node	156.0.214.221	\N	\N	\N	\N	\N
77911b5f-1545-4af2-b2f4-304a84bc932d	8e237b3f-2e09-4938-899b-b97d12deee1a	2026-05-06 21:40:32.271822+00	2026-05-06 21:40:32.271822+00	\N	aal1	\N	\N	node	156.0.214.221	\N	\N	\N	\N	\N
99be4e3a-7f9b-424c-93d9-d4fb98520715	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-05-06 21:41:27.05371+00	2026-05-06 21:41:27.05371+00	\N	aal1	\N	\N	node	156.0.214.221	\N	\N	\N	\N	\N
ae234f65-1f04-4ae1-b04e-3e58ee7d8c3f	47f79776-a2d5-497b-80fa-8b38670461f4	2026-05-06 22:13:35.653833+00	2026-05-06 22:13:35.653833+00	\N	aal1	\N	\N	node	156.0.214.221	\N	\N	\N	\N	\N
3589cc9a-7daa-4bca-a9a0-03ab5682fe3a	47f79776-a2d5-497b-80fa-8b38670461f4	2026-05-06 22:35:44.152573+00	2026-05-06 22:35:44.152573+00	\N	aal1	\N	\N	node	156.0.214.221	\N	\N	\N	\N	\N
147517e3-4cf4-4eb4-80a2-a15209ee21a5	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	2026-06-18 15:35:17.84366+00	2026-06-18 15:35:17.84366+00	\N	aal1	\N	\N	node	41.79.219.135	\N	\N	\N	\N	\N
ce16c67e-cd9a-4a29-9a8a-7ad7c50995d7	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	2026-06-18 15:39:37.135946+00	2026-06-18 15:39:37.135946+00	\N	aal1	\N	\N	node	41.79.219.135	\N	\N	\N	\N	\N
1862011f-8561-40a2-852d-eda6574bc4ef	47f79776-a2d5-497b-80fa-8b38670461f4	2026-05-06 23:29:13.659443+00	2026-05-07 02:24:38.674436+00	\N	aal1	\N	2026-05-07 02:24:38.674318	node	156.0.214.221	\N	\N	\N	\N	\N
c3d13b14-2b54-4d78-86bf-2317c39010aa	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-05-07 05:32:03.679843+00	2026-05-07 05:32:03.679843+00	\N	aal1	\N	\N	node	156.0.214.221	\N	\N	\N	\N	\N
1fd609e2-6165-43a7-b943-5b5478ebce35	47f79776-a2d5-497b-80fa-8b38670461f4	2026-05-07 06:07:20.258293+00	2026-05-07 06:07:20.258293+00	\N	aal1	\N	\N	node	156.0.214.221	\N	\N	\N	\N	\N
974f5670-9ae0-4ab8-b0d3-542b7832f36c	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-05-07 06:31:47.022889+00	2026-05-07 06:31:47.022889+00	\N	aal1	\N	\N	node	156.0.214.221	\N	\N	\N	\N	\N
aec72b55-d2cc-4ed3-9119-686d94ca66e5	47f79776-a2d5-497b-80fa-8b38670461f4	2026-05-07 06:38:15.843689+00	2026-05-07 06:38:15.843689+00	\N	aal1	\N	\N	node	156.0.214.221	\N	\N	\N	\N	\N
001bb9d8-a1a4-4934-9f14-fff589def86d	47f79776-a2d5-497b-80fa-8b38670461f4	2026-05-07 06:43:33.084784+00	2026-05-07 08:22:47.460382+00	\N	aal1	\N	2026-05-07 08:22:47.460254	node	197.234.219.51	\N	\N	\N	\N	\N
5c5db3eb-1ed8-4b13-981a-c33a762f24f7	47f79776-a2d5-497b-80fa-8b38670461f4	2026-05-07 08:48:29.174816+00	2026-05-07 08:48:29.174816+00	\N	aal1	\N	\N	node	197.234.219.51	\N	\N	\N	\N	\N
964215c7-37f6-47ca-9fb7-b9b897c9d787	40f13c4d-8b63-443e-8191-0b4df12645fb	2026-05-14 17:35:32.920768+00	2026-05-14 17:35:32.920768+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	156.0.213.180	\N	\N	\N	\N	\N
9a1ab8e0-b88a-41f0-970d-0c41d65a4976	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-05-28 16:14:23.015368+00	2026-05-28 16:14:23.015368+00	\N	aal1	\N	\N	node	156.0.214.209	\N	\N	\N	\N	\N
4428c425-2ab0-42c3-a138-db02b62d7299	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-05-28 16:29:32.626722+00	2026-05-28 16:29:32.626722+00	\N	aal1	\N	\N	node	41.79.219.123	\N	\N	\N	\N	\N
3b2e73b8-20ba-47e2-9bf7-1e00c0c6a0ab	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-05-29 18:00:27.286982+00	2026-05-29 18:00:27.286982+00	\N	aal1	\N	\N	node	156.0.214.235	\N	\N	\N	\N	\N
3abb80de-4452-411e-a3b7-c0b7483a953d	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-06-18 15:43:06.40814+00	2026-06-18 15:43:06.40814+00	\N	aal1	\N	\N	node	41.79.219.135	\N	\N	\N	\N	\N
c58dc233-3d1b-4ad6-8eb7-adb3a45fc041	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-18 15:50:06.148705+00	2026-06-18 15:50:06.148705+00	\N	aal1	\N	\N	node	41.79.219.135	\N	\N	\N	\N	\N
ac73f2c4-861c-4e41-b137-3180e719d10d	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-05-29 18:01:13.703419+00	2026-05-29 22:14:27.623129+00	\N	aal1	\N	2026-05-29 22:14:27.623015	node	156.0.213.167	\N	\N	\N	\N	\N
a9b47e58-51a7-4617-8efe-52cd2714f58b	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-06-16 01:57:29.207179+00	2026-06-16 01:57:29.207179+00	\N	aal1	\N	\N	node	156.0.212.149	\N	\N	\N	\N	\N
ab8f8c69-325c-4b02-87d0-3f168cf037a1	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-06-16 02:37:59.449182+00	2026-06-16 02:37:59.449182+00	\N	aal1	\N	\N	node	156.0.212.149	\N	\N	\N	\N	\N
a2e95855-fca4-4f3e-b444-58218c527ca7	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	2026-06-16 02:50:42.786393+00	2026-06-16 02:50:42.786393+00	\N	aal1	\N	\N	node	156.0.212.149	\N	\N	\N	\N	\N
672cc515-9d2d-491f-a8a2-afaef289b4a1	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-06-16 02:53:35.81776+00	2026-06-16 02:53:35.81776+00	\N	aal1	\N	\N	node	156.0.212.149	\N	\N	\N	\N	\N
a851c3b3-e807-410b-8614-117bdebce239	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-18 15:56:33.791089+00	2026-06-18 15:56:33.791089+00	\N	aal1	\N	\N	node	41.79.219.135	\N	\N	\N	\N	\N
51c4cecc-a7cd-49b1-abf9-5972446612dd	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-18 15:56:57.762805+00	2026-06-18 15:56:57.762805+00	\N	aal1	\N	\N	node	41.79.219.135	\N	\N	\N	\N	\N
7f86b4b7-a247-4486-91f5-baa9449b69d6	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-18 15:57:40.426942+00	2026-06-18 15:57:40.426942+00	\N	aal1	\N	\N	node	41.79.219.135	\N	\N	\N	\N	\N
3bb08b99-3018-4e73-a7fe-987d315c9b9f	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-06-16 02:56:58.925671+00	2026-06-16 06:49:28.022845+00	\N	aal1	\N	2026-06-16 06:49:28.022735	node	156.0.212.134	\N	\N	\N	\N	\N
f0669765-a810-4363-afbe-f5b39adacb3d	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-06-16 07:41:17.94968+00	2026-06-16 07:41:17.94968+00	\N	aal1	\N	\N	node	156.0.212.134	\N	\N	\N	\N	\N
3691e00d-68a8-4685-9518-aac799c15572	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-16 09:45:48.028839+00	2026-06-16 09:45:48.028839+00	\N	aal1	\N	\N	node	41.216.53.7	\N	\N	\N	\N	\N
d8518ea2-33ab-4758-bca3-9cc0811a671f	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-16 09:50:53.565156+00	2026-06-16 09:50:53.565156+00	\N	aal1	\N	\N	node	41.216.53.7	\N	\N	\N	\N	\N
3216b3b8-25d2-4f3b-9dc6-f90621016ec0	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-16 09:51:59.311542+00	2026-06-16 09:51:59.311542+00	\N	aal1	\N	\N	node	41.216.53.7	\N	\N	\N	\N	\N
e0848fdb-c73a-490e-bb56-a56cad885199	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-16 09:53:53.541921+00	2026-06-16 09:53:53.541921+00	\N	aal1	\N	\N	node	41.216.53.7	\N	\N	\N	\N	\N
0b97748c-ad45-4813-b3f0-f49755807239	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-16 09:53:57.105931+00	2026-06-16 09:53:57.105931+00	\N	aal1	\N	\N	node	41.216.53.7	\N	\N	\N	\N	\N
9020a286-887f-4093-95a4-06f3ae509cae	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-16 09:54:00.823081+00	2026-06-16 09:54:00.823081+00	\N	aal1	\N	\N	node	41.216.53.7	\N	\N	\N	\N	\N
946587e6-d4f8-4686-9c43-e5228df3a1ed	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-16 09:54:19.654372+00	2026-06-16 09:54:19.654372+00	\N	aal1	\N	\N	node	41.216.53.7	\N	\N	\N	\N	\N
4ba6a66a-d1be-4700-88a2-8379f8d38d38	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-16 10:00:43.463566+00	2026-06-16 10:00:43.463566+00	\N	aal1	\N	\N	node	41.216.53.7	\N	\N	\N	\N	\N
3718d672-abbe-40c8-9ba9-f6574b8be2fd	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-16 10:01:10.213186+00	2026-06-16 10:01:10.213186+00	\N	aal1	\N	\N	node	41.216.53.7	\N	\N	\N	\N	\N
66d00bfa-52a8-46a4-a664-f9dc6b3937d8	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-16 10:01:34.408529+00	2026-06-16 10:01:34.408529+00	\N	aal1	\N	\N	node	41.216.53.7	\N	\N	\N	\N	\N
346dfe1c-bc0a-4069-87e4-4a81ae852af0	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-16 10:02:09.280603+00	2026-06-16 10:02:09.280603+00	\N	aal1	\N	\N	node	41.216.53.7	\N	\N	\N	\N	\N
56e5c6d1-9af7-4787-b8dd-38ee672c2001	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-16 10:02:52.580143+00	2026-06-16 10:02:52.580143+00	\N	aal1	\N	\N	node	41.216.53.7	\N	\N	\N	\N	\N
e6b25c9b-5e03-4d3a-b096-d8e15f81641d	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-16 10:03:12.047203+00	2026-06-16 10:03:12.047203+00	\N	aal1	\N	\N	node	41.216.53.7	\N	\N	\N	\N	\N
d98704f5-9067-4aa4-8a4e-598b3a02efa5	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-16 10:06:13.174736+00	2026-06-16 10:06:13.174736+00	\N	aal1	\N	\N	node	41.216.53.7	\N	\N	\N	\N	\N
60f1f219-097a-4f1a-a87b-e983b8e129a0	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-16 10:27:40.453027+00	2026-06-16 10:27:40.453027+00	\N	aal1	\N	\N	node	41.216.53.7	\N	\N	\N	\N	\N
f7ed7a83-acba-4a03-bd10-9036a316ca34	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	2026-06-16 10:57:26.815339+00	2026-06-16 10:57:26.815339+00	\N	aal1	\N	\N	node	41.138.91.155	\N	\N	\N	\N	\N
1620a02f-df61-4cab-ad77-3caaed8aa86d	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-06-16 11:01:34.690724+00	2026-06-16 11:01:34.690724+00	\N	aal1	\N	\N	node	41.138.91.155	\N	\N	\N	\N	\N
c1f0c4d8-c958-43d2-ba1c-251d260d96a2	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-06-16 11:12:21.789778+00	2026-06-16 11:12:21.789778+00	\N	aal1	\N	\N	node	156.0.212.155	\N	\N	\N	\N	\N
c7284af3-89e4-4ef4-9f80-9677fcf996d1	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-16 10:29:18.556157+00	2026-06-16 11:27:28.386745+00	\N	aal1	\N	2026-06-16 11:27:28.386621	node	41.216.53.7	\N	\N	\N	\N	\N
1f0b8520-1620-410b-a82d-bca0d6ef6b5d	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-16 11:28:03.592398+00	2026-06-16 11:28:03.592398+00	\N	aal1	\N	\N	node	41.216.53.7	\N	\N	\N	\N	\N
10b12a90-4971-452d-807a-548bc4dc8486	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-16 11:35:04.690998+00	2026-06-16 11:35:04.690998+00	\N	aal1	\N	\N	node	41.216.53.7	\N	\N	\N	\N	\N
dd00f352-4442-4bd8-902b-9c813f56a95e	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-18 15:57:59.070584+00	2026-06-18 15:57:59.070584+00	\N	aal1	\N	\N	node	41.79.219.135	\N	\N	\N	\N	\N
9fe72ef4-a9bc-404e-94ed-c0e20714a701	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-18 15:58:58.083724+00	2026-06-18 15:58:58.083724+00	\N	aal1	\N	\N	node	41.79.219.135	\N	\N	\N	\N	\N
9e8dd69c-099b-43b1-ad82-b1ef654c2aea	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-06-16 11:17:56.005495+00	2026-06-17 11:50:56.197328+00	\N	aal1	\N	2026-06-17 11:50:56.197208	node	41.79.219.62	\N	\N	\N	\N	\N
1336a58c-748f-4faa-a3e7-04d82a0e544a	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	2026-06-18 16:34:52.539781+00	2026-06-18 16:34:52.539781+00	\N	aal1	\N	\N	node	102.202.111.253	\N	\N	\N	\N	\N
6729aa92-73e7-4861-b63e-067d589a2b3e	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-06-18 07:42:35.327066+00	2026-06-18 08:41:04.433693+00	\N	aal1	\N	2026-06-18 08:41:04.433553	node	102.202.111.253	\N	\N	\N	\N	\N
09d3ae6b-f13e-4db8-b73c-75c697e00dd7	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-06-18 09:19:01.968998+00	2026-06-18 09:19:01.968998+00	\N	aal1	\N	\N	node	102.202.111.253	\N	\N	\N	\N	\N
016b3e68-b87b-49e4-8a6c-59775e3dda6d	754671cd-2b76-4ccb-a0bb-690adcf34443	2026-06-18 13:23:15.536235+00	2026-06-18 13:23:15.536235+00	\N	aal1	\N	\N	node	102.202.111.215	\N	\N	\N	\N	\N
6a512da5-2aaa-4a86-971e-f4da822116f1	754671cd-2b76-4ccb-a0bb-690adcf34443	2026-06-18 13:37:35.69982+00	2026-06-18 13:37:35.69982+00	\N	aal1	\N	\N	node	102.202.111.253	\N	\N	\N	\N	\N
5b19b13c-bbc3-4603-b974-314428e4e383	adad5263-20b1-4f82-8650-e2011ed199ab	2026-06-18 14:33:54.265725+00	2026-06-18 14:33:54.265725+00	\N	aal1	\N	\N	node	102.202.111.253	\N	\N	\N	\N	\N
13373f67-e667-407f-9c9d-1cf6632ab432	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	2026-06-18 14:39:09.998791+00	2026-06-18 14:39:09.998791+00	\N	aal1	\N	\N	node	102.202.111.253	\N	\N	\N	\N	\N
17f6b45b-c2cd-4e22-9ce8-cba4d1dd3180	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-23 08:14:53.311397+00	2026-06-23 08:14:53.311397+00	\N	aal1	\N	\N	node	41.85.163.219	\N	\N	\N	\N	\N
49b0da04-d076-4a5b-a247-41607dee0317	f4bf7644-7d51-4764-a6ff-a4a3b450b0fc	2026-06-23 08:26:29.993829+00	2026-06-23 08:26:29.993829+00	\N	aal1	\N	\N	node	41.85.163.219	\N	\N	\N	\N	\N
82fa1d6e-9a3b-46d4-a376-45de0d0935d1	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-22 08:09:57.284634+00	2026-06-22 14:40:23.59362+00	\N	aal1	\N	2026-06-22 14:40:23.593473	node	41.216.54.157	\N	\N	\N	\N	\N
5b6c48f6-ee0b-401a-9b70-03c902c8d08b	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-22 15:24:53.846284+00	2026-06-22 15:24:53.846284+00	\N	aal1	\N	\N	node	41.216.54.157	\N	\N	\N	\N	\N
b2bf7dde-32fd-4e53-b42f-87e4b7bbaec0	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-23 08:34:38.681262+00	2026-06-23 08:34:38.681262+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	41.79.217.115	\N	\N	\N	\N	\N
e304f791-828b-494d-aa78-0ed23c58263d	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-23 09:13:41.886092+00	2026-06-23 15:10:26.596567+00	\N	aal1	\N	2026-06-23 15:10:26.594795	node	41.85.163.219	\N	\N	\N	\N	\N
9fae5eb6-f3db-4b1d-b787-c96e32ff7a84	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-23 19:57:53.257802+00	2026-06-23 19:57:53.257802+00	\N	aal1	\N	\N	node	156.0.212.167	\N	\N	\N	\N	\N
086c918d-c3fb-4c1f-8c7f-17af0fe25208	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-23 19:53:51.403635+00	2026-06-23 19:53:51.403635+00	\N	aal1	\N	\N	node	156.0.212.167	\N	\N	\N	\N	\N
a97872cc-b21f-4ae0-9f15-4598b6f4d541	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-23 21:06:41.632547+00	2026-06-23 21:06:41.632547+00	\N	aal1	\N	\N	node	156.0.214.233	\N	\N	\N	\N	\N
08a492df-078a-46b0-ab64-b3e292017f2b	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-23 21:06:59.720313+00	2026-06-23 21:06:59.720313+00	\N	aal1	\N	\N	node	156.0.214.233	\N	\N	\N	\N	\N
347af834-4e9e-47c6-a414-0365e53473b2	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-24 04:32:52.532153+00	2026-06-24 05:31:09.240159+00	\N	aal1	\N	2026-06-24 05:31:09.240055	node	41.138.89.234	\N	\N	\N	\N	\N
d3e17673-34e2-49d1-adbc-70421d441351	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-24 05:44:42.693711+00	2026-06-24 06:43:12.644251+00	\N	aal1	\N	2026-06-24 06:43:12.644144	node	41.138.89.232	\N	\N	\N	\N	\N
438d43fd-5cb9-4d8c-a976-e89a6b0ecbc7	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-24 07:25:36.317846+00	2026-06-24 07:25:36.317846+00	\N	aal1	\N	\N	node	41.138.89.232	\N	\N	\N	\N	\N
178bc92c-95f5-4147-a4ef-90a95c7ca23f	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-06-24 07:27:41.929264+00	2026-06-24 07:27:41.929264+00	\N	aal1	\N	\N	node	41.138.89.232	\N	\N	\N	\N	\N
d2de8e17-f3a8-405c-8750-6c23a014e9f4	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-06-24 07:39:58.775456+00	2026-06-24 07:39:58.775456+00	\N	aal1	\N	\N	node	41.138.89.223	\N	\N	\N	\N	\N
03ee2572-6b54-4877-9fd1-0379f90b7c11	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-24 07:43:42.753239+00	2026-06-24 07:43:42.753239+00	\N	aal1	\N	\N	node	41.138.89.223	\N	\N	\N	\N	\N
61950309-93ba-4cf4-8bd5-b06d28c22523	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-06-24 07:45:14.540537+00	2026-06-24 07:45:14.540537+00	\N	aal1	\N	\N	node	41.138.89.223	\N	\N	\N	\N	\N
11fc9255-2578-438e-b1d5-8c2163259454	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-24 07:50:31.796705+00	2026-06-24 08:48:57.358072+00	\N	aal1	\N	2026-06-24 08:48:57.35795	node	41.79.219.60	\N	\N	\N	\N	\N
369dfe74-d319-4dd7-93b8-efeb00e35b4b	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-24 09:13:18.293259+00	2026-06-24 09:13:18.293259+00	\N	aal1	\N	\N	node	41.79.219.60	\N	\N	\N	\N	\N
a8a32673-c279-4a03-b2ae-1682e13f86d3	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-24 10:04:21.955246+00	2026-06-24 10:04:21.955246+00	\N	aal1	\N	\N	node	41.79.219.60	\N	\N	\N	\N	\N
9e243095-0770-4fa5-b105-94604cd29405	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-24 11:15:26.396007+00	2026-06-24 11:15:26.396007+00	\N	aal1	\N	\N	node	41.79.219.60	\N	\N	\N	\N	\N
05b087b9-005c-4261-9411-428968b60b53	adad5263-20b1-4f82-8650-e2011ed199ab	2026-06-24 11:23:00.996846+00	2026-06-24 11:23:00.996846+00	\N	aal1	\N	\N	node	41.79.219.60	\N	\N	\N	\N	\N
12ccbe00-4f42-4abf-a8a4-cf4368d0b23c	adad5263-20b1-4f82-8650-e2011ed199ab	2026-06-24 11:40:03.376092+00	2026-06-24 11:40:03.376092+00	\N	aal1	\N	\N	node	41.79.219.60	\N	\N	\N	\N	\N
def6cf54-03d5-4ff6-9424-1b36de105103	adad5263-20b1-4f82-8650-e2011ed199ab	2026-06-24 11:40:41.122152+00	2026-06-24 11:40:41.122152+00	\N	aal1	\N	\N	node	41.79.219.60	\N	\N	\N	\N	\N
44685fd7-0313-4ff8-a606-abcfd560dd2e	adad5263-20b1-4f82-8650-e2011ed199ab	2026-06-24 11:44:39.879523+00	2026-06-24 11:44:39.879523+00	\N	aal1	\N	\N	node	41.79.219.60	\N	\N	\N	\N	\N
d638375c-919e-4de9-a9a1-eebcab1f53b7	20a05243-32ba-41d2-b61f-635df62e2173	2026-06-24 11:46:25.933028+00	2026-06-24 11:46:25.933028+00	\N	aal1	\N	\N	node	41.79.219.60	\N	\N	\N	\N	\N
812b311d-0fe6-49f7-901e-212e23a2be7a	754671cd-2b76-4ccb-a0bb-690adcf34443	2026-06-24 11:48:44.889569+00	2026-06-24 11:48:44.889569+00	\N	aal1	\N	\N	node	41.79.219.60	\N	\N	\N	\N	\N
def3f7b6-c681-46d6-9c0c-35b3edacd666	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-24 11:53:08.485647+00	2026-06-24 11:53:08.485647+00	\N	aal1	\N	\N	node	41.79.219.60	\N	\N	\N	\N	\N
c7611fe8-8933-47a9-b39a-115c167f8da0	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-06-24 12:27:10.83697+00	2026-06-24 12:27:10.83697+00	\N	aal1	\N	\N	node	41.79.219.60	\N	\N	\N	\N	\N
7a409f45-0bc7-471b-b714-16907305c52d	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-24 12:06:56.639879+00	2026-06-24 13:04:58.552074+00	\N	aal1	\N	2026-06-24 13:04:58.551969	node	41.85.163.219	\N	\N	\N	\N	\N
40d37eed-04e8-45eb-bd79-6dded3a9c40c	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-07-01 05:05:33.276835+00	2026-07-01 06:03:40.957652+00	\N	aal1	\N	2026-07-01 06:03:40.95753	node	41.138.89.134	\N	\N	\N	\N	\N
aef8b3d5-aeda-42be-bfb3-66ed21687b83	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-07-01 12:22:12.538805+00	2026-07-01 12:22:12.538805+00	\N	aal1	\N	\N	node	137.255.85.144	\N	\N	\N	\N	\N
c211b568-6517-487e-a4d7-9d3f0cf2a715	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-24 13:27:36.698196+00	2026-06-24 16:29:23.078266+00	\N	aal1	\N	2026-06-24 16:29:23.078142	node	41.85.163.219	\N	\N	\N	\N	\N
a47701cd-e6e0-4358-bc19-960216cac6dc	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	2026-07-01 12:28:21.514463+00	2026-07-01 12:28:21.514463+00	\N	aal1	\N	\N	node	137.255.85.144	\N	\N	\N	\N	\N
0484b60c-16fb-4929-bf20-d4d398622afb	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-07-01 12:30:58.508754+00	2026-07-01 12:30:58.508754+00	\N	aal1	\N	\N	node	137.255.85.144	\N	\N	\N	\N	\N
dff19de4-faa3-4a02-a4c6-145be6dcb134	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	2026-07-01 12:35:52.629919+00	2026-07-01 12:35:52.629919+00	\N	aal1	\N	\N	node	137.255.85.144	\N	\N	\N	\N	\N
effe1c99-e5ae-46ae-968f-4c6738c9a5dc	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-07-01 12:43:54.957346+00	2026-07-01 12:43:54.957346+00	\N	aal1	\N	\N	node	137.255.85.144	\N	\N	\N	\N	\N
8fa90260-7b1b-4422-8cb8-94d5d3afe959	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	2026-07-01 12:45:24.229693+00	2026-07-01 12:45:24.229693+00	\N	aal1	\N	\N	node	137.255.85.144	\N	\N	\N	\N	\N
dd8f2dd3-c3f9-4c18-8b51-0c572ba5b941	adad5263-20b1-4f82-8650-e2011ed199ab	2026-07-01 12:48:15.151335+00	2026-07-01 12:48:15.151335+00	\N	aal1	\N	\N	node	137.255.85.144	\N	\N	\N	\N	\N
d4cf4307-b027-4379-bb76-c0f4a70dba66	754671cd-2b76-4ccb-a0bb-690adcf34443	2026-07-01 12:57:34.560258+00	2026-07-01 12:57:34.560258+00	\N	aal1	\N	\N	node	137.255.85.144	\N	\N	\N	\N	\N
7726b4dc-9e2a-4b06-a215-4c468242af9d	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-06-27 13:53:10.683889+00	2026-06-28 06:21:00.733489+00	\N	aal1	\N	2026-06-28 06:21:00.733379	node	41.138.89.211	\N	\N	\N	\N	\N
093d184a-2895-4d9b-b2e9-fbcf150ade4e	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-28 06:48:48.166467+00	2026-06-28 06:48:48.166467+00	\N	aal1	\N	\N	node	41.138.89.211	\N	\N	\N	\N	\N
9a818d3c-95c2-4058-b55a-543cf13ccf44	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-06-25 11:04:43.820794+00	2026-06-25 11:04:43.820794+00	\N	aal1	\N	\N	node	41.138.89.235	\N	\N	\N	\N	\N
3217c3f5-eaef-4c2d-8cd2-54b7d8d65da4	2ceb478d-1a3b-49e7-a64c-bab998d8aa3f	2026-06-25 14:26:12.421711+00	2026-06-25 14:26:12.421711+00	\N	aal1	\N	\N	node	41.79.219.68	\N	\N	\N	\N	\N
c7c7fd48-ab90-47ef-bce9-a68fb844053b	2ceb478d-1a3b-49e7-a64c-bab998d8aa3f	2026-06-25 15:32:22.971277+00	2026-06-25 15:32:22.971277+00	\N	aal1	\N	\N	node	41.79.219.68	\N	\N	\N	\N	\N
e6237a83-84b8-46fc-8d96-7104fe5e7523	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-26 10:30:25.98377+00	2026-06-26 12:29:41.38736+00	\N	aal1	\N	2026-06-26 12:29:41.387255	node	41.79.219.219	\N	\N	\N	\N	\N
d25968cf-710a-465d-8728-9cad7399fe75	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-26 12:48:37.293638+00	2026-06-26 12:48:37.293638+00	\N	aal1	\N	\N	node	41.79.219.52	\N	\N	\N	\N	\N
27eef67a-77c5-409e-9fea-966e01700270	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-26 12:49:39.675915+00	2026-06-26 13:48:04.563515+00	\N	aal1	\N	2026-06-26 13:48:04.563413	node	41.79.219.52	\N	\N	\N	\N	\N
a2c0e8ee-5be5-4a83-a075-7255333e5171	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-26 17:40:34.486617+00	2026-06-26 17:40:34.486617+00	\N	aal1	\N	\N	node	41.79.219.52	\N	\N	\N	\N	\N
a292b143-868d-4364-9d18-b29c2f042f75	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-06-26 17:51:32.912055+00	2026-06-26 17:51:32.912055+00	\N	aal1	\N	\N	node	41.79.219.52	\N	\N	\N	\N	\N
2e12a7f2-bbd8-4eb1-b9c1-a46b19725af2	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	2026-06-28 09:08:31.466129+00	2026-06-28 12:32:00.446785+00	\N	aal1	\N	2026-06-28 12:32:00.446656	node	41.79.219.147	\N	\N	\N	\N	\N
9a25567d-d027-4843-b137-260cd474ff43	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	2026-06-28 13:02:27.401435+00	2026-06-28 13:02:27.401435+00	\N	aal1	\N	\N	node	137.255.79.237	\N	\N	\N	\N	\N
6a8a0199-84c9-40e5-bb59-5ec21d04419a	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	2026-06-28 13:08:36.710835+00	2026-06-28 14:06:57.947034+00	\N	aal1	\N	2026-06-28 14:06:57.946931	node	137.255.79.237	\N	\N	\N	\N	\N
7d420141-0c30-4f95-a61a-f2d7d34c3116	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	2026-06-28 14:23:37.82074+00	2026-06-28 14:23:37.82074+00	\N	aal1	\N	\N	node	137.255.79.237	\N	\N	\N	\N	\N
dee66597-2029-47d7-9473-cb494067d746	2ceb478d-1a3b-49e7-a64c-bab998d8aa3f	2026-06-26 17:56:36.855222+00	2026-06-26 23:47:14.757739+00	\N	aal1	\N	2026-06-26 23:47:14.757597	node	102.202.111.208	\N	\N	\N	\N	\N
0dfdeb60-ce1b-418c-92a6-b2f051d1115e	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-27 07:59:18.891591+00	2026-06-27 07:59:18.891591+00	\N	aal1	\N	\N	node	156.0.213.134	\N	\N	\N	\N	\N
36d86707-40a8-405c-844c-101effaaf511	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-27 08:07:45.152454+00	2026-06-27 08:07:45.152454+00	\N	aal1	\N	\N	node	156.0.213.134	\N	\N	\N	\N	\N
270fa836-0345-41d9-90ef-b29d05bd3e70	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-27 08:15:46.404393+00	2026-06-27 08:15:46.404393+00	\N	aal1	\N	\N	node	41.79.219.11	\N	\N	\N	\N	\N
c37b3084-9ef2-4cec-b322-11173127c5e8	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-27 09:25:21.117873+00	2026-06-27 10:23:43.477276+00	\N	aal1	\N	2026-06-27 10:23:43.477167	node	41.79.219.75	\N	\N	\N	\N	\N
a183883b-48c0-4d9b-ab19-d033887855b1	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-27 10:51:27.808118+00	2026-06-27 10:51:27.808118+00	\N	aal1	\N	\N	node	41.79.219.75	\N	\N	\N	\N	\N
a00d3d0f-9262-45cc-8efa-e0bb58321ba6	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-06-27 11:30:24.852382+00	2026-06-27 11:30:24.852382+00	\N	aal1	\N	\N	node	41.79.219.75	\N	\N	\N	\N	\N
d34b1d5a-31f1-47cc-850a-ec60d7f79461	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-27 11:34:11.646874+00	2026-06-27 11:34:11.646874+00	\N	aal1	\N	\N	node	41.79.219.75	\N	\N	\N	\N	\N
23b9a56c-7f68-4a50-b7c4-ae0d9509327d	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	2026-06-28 14:45:16.085539+00	2026-06-28 14:45:16.085539+00	\N	aal1	\N	\N	node	41.79.219.147	\N	\N	\N	\N	\N
dc1404a4-64ca-4120-aaa4-6af6e81e72f9	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-06-27 11:36:05.122567+00	2026-06-27 13:32:38.123936+00	\N	aal1	\N	2026-06-27 13:32:38.123811	node	156.0.213.134	\N	\N	\N	\N	\N
62c5ba4f-b8c9-4e7e-bfc0-29ea74e40a64	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-06-28 14:50:10.335609+00	2026-06-28 14:50:10.335609+00	\N	aal1	\N	\N	node	41.79.219.147	\N	\N	\N	\N	\N
b22262d4-b36d-4f33-b418-2a1ef937483d	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-07-02 00:20:16.032645+00	2026-07-02 05:32:11.012274+00	\N	aal1	\N	2026-07-02 05:32:11.012144	node	41.138.89.134	\N	\N	\N	\N	\N
9e691df4-4d12-4f5b-935c-3dee3be436f1	3e1050d6-a7b8-47d6-8142-68a6ce1e3de8	2026-06-28 14:59:42.835842+00	2026-06-28 14:59:42.835842+00	\N	aal1	\N	\N	node	41.79.219.147	\N	\N	\N	\N	\N
c6b4abbd-020e-49b5-bad2-e3b7d5d0fb52	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-06-28 16:04:00.392699+00	2026-06-28 16:04:00.392699+00	\N	aal1	\N	\N	node	41.216.54.15	\N	\N	\N	\N	\N
76e72c65-c8e1-4ea2-960e-f877d838e954	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-06-28 16:18:23.472155+00	2026-06-28 16:18:23.472155+00	\N	aal1	\N	\N	node	41.216.54.15	\N	\N	\N	\N	\N
eb81acd5-6448-495b-ace4-1558e39bc12f	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-28 16:26:06.271277+00	2026-06-28 16:26:06.271277+00	\N	aal1	\N	\N	node	41.216.54.15	\N	\N	\N	\N	\N
2634b991-6f48-4dd6-bf6d-797475e0185c	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-28 16:28:06.326851+00	2026-06-28 16:28:06.326851+00	\N	aal1	\N	\N	node	41.216.54.15	\N	\N	\N	\N	\N
57a1936f-620c-4cec-95f5-57b9485d9598	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	2026-06-28 16:45:13.228682+00	2026-06-28 16:45:13.228682+00	\N	aal1	\N	\N	node	156.0.214.204	\N	\N	\N	\N	\N
ff71a1ac-f6fe-4865-bf58-4e00b1a48e1d	3e1050d6-a7b8-47d6-8142-68a6ce1e3de8	2026-06-28 16:59:26.430185+00	2026-06-28 16:59:26.430185+00	\N	aal1	\N	\N	node	156.0.214.204	\N	\N	\N	\N	\N
25ed5edd-0ff4-49b7-839f-be90a7e2b882	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-07-02 05:35:22.700309+00	2026-07-02 05:35:22.700309+00	\N	aal1	\N	\N	node	41.138.89.134	\N	\N	\N	\N	\N
60834222-f8d7-4021-af19-a895ad0b43d0	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	2026-07-02 05:49:45.780532+00	2026-07-02 05:49:45.780532+00	\N	aal1	\N	\N	node	41.138.89.134	\N	\N	\N	\N	\N
339b80af-0801-4629-b7e9-96f497769bc6	20a05243-32ba-41d2-b61f-635df62e2173	2026-07-02 05:56:05.102336+00	2026-07-02 05:56:05.102336+00	\N	aal1	\N	\N	node	41.138.89.134	\N	\N	\N	\N	\N
9e42e1d5-d975-498e-a90e-14ee2a43e693	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	2026-06-28 16:45:21.224733+00	2026-06-28 23:41:56.16374+00	\N	aal1	\N	2026-06-28 23:41:56.160918	node	41.85.162.100	\N	\N	\N	\N	\N
f41ea936-d28c-4876-89e2-bb4706bd27b3	754671cd-2b76-4ccb-a0bb-690adcf34443	2026-07-02 05:58:44.122366+00	2026-07-02 05:58:44.122366+00	\N	aal1	\N	\N	node	41.138.89.134	\N	\N	\N	\N	\N
30abb730-0f9d-454d-8b6d-431fc498e12b	754671cd-2b76-4ccb-a0bb-690adcf34443	2026-07-02 06:04:56.5834+00	2026-07-02 06:04:56.5834+00	\N	aal1	\N	\N	node	41.138.89.134	\N	\N	\N	\N	\N
9dab6eac-0400-44a6-b9c2-f19bd82ecfdb	754671cd-2b76-4ccb-a0bb-690adcf34443	2026-07-02 06:18:25.846978+00	2026-07-02 06:18:25.846978+00	\N	aal1	\N	\N	node	41.79.219.91	\N	\N	\N	\N	\N
00e259f1-20df-4f3c-92ea-20842564d02a	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	2026-07-02 06:19:37.632039+00	2026-07-02 06:19:37.632039+00	\N	aal1	\N	\N	node	41.79.219.91	\N	\N	\N	\N	\N
f0ae6279-dc80-44ba-8c5a-6bf63164a250	20a05243-32ba-41d2-b61f-635df62e2173	2026-07-02 06:48:32.238025+00	2026-07-02 06:48:32.238025+00	\N	aal1	\N	\N	node	41.79.219.91	\N	\N	\N	\N	\N
2dba5aab-4028-4718-8a4b-887badc6c2bf	754671cd-2b76-4ccb-a0bb-690adcf34443	2026-07-02 06:50:51.18497+00	2026-07-02 06:50:51.18497+00	\N	aal1	\N	\N	node	41.79.219.91	\N	\N	\N	\N	\N
25794285-5eef-471f-baa9-0f0facdff7b8	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-07-02 07:14:37.02479+00	2026-07-02 07:14:37.02479+00	\N	aal1	\N	\N	node	41.79.219.91	\N	\N	\N	\N	\N
61c31b01-30a8-4f95-9d08-74f639ed6d9b	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	2026-07-02 07:28:49.845605+00	2026-07-02 07:28:49.845605+00	\N	aal1	\N	\N	node	41.79.219.91	\N	\N	\N	\N	\N
6eeb59f8-5c9d-4020-a6bb-f65647eb786e	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-07-02 07:49:13.756731+00	2026-07-02 07:49:13.756731+00	\N	aal1	\N	\N	node	41.79.219.75	\N	\N	\N	\N	\N
74eb08b6-a9ae-4ae1-a934-cbee1cbd064e	754671cd-2b76-4ccb-a0bb-690adcf34443	2026-07-02 08:09:37.083768+00	2026-07-02 08:09:37.083768+00	\N	aal1	\N	\N	node	41.79.219.75	\N	\N	\N	\N	\N
facbc276-531d-4d31-a306-3ec0ee140a1d	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-07-02 08:22:50.87294+00	2026-07-02 08:22:50.87294+00	\N	aal1	\N	\N	node	41.79.219.75	\N	\N	\N	\N	\N
456c12a1-6046-4418-9c6f-7db79e705be1	2ceb478d-1a3b-49e7-a64c-bab998d8aa3f	2026-07-02 08:27:09.111814+00	2026-07-02 08:27:09.111814+00	\N	aal1	\N	\N	node	41.79.219.75	\N	\N	\N	\N	\N
8be8629c-0cbf-4119-86e2-4c68e325a804	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	2026-07-02 08:35:02.178814+00	2026-07-02 08:35:02.178814+00	\N	aal1	\N	\N	node	41.79.219.75	\N	\N	\N	\N	\N
4ff0ae0a-99c3-4c2f-b4c9-e7dc76724178	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	2026-07-02 08:41:16.477442+00	2026-07-02 08:41:16.477442+00	\N	aal1	\N	\N	node	41.79.219.75	\N	\N	\N	\N	\N
fa77b1d4-17f5-4246-b27f-129e337e75cc	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	2026-07-02 08:49:23.429812+00	2026-07-03 10:30:22.611038+00	\N	aal1	\N	2026-07-03 10:30:22.61095	node	41.79.219.184	\N	\N	\N	\N	\N
67ae1b0b-d9c3-42e0-b7d9-60225f0e9282	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-07-03 10:31:09.364963+00	2026-07-03 11:47:43.896883+00	\N	aal1	\N	2026-07-03 11:47:43.896759	node	156.0.212.156	\N	\N	\N	\N	\N
6c9bf39c-c441-4cd9-aa22-e598f7b34c99	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-07-03 11:50:45.471785+00	2026-07-03 11:50:45.471785+00	\N	aal1	\N	\N	node	156.0.212.156	\N	\N	\N	\N	\N
7bbdbebf-44e9-4084-9e07-5e7797ec6cd5	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-07-03 11:57:56.414701+00	2026-07-03 13:53:03.341885+00	\N	aal1	\N	2026-07-03 13:53:03.341757	node	156.0.212.156	\N	\N	\N	\N	\N
bd7ddb97-15e8-45ab-9008-a1fa6353ff89	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	2026-07-03 13:56:24.776969+00	2026-07-03 13:56:24.776969+00	\N	aal1	\N	\N	node	156.0.212.156	\N	\N	\N	\N	\N
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	ec032fe4-9093-4825-a3ff-af8a8c4b2fad	authenticated	authenticated	candidat.test@gmail.com	$2a$10$OmU7h2w2xnG/iwKATP68YedZchdNUS4n0j3Ib1.85YmPmG8QM.4hu	2026-04-16 05:47:39.486663+00	\N		\N		\N			\N	2026-04-16 05:59:23.96395+00	{"provider": "email", "providers": ["email"]}	{"sub": "ec032fe4-9093-4825-a3ff-af8a8c4b2fad", "email": "candidat.test@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-04-16 05:47:39.453279+00	2026-04-16 05:59:23.975304+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	4de3adcd-e444-403d-8036-a5525129d2d6	authenticated	authenticated	lebg30794@gmail.com	$2a$10$fpKo1Vbue84PnPA/1lNs2Oy0LzeDRcJznflxXKeNtYAKUF0kPKiUG	\N	\N	aadb129ca5148fe34c8a667729880b908272b1107e877af2ed037c4e	2026-06-21 23:34:04.594102+00		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"nom": "ASSOGBA", "sub": "4de3adcd-e444-403d-8036-a5525129d2d6", "anip": "111111111111", "email": "lebg30794@gmail.com", "prenom": "Urgarte", "email_verified": false, "phone_verified": false}	\N	2026-06-21 23:32:35.887129+00	2026-06-21 23:34:04.88722+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	bf121994-42f1-4e88-8ac6-1309d6d208a2	authenticated	authenticated	harry.test@gmail.com	$2a$10$Q.CMSKE5Gop9S.iAsi6pee/d6G2Xq3ZRHgsVmCKA77P458R9gAMse	\N	\N	05f086fb220c38e32e65eb2fe57194c9033f85d7401a4c1b4615fd27	2026-04-09 17:39:30.252231+00		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"sub": "bf121994-42f1-4e88-8ac6-1309d6d208a2", "email": "harry.test@gmail.com", "email_verified": false, "phone_verified": false}	\N	2026-04-09 17:39:30.207372+00	2026-04-09 17:39:31.221414+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	219b295c-5172-4950-b50c-d6138d275770	authenticated	authenticated	candidat.test2@unipath.test	$2a$10$riZgxZXZyf5dERNi2GVs2.ouYamxq4u503N0sWg/.wRhoNGifnqYy	2026-06-23 08:21:51.578262+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"nom": "TESTTWO", "anip": "200000000002", "prenom": "Candidat2", "email_verified": true}	\N	2026-06-23 08:21:51.575418+00	2026-06-23 08:21:51.579064+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	cea47adf-c2b4-42dc-85e1-f77a82853cb0	authenticated	authenticated	harrydedji+candidat2@gmail.com	$2a$10$qkR80/422ShX2f9GkCDinep15wjuNGqlsqpNhCLfz6nbW9sxy3FeC	2026-07-09 06:37:32.250641+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-07-09 06:37:32.242418+00	2026-07-09 06:37:32.251369+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	cf3f6aea-e532-40f2-a5d6-4ebe67a91250	authenticated	authenticated	dges@test.com	$2a$10$V/bwV9wMiLCV/dArvnPE6OZu/BMhB6ZP5FcB3ZnouPHxZOIeDnu2G	2026-06-16 10:29:15.1413+00	\N		\N		\N			\N	2026-07-02 08:49:23.429697+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-24 13:54:51.291501+00	2026-07-03 10:30:22.608055+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	0b31e734-c377-426f-9618-fa73b50675d8	authenticated	authenticated	unipath@gmail.com	$2a$10$G2Icoynms8N45QKb7dCs8.D1FoQoOvr5cOY6bN3BTnImsHfkcF47i	2026-04-22 08:46:28.193328+00	\N		\N		\N			\N	2026-04-22 20:04:49.736452+00	{"provider": "email", "providers": ["email"]}	{"sub": "0b31e734-c377-426f-9618-fa73b50675d8", "email": "unipath@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-04-22 08:46:28.168985+00	2026-04-22 20:04:49.756068+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	c121a8d7-589a-48d4-bae2-134a826c5856	authenticated	authenticated	test.unipath@gmail.com	$2a$10$PxbZouFaUlyOMuutEVOJsuFNtowJdlSRaiHtmmdUk9MqCRIGi1Sn.	2026-04-21 13:37:41.759968+00	\N		\N		\N			\N	2026-04-22 08:20:58.213556+00	{"provider": "email", "providers": ["email"]}	{"sub": "c121a8d7-589a-48d4-bae2-134a826c5856", "email": "test.unipath@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-04-21 13:37:41.733904+00	2026-04-22 08:20:58.221558+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	50924558-a5a0-4ccd-ab7c-9bddbb1252dd	authenticated	authenticated	candidat@test.com	$2a$10$AM4R5hLpqtnFT/bkLnQlYu8IZXkyRDxprHFyAxmwfV8HUFKd7OpbO	2026-06-16 10:29:14.303106+00	\N		\N		\N			\N	2026-06-28 16:45:21.224646+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-24 13:54:46.825139+00	2026-06-28 23:41:56.142625+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	authenticated	authenticated	commission@test.com	$2a$10$l.wbis0tGqZPORSIyqkqM.pBM1FMU66yiTAnycXB5T0G29vns548i	2026-04-24 13:54:50.760804+00	\N		\N		\N			\N	2026-06-18 16:34:52.538433+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-24 13:54:50.756981+00	2026-06-18 16:34:52.592638+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	adad5263-20b1-4f82-8650-e2011ed199ab	authenticated	authenticated	examinateur@test.com	$2a$10$mExAyz0q7k2gSVpNtcj6FuDgjQCIMt3oHVtlJ7XQmqbuhOU0VnE0i	2026-06-16 10:29:14.533993+00	\N		\N		\N			\N	2026-07-01 12:48:15.149724+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-06-16 07:26:18.851399+00	2026-07-01 12:48:15.179549+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	754671cd-2b76-4ccb-a0bb-690adcf34443	authenticated	authenticated	controleur-commission@test.com	$2a$10$XmK5gsQzwb83LjM.CbrMv.oqofNxIjmTrKznypjO.IEqXUID8oPMm	2026-06-16 10:29:14.940167+00	\N		\N		\N			\N	2026-07-02 08:09:37.083647+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-06-16 07:26:24.570112+00	2026-07-02 08:09:37.103107+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	590cfa64-d397-403c-96d0-dc975cf2a149	authenticated	authenticated	kanlinhanonvignon@gmail.com	$2a$10$GcUuvdUcwi7qgwgHQUXcTO1B1pwlYs92CS2isyT5b7Qin4VlPIhMq	2026-04-26 18:37:07.027709+00	\N		\N		\N			\N	2026-04-26 18:52:13.4598+00	{"provider": "email", "providers": ["email"]}	{"sub": "590cfa64-d397-403c-96d0-dc975cf2a149", "email": "kanlinhanonvignon@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-04-26 18:37:06.996137+00	2026-04-26 18:52:13.485743+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	authenticated	authenticated	harrydedji@gmail.com	$2a$10$UvYQTKVDCJEB9WuqD0DxH.M4xPZLl7MFsihDgRREUfMHTYCX6l8Xm	2026-04-09 17:45:26.428853+00	\N		2026-04-09 17:43:24.24022+00		\N			\N	2026-06-18 15:43:06.400531+00	{"provider": "email", "providers": ["email"]}	{"sub": "1edb2bf5-83ef-46f1-b926-ea889ef8cf7c", "email": "harrydedji@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-04-09 17:43:24.206363+00	2026-06-18 15:43:06.421924+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	12a044fe-0847-4643-9c20-95ade843d316	authenticated	authenticated	test@test.com	$2a$10$bpCq/OEr3e0MD7dJX9hJtOJ/oJJXooqnc.htcOnEJZMh1h1mh1Kla	2026-04-26 12:06:50.268072+00	\N		\N		\N			\N	2026-04-26 12:06:50.277981+00	{"provider": "email", "providers": ["email"]}	{"sub": "12a044fe-0847-4643-9c20-95ade843d316", "email": "test@test.com", "email_verified": true, "phone_verified": false}	\N	2026-04-26 12:06:50.235899+00	2026-04-26 13:05:05.898332+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	ce2842ec-13d7-4b9b-8491-26aa92080b35	authenticated	authenticated	harrydedji+candidat3@gmail.com	$2a$10$MK3uAWzwPn7uKAJGv4IR3uZRWTzltI/VJ44Eyxf1c/dgQVmLRXcKG	2026-07-09 06:37:49.276615+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-07-09 06:37:49.271401+00	2026-07-09 06:37:49.277335+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	e22b8e9b-8d98-4316-bc74-49126b9f38e8	authenticated	authenticated	harrydedji+candidat4@gmail.com	$2a$10$Ti8U5xFuiyodfolLixagX.APdR6IgeIT.YySxElcr8eqGFja9YIfK	2026-07-09 06:38:08.298942+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-07-09 06:38:08.282632+00	2026-07-09 06:38:08.299671+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	7a4993ea-5eb4-4ff8-9e66-c4c5f5d5acf2	authenticated	authenticated	harrydedji+candidat5@gmail.com	$2a$10$deKvLSHdEyCFs2JDxfWtAeY.AHHqxFb3HDdF3JH5ANyvnKnYO2QaO	2026-07-09 06:38:24.21605+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-07-09 06:38:24.213349+00	2026-07-09 06:38:24.216764+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	054f38ee-7af7-4bd5-b9b4-5a1dceb84a99	authenticated	authenticated	vignonkanlinhanon5@gmail.com	$2a$10$Z74XqNZbN6TY30y29CjmQOgvgVXUXwOHBjRuWshs3wp0tOy5qFymG	2026-04-26 18:54:49.640504+00	\N		\N		\N			\N	2026-04-26 18:54:49.65161+00	{"provider": "email", "providers": ["email"]}	{"sub": "054f38ee-7af7-4bd5-b9b4-5a1dceb84a99", "email": "vignonkanlinhanon5@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-04-26 18:54:49.605563+00	2026-04-26 18:54:49.663371+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	caf0b663-7b1b-41ef-ac7c-9022b80c41c8	authenticated	authenticated	test-1779802994402@example.com	$2a$10$TYXkwaulY4dk/mEU7I0.yuk005darTF2TNksu4wpPHHEu8OBMryQG	\N	\N	fc56d4cc27f409171e2bc8ae0a19927545f8c6bd430a64e94db3a0eb	2026-05-26 13:43:19.744848+00		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"nom": "DEDJI", "sub": "caf0b663-7b1b-41ef-ac7c-9022b80c41c8", "anip": "000000000000", "email": "test-1779802994402@example.com", "prenom": "Harry", "email_verified": false, "phone_verified": false}	\N	2026-05-26 13:43:19.739568+00	2026-05-26 13:43:20.056109+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	40f13c4d-8b63-443e-8191-0b4df12645fb	authenticated	authenticated	themcdhy@gmail.com	$2a$10$SN524eUUQR.IzTtqQSt6Ve.ndiWg9APHfZjXUNgt./uR18CPJmpkO	2026-05-01 16:55:35.563471+00	\N		2026-05-01 16:50:44.538579+00		2026-05-14 17:34:53.535485+00			\N	2026-05-14 17:35:32.918939+00	{"provider": "email", "providers": ["email"]}	{"sub": "40f13c4d-8b63-443e-8191-0b4df12645fb", "email": "themcdhy@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-05-01 16:50:44.518284+00	2026-05-14 17:35:32.954476+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	8e237b3f-2e09-4938-899b-b97d12deee1a	authenticated	authenticated	elnissoskafu@gmail.com	$2a$10$mOy7nN/gDYDxMQa3wabesueNUOQgL2ma0LdxolBreYUeVuS9F.b0O	2026-05-05 23:00:43.399081+00	\N		2026-05-05 22:53:29.499841+00		\N			\N	2026-05-06 21:40:32.266265+00	{"provider": "email", "providers": ["email"]}	{"sub": "8e237b3f-2e09-4938-899b-b97d12deee1a", "email": "elnissoskafu@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-05-05 22:53:29.446388+00	2026-05-06 21:40:32.285909+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	f12eb176-bb43-4432-b3ec-9ce3735e1226	authenticated	authenticated	test-user1-1779802979366@example.com	$2a$10$b3dXFMfdzPajc7vAFWWZn.sMkbP.kspXN5C9DNmLyMuA3Y/mlkcrW	\N	\N	f3ec4bc078319a6e6a10d0e7ecd7864d667d9b96740dc6b7f60be001	2026-05-26 13:43:15.29291+00		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"nom": "DEDJI", "sub": "f12eb176-bb43-4432-b3ec-9ce3735e1226", "anip": "177980297936", "email": "test-user1-1779802979366@example.com", "prenom": "Harry", "email_verified": false, "phone_verified": false}	\N	2026-05-26 13:43:15.243789+00	2026-05-26 13:43:15.637568+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	47f79776-a2d5-497b-80fa-8b38670461f4	authenticated	authenticated	emlagbaguidi@gmail.com	$2a$10$ssmsFwmSGqRwVQw.TqEX8uUy6mbYBxN3CGAfLVv9kEokFBdY8mZzu	2026-05-02 16:50:41.782025+00	\N		2026-05-02 16:49:59.116567+00		\N			\N	2026-05-07 08:48:29.173725+00	{"provider": "email", "providers": ["email"]}	{"sub": "47f79776-a2d5-497b-80fa-8b38670461f4", "email": "emlagbaguidi@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-05-02 16:49:59.084066+00	2026-05-07 08:48:29.215315+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	ec4ec11c-a798-45a5-9ee8-79a9bee08e39	authenticated	authenticated	dedjiharry@gmail.com	$2a$10$2MlNzayBYCs19Bg6BKZu4uM/Bk9lwtrgEi18QLiW0Rr3EC2isW0by	\N	\N	c906d08dd409d072fa89a8100e75cff5d3c44eb7a99f73a68b1c7803	2026-05-07 09:30:58.848412+00		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"sub": "ec4ec11c-a798-45a5-9ee8-79a9bee08e39", "email": "dedjiharry@gmail.com", "email_verified": false, "phone_verified": false}	\N	2026-05-02 16:00:35.638849+00	2026-05-07 09:30:59.722491+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	18f6be90-ed86-4bfb-8360-443d70852cc9	authenticated	authenticated	test-first-1779802974360@example.com	$2a$10$RiDMHTX9IW0.TxS70L31i.QN2H4mH8vv.sp0Ck8JI46/WF7fkTmV2	\N	\N	79a31e7472b3b252e32f94afe2cbb59ad5cbb3b4061329773170135b	2026-05-26 13:43:09.770769+00		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"nom": "DEDJI", "sub": "18f6be90-ed86-4bfb-8360-443d70852cc9", "anip": "177980297435", "email": "test-first-1779802974360@example.com", "prenom": "Harry", "email_verified": false, "phone_verified": false}	\N	2026-05-26 13:43:09.712383+00	2026-05-26 13:43:10.156678+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	16eaa1a5-477b-4b43-b73e-e2373b69dc3f	authenticated	authenticated	cad@gmail.com	$2a$10$JP1RwCRbY6omnstioWMN9elqzU0TGyfBP7BFYyhwcOOjV4UMxAP7W	2026-04-26 18:55:54.055531+00	\N		\N		\N			\N	2026-04-26 19:14:33.841269+00	{"provider": "email", "providers": ["email"]}	{"sub": "16eaa1a5-477b-4b43-b73e-e2373b69dc3f", "email": "cad@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-04-26 18:55:54.05118+00	2026-04-26 19:14:33.852168+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	c93e16a6-b9fc-4739-b0fe-b1e96315422b	authenticated	authenticated	testunipath@gmail.com	$2a$10$tZvch837Iq3c11xKhMzZvuROknEEGyTs8ZMqiEi3TLi4voA2IUI0i	2026-05-02 15:53:24.666374+00	\N		2026-05-02 15:52:08.497618+00		\N			\N	2026-05-02 15:54:04.721445+00	{"provider": "email", "providers": ["email"]}	{"sub": "c93e16a6-b9fc-4739-b0fe-b1e96315422b", "email": "testunipath@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-05-01 16:41:14.59502+00	2026-05-02 15:54:04.726725+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	cc087f51-4754-47cf-97eb-1d372599abf7	authenticated	authenticated	test-1779802999407@example.com	$2a$10$cTEIaY0z5ZnQHSUoR3lPLO7DZHn1RlnlvD4r/0IjFaro2itxHkB0e	\N	\N	5f7d461b82a3f5c53b0bff1f26b8c1b5a77d62b1d747ebef24f8ca70	2026-05-26 13:43:27.058643+00		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"nom": "TEST", "sub": "cc087f51-4754-47cf-97eb-1d372599abf7", "anip": "000123456789", "email": "test-1779802999407@example.com", "prenom": "User", "email_verified": false, "phone_verified": false}	\N	2026-05-26 13:43:27.008193+00	2026-05-26 13:43:27.380368+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	0099a5d1-7ca2-456d-9136-9535a9cdf13e	authenticated	authenticated	perf-1779803004441@example.com	$2a$10$iUyluBTgz/PrffsncT4bauJbdIdfG3LkGGoyID8/rc7wSZI.Uzzqe	\N	\N	cb1a02d83ce999301098e82fd39b5335ac42a4314e61733d201df5ed	2026-05-26 13:43:29.291749+00		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"nom": "PERF", "sub": "0099a5d1-7ca2-456d-9136-9535a9cdf13e", "anip": "177980300444", "email": "perf-1779803004441@example.com", "prenom": "Test", "email_verified": false, "phone_verified": false}	\N	2026-05-26 13:43:29.285599+00	2026-05-26 13:43:29.570178+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	f4bf7644-7d51-4764-a6ff-a4a3b450b0fc	authenticated	authenticated	candidat.test1@unipath.test	$2a$10$FYvhr62kKDQFwpvMdwKpbOCwSWTBPnRq5wpk6ZiBhQjAdK.esbZoC	2026-06-23 08:21:42.109712+00	\N		\N		\N			\N	2026-06-23 08:26:29.991855+00	{"provider": "email", "providers": ["email"]}	{"nom": "TESTONE", "anip": "200000000001", "prenom": "Candidat1", "email_verified": true}	\N	2026-06-23 08:21:42.078046+00	2026-06-23 08:26:30.020266+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	20a05243-32ba-41d2-b61f-635df62e2173	authenticated	authenticated	examinateur2@test.com	$2a$10$F4lylqTt5HufrLoDUu9yS.85ALGDui0MGQpkHjApEH4.HGVJsVlcy	2026-06-16 10:29:14.735782+00	\N		\N		\N			\N	2026-07-02 06:48:32.236903+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-06-16 07:32:37.727501+00	2026-07-02 06:48:32.274238+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	dd569177-974b-44a6-a51b-e899cc479be1	authenticated	authenticated	harrydedji+candidat1@gmail.com	$2a$10$2TqMSbOg/A48thF50dk52uhqTGNAAPD1yfpa.aN2QJaAHKwp.i5q2	2026-07-09 06:37:15.631002+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-07-09 06:37:15.603758+00	2026-07-09 06:37:15.632+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	authenticated	authenticated	thechill000@gmail.com	$2a$10$OAPpJ/N//.7xqs0tKyZTmenZfwPo9c5wEUcO/2dgTgcp/W6EbPhbe	2026-06-28 09:07:30.951311+00	\N		2026-06-28 08:11:55.533893+00		\N			\N	2026-07-02 08:41:16.47732+00	{"provider": "email", "providers": ["email"]}	{"nom": "FAVI", "sub": "1f1bc8d1-5f57-47ae-8b9c-952c45ffde14", "anip": "146266863878", "email": "thechill000@gmail.com", "prenom": "Keren", "email_verified": true, "phone_verified": false}	\N	2026-06-28 08:05:43.945189+00	2026-07-02 08:41:16.501112+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	362a8b1a-9e81-4c91-b477-c6183394f42f	authenticated	authenticated	test_candidat_1782243862275@example.com	$2a$10$t3D31PterN5TqM50FNqzneQNWPebNL8v9xN/DEG.0H2BSxGNGj4xy	\N	\N	0e62112f29c128c9335ced845d69d86e217e3d3c240ab885caaf7864	2026-06-23 19:44:26.280572+00		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"nom": "TestNom", "sub": "362a8b1a-9e81-4c91-b477-c6183394f42f", "anip": "665232289311", "email": "test_candidat_1782243862275@example.com", "prenom": "TestPrenom", "email_verified": false, "phone_verified": false}	\N	2026-06-23 19:44:26.227943+00	2026-06-23 19:44:26.910504+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	d953f6f7-2cb6-445d-9356-f51141f6916c	authenticated	authenticated	jerzeyshop8@gmail.com	$2a$10$/5tYwJAjBQs81QMihSNJzuAXDGQzYRNCr2il79cTZ2L1rtudQB2.e	2026-06-24 12:32:17.910285+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"role": "ADMIN_ETABLISSEMENT", "email_verified": true, "etablissementId": "22222222-2222-2222-2222-222222222222"}	\N	2026-06-24 12:32:17.877624+00	2026-06-24 12:32:17.912243+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	8b6f294e-f2b8-4611-82f7-63d59df1804a	authenticated	authenticated	test_candidat_1782243949123@example.com	$2a$10$aAMVpOHj8rCckRsyc4O9uupiQ0FKSXcqaShlamgQ/l7naXPu7FWa2	\N	\N	5e355182f9fe0c65456aaef89cda3dd9a127e37e4b5e6343d3f5de2c	2026-06-23 19:45:53.877748+00		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"nom": "TestNom", "sub": "8b6f294e-f2b8-4611-82f7-63d59df1804a", "anip": "808303535200", "email": "test_candidat_1782243949123@example.com", "prenom": "TestPrenom", "email_verified": false, "phone_verified": false}	\N	2026-06-23 19:45:53.870196+00	2026-06-23 19:45:54.184225+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	3e1050d6-a7b8-47d6-8142-68a6ce1e3de8	authenticated	authenticated	forfait199@gmail.com	$2a$10$7ws2f.9j/WbVMk60pSWt0OZjUm2xgmihacwjVblq1DYl5yiPZwpIu	2026-06-28 14:54:59.971929+00	\N		\N		\N			\N	2026-06-28 16:59:26.430085+00	{"provider": "email", "providers": ["email"]}	{"role": "ADMIN_ETABLISSEMENT", "email_verified": true, "etablissementId": "504d0e86-c98f-4fc2-a4e8-235788a21a30", "mustChangePassword": false}	\N	2026-06-28 14:54:59.936467+00	2026-06-28 16:59:26.455445+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	6a2e2a2f-b49e-4dc1-b8e3-3e26fa46eedc	authenticated	authenticated	forsuree15@gmail.com	$2a$10$E81PjXbMeRcneKf0U3rMhuGJUyefpzmolZwD5dw9MpW2W6oM2cKn2	2026-07-02 07:54:58.049048+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"role": "COMMISSION", "sousRole": "EXAMINATEUR", "email_verified": true, "etablissementId": "696e24e5-ffbf-4246-bc57-9db5eff6afef", "mustChangePassword": true, "tempPasswordExpiresAt": "2026-07-04T07:54:56.373Z"}	\N	2026-07-02 07:54:58.016122+00	2026-07-02 07:54:58.050102+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	2ceb478d-1a3b-49e7-a64c-bab998d8aa3f	authenticated	authenticated	dhvrris@gmail.com	$2a$10$gsQK9lleaye7/wdvcwCZFOW.Wij5iZQdQK3jVtMluaIwrycP9PkPK	2026-06-24 12:36:29.410184+00	\N		\N		\N			\N	2026-07-02 08:27:09.110227+00	{"provider": "email", "providers": ["email"]}	{"role": "ADMIN_ETABLISSEMENT", "email_verified": true, "etablissementId": "22222222-2222-2222-2222-222222222222"}	\N	2026-06-24 12:36:29.394464+00	2026-07-02 08:27:09.133017+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	authenticated	authenticated	unipathepac@gmail.com	$2a$10$BDgpBz2r91Cj2nkinFjl/ujpxSn6fq8IP.4o8Ol1x6zQa6qyxuO5q	2026-06-23 08:34:38.676257+00	\N		2026-06-23 08:34:04.746742+00		\N			\N	2026-07-03 13:56:24.776875+00	{"provider": "email", "providers": ["email"]}	{"nom": "DEVI", "sub": "9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f", "anip": "122334567890", "email": "unipathepac@gmail.com", "prenom": "Sidney", "email_verified": true, "phone_verified": false}	\N	2026-06-23 08:34:04.729884+00	2026-07-03 13:56:24.800902+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	acec5f54-1db7-44ab-abcd-514941a94b89	authenticated	authenticated	harrydedji+candidat6@gmail.com	$2a$10$YnSlgM3r7ild8QOI3JOxB.SHE0L.04CL.1FUqPNclOpMxbuDrNSlK	2026-07-09 06:38:37.735669+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-07-09 06:38:37.730076+00	2026-07-09 06:38:37.736414+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	acf582c5-34a6-463f-9ded-c9ae33cec93c	authenticated	authenticated	harrydedji+candidat12@gmail.com	$2a$10$qHRkKkfzjKH78Gpw5SWifOX4BPHAakzwk73Lir1YrtqnWVR4jaj9W	2026-07-09 06:40:01.302595+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-07-09 06:40:01.287932+00	2026-07-09 06:40:01.303345+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	6a4e990b-48f6-4d80-a572-b24a6da10065	authenticated	authenticated	harrydedji+candidat7@gmail.com	$2a$10$Mu2gPGGoggXPxO3qLvsMcOrkp/RTzP7KTO/y0WXU.SsyUGAjAlTgm	2026-07-09 06:38:51.263934+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-07-09 06:38:51.260313+00	2026-07-09 06:38:51.264823+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	95798e76-e65d-4a9d-8e4d-6bc1dbe24169	authenticated	authenticated	harrydedji+candidat8@gmail.com	$2a$10$kJ4ZSFZ4Us43mLZ7OsIdG.I0IYEehjeVG/XZ/TQFNSFn8s8XJU4/W	2026-07-09 06:39:04.526094+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-07-09 06:39:04.523242+00	2026-07-09 06:39:04.52672+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	c489ab2e-1f30-4490-8da7-a4f3be59a9a3	authenticated	authenticated	harrydedji+candidat13@gmail.com	$2a$10$hKICAkttqu5nt0rr4o/m8uDESdZkOKGpFlD8Rwf4tS1iuXB.dAqai	2026-07-09 06:40:15.588361+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-07-09 06:40:15.575784+00	2026-07-09 06:40:15.589154+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	7dafd101-8703-4048-a7ac-b3e5a59a7a20	authenticated	authenticated	harrydedji+candidat9@gmail.com	$2a$10$fQ8lun9IRKQm6VwyNc11u.BrnVIECGgg2u3e/Dlu6b9yMHP7XAci.	2026-07-09 06:39:18.479698+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-07-09 06:39:18.4773+00	2026-07-09 06:39:18.480343+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	63433950-de27-4e70-8f2f-5422ee728631	authenticated	authenticated	harrydedji+candidat10@gmail.com	$2a$10$xH9jC0rtarR7WMVGVVklJeqhQYC8TWVkG6pfALFkLrx4YPMYjBlWq	2026-07-09 06:39:32.246853+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-07-09 06:39:32.244508+00	2026-07-09 06:39:32.247515+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	d4370a44-36c4-4a83-a694-9ce69b76226b	authenticated	authenticated	harrydedji+candidat14@gmail.com	$2a$10$5dPOjh3mhSl7yVVKA8tQm.fWcy/MMif8MgIQ2L06L05CJu2cgeGV.	2026-07-09 06:40:28.971267+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-07-09 06:40:28.968597+00	2026-07-09 06:40:28.972051+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	c61477fa-be86-447c-a001-5b043b58d3b3	authenticated	authenticated	harrydedji+candidat11@gmail.com	$2a$10$hZTvNw5X.dIFlcUdBPxUMOgtbuLoXivhgBKDP5ns/kBGwWMUP5DiO	2026-07-09 06:39:45.865928+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-07-09 06:39:45.862953+00	2026-07-09 06:39:45.866575+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	55c80461-24f9-44dd-b695-d700fba2c36d	authenticated	authenticated	harrydedji+candidat15@gmail.com	$2a$10$oOQHQgYbk3XUj0UavbJKH.tGTcrSwmxucsY3s6D2hl.mF1fKd2IJK	2026-07-09 06:40:42.143969+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-07-09 06:40:42.139022+00	2026-07-09 06:40:42.144718+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.webauthn_challenges (id, user_id, challenge_type, session_data, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.webauthn_credentials (id, user_id, credential_id, public_key, attestation_type, aaguid, sign_count, transports, backup_eligible, backed_up, friendly_name, created_at, updated_at, last_used_at) FROM stdin;
\.


--
-- Data for Name: ActionHistory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ActionHistory" (id, "utilisateurId", "typeAction", details, "timestamp", "ipAddress", "userAgent", "createdAt", "updatedAt", "dossierInscriptionId") FROM stdin;
5cefdfaf-27d8-45b4-955e-c3cdd8e0e95b	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	DOSSIER_CONCOURS_CREE	{"concoursId": "edda9184-3d32-4b68-a8c5-46d19a49004a", "inscriptionId": "817df7ff-f49c-4532-a286-810f325651ae"}	2026-06-24 07:51:38.955	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-24 07:51:38.955	2026-06-24 07:51:38.955	9a8e9aea-4ad2-415d-831f-cfb4595c5d7f
1a50de4b-b9aa-42ce-949a-997b119a7e49	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	DOSSIER_SOUMIS	{"message": "Dossier soumis en une seule requête", "concoursId": "edda9184-3d32-4b68-a8c5-46d19a49004a", "inscriptionId": "817df7ff-f49c-4532-a286-810f325651ae"}	2026-06-24 07:51:39.676	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-24 07:51:39.676	2026-06-24 07:51:39.676	9a8e9aea-4ad2-415d-831f-cfb4595c5d7f
864b9777-7d1a-4f52-9d85-26668dd01f13	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	PIECE_BASE_MISE_A_JOUR	{"url": "https://krqxuoqijkwxouixqudo.supabase.co/storage/v1/object/public/dossiers-candidats/9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f/photo-1782299815424.jpeg", "typePiece": "photo"}	2026-06-24 11:16:58.84	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-24 11:16:58.84	2026-06-24 11:16:58.84	9a8e9aea-4ad2-415d-831f-cfb4595c5d7f
faa5e865-f147-4dd0-bc4d-6deab119a207	adad5263-20b1-4f82-8650-e2011ed199ab	VERDICT_EXAMINATEUR_RENDU	{"motif": null, "verdict": "VALIDE", "numeroVerdict": 1}	2026-06-24 11:45:41.288	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-24 11:45:41.288	2026-06-24 11:45:41.288	9a8e9aea-4ad2-415d-831f-cfb4595c5d7f
ee543eef-b217-43cb-a16d-584e732356b8	754671cd-2b76-4ccb-a0bb-690adcf34443	DECISION_CONTROLEUR_RENDUE	{"motif": null, "decision": "VALIDE", "nombreVerdictsPresents": 1}	2026-06-24 11:50:23.34	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-24 11:50:23.34	2026-06-24 11:50:23.34	9a8e9aea-4ad2-415d-831f-cfb4595c5d7f
3e8b87e8-ac30-4ec3-9552-f695b44fcf59	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	DOSSIER_CONCOURS_CREE	{"concoursId": "01b7434b-1a80-4e64-a0e3-f04eb833e43e", "inscriptionId": "fdb3a986-f90e-4c22-bd37-e2b211d6cd4b"}	2026-07-01 12:42:17.55	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-01 12:42:17.55	2026-07-01 12:42:17.55	de72a1f8-d74d-496d-a8d7-ad30a427218d
f790ae8e-b838-49dc-a12e-e6a8687b5d77	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	DOSSIER_SOUMIS	{"message": "Dossier soumis en une seule requête", "concoursId": "01b7434b-1a80-4e64-a0e3-f04eb833e43e", "inscriptionId": "fdb3a986-f90e-4c22-bd37-e2b211d6cd4b"}	2026-07-01 12:42:17.83	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-01 12:42:17.83	2026-07-01 12:42:17.83	de72a1f8-d74d-496d-a8d7-ad30a427218d
9f6152c0-e917-42e3-8e90-0f63cfe8981c	adad5263-20b1-4f82-8650-e2011ed199ab	VERDICT_EXAMINATEUR_RENDU	{"motif": "Les pièces ne s", "verdict": "SOUS_RESERVE", "numeroVerdict": 1}	2026-07-01 12:51:07.726	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-01 12:51:07.726	2026-07-01 12:51:07.726	de72a1f8-d74d-496d-a8d7-ad30a427218d
0e6165b9-f7bf-4db1-bcfd-149c7fc503d2	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	DOSSIER_CONCOURS_CREE	{"concoursId": "73ef6938-9e50-4d8a-9bf6-14bb584c6fd8", "inscriptionId": "92cbd1d5-ffcc-4069-99e5-6a9c16ab596f"}	2026-07-02 05:55:13.268	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-02 05:55:13.268	2026-07-02 05:55:13.268	1ae78c5f-bd8a-4533-b70d-997bca802112
925fe437-4d1f-42ee-bc56-a85cbdc6e8bd	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	DOSSIER_SOUMIS	{"message": "Dossier soumis en une seule requête", "concoursId": "73ef6938-9e50-4d8a-9bf6-14bb584c6fd8", "inscriptionId": "92cbd1d5-ffcc-4069-99e5-6a9c16ab596f"}	2026-07-02 05:55:13.643	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-02 05:55:13.643	2026-07-02 05:55:13.643	1ae78c5f-bd8a-4533-b70d-997bca802112
ae884656-e8a3-44c8-9f30-f4fdeb5590a4	20a05243-32ba-41d2-b61f-635df62e2173	VERDICT_EXAMINATEUR_RENDU	{"motif": "La carte d&#x27;identité n&#x27;est pas conforme", "verdict": "SOUS_RESERVE", "numeroVerdict": 1}	2026-07-02 05:57:48.925	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-02 05:57:48.925	2026-07-02 05:57:48.925	1ae78c5f-bd8a-4533-b70d-997bca802112
546224d6-e4a4-433c-b151-b7c860f45a75	754671cd-2b76-4ccb-a0bb-690adcf34443	DECISION_CONTROLEUR_RENDUE	{"motif": "La carte d&#x27;identité n&#x27;est pas conforme", "decision": "SOUS_RESERVE", "nombreVerdictsPresents": 1}	2026-07-02 06:07:48.246	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-02 06:07:48.246	2026-07-02 06:07:48.246	1ae78c5f-bd8a-4533-b70d-997bca802112
d467c16d-f055-4e22-994e-d36d5c0a9083	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	PIECE_BASE_MISE_A_JOUR	{"url": "1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/photo-1782974709570.jpg", "typePiece": "photo"}	2026-07-02 06:45:14.502	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-02 06:45:14.502	2026-07-02 06:45:14.502	de72a1f8-d74d-496d-a8d7-ad30a427218d
faa52ac1-16ba-4e00-b906-b0b93bc39eda	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	PIECE_BASE_MISE_A_JOUR	{"url": "1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/photo-1782974709570.jpg", "typePiece": "photo"}	2026-07-02 06:45:15.517	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-02 06:45:15.517	2026-07-02 06:45:15.517	1ae78c5f-bd8a-4533-b70d-997bca802112
5ce84d4e-7d56-4bfd-b78f-ec53651b7ece	754671cd-2b76-4ccb-a0bb-690adcf34443	DECISION_CONTROLEUR_MODIFIEE	{"motif": "Il  a corrigé le dossier et j'ai validé", "ancienneDecision": "SOUS_RESERVE", "nouvelleDecision": "VALIDE"}	2026-07-02 07:11:35.458	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-02 07:11:35.458	2026-07-02 07:11:35.458	1ae78c5f-bd8a-4533-b70d-997bca802112
\.


--
-- Data for Name: AdminEtablissement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AdminEtablissement" (id, nom, prenom, email, telephone, role, "etablissementId", "createdAt", "updatedAt") FROM stdin;
d953f6f7-2cb6-445d-9356-f51141f6916c	DIGBA	Didier	jerzeyshop8@gmail.com	0146620238	ADMIN_ETABLISSEMENT	22222222-2222-2222-2222-222222222222	2026-06-24 12:32:16.196	2026-06-24 12:32:16.196
2ceb478d-1a3b-49e7-a64c-bab998d8aa3f	DJIMON	Girès	dhvrris@gmail.com	0168629864	ADMIN_ETABLISSEMENT	22222222-2222-2222-2222-222222222222	2026-06-24 12:36:27.742	2026-06-24 12:36:27.742
3e1050d6-a7b8-47d6-8142-68a6ce1e3de8	ALI	Marcos	forfait199@gmail.com	0144443333	ADMIN_ETABLISSEMENT	504d0e86-c98f-4fc2-a4e8-235788a21a30	2026-06-28 14:55:00.144	2026-06-28 14:55:00.144
\.


--
-- Data for Name: AdministrateurDGES; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AdministrateurDGES" (id, nom, prenom, email, telephone, role, "createdAt", "updatedAt") FROM stdin;
cf3f6aea-e532-40f2-a5d6-4ebe67a91250	TEST	DGES	dges@test.com	+22997000003	DGES	2026-06-16 09:56:18.127	2026-06-16 10:00:26.819
\.


--
-- Data for Name: Application; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Application" (id, "numeroApplication", "candidatId", "etablissementId", "filiereId", "anneeAcademique", niveau, status, "preinscriptionId", "createdAt", "updatedAt", "campagneFiliereId") FROM stdin;
362accc7-c04c-4727-8f09-7827f7e9c869	APP-2026-35698	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	22222222-2222-2222-2222-222222222222	73b1104a-9326-458c-92a2-2d761d5a2803	2026-2027	1	DRAFT	\N	2026-06-24 12:24:16.851	2026-06-24 12:24:16.851	\N
f15977f0-2382-4d0e-9337-941d0e1ea3e6	APP-2026-37872	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	e81c0f9c-1a75-41c9-9f53-77776c11ccd9	bb7ff878-b48f-40c9-a1a7-dcb7bc920b95	2026-2027	1	DRAFT	\N	2026-06-28 07:14:32.007	2026-06-28 07:14:32.007	\N
6aa9406f-da43-4013-a781-2628818fe579	APP-2026-65339	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	7338f85e-731a-4e03-84ee-891f4c7d8e12	e2f7e954-5947-4805-a0c5-1c02c110f1a4	2026-2027	1	DRAFT	\N	2026-06-28 16:56:53.913	2026-06-28 16:56:53.913	\N
77185053-1972-4418-8281-d98c621e907d	APP-2026-72320	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	520e3096-707c-4646-97d5-7514df97676f	0dd5a6ed-17ec-4b07-83a7-88adb3f986cf	2026-2027	1	DRAFT	\N	2026-07-02 08:45:00.512	2026-07-02 08:45:00.512	\N
69af54a1-2fdd-470c-8967-36d7f6dbdf59	DEMO-APP-2026-002	cea47adf-c2b4-42dc-85e1-f77a82853cb0	c70df463-0f8f-4cf9-9da1-ef5526d5e6e6	7fde5ad7-ded1-4bc0-b18f-d224024c1289	2026-2027	1	FICHE_GENERATED	e441879c-a578-471d-a854-a44b6328f62b	2026-07-08 14:15:00	2026-07-09 06:43:12.475	542597d7-ac0a-46cc-9d7c-2926d1b7a6fd
b50a11f1-1f97-488e-b459-33c2815ccbc3	DEMO-APP-2026-001	dd569177-974b-44a6-a51b-e899cc479be1	e81c0f9c-1a75-41c9-9f53-77776c11ccd9	fa47a00c-5236-430e-b2e4-c08746fa140a	2026-2027	1	FICHE_GENERATED	7c64b731-6abc-4130-b274-feaf8f975eb8	2026-07-05 10:30:00	2026-07-09 06:42:58.396	f942b8db-e314-4790-8882-133c5ca4b26a
f01d57bb-c800-461f-9a93-12d25ce01ea3	DEMO-APP-2026-005	7a4993ea-5eb4-4ff8-9e66-c4c5f5d5acf2	27862738-53ec-496d-835f-a5c24245c653	7d0cbf1e-82ae-4749-8a79-b6d5cbff992f	2026-2027	1	FICHE_GENERATED	3c1486d8-fc11-41ca-80f8-8917883d2507	2026-07-15 11:20:00	2026-07-09 06:43:53.323	dc52e286-86e7-49ac-b014-dc10c0033ddd
4fce3a1a-cc2b-4574-aeb1-387659b9bbd8	DEMO-APP-2026-008	95798e76-e65d-4a9d-8e4d-6bc1dbe24169	7338f85e-731a-4e03-84ee-891f4c7d8e12	859c2c8c-3470-4d6a-a7d0-2ab149d2840b	2026-2027	1	FICHE_GENERATED	520d1e7b-8314-4ba9-aba1-0c74b91d2509	2026-07-22 15:40:00	2026-07-09 06:44:35.802	9b92e79c-a98c-4191-966f-786e0e5e004e
4bc15290-aa5b-4229-a213-830763772954	DEMO-APP-2026-003	ce2842ec-13d7-4b9b-8491-26aa92080b35	8b091357-0bd9-4cf2-95ac-297743896231	9e2ec4f4-56fa-4f44-ad6a-0711e2fe41ff	2026-2027	1	FICHE_GENERATED	db5fe1fe-5b7e-44a7-b8a8-f0975bf28388	2026-07-10 09:00:00	2026-07-09 06:43:26.024	cfdc10a4-842f-4882-a3dc-3b8f8b5b1f51
5d2c4a06-3b2e-4457-9576-e924a2216007	DEMO-APP-2026-006	acec5f54-1db7-44ab-abcd-514941a94b89	504d0e86-c98f-4fc2-a4e8-235788a21a30	7e01c588-abc1-4948-90fe-c36f84cefa0e	2026-2027	1	FICHE_GENERATED	071fbe30-d3ca-4c12-8b61-47d71153c8de	2026-07-18 08:50:00	2026-07-09 06:44:07.522	4e5bbafa-c2f8-4bc6-b7ec-9e0b0eae4faf
6bbb6cf8-0c49-4d83-921a-83d9c0312d70	DEMO-APP-2026-004	e22b8e9b-8d98-4316-bc74-49126b9f38e8	1e8f8742-21b9-4801-8fa7-f7588875a074	95e903eb-b782-4dde-9aa9-ca40d6484664	2026-2027	1	FICHE_GENERATED	6662568d-4027-4368-b090-922bd4d31cf0	2026-07-12 16:45:00	2026-07-09 06:43:39.733	5602c749-63d7-4219-8646-413e9aaac0db
1b36570d-b9ff-4235-8c8f-d6649ece3d15	DEMO-APP-2026-011	c61477fa-be86-447c-a001-5b043b58d3b3	688bc6b3-e29e-4d07-854b-06da1337a7b5	11b8146f-55b6-49b2-ac20-a082e73b25bf	2026-2027	1	FICHE_GENERATED	42baee97-f93f-490a-a8a0-84094cfc6052	2026-08-01 09:35:00	2026-07-09 06:45:19.467	4da3f288-c945-4388-a1ff-9594fe72611a
ac652308-5a03-4629-98e3-8b22e7627926	DEMO-APP-2026-009	7dafd101-8703-4048-a7ac-b3e5a59a7a20	eb18c3d8-8756-4e5e-bb01-c19a8409428d	5dd45f0a-18fb-4b05-8657-ec6609165070	2026-2027	1	FICHE_GENERATED	e6c58340-1f86-4ee7-8f54-335e6e0e24e1	2026-07-25 10:05:00	2026-07-09 06:44:49.744	96c0a2b3-3467-4172-bf76-70951d5d64ba
26cbc0ab-1e55-44a2-9194-1ad5a059afcf	DEMO-APP-2026-007	6a4e990b-48f6-4d80-a572-b24a6da10065	6d578bb6-6a1d-45e7-89ed-b18db9cec6a8	9811ada3-f644-4ea8-bc49-5931037541fa	2026-2027	1	FICHE_GENERATED	527e38f1-7483-43cb-b04c-ef3ec760cecd	2026-07-20 13:10:00	2026-07-09 06:44:21.673	bb9c44e8-5414-47ac-9c84-8333dc4f5513
a52cc3a8-4f64-4ac6-9e25-f0750575a86c	DEMO-APP-2026-014	d4370a44-36c4-4a83-a694-9ce69b76226b	c70df463-0f8f-4cf9-9da1-ef5526d5e6e6	4ce23399-864e-4300-add4-2ea33e37a7af	2026-2027	1	FICHE_GENERATED	86b7c7af-9370-4930-9097-0db32055cc69	2026-08-10 11:15:00	2026-07-09 06:46:05.161	141de4ba-2de8-41b3-bab8-2457265a1bc1
2913c814-ddef-44ec-a0da-10372a43b378	DEMO-APP-2026-012	acf582c5-34a6-463f-9ded-c9ae33cec93c	c2073e47-1e76-4c8d-b042-16fbcf356638	cb966a36-2648-4449-aa57-055be9c1aa8a	2026-2027	1	FICHE_GENERATED	b17d0f42-c1f3-4d9c-8e38-e94271df82b4	2026-08-05 12:00:00	2026-07-09 06:45:34.433	b94e4d80-f344-4ca5-af8f-16c563667c04
b15d84a8-89f7-467b-8a77-78bed28fef6c	DEMO-APP-2026-010	63433950-de27-4e70-8f2f-5422ee728631	f34ed1d5-c65c-4de4-8cec-8bed55c36a40	fb06e7f8-0a7f-4a59-a321-2d5299fa6ec3	2026-2027	1	FICHE_GENERATED	ee6be6f7-2419-44a7-89d7-cb16a248e509	2026-07-28 17:25:00	2026-07-09 06:45:04.338	be0bb093-2101-41fd-b86d-f5b22dd20518
0d0f6f4e-a977-41b3-b836-b50997f918d4	DEMO-APP-2026-015	55c80461-24f9-44dd-b695-d700fba2c36d	27862738-53ec-496d-835f-a5c24245c653	9ca6e685-5abd-4dc8-af6b-c951ed2cab93	2026-2027	1	FICHE_GENERATED	8fd9deb5-c855-4346-82ea-35e4dee3dae4	2026-08-12 16:30:00	2026-07-09 06:46:22.953	6335099c-0d97-4ff2-b89f-723f048bdad2
b6ef3ca7-e6b3-496f-93a1-e320b8d97ab5	DEMO-APP-2026-013	c489ab2e-1f30-4490-8da7-a4f3be59a9a3	e81c0f9c-1a75-41c9-9f53-77776c11ccd9	78d1f8b1-fbc1-4d7a-8859-9308139fb1e8	2026-2027	1	FICHE_GENERATED	4616d7a9-8544-42b1-84e8-b99bbf7f2bce	2026-08-08 14:55:00	2026-07-09 06:45:48.926	dd85c6fe-9879-41c0-a9f9-5f4c00ef0195
\.


--
-- Data for Name: ApplicationDocument; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ApplicationDocument" (id, "applicationId", "schoolRequirementId", code, label, source, "documentUrl", status, metadata, "createdAt", "updatedAt") FROM stdin;
5def58d6-d30c-48dc-9583-48262d468f2c	b50a11f1-1f97-488e-b459-33c2815ccbc3	\N	CARTE_IDENTITE	Carte d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/cni-1.pdf	PROVIDED	\N	2026-07-09 06:37:24.293	2026-07-09 06:42:53.074
5ae62cf9-532d-4675-9a51-6d9e91545920	b50a11f1-1f97-488e-b459-33c2815ccbc3	\N	PHOTO	Photo d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/photo-1.jpg	PROVIDED	\N	2026-07-09 06:37:25.572	2026-07-09 06:42:53.955
01c0b11f-8c2b-4fc9-bb02-028860b74dfa	b50a11f1-1f97-488e-b459-33c2815ccbc3	\N	RELEVE_NOTES	Relevé de notes	STUDENT_UPLOAD	https://example.com/demo/unipath/releve-1.pdf	PROVIDED	\N	2026-07-09 06:37:26.571	2026-07-09 06:42:54.896
7486b366-4400-45c9-b32d-2af483235056	69af54a1-2fdd-470c-8967-36d7f6dbdf59	\N	ACTE_NAISSANCE	Acte de naissance	STUDENT_UPLOAD	https://example.com/demo/unipath/acte-2.pdf	PROVIDED	\N	2026-07-09 06:37:39.504	2026-07-09 06:43:06.029
f9f16f0c-0845-494d-8326-1781cc26860b	69af54a1-2fdd-470c-8967-36d7f6dbdf59	\N	CARTE_IDENTITE	Carte d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/cni-2.pdf	PROVIDED	\N	2026-07-09 06:37:40.353	2026-07-09 06:43:06.881
4725eb98-86f1-44d8-8a5a-0a7aab5859c4	69af54a1-2fdd-470c-8967-36d7f6dbdf59	\N	PHOTO	Photo d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/photo-2.jpg	PROVIDED	\N	2026-07-09 06:37:41.216	2026-07-09 06:43:07.75
fff56eba-c1a9-4842-8d38-c587d1a1b000	69af54a1-2fdd-470c-8967-36d7f6dbdf59	\N	RELEVE_NOTES	Relevé de notes	STUDENT_UPLOAD	https://example.com/demo/unipath/releve-2.pdf	PROVIDED	\N	2026-07-09 06:37:42.293	2026-07-09 06:43:08.798
b009cf6c-72c6-4f47-871f-482adf409406	4bc15290-aa5b-4229-a213-830763772954	\N	ACTE_NAISSANCE	Acte de naissance	STUDENT_UPLOAD	https://example.com/demo/unipath/acte-3.pdf	PROVIDED	\N	2026-07-09 06:37:56.849	2026-07-09 06:43:19.918
34f416ea-b51a-4857-ae7f-1aa461a992d8	4bc15290-aa5b-4229-a213-830763772954	\N	CARTE_IDENTITE	Carte d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/cni-3.pdf	PROVIDED	\N	2026-07-09 06:37:58.012	2026-07-09 06:43:20.785
801afc69-c998-40c8-a06e-2258ef6684c6	4bc15290-aa5b-4229-a213-830763772954	\N	PHOTO	Photo d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/photo-3.jpg	PROVIDED	\N	2026-07-09 06:37:58.997	2026-07-09 06:43:21.642
bc557716-1e94-4c20-93bc-b752a273573a	4bc15290-aa5b-4229-a213-830763772954	\N	RELEVE_NOTES	Relevé de notes	STUDENT_UPLOAD	https://example.com/demo/unipath/releve-3.pdf	PROVIDED	\N	2026-07-09 06:37:59.863	2026-07-09 06:43:22.513
8a718104-6956-4a9c-ab01-db492449c65e	6bbb6cf8-0c49-4d83-921a-83d9c0312d70	\N	ACTE_NAISSANCE	Acte de naissance	STUDENT_UPLOAD	https://example.com/demo/unipath/acte-4.pdf	PROVIDED	\N	2026-07-09 06:38:16.252	2026-07-09 06:43:33.562
4cf16a50-a491-4769-b057-0e93c655d09c	6bbb6cf8-0c49-4d83-921a-83d9c0312d70	\N	CARTE_IDENTITE	Carte d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/cni-4.pdf	PROVIDED	\N	2026-07-09 06:38:17.115	2026-07-09 06:43:34.443
35df5339-2d14-46b0-a4e1-dd25db25308a	6bbb6cf8-0c49-4d83-921a-83d9c0312d70	\N	PHOTO	Photo d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/photo-4.jpg	PROVIDED	\N	2026-07-09 06:38:18.143	2026-07-09 06:43:35.304
31c056b9-d7be-4621-94cf-ff5a47fd1212	6bbb6cf8-0c49-4d83-921a-83d9c0312d70	\N	RELEVE_NOTES	Relevé de notes	STUDENT_UPLOAD	https://example.com/demo/unipath/releve-4.pdf	PROVIDED	\N	2026-07-09 06:38:18.984	2026-07-09 06:43:36.154
61bbf4b6-05e7-499a-8ae2-6340e8933e93	f01d57bb-c800-461f-9a93-12d25ce01ea3	\N	ACTE_NAISSANCE	Acte de naissance	STUDENT_UPLOAD	https://example.com/demo/unipath/acte-5.pdf	PROVIDED	\N	2026-07-09 06:38:30.016	2026-07-09 06:43:47.242
a9fa611f-9edb-40cc-9d7f-3486f5dd497e	f01d57bb-c800-461f-9a93-12d25ce01ea3	\N	CARTE_IDENTITE	Carte d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/cni-5.pdf	PROVIDED	\N	2026-07-09 06:38:30.878	2026-07-09 06:43:48.123
6a263c1c-046e-418b-ab00-b3a6f698c13f	f01d57bb-c800-461f-9a93-12d25ce01ea3	\N	PHOTO	Photo d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/photo-5.jpg	PROVIDED	\N	2026-07-09 06:38:31.775	2026-07-09 06:43:48.994
f7d42665-8438-42cf-8351-9d5872e952c5	f01d57bb-c800-461f-9a93-12d25ce01ea3	\N	RELEVE_NOTES	Relevé de notes	STUDENT_UPLOAD	https://example.com/demo/unipath/releve-5.pdf	PROVIDED	\N	2026-07-09 06:38:32.614	2026-07-09 06:43:49.876
d14db3bb-1748-49ee-9079-8bd57abbe419	5d2c4a06-3b2e-4457-9576-e924a2216007	\N	ACTE_NAISSANCE	Acte de naissance	STUDENT_UPLOAD	https://example.com/demo/unipath/acte-6.pdf	PROVIDED	\N	2026-07-09 06:38:43.577	2026-07-09 06:44:01.355
ef44c592-82e1-4ad3-8b17-e79d57983f1e	5d2c4a06-3b2e-4457-9576-e924a2216007	\N	CARTE_IDENTITE	Carte d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/cni-6.pdf	PROVIDED	\N	2026-07-09 06:38:44.612	2026-07-09 06:44:02.207
19dc2548-76b6-4876-82bf-2c5ebf376a60	5d2c4a06-3b2e-4457-9576-e924a2216007	\N	PHOTO	Photo d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/photo-6.jpg	PROVIDED	\N	2026-07-09 06:38:45.466	2026-07-09 06:44:03.075
6df455a0-01a6-4f65-b01c-427f0c8dde31	5d2c4a06-3b2e-4457-9576-e924a2216007	\N	RELEVE_NOTES	Relevé de notes	STUDENT_UPLOAD	https://example.com/demo/unipath/releve-6.pdf	PROVIDED	\N	2026-07-09 06:38:46.455	2026-07-09 06:44:03.987
87c299bb-b5fb-41e2-9a1e-efdcdb15a0f3	26cbc0ab-1e55-44a2-9194-1ad5a059afcf	\N	ACTE_NAISSANCE	Acte de naissance	STUDENT_UPLOAD	https://example.com/demo/unipath/acte-7.pdf	PROVIDED	\N	2026-07-09 06:38:56.851	2026-07-09 06:44:15.401
0cd04cf1-d17d-4445-8dc0-31b8ffe169ab	26cbc0ab-1e55-44a2-9194-1ad5a059afcf	\N	CARTE_IDENTITE	Carte d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/cni-7.pdf	PROVIDED	\N	2026-07-09 06:38:57.813	2026-07-09 06:44:16.306
73b73141-d118-45a3-8b0b-4b14c1c0e3fb	26cbc0ab-1e55-44a2-9194-1ad5a059afcf	\N	PHOTO	Photo d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/photo-7.jpg	PROVIDED	\N	2026-07-09 06:38:58.665	2026-07-09 06:44:17.163
9ced29da-4a43-4608-9853-5fca74dbc09d	4fce3a1a-cc2b-4574-aeb1-387659b9bbd8	\N	ACTE_NAISSANCE	Acte de naissance	STUDENT_UPLOAD	https://example.com/demo/unipath/acte-8.pdf	PROVIDED	\N	2026-07-09 06:39:10.73	2026-07-09 06:44:29.713
709ed5da-50dc-48f6-a8cc-db3b7f1343fb	4fce3a1a-cc2b-4574-aeb1-387659b9bbd8	\N	CARTE_IDENTITE	Carte d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/cni-8.pdf	PROVIDED	\N	2026-07-09 06:39:11.704	2026-07-09 06:44:30.598
d5a31b5e-0dee-4c8d-a68a-537151a3c45c	4fce3a1a-cc2b-4574-aeb1-387659b9bbd8	\N	PHOTO	Photo d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/photo-8.jpg	PROVIDED	\N	2026-07-09 06:39:12.541	2026-07-09 06:44:31.522
e49e7c6e-1212-4a93-a4fc-c23a078e0c47	4fce3a1a-cc2b-4574-aeb1-387659b9bbd8	\N	RELEVE_NOTES	Relevé de notes	STUDENT_UPLOAD	https://example.com/demo/unipath/releve-8.pdf	PROVIDED	\N	2026-07-09 06:39:13.452	2026-07-09 06:44:32.383
61f78655-6851-4f97-90f6-b7f6d6b555ec	ac652308-5a03-4629-98e3-8b22e7627926	\N	ACTE_NAISSANCE	Acte de naissance	STUDENT_UPLOAD	https://example.com/demo/unipath/acte-9.pdf	PROVIDED	\N	2026-07-09 06:39:24.362	2026-07-09 06:44:43.585
6a730319-34be-402b-99f4-0a5ef9c96a5a	ac652308-5a03-4629-98e3-8b22e7627926	\N	CARTE_IDENTITE	Carte d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/cni-9.pdf	PROVIDED	\N	2026-07-09 06:39:25.222	2026-07-09 06:44:44.435
9daf80c7-10f6-467d-bf88-66f76053249b	ac652308-5a03-4629-98e3-8b22e7627926	\N	PHOTO	Photo d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/photo-9.jpg	PROVIDED	\N	2026-07-09 06:39:26.252	2026-07-09 06:44:45.281
3132f6b2-4eb6-48f3-840f-e1d644c53061	ac652308-5a03-4629-98e3-8b22e7627926	\N	RELEVE_NOTES	Relevé de notes	STUDENT_UPLOAD	https://example.com/demo/unipath/releve-9.pdf	PROVIDED	\N	2026-07-09 06:39:27.175	2026-07-09 06:44:46.114
3c0f9975-7ed7-45bd-80af-5f68ed015ff7	b15d84a8-89f7-467b-8a77-78bed28fef6c	\N	ACTE_NAISSANCE	Acte de naissance	STUDENT_UPLOAD	https://example.com/demo/unipath/acte-10.pdf	PROVIDED	\N	2026-07-09 06:39:37.845	2026-07-09 06:44:57.397
29144604-db11-4ad4-84ed-d38cc2e6b634	b15d84a8-89f7-467b-8a77-78bed28fef6c	\N	CARTE_IDENTITE	Carte d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/cni-10.pdf	PROVIDED	\N	2026-07-09 06:39:38.785	2026-07-09 06:44:58.563
87dc2330-3666-4bc8-b95f-b5ff188d4983	b50a11f1-1f97-488e-b459-33c2815ccbc3	\N	ACTE_NAISSANCE	Acte de naissance	STUDENT_UPLOAD	https://example.com/demo/unipath/acte-1.pdf	PROVIDED	\N	2026-07-09 06:37:22.963	2026-07-09 06:42:52.066
700a201e-35e3-4423-97f3-a20b13086532	26cbc0ab-1e55-44a2-9194-1ad5a059afcf	\N	RELEVE_NOTES	Relevé de notes	STUDENT_UPLOAD	https://example.com/demo/unipath/releve-7.pdf	PROVIDED	\N	2026-07-09 06:38:59.502	2026-07-09 06:44:18.035
142029df-bd22-409e-959b-28428249eb14	b15d84a8-89f7-467b-8a77-78bed28fef6c	\N	PHOTO	Photo d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/photo-10.jpg	PROVIDED	\N	2026-07-09 06:39:39.686	2026-07-09 06:44:59.616
1709be40-e2d8-475d-890d-95186b3ebbd2	b15d84a8-89f7-467b-8a77-78bed28fef6c	\N	RELEVE_NOTES	Relevé de notes	STUDENT_UPLOAD	https://example.com/demo/unipath/releve-10.pdf	PROVIDED	\N	2026-07-09 06:39:40.536	2026-07-09 06:45:00.477
76827b52-616a-4e48-b4ce-3623a57e52af	1b36570d-b9ff-4235-8c8f-d6649ece3d15	\N	ACTE_NAISSANCE	Acte de naissance	STUDENT_UPLOAD	https://example.com/demo/unipath/acte-11.pdf	PROVIDED	\N	2026-07-09 06:39:51.578	2026-07-09 06:45:12.831
e62c1057-c032-4030-a001-9a03e8b94249	1b36570d-b9ff-4235-8c8f-d6649ece3d15	\N	CARTE_IDENTITE	Carte d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/cni-11.pdf	PROVIDED	\N	2026-07-09 06:39:53.221	2026-07-09 06:45:13.705
22ff545e-31af-4516-92b1-5d8f52c97796	1b36570d-b9ff-4235-8c8f-d6649ece3d15	\N	PHOTO	Photo d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/photo-11.jpg	PROVIDED	\N	2026-07-09 06:39:54.062	2026-07-09 06:45:14.553
ddfa700a-e2fb-4551-9b9c-6a1f6e6a4d82	1b36570d-b9ff-4235-8c8f-d6649ece3d15	\N	RELEVE_NOTES	Relevé de notes	STUDENT_UPLOAD	https://example.com/demo/unipath/releve-11.pdf	PROVIDED	\N	2026-07-09 06:39:55.044	2026-07-09 06:45:15.557
8cba0b50-6900-441d-a141-8315261bb784	2913c814-ddef-44ec-a0da-10372a43b378	\N	ACTE_NAISSANCE	Acte de naissance	STUDENT_UPLOAD	https://example.com/demo/unipath/acte-12.pdf	PROVIDED	\N	2026-07-09 06:40:08.029	2026-07-09 06:45:27.57
c86e2706-e69d-471b-ad84-69ad7f4c5eba	2913c814-ddef-44ec-a0da-10372a43b378	\N	CARTE_IDENTITE	Carte d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/cni-12.pdf	PROVIDED	\N	2026-07-09 06:40:09.056	2026-07-09 06:45:28.468
cb764b89-acee-47fd-8793-241bb17a156c	2913c814-ddef-44ec-a0da-10372a43b378	\N	PHOTO	Photo d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/photo-12.jpg	PROVIDED	\N	2026-07-09 06:40:09.894	2026-07-09 06:45:29.343
b24b2de2-22b6-48ce-80cb-14387cc862bb	2913c814-ddef-44ec-a0da-10372a43b378	\N	RELEVE_NOTES	Relevé de notes	STUDENT_UPLOAD	https://example.com/demo/unipath/releve-12.pdf	PROVIDED	\N	2026-07-09 06:40:10.721	2026-07-09 06:45:30.228
ae52b841-e249-4735-b616-7451b16f82aa	b6ef3ca7-e6b3-496f-93a1-e320b8d97ab5	\N	ACTE_NAISSANCE	Acte de naissance	STUDENT_UPLOAD	https://example.com/demo/unipath/acte-13.pdf	PROVIDED	\N	2026-07-09 06:40:21.32	2026-07-09 06:45:42.384
b22487e3-2a5b-4a30-8c78-6a7c5295ca69	b6ef3ca7-e6b3-496f-93a1-e320b8d97ab5	\N	CARTE_IDENTITE	Carte d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/cni-13.pdf	PROVIDED	\N	2026-07-09 06:40:22.278	2026-07-09 06:45:43.365
ec7b195c-2d18-457d-9e06-8635abf8d3aa	b6ef3ca7-e6b3-496f-93a1-e320b8d97ab5	\N	PHOTO	Photo d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/photo-13.jpg	PROVIDED	\N	2026-07-09 06:40:23.107	2026-07-09 06:45:44.246
d0e93eec-55ac-41fe-8523-3a92a857cdce	b6ef3ca7-e6b3-496f-93a1-e320b8d97ab5	\N	RELEVE_NOTES	Relevé de notes	STUDENT_UPLOAD	https://example.com/demo/unipath/releve-13.pdf	PROVIDED	\N	2026-07-09 06:40:23.957	2026-07-09 06:45:45.146
6106fda8-5200-44ca-84d8-a6fe0a599083	a52cc3a8-4f64-4ac6-9e25-f0750575a86c	\N	ACTE_NAISSANCE	Acte de naissance	STUDENT_UPLOAD	https://example.com/demo/unipath/acte-14.pdf	PROVIDED	\N	2026-07-09 06:40:34.736	2026-07-09 06:45:58.962
04286926-9411-49ef-bcf6-44aaf3e1ce45	a52cc3a8-4f64-4ac6-9e25-f0750575a86c	\N	CARTE_IDENTITE	Carte d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/cni-14.pdf	PROVIDED	\N	2026-07-09 06:40:35.572	2026-07-09 06:45:59.83
2311b282-235c-43be-9aef-059ed2465a6d	a52cc3a8-4f64-4ac6-9e25-f0750575a86c	\N	PHOTO	Photo d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/photo-14.jpg	PROVIDED	\N	2026-07-09 06:40:36.452	2026-07-09 06:46:00.667
64dfcecb-cb81-46b3-b128-1ab71af5a3a6	a52cc3a8-4f64-4ac6-9e25-f0750575a86c	\N	RELEVE_NOTES	Relevé de notes	STUDENT_UPLOAD	https://example.com/demo/unipath/releve-14.pdf	PROVIDED	\N	2026-07-09 06:40:37.294	2026-07-09 06:46:01.495
f75ece78-6c60-499e-b6d1-3932b09833cb	0d0f6f4e-a977-41b3-b836-b50997f918d4	\N	ACTE_NAISSANCE	Acte de naissance	STUDENT_UPLOAD	https://example.com/demo/unipath/acte-15.pdf	PROVIDED	\N	2026-07-09 06:40:47.798	2026-07-09 06:46:14.041
a0bd702a-8d0b-4151-ba99-5dee222e18c0	0d0f6f4e-a977-41b3-b836-b50997f918d4	\N	CARTE_IDENTITE	Carte d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/cni-15.pdf	PROVIDED	\N	2026-07-09 06:40:48.639	2026-07-09 06:46:14.884
b4947a73-8258-4bcd-ab2c-de41cdb650ee	0d0f6f4e-a977-41b3-b836-b50997f918d4	\N	PHOTO	Photo d'identité	STUDENT_UPLOAD	https://example.com/demo/unipath/photo-15.jpg	PROVIDED	\N	2026-07-09 06:40:49.611	2026-07-09 06:46:15.817
3273a88c-3a02-4d74-b8db-03d020499ab2	0d0f6f4e-a977-41b3-b836-b50997f918d4	\N	RELEVE_NOTES	Relevé de notes	STUDENT_UPLOAD	https://example.com/demo/unipath/releve-15.pdf	PROVIDED	\N	2026-07-09 06:40:50.439	2026-07-09 06:46:16.668
\.


--
-- Data for Name: CampagneFiliere; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CampagneFiliere" (id, "campagneId", "filiereId", "fraisDossier", "placesDisponibles", "criteresSelection", "seriesAcceptees", "niveauMinBac", "autresCriteres", "createdAt", "updatedAt") FROM stdin;
83505d42-b6e5-4f76-aab7-eb4bd76ac5ab	db9a23b8-1863-4667-ab06-a5f73a8f0bf2	482c18be-0ba4-4a1b-8596-8d00a72c4f71	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-26 13:42:56.762	2026-06-26 13:42:56.762
50774e6a-63db-43a4-9276-ad19b0d70e3a	db9a23b8-1863-4667-ab06-a5f73a8f0bf2	0dd5a6ed-17ec-4b07-83a7-88adb3f986cf	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-26 13:42:56.762	2026-06-26 13:42:56.762
e05627c6-b02c-44e8-b980-39e106217567	db9a23b8-1863-4667-ab06-a5f73a8f0bf2	5c4ded34-f714-4b67-9e24-df14c5e88c4c	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-26 13:42:56.762	2026-06-26 13:42:56.762
15cc56dd-f12b-4025-9e95-5c5eef274abf	db9a23b8-1863-4667-ab06-a5f73a8f0bf2	e370215c-c687-451a-a8de-d191d64f595c	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-26 13:42:56.762	2026-06-26 13:42:56.762
fd0263f8-6372-41b3-a37e-5176af9ae905	9d1fc067-2c17-4fb2-9569-3ff4e09900c9	642c2376-70dc-4dab-82d6-ca6561bc2bdb	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-26 13:43:03.664	2026-06-26 13:43:03.664
0f476648-bf63-406b-b2f3-a7328d2339d3	9d1fc067-2c17-4fb2-9569-3ff4e09900c9	c3b62ada-a4f1-4305-aa20-4f4fd995246e	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-26 13:43:03.664	2026-06-26 13:43:03.664
095d6f8d-77e1-47fa-b1cc-9cc55a447bde	9d1fc067-2c17-4fb2-9569-3ff4e09900c9	cedcfea4-e529-4947-a0ae-cb11599d0f94	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-26 13:43:03.664	2026-06-26 13:43:03.664
84012420-6101-449d-ba4a-e7569588478a	9d1fc067-2c17-4fb2-9569-3ff4e09900c9	ea4c8f3c-ac44-4729-af1a-9ce7fc4a1e62	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-26 13:43:03.664	2026-06-26 13:43:03.664
181e73a3-d2d0-4b67-85da-6de8494edbf1	be7d6c4c-cd5c-4e56-8828-9c28a13fca9f	7d0cbf1e-82ae-4749-8a79-b6d5cbff992f	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-26 13:43:09.455	2026-06-26 13:43:09.455
bf8ece73-8bb8-4df1-8d7d-6e12b9326cd1	be7d6c4c-cd5c-4e56-8828-9c28a13fca9f	c4dbc6aa-490c-4190-9357-79d176f09288	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-26 13:43:09.455	2026-06-26 13:43:09.455
1fd13f7b-a934-447d-9b5e-9ea8629580ef	be7d6c4c-cd5c-4e56-8828-9c28a13fca9f	5187d466-fcab-40bf-a3da-6522cac45f35	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-26 13:43:09.455	2026-06-26 13:43:09.455
5364cc1d-5a77-4190-87ea-94d0befbb60e	9a175182-bc38-4ac7-a477-6f7393653737	c77d20ac-c5c3-4fa0-bda7-cf2eb7dbda73	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-26 13:43:15.317	2026-06-26 13:43:15.317
df6e13fb-56c1-4081-9a41-7e0f172e4f01	9a175182-bc38-4ac7-a477-6f7393653737	621debe8-b2ba-4a79-ba62-0a8b04e06c44	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-26 13:43:15.317	2026-06-26 13:43:15.317
cf71b67b-757c-40ad-a40a-d1e12f48ff7c	9a175182-bc38-4ac7-a477-6f7393653737	afd2c079-d716-4c8b-9548-ab1c1220abd5	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-26 13:43:15.317	2026-06-26 13:43:15.317
255b0161-a526-44c1-8781-d148be004e83	f3f12df9-eb9a-4f3a-bdc3-aad0b89a4aea	f00c340e-81b3-4a68-a0f7-9735d5b50442	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-26 13:43:27.41	2026-06-26 13:43:27.41
aa1dd89f-c7e5-4d25-bef6-de35d440f901	f3f12df9-eb9a-4f3a-bdc3-aad0b89a4aea	863b90af-9e7a-4d3c-a525-2500e201bf98	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-26 13:43:27.41	2026-06-26 13:43:27.41
4d70fdb2-eb76-43d7-b37d-60431bbab4fc	f3f12df9-eb9a-4f3a-bdc3-aad0b89a4aea	c2e849ac-71fe-4566-9092-21236b2449ff	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-26 13:43:27.41	2026-06-26 13:43:27.41
d54dfab4-a9ed-401c-b4ee-624236e60529	7d925cba-b71f-48d9-bbfc-3ada321fb3cf	0e43cc9e-b2b3-440d-829c-b8d76097bc8e	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-26 13:43:33.364	2026-06-26 13:43:33.364
217913f6-90ea-4722-adc5-120a41c4b063	7d925cba-b71f-48d9-bbfc-3ada321fb3cf	4cf2f339-6ca4-4d95-a78f-606f64da88e4	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-26 13:43:33.364	2026-06-26 13:43:33.364
01d44ba8-39ca-4522-9b07-0a3a0c8aafe7	7d925cba-b71f-48d9-bbfc-3ada321fb3cf	2504cf80-c1be-4157-9992-d3d2de3dd82e	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-26 13:43:33.364	2026-06-26 13:43:33.364
f942b8db-e314-4790-8882-133c5ca4b26a	31a532b8-6821-4c2a-a54b-6fbbbe361dc8	fa47a00c-5236-430e-b2e4-c08746fa140a	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:24.866	2026-06-28 07:09:24.866
dd85c6fe-9879-41c0-a9f9-5f4c00ef0195	31a532b8-6821-4c2a-a54b-6fbbbe361dc8	78d1f8b1-fbc1-4d7a-8859-9308139fb1e8	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:24.866	2026-06-28 07:09:24.866
d2879122-dd1a-4717-9233-2914879a0441	31a532b8-6821-4c2a-a54b-6fbbbe361dc8	4e7fa1b6-bc51-47f0-ad8e-dd1d06287254	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:24.866	2026-06-28 07:09:24.866
cdbb41d9-b699-4ac9-82ba-5f1f54c80c54	31a532b8-6821-4c2a-a54b-6fbbbe361dc8	e55ea198-4a33-4c97-9e95-e433c413796c	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:24.866	2026-06-28 07:09:24.866
8cec68c8-2855-45e9-a713-65f28d0a5b6d	31a532b8-6821-4c2a-a54b-6fbbbe361dc8	e9705b16-e66c-4ffa-8d13-1c0acd6203ac	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:24.866	2026-06-28 07:09:24.866
58013d1a-d654-42d7-8c08-20b2f3ba9fcd	31a532b8-6821-4c2a-a54b-6fbbbe361dc8	03f255a3-072d-4d01-a9d9-fbdeb9a8fbfe	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:24.866	2026-06-28 07:09:24.866
0f3aeac9-a026-478f-ad19-ce9cffa05d8f	31a532b8-6821-4c2a-a54b-6fbbbe361dc8	bb7ff878-b48f-40c9-a1a7-dcb7bc920b95	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:24.866	2026-06-28 07:09:24.866
d6f0f84d-0212-4fbc-800e-104039bc7749	31a532b8-6821-4c2a-a54b-6fbbbe361dc8	a703665a-48cf-4a0d-9278-2e96bd54268f	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:24.866	2026-06-28 07:09:24.866
542597d7-ac0a-46cc-9d7c-2926d1b7a6fd	73ad1ab8-208e-40a2-9df2-60cb053f0473	7fde5ad7-ded1-4bc0-b18f-d224024c1289	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:38.623	2026-06-28 07:09:38.623
6ff387a0-b8b2-453e-8739-83ddeea3670c	73ad1ab8-208e-40a2-9df2-60cb053f0473	5d98466e-45e1-4b34-8648-8a7f23beacbe	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:38.623	2026-06-28 07:09:38.623
141de4ba-2de8-41b3-bab8-2457265a1bc1	73ad1ab8-208e-40a2-9df2-60cb053f0473	4ce23399-864e-4300-add4-2ea33e37a7af	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:38.623	2026-06-28 07:09:38.623
947f4646-2679-4764-a756-54e26c8cb0f7	73ad1ab8-208e-40a2-9df2-60cb053f0473	1548a2d7-dace-4bf9-b82e-cfe1b249cedd	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:38.623	2026-06-28 07:09:38.623
6e15b98e-1606-4bf8-a649-386f6e71eb53	73ad1ab8-208e-40a2-9df2-60cb053f0473	6e03ece5-e241-40cf-8d5c-85dcf3bf68d4	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:38.623	2026-06-28 07:09:38.623
ac949f5b-57f4-4bd5-a425-6482d6e92477	73ad1ab8-208e-40a2-9df2-60cb053f0473	eacc6e7e-9811-4ebe-9a32-3c32c1d09767	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:38.623	2026-06-28 07:09:38.623
91f1735f-28ea-4fc7-8a87-3fee1882e9f9	73ad1ab8-208e-40a2-9df2-60cb053f0473	0e40782a-969a-426e-980e-9138261932ce	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:38.623	2026-06-28 07:09:38.623
cfe7805c-9c3e-479f-bf51-2cec979e2871	73ad1ab8-208e-40a2-9df2-60cb053f0473	6942ef38-62aa-4c19-8017-5ae34b069ac2	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:38.623	2026-06-28 07:09:38.623
cfdc10a4-842f-4882-a3dc-3b8f8b5b1f51	7359502b-d432-482e-8c0a-28c005a794a6	9e2ec4f4-56fa-4f44-ad6a-0711e2fe41ff	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:51.83	2026-06-28 07:09:51.83
49e791fc-a9b1-48e7-b619-fa388c5fac84	7359502b-d432-482e-8c0a-28c005a794a6	6627e4d1-65b9-4e5b-a9ed-53a4f4ec2b23	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:51.83	2026-06-28 07:09:51.83
7fba0f54-73e4-4678-9ddd-009e4ba1f297	7359502b-d432-482e-8c0a-28c005a794a6	47ca028b-6240-4f67-98e0-c66028ad31d2	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:51.83	2026-06-28 07:09:51.83
9df685d5-7b82-476c-a70b-375f2ea2d3e5	7359502b-d432-482e-8c0a-28c005a794a6	3b2d34f0-9eab-4034-a1a1-42d8bd125557	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:51.83	2026-06-28 07:09:51.83
b1c650cd-b113-44f3-8366-2ac75413baf0	7359502b-d432-482e-8c0a-28c005a794a6	fd5d1d8a-8595-4fc2-8b50-05f2898add90	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:51.83	2026-06-28 07:09:51.83
b29f6660-f49d-4f4d-ba5f-f128b71fa033	7359502b-d432-482e-8c0a-28c005a794a6	cc8e4500-7d04-4240-86fc-df727601a078	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:51.83	2026-06-28 07:09:51.83
47718b76-1b11-471d-b2e1-6a560a7a742f	7359502b-d432-482e-8c0a-28c005a794a6	893ed4b9-1ca5-474b-846c-7699e6add76d	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:51.83	2026-06-28 07:09:51.83
32b40154-65ef-4f72-bc09-bfce6afc111e	7359502b-d432-482e-8c0a-28c005a794a6	fec04454-58e2-4dd6-a06f-6c52c55641db	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:09:51.83	2026-06-28 07:09:51.83
5602c749-63d7-4219-8646-413e9aaac0db	0c5e1a84-982e-4b42-bfe4-bed0b38f3648	95e903eb-b782-4dde-9aa9-ca40d6484664	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:00.812	2026-06-28 07:10:00.812
8415fbf2-b228-4a09-8248-658451bbd93f	0c5e1a84-982e-4b42-bfe4-bed0b38f3648	59967784-071e-480f-9370-db3332065ca3	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:00.812	2026-06-28 07:10:00.812
b0e4b901-b974-4cd2-81bd-fdf28de399ad	0c5e1a84-982e-4b42-bfe4-bed0b38f3648	1c28ca4f-8c7e-47e3-a8e6-008b6e3d0e0e	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:00.812	2026-06-28 07:10:00.812
abc53747-2ed5-43d4-9704-38571d15f323	0c5e1a84-982e-4b42-bfe4-bed0b38f3648	7b79bc3e-eab8-41e9-a075-2c43622711fe	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:00.812	2026-06-28 07:10:00.812
dc52e286-86e7-49ac-b014-dc10c0033ddd	0fb26c1a-b68a-4ee4-a8bc-20921287d0ac	7d0cbf1e-82ae-4749-8a79-b6d5cbff992f	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:11.102	2026-06-28 07:10:11.102
6335099c-0d97-4ff2-b89f-723f048bdad2	0fb26c1a-b68a-4ee4-a8bc-20921287d0ac	9ca6e685-5abd-4dc8-af6b-c951ed2cab93	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:11.102	2026-06-28 07:10:11.102
838d05dc-6fa6-420d-b9d8-4408fbad5e9a	0fb26c1a-b68a-4ee4-a8bc-20921287d0ac	3b5205e4-0dab-42cc-bd8a-1e863162856f	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:11.102	2026-06-28 07:10:11.102
fb08fefd-16d5-4588-bc10-088731de5293	0fb26c1a-b68a-4ee4-a8bc-20921287d0ac	7098c66a-ba39-480a-bd8e-f8cafb4d2813	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:11.102	2026-06-28 07:10:11.102
c73e4e1b-6bd9-4052-aed0-81d2eaf98496	0fb26c1a-b68a-4ee4-a8bc-20921287d0ac	83ae995b-1b8b-4a8c-a693-2be7c060b577	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:11.102	2026-06-28 07:10:11.102
b647a2da-b1c3-498d-8b16-30c053a864f9	f34be76b-3cb3-4ddf-a71c-8f675a7e6d6f	399c5183-887d-4587-963d-ada6cede79ce	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:26.201	2026-06-28 07:10:26.201
4e5bbafa-c2f8-4bc6-b7ec-9e0b0eae4faf	f34be76b-3cb3-4ddf-a71c-8f675a7e6d6f	7e01c588-abc1-4948-90fe-c36f84cefa0e	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:26.201	2026-06-28 07:10:26.201
2bf87903-65cc-4be5-ae80-14698ec018bc	f34be76b-3cb3-4ddf-a71c-8f675a7e6d6f	d0193336-eddb-44b1-9847-35a7c6aa68de	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:26.201	2026-06-28 07:10:26.201
43ebd642-53ea-4239-8628-25e9439761bf	f34be76b-3cb3-4ddf-a71c-8f675a7e6d6f	2ab7f4c4-53c8-407c-9f5f-e6f8c958d138	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:26.201	2026-06-28 07:10:26.201
df6860a7-605c-4160-9b13-10c1ec0c11b9	f34be76b-3cb3-4ddf-a71c-8f675a7e6d6f	d23516b9-66c2-4230-b8ea-5a57ef2082e7	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:26.201	2026-06-28 07:10:26.201
fe1db8bc-3b3c-4891-9ad0-17ac33e05a63	f34be76b-3cb3-4ddf-a71c-8f675a7e6d6f	f8bb94cf-b93c-4517-942d-963103395814	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:26.201	2026-06-28 07:10:26.201
2159193a-711b-4305-b787-d355aa578686	f34be76b-3cb3-4ddf-a71c-8f675a7e6d6f	5e0a8515-df98-42c2-922c-ea6559ac74e3	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:26.201	2026-06-28 07:10:26.201
22539c1c-a9f2-4cd9-a927-f5c619543725	f34be76b-3cb3-4ddf-a71c-8f675a7e6d6f	6ed7ec73-71a9-43e5-a0c0-f974a1b5e1eb	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:26.201	2026-06-28 07:10:26.201
b44aaf73-de4d-4df5-9718-cbebb0626e55	f34be76b-3cb3-4ddf-a71c-8f675a7e6d6f	12342ae2-b254-4f99-84c5-f21bbf5b8d1d	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:26.201	2026-06-28 07:10:26.201
bb9c44e8-5414-47ac-9c84-8333dc4f5513	d5a5bba4-c2fc-4ba1-b55f-a25c48efc3f7	9811ada3-f644-4ea8-bc49-5931037541fa	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:35.471	2026-06-28 07:10:35.471
d36eccf7-028b-4919-96bf-31f49f633e02	d5a5bba4-c2fc-4ba1-b55f-a25c48efc3f7	83634027-b216-4746-a2e4-2c44f54bb9c5	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:35.471	2026-06-28 07:10:35.471
275c102b-7a72-444b-a47c-45f9c683bae1	d5a5bba4-c2fc-4ba1-b55f-a25c48efc3f7	fb5132f3-b256-4427-9ee2-56846743d5d6	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:35.471	2026-06-28 07:10:35.471
36075f28-c253-4a72-a009-d1c23270346d	d5a5bba4-c2fc-4ba1-b55f-a25c48efc3f7	f67a4712-d347-4c6a-97de-9d44c379c9ca	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:35.471	2026-06-28 07:10:35.471
9b92e79c-a98c-4191-966f-786e0e5e004e	0752aef3-fe46-42ae-8f5b-d5b9594b2808	859c2c8c-3470-4d6a-a7d0-2ab149d2840b	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:46.052	2026-06-28 07:10:46.052
d3157813-b519-4f47-96fb-6b039d2e9eeb	0752aef3-fe46-42ae-8f5b-d5b9594b2808	6a60e8e9-163b-4223-a14e-77d963a4e35e	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:46.052	2026-06-28 07:10:46.052
19ef8763-bd82-4e1b-a1bc-f36b5eaa55dc	0752aef3-fe46-42ae-8f5b-d5b9594b2808	0792acee-9846-4cf6-a55a-622382443f06	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:46.052	2026-06-28 07:10:46.052
664bb610-a514-43a2-98b4-61a081722cc4	0752aef3-fe46-42ae-8f5b-d5b9594b2808	25207810-d7a1-451f-97e4-1d306c4b5709	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:46.052	2026-06-28 07:10:46.052
45399eb1-bb5f-4a65-ac34-cd3583015451	0752aef3-fe46-42ae-8f5b-d5b9594b2808	e2f7e954-5947-4805-a0c5-1c02c110f1a4	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:46.052	2026-06-28 07:10:46.052
06d69e8b-fc95-4a0c-8098-eb6a5dfed1d7	0752aef3-fe46-42ae-8f5b-d5b9594b2808	546587d4-5acb-4b4f-adeb-a4e377ef635b	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:46.052	2026-06-28 07:10:46.052
96c0a2b3-3467-4172-bf76-70951d5d64ba	f13c3a57-f1d4-4f3c-bf51-265617a1ca64	5dd45f0a-18fb-4b05-8657-ec6609165070	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:56.145	2026-06-28 07:10:56.145
486d3f36-4bfe-4649-b06d-8a9c89f3cc0b	f13c3a57-f1d4-4f3c-bf51-265617a1ca64	9c7855c7-6b9b-4dfb-b3b9-87a6042db262	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:56.145	2026-06-28 07:10:56.145
26556fac-2e94-464d-9f62-abd5991b08f9	f13c3a57-f1d4-4f3c-bf51-265617a1ca64	578acb9c-5388-4929-a0f1-928d0e1049d5	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:56.145	2026-06-28 07:10:56.145
b8c38528-928d-4132-ac8e-fda917a6bfcd	f13c3a57-f1d4-4f3c-bf51-265617a1ca64	4be54a90-4572-4e47-9ddb-e538d7295597	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:56.145	2026-06-28 07:10:56.145
0abb08b0-ad5a-418c-bb50-d6b5ba2060ee	f13c3a57-f1d4-4f3c-bf51-265617a1ca64	bdd9d03d-e395-43b4-88f6-1eeb60f4140c	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:10:56.145	2026-06-28 07:10:56.145
929752d4-dadb-4196-bf7c-cec2dafdc6aa	f230cc08-135e-46f0-a56b-e3adf7c73206	2382c64d-2502-4dd0-bbc7-6283c93b3026	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:11:06.594	2026-06-28 07:11:06.594
be0bb093-2101-41fd-b86d-f5b22dd20518	f230cc08-135e-46f0-a56b-e3adf7c73206	fb06e7f8-0a7f-4a59-a321-2d5299fa6ec3	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:11:06.594	2026-06-28 07:11:06.594
9df14e62-aabf-47cf-b336-882ed6912f27	f230cc08-135e-46f0-a56b-e3adf7c73206	e1b73298-26cf-4cd9-aaf8-0847b276018f	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:11:06.594	2026-06-28 07:11:06.594
b8099b7e-cb5a-4b59-818b-8b1c4f719d7e	f230cc08-135e-46f0-a56b-e3adf7c73206	ad995e1e-ed27-48fe-929d-d96b22753948	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:11:06.594	2026-06-28 07:11:06.594
508c1cc5-bcf0-45e5-bb38-7c3dbcbb48d0	f230cc08-135e-46f0-a56b-e3adf7c73206	5402d899-cdb1-4244-808e-894e840303db	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:11:06.594	2026-06-28 07:11:06.594
4da3f288-c945-4388-a1ff-9594fe72611a	1a47b732-a958-42d7-88dc-77a9ea505387	11b8146f-55b6-49b2-ac20-a082e73b25bf	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:11:14.02	2026-06-28 07:11:14.02
ced5c601-e740-4fee-9bff-81aae5007d53	1a47b732-a958-42d7-88dc-77a9ea505387	af96e8e9-957d-4420-b55d-bc603c4815e7	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:11:14.02	2026-06-28 07:11:14.02
dddeacbf-21e6-4899-916b-323b53a63d2f	1a47b732-a958-42d7-88dc-77a9ea505387	982ad32b-c2a7-4409-9f09-4a4143736f65	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:11:14.02	2026-06-28 07:11:14.02
b94e4d80-f344-4ca5-af8f-16c563667c04	9e5f365f-6d85-4dd1-a1e3-eb0287cd2dec	cb966a36-2648-4449-aa57-055be9c1aa8a	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:11:22.874	2026-06-28 07:11:22.874
425d515f-0fe9-44e5-9304-a070f98c3218	9e5f365f-6d85-4dd1-a1e3-eb0287cd2dec	5128cf6a-58f1-4dda-b990-e7356b57c513	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:11:22.874	2026-06-28 07:11:22.874
bb3275a5-7863-444d-930b-9ab78dd57db4	9e5f365f-6d85-4dd1-a1e3-eb0287cd2dec	9e9a494d-0790-4328-b1be-27e5421dea07	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:11:22.874	2026-06-28 07:11:22.874
4e15c89b-0df8-4c29-87d1-c6b2e19aeb83	9e5f365f-6d85-4dd1-a1e3-eb0287cd2dec	dfe95517-fa67-41c7-9aeb-b6b89c2ecb89	5000	50	\N	{A,B,C,D,G1,G2,G3}	\N	\N	2026-06-28 07:11:22.874	2026-06-28 07:11:22.874
\.


--
-- Data for Name: CampagneInscription; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CampagneInscription" (id, "etablissementId", titre, "anneeAcademique", "dateOuverture", "dateCloture", description, statut, "createdBy", "createdAt", "updatedAt") FROM stdin;
db9a23b8-1863-4667-ab06-a5f73a8f0bf2	520e3096-707c-4646-97d5-7514df97676f	Campagne d'inscription École Supérieure de Gestion et de Technologie du Bénin 2026-2027	2026-2027	2026-07-01 00:00:00	2026-09-30 23:59:59	Inscriptions ouvertes pour l'année académique 2026-2027	PUBLIEE	seed	2026-06-26 13:42:56.762	2026-06-26 13:42:56.762
9d1fc067-2c17-4fb2-9569-3ff4e09900c9	b1e3926a-2029-4ccb-9667-9e53b8f1534d	Campagne d'inscription École Supérieure de Gestion, d'Informatique et des Sciences 2026-2027	2026-2027	2026-07-01 00:00:00	2026-09-30 23:59:59	Inscriptions ouvertes pour l'année académique 2026-2027	PUBLIEE	seed	2026-06-26 13:43:03.664	2026-06-26 13:43:03.664
be7d6c4c-cd5c-4e56-8828-9c28a13fca9f	2521c204-eb38-4056-ade2-45e61ef858b7	Campagne d'inscription Hautes Études Commerciales et de Management 2026-2027	2026-2027	2026-07-01 00:00:00	2026-09-30 23:59:59	Inscriptions ouvertes pour l'année académique 2026-2027	PUBLIEE	seed	2026-06-26 13:43:09.455	2026-06-26 13:43:09.455
9a175182-bc38-4ac7-a477-6f7393653737	c0b4f455-c9af-440f-b891-1fde018b7998	Campagne d'inscription Institut Supérieur de Management du Bénin 2026-2027	2026-2027	2026-07-01 00:00:00	2026-09-30 23:59:59	Inscriptions ouvertes pour l'année académique 2026-2027	PUBLIEE	seed	2026-06-26 13:43:15.317	2026-06-26 13:43:15.317
f3f12df9-eb9a-4f3a-bdc3-aad0b89a4aea	1e3dd9e9-2ac9-48c5-8c87-13f63eb02038	Campagne d'inscription École Supérieure de Commerce et d'Administration des Entreprises 2026-2027	2026-2027	2026-07-01 00:00:00	2026-09-30 23:59:59	Inscriptions ouvertes pour l'année académique 2026-2027	PUBLIEE	seed	2026-06-26 13:43:27.41	2026-06-26 13:43:27.41
7d925cba-b71f-48d9-bbfc-3ada321fb3cf	ca83cd26-daaa-4ad0-a359-c2e5b638823f	Campagne d'inscription École Supérieure de Management et d'Administration 2026-2027	2026-2027	2026-07-01 00:00:00	2026-09-30 23:59:59	Inscriptions ouvertes pour l'année académique 2026-2027	PUBLIEE	seed	2026-06-26 13:43:33.364	2026-06-26 13:43:33.364
31a532b8-6821-4c2a-a54b-6fbbbe361dc8	e81c0f9c-1a75-41c9-9f53-77776c11ccd9	Campagne d'inscription École Supérieure d'Administration et d'Économie 2026-2027	2026-2027	2026-07-01 00:00:00	2026-09-30 23:59:59	Inscriptions ouvertes pour l'année académique 2026-2027	PUBLIEE	seed	2026-06-28 07:09:24.866	2026-06-28 07:09:24.866
73ad1ab8-208e-40a2-9df2-60cb053f0473	c70df463-0f8f-4cf9-9da1-ef5526d5e6e6	Campagne d'inscription IRGIB Africa University 2026-2027	2026-2027	2026-07-01 00:00:00	2026-09-30 23:59:59	Inscriptions ouvertes pour l'année académique 2026-2027	PUBLIEE	seed	2026-06-28 07:09:38.623	2026-06-28 07:09:38.623
7359502b-d432-482e-8c0a-28c005a794a6	8b091357-0bd9-4cf2-95ac-297743896231	Campagne d'inscription Institut Supérieur de Communication et de Gestion 2026-2027	2026-2027	2026-07-01 00:00:00	2026-09-30 23:59:59	Inscriptions ouvertes pour l'année académique 2026-2027	PUBLIEE	seed	2026-06-28 07:09:51.83	2026-06-28 07:09:51.83
0c5e1a84-982e-4b42-bfe4-bed0b38f3648	1e8f8742-21b9-4801-8fa7-f7588875a074	Campagne d'inscription Institut Supérieur des Métiers de l'Audiovisuel 2026-2027	2026-2027	2026-07-01 00:00:00	2026-09-30 23:59:59	Inscriptions ouvertes pour l'année académique 2026-2027	PUBLIEE	seed	2026-06-28 07:10:00.812	2026-06-28 07:10:00.812
0fb26c1a-b68a-4ee4-a8bc-20921287d0ac	27862738-53ec-496d-835f-a5c24245c653	Campagne d'inscription Haute École de Commerce et de Management 2026-2027	2026-2027	2026-07-01 00:00:00	2026-09-30 23:59:59	Inscriptions ouvertes pour l'année académique 2026-2027	PUBLIEE	seed	2026-06-28 07:10:11.102	2026-06-28 07:10:11.102
f34be76b-3cb3-4ddf-a71c-8f675a7e6d6f	504d0e86-c98f-4fc2-a4e8-235788a21a30	Campagne d'inscription Pigier Bénin 2026-2027	2026-2027	2026-07-01 00:00:00	2026-09-30 23:59:59	Inscriptions ouvertes pour l'année académique 2026-2027	PUBLIEE	seed	2026-06-28 07:10:26.201	2026-06-28 07:10:26.201
d5a5bba4-c2fc-4ba1-b55f-a25c48efc3f7	6d578bb6-6a1d-45e7-89ed-b18db9cec6a8	Campagne d'inscription Institut Supérieur de Management Adonaï 2026-2027	2026-2027	2026-07-01 00:00:00	2026-09-30 23:59:59	Inscriptions ouvertes pour l'année académique 2026-2027	PUBLIEE	seed	2026-06-28 07:10:35.471	2026-06-28 07:10:35.471
0752aef3-fe46-42ae-8f5b-d5b9594b2808	7338f85e-731a-4e03-84ee-891f4c7d8e12	Campagne d'inscription Université Africaine de Technologie et de Management 2026-2027	2026-2027	2026-07-01 00:00:00	2026-09-30 23:59:59	Inscriptions ouvertes pour l'année académique 2026-2027	PUBLIEE	seed	2026-06-28 07:10:46.052	2026-06-28 07:10:46.052
f13c3a57-f1d4-4f3c-bf51-265617a1ca64	eb18c3d8-8756-4e5e-bb01-c19a8409428d	Campagne d'inscription École Supérieure de Management du Bénin 2026-2027	2026-2027	2026-07-01 00:00:00	2026-09-30 23:59:59	Inscriptions ouvertes pour l'année académique 2026-2027	PUBLIEE	seed	2026-06-28 07:10:56.145	2026-06-28 07:10:56.145
f230cc08-135e-46f0-a56b-e3adf7c73206	f34ed1d5-c65c-4de4-8cec-8bed55c36a40	Campagne d'inscription Université Catholique d'Afrique de l'Ouest 2026-2027	2026-2027	2026-07-01 00:00:00	2026-09-30 23:59:59	Inscriptions ouvertes pour l'année académique 2026-2027	PUBLIEE	seed	2026-06-28 07:11:06.594	2026-06-28 07:11:06.594
1a47b732-a958-42d7-88dc-77a9ea505387	688bc6b3-e29e-4d07-854b-06da1337a7b5	Campagne d'inscription Institut Universitaire Panafricain 2026-2027	2026-2027	2026-07-01 00:00:00	2026-09-30 23:59:59	Inscriptions ouvertes pour l'année académique 2026-2027	PUBLIEE	seed	2026-06-28 07:11:14.02	2026-06-28 07:11:14.02
9e5f365f-6d85-4dd1-a1e3-eb0287cd2dec	c2073e47-1e76-4c8d-b042-16fbcf356638	Campagne d'inscription École Supérieure de l'Enseignement Professionnel Le Berger 2026-2027	2026-2027	2026-07-01 00:00:00	2026-09-30 23:59:59	Inscriptions ouvertes pour l'année académique 2026-2027	PUBLIEE	seed	2026-06-28 07:11:22.874	2026-06-28 07:11:22.874
\.


--
-- Data for Name: Candidat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Candidat" (id, matricule, nom, prenom, anip, serie, sexe, nationalite, email, "emailConfirme", telephone, "dateNaiss", "lieuNaiss", role, "createdAt", "updatedAt", "emailConfirmToken", "emailConfirmExpires") FROM stdin;
dd569177-974b-44a6-a51b-e899cc479be1	DEMO-2026-001	AGOSSOU	Koffi	\N	G1	M	Béninoise	harrydedji+candidat1@gmail.com	t	+2296100001	2004-03-12 00:00:00	Cotonou	ETUDIANT	2026-07-09 06:37:20.234	2026-07-09 06:42:49.429	\N	\N
35cc2506-886a-48eb-806f-7ab46bea420d	TEMP	MENSAH	Kofi	\N	\N	\N	\N	kofi.mensah@test.bj	f	+22961000001	2008-03-15 00:00:00	Cotonou	CANDIDAT	2026-06-16 09:05:23.247	2026-06-16 09:05:23.247	\N	\N
cea47adf-c2b4-42dc-85e1-f77a82853cb0	DEMO-2026-002	HOUNGBO	Mireille	\N	G2	F	Béninoise	harrydedji+candidat2@gmail.com	t	+2296100002	2005-06-22 00:00:00	Porto-Novo	ETUDIANT	2026-07-09 06:37:36.746	2026-07-09 06:43:03.334	\N	\N
ce2842ec-13d7-4b9b-8491-26aa92080b35	DEMO-2026-003	KPADONOU	Romuald	\N	G3	M	Béninoise	harrydedji+candidat3@gmail.com	t	+2296100003	2003-11-08 00:00:00	Parakou	ETUDIANT	2026-07-09 06:37:52.547	2026-07-09 06:43:17.363	\N	\N
e22b8e9b-8d98-4316-bc74-49126b9f38e8	DEMO-2026-004	DANSOU	Élodie	\N	A	F	Béninoise	harrydedji+candidat4@gmail.com	t	+2296100004	2005-01-30 00:00:00	Abomey-Calavi	ETUDIANT	2026-07-09 06:38:12.024	2026-07-09 06:43:30.916	\N	\N
7a4993ea-5eb4-4ff8-9e66-c4c5f5d5acf2	DEMO-2026-005	TOSSOU	Yves	\N	C	M	Béninoise	harrydedji+candidat5@gmail.com	t	+2296100005	2004-09-17 00:00:00	Bohicon	ETUDIANT	2026-07-09 06:38:27.179	2026-07-09 06:43:44.715	\N	\N
acec5f54-1db7-44ab-abcd-514941a94b89	DEMO-2026-006	BIAOU	Aïcha	\N	D	F	Béninoise	harrydedji+candidat6@gmail.com	t	+2296100006	2006-02-14 00:00:00	Cotonou	ETUDIANT	2026-07-09 06:38:40.945	2026-07-09 06:43:58.792	\N	\N
6a4e990b-48f6-4d80-a572-b24a6da10065	DEMO-2026-007	GANDONOU	Serge	\N	G1	M	Béninoise	harrydedji+candidat7@gmail.com	t	+2296100007	2004-07-03 00:00:00	Ouidah	ETUDIANT	2026-07-09 06:38:54.266	2026-07-09 06:44:12.785	\N	\N
95798e76-e65d-4a9d-8e4d-6bc1dbe24169	DEMO-2026-008	ADJOLO	Ayélé	\N	G2	F	Béninoise	harrydedji+candidat8@gmail.com	t	+2296100008	2005-12-01 00:00:00	Natitingou	ETUDIANT	2026-07-09 06:39:08.04	2026-07-09 06:44:26.914	\N	\N
7dafd101-8703-4048-a7ac-b3e5a59a7a20	DEMO-2026-009	ZANNOU	Marcel	\N	B	M	Béninoise	harrydedji+candidat9@gmail.com	t	+2296100009	2003-05-19 00:00:00	Cotonou	ETUDIANT	2026-07-09 06:39:21.753	2026-07-09 06:44:40.756	\N	\N
63433950-de27-4e70-8f2f-5422ee728631	DEMO-2026-010	KOUASSI	Nadia	\N	G3	F	Béninoise	harrydedji+candidat10@gmail.com	t	+2296100010	2004-10-11 00:00:00	Lokossa	ETUDIANT	2026-07-09 06:39:35.283	2026-07-09 06:44:54.825	\N	\N
c61477fa-be86-447c-a001-5b043b58d3b3	DEMO-2026-011	DOSSOU	Kévin	\N	G1	M	Béninoise	harrydedji+candidat11@gmail.com	t	+2296100011	2005-04-27 00:00:00	Porto-Novo	ETUDIANT	2026-07-09 06:39:48.99	2026-07-09 06:45:09.68	\N	\N
acf582c5-34a6-463f-9ded-c9ae33cec93c	DEMO-2026-012	AHOUANDJINOU	Prisca	\N	A	F	Béninoise	harrydedji+candidat12@gmail.com	t	+2296100012	2006-08-09 00:00:00	Cotonou	ETUDIANT	2026-07-09 06:40:04.744	2026-07-09 06:45:24.862	\N	\N
c489ab2e-1f30-4490-8da7-a4f3be59a9a3	DEMO-2026-013	SOSSOU	Patrick	\N	C	M	Béninoise	harrydedji+candidat13@gmail.com	t	+2296100013	2004-12-23 00:00:00	Abomey	ETUDIANT	2026-07-09 06:40:18.768	2026-07-09 06:45:39.639	\N	\N
d4370a44-36c4-4a83-a694-9ce69b76226b	DEMO-2026-014	OGOUNCHILE	Christelle	\N	D	F	Béninoise	harrydedji+candidat14@gmail.com	t	+2296100014	2005-03-06 00:00:00	Parakou	ETUDIANT	2026-07-09 06:40:32.039	2026-07-09 06:45:56.39	\N	\N
55c80461-24f9-44dd-b695-d700fba2c36d	DEMO-2026-015	BOCO	Raphaël	\N	G2	M	Béninoise	harrydedji+candidat15@gmail.com	t	+2296100015	2004-06-18 00:00:00	Cotonou	ETUDIANT	2026-07-09 06:40:45.16	2026-07-09 06:46:10.599	\N	\N
4b12fd5d-c098-4b02-b03d-43a0a4b69150	UnP-2026-000001	GLIBA	Rémi	123456789912	G2	M	Béninois	bkoussedoh@gmail.com	t	+229 0155337788	2006-06-17 00:00:00	Missèbo	ETUDIANT	2026-06-18 16:51:56.781	2026-06-18 17:00:19.448	\N	\N
f4bf7644-7d51-4764-a6ff-a4a3b450b0fc	UnP-2026-000002	TESTONE	Candidat1	200000000001	D	M	Béninoise	candidat.test1@unipath.test	t	+22997000101	2005-05-15 00:00:00	Cotonou	CANDIDAT	2026-06-23 08:21:50.25	2026-06-23 08:21:50.25	\N	\N
219b295c-5172-4950-b50c-d6138d275770	UnP-2026-000003	TESTTWO	Candidat2	200000000002	C	F	Béninoise	candidat.test2@unipath.test	t	+22997000102	2006-08-20 00:00:00	Porto-Novo	CANDIDAT	2026-06-23 08:21:54.756	2026-06-23 08:21:54.756	\N	\N
8b6f294e-f2b8-4611-82f7-63d59df1804a	UnP-2026-000005	TestNom	TestPrenom	808303535200	A	M	Beninoise	test_candidat_1782243949123@example.com	f	+22990000000	2000-01-01 00:00:00	Cotonou	ETUDIANT	2026-06-23 19:45:55.716	2026-06-23 19:45:55.716	\N	\N
34c03c09-c954-48f0-8b3b-ae670ba5220e	UnP-2026-000006	KANLINHANON	Vignon	123456789012	E	M	Béninoise	vignonkanlinhanon5@gmail.com	f	0141822980	2003-03-04 00:00:00	Cotonou	ETUDIANT	2026-06-23 19:48:15.621	2026-06-23 19:48:15.621	\N	\N
9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	UnP-2026-000004	DEVI	Sidney	122334567890	F4	M	Béninoise	unipathepac@gmail.com	t	+229 0144269133	2006-10-09 00:00:00	Kpota	ETUDIANT	2026-06-23 08:34:08.046	2026-06-26 17:50:49.392	\N	\N
1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	UnP-2026-000007	FAVI	Keren	146266863878	D	F	Béninoise	thechill000@gmail.com	t	+229 0144443333	2008-01-18 00:00:00	Yamoussoukro	ETUDIANT	2026-06-28 08:11:56.207	2026-06-28 08:52:36.614	\N	\N
50924558-a5a0-4ccd-ab7c-9bddbb1252dd	SEED-CAND-50924558	TEST	Candidat	12345678901	D	M	Beninoise	candidat@test.com	t	+22997000088	2000-05-15 00:00:00	Cotonou	CANDIDAT	2026-06-16 10:00:18.434	2026-06-28 16:35:15.829	\N	\N
\.


--
-- Data for Name: CentreComposition; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CentreComposition" (id, nom, ville, adresse, telephone, actif, "createdAt", "updatedAt") FROM stdin;
ee72686f-43d0-4c73-990e-568f1fd88e7f	CEG Gbégamey	Cotonou	Cotonou, Bénin	\N	t	2026-06-28 17:36:45.116	2026-06-28 17:36:45.116
0e12066c-efcf-4015-85ef-8e62e0599b67	Collège Notre Dame des Apôtres	Cotonou	Cotonou, Bénin	\N	t	2026-06-28 17:36:48.828	2026-06-28 17:36:48.828
95598112-d282-4575-ac33-3a4b16d6e1dc	IFSIO	Parakou	Parakou, Bénin	\N	t	2026-06-28 17:36:53.226	2026-06-28 17:36:53.226
c566845d-2a41-42eb-9a27-eada9c2cb0a9	CEG Zoca II	Abomey-Calavi	\N	\N	t	2026-07-02 05:41:31.549	2026-07-02 05:41:31.549
d027bf55-812d-48b9-8a1c-d8f609fa15f1	CEG Application	Porto-Novo	\N	\N	t	2026-07-02 07:16:51.607	2026-07-02 07:16:51.607
\.


--
-- Data for Name: Concours; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Concours" (id, libelle, etablissement, "dateDebut", "dateFin", "dateComposition", description, "fraisParticipation", "seriesAcceptees", matieres, "piecesRequises", "dateDebutDepot", "dateFinDepot", "dateDebutComposition", "dateFinComposition", "createdAt", "criteresEligibilite", "centresComposition", "etablissementId", "inscriptionCompteur", "inscriptionCompteurAnnee", sigle) FROM stdin;
73ef6938-9e50-4d8a-9bf6-14bb584c6fd8	Concours ENSPD 2026	Ecole Nationale de la Statistique, de la Planification et de la Demographie (ENSPD) - Universite de Parakou - Parakou	2026-06-30 00:00:00	2026-08-14 00:00:00	2026-08-29 00:00:00	Domaine: Statistique & Planification\nFilieres: Statistique, Planification du developpement, Demographie\nDebouches: Statisticien, Planificateur, Demographe, Analyste de donnees\nDuree de formation: 3 ans\n	5000	{C,D,G2}	{Mathématiques,Français,"Culture générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}], "criteresEligibilite": [{"titre": "Nationalite: Beninoise", "description": null}, {"titre": "Diplome requis: Baccalaureat", "description": null}, {"titre": "Mention minimale: Assez-bien", "description": null}, {"titre": "Age maximal: 21 ans", "description": null}, {"titre": "Type de concours: ecrit", "description": null}, {"titre": "Series acceptees: C, D, G2", "description": null}]}	2026-06-30 00:00:00	2026-08-14 00:00:00	2026-08-29 00:00:00	2026-08-30 00:00:00	2026-06-16 09:39:07.191	{"criteres": [{"titre": "Nationalite: Beninoise", "description": null}, {"titre": "Diplome requis: Baccalaureat", "description": null}, {"titre": "Mention minimale: Assez-bien", "description": null}, {"titre": "Age maximal: 21 ans", "description": null}, {"titre": "Type de concours: ecrit", "description": null}, {"titre": "Series acceptees: C, D, G2", "description": null}]}	\N	\N	0	\N	\N
cca5dff0-b4b6-42fd-8a70-283c99559d6d	Concours ENEAM 2026	Ecole Nationale d'Economie Appliquee et de Management (ENEAM) - Universite d'Abomey-Calavi - Cotonou	2026-06-30 09:00:00	2026-08-14 09:00:00	2026-08-29 09:00:00	[MESRS-CONCOURS-2026] Source: MESRS Benin - Concours universitaires officiels\nDomaine: Economie & Gestion\nFilieres: Economie appliquee, Management, Commerce international, Comptabilite-Finance, Logistique\nDebouches: Economiste, Manager d'entreprise, Analyste financier, Logisticien\nDuree de formation: 3 ans (Licence) / 5 ans (Master)\nDate epreuves indicative: 29 aout\nPlateforme d'inscription: https://concours.enseignementsuperieur.gouv.bj	5000	{A,B,C,D,G1,G2,G3}	{Mathématiques,Français,Anglais,"Culture générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}]}	2026-06-30 09:00:00	2026-08-14 09:00:00	2026-08-29 09:00:00	2026-08-30 09:00:00	2026-06-16 09:39:07.191	{"criteres": [{"titre": "Nationalite: Beninoise"}, {"titre": "Diplome requis: Baccalaureat"}, {"titre": "Mention minimale: Assez-bien"}, {"titre": "Age maximal: 21 ans"}, {"titre": "Type de concours: ecrit"}, {"titre": "Series acceptees: A, B, C, D, G1, G2, G3"}]}	\N	19563b8b-7dab-4e37-b476-9fb51a877e54	0	\N	\N
2b9bcbfb-5daf-48cc-9c80-8e21884d64f0	Concours IFSIO 2026	Institut de Formation en Soins Infirmiers et Obstetricaux (IFSIO) - Universite de Parakou - Parakou	2026-06-28 09:00:00	2026-08-12 09:00:00	2026-08-27 09:00:00	[MESRS-CONCOURS-2026] Source: MESRS Benin - Concours universitaires officiels\nDomaine: Sante\nFilieres: Soins infirmiers, Obstetrique / Sage-femme\nDebouches: Infirmier diplome d'Etat, Sage-femme, Infirmier anesthesiste\nDuree de formation: 3 ans\nDate epreuves indicative: 27 aout\nPlateforme d'inscription: https://concours.enseignementsuperieur.gouv.bj	5000	{C,D}	{Mathématiques,SVT,Physique-Chimie,"Culture générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}]}	2026-06-28 09:00:00	2026-08-12 09:00:00	2026-08-27 09:00:00	2026-08-28 09:00:00	2026-06-16 09:39:07.191	{"criteres": [{"titre": "Nationalite: Beninoise"}, {"titre": "Diplome requis: Baccalaureat"}, {"titre": "Mention minimale: Assez-bien"}, {"titre": "Age maximal: 21 ans"}, {"titre": "Type de concours: ecrit + epreuve physique"}, {"titre": "Series acceptees: C, D"}]}	\N	b4c1c7a7-5608-4abd-9955-c0a411cf945c	0	\N	\N
9ad910af-731f-423b-b590-53ff13a172ee	Concours ENSTIC 2026	Ecole Nationale des Sciences et Techniques de l'Information et de la Communication (ENSTIC) - Universite d'Abomey-Calavi - Abomey-Calavi	2026-06-30 09:00:00	2026-08-14 09:00:00	2026-08-29 09:00:00	[MESRS-CONCOURS-2026] Source: MESRS Benin - Concours universitaires officiels\nDomaine: Informatique & Telecoms\nFilieres: Informatique de gestion, Reseaux et telecommunications, Systemes embarques, Cybersecurite\nDebouches: Ingenieur reseau, Developpeur, Technicien telecoms, Administrateur systemes\nDuree de formation: 3 ans (Licence)\nDate epreuves indicative: 29 aout\nPlateforme d'inscription: https://concours.enseignementsuperieur.gouv.bj	5000	{C,D,F3}	{Mathématiques,Physique-Chimie,Anglais,"Culture générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}]}	2026-06-30 09:00:00	2026-08-14 09:00:00	2026-08-29 09:00:00	2026-08-30 09:00:00	2026-06-16 09:39:07.191	{"criteres": [{"titre": "Nationalite: Beninoise"}, {"titre": "Diplome requis: Baccalaureat"}, {"titre": "Mention minimale: Assez-bien"}, {"titre": "Age maximal: 21 ans"}, {"titre": "Type de concours: ecrit"}, {"titre": "Series acceptees: C, D, F3"}]}	\N	\N	0	\N	\N
16f64fd6-d8b5-42c1-b96f-7a8550d831b0	Concours INEPS 2026	Institut National de l'Education Physique et Sportive (INEPS) - Universite d'Abomey-Calavi - Porto-Novo	2026-07-01 00:00:00	2026-08-18 00:00:00	2026-09-02 00:00:00	[MESRS-CONCOURS-2026] Source: MESRS Benin - Concours universitaires officiels\nDomaine: Sport & EPS\nFilieres: Education physique et sportive, Kinesitherapie, Management du sport, Loisirs et tourisme sportif\nDebouches: Professeur d'EPS, Kinesitherapeute, Animateur sportif, Manager sportif\nDuree de formation: 3 ans\nDate epreuves indicative: 2 septembre\nPlateforme d'inscription: https://concours.enseignementsuperieur.gouv.bj	5000	{A,B,C,D,F1,F2,F3,G1,G2,G3}	{Mathématiques,SVT,Français,"Culture générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}], "criteresEligibilite": [{"titre": "Nationalite: Beninoise", "description": null}, {"titre": "Diplome requis: Baccalaureat", "description": null}, {"titre": "Mention minimale: Assez-bien", "description": null}, {"titre": "Age maximal: 21 ans", "description": null}, {"titre": "Type de concours: ecrit + epreuves physiques", "description": null}, {"titre": "Series acceptees: A, B, C, D, F1, F2, F3, G1, G2, G3", "description": null}]}	2026-07-01 00:00:00	2026-08-18 00:00:00	2026-09-02 00:00:00	2026-09-03 00:00:00	2026-06-16 09:39:07.191	{"criteres": [{"titre": "Nationalite: Beninoise", "description": null}, {"titre": "Diplome requis: Baccalaureat", "description": null}, {"titre": "Mention minimale: Assez-bien", "description": null}, {"titre": "Age maximal: 21 ans", "description": null}, {"titre": "Type de concours: ecrit + epreuves physiques", "description": null}, {"titre": "Series acceptees: A, B, C, D, F1, F2, F3, G1, G2, G3", "description": null}]}	\N	\N	0	\N	\N
01b7434b-1a80-4e64-a0e3-f04eb833e43e	Concours INSPEI 2026	Institut National Superieur des Classes Preparatoires aux Etudes d'Ingenieurs (INSPEI) - Universite Nationale des Sciences, Technologies, Ingenierie et Mathematiques - Abomey	2026-07-01 00:00:00	2026-08-18 00:00:00	2026-09-02 00:00:00	[MESRS-CONCOURS-2026] Source: MESRS Benin - Concours universitaires officiels\nDomaine: Classes Preparatoires\nFilieres: MPSI, PCSI, TSI\nDebouches: Integration en ecole d'ingenieurs, Ingenieur generaliste\nDuree de formation: 2 ans (prepa) -> Grandes Ecoles\nDate epreuves indicative: 2 septembre\nPlateforme d'inscription: https://concours.enseignementsuperieur.gouv.bj	5000	{C,D}	{Mathématiques,Physique-Chimie,SVT,"Culture générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}], "criteresEligibilite": [{"titre": "Nationalite: Beninoise", "description": null}, {"titre": "Diplome requis: Baccalaureat", "description": null}, {"titre": "Mention minimale: Assez-bien", "description": null}, {"titre": "Age maximal: 21 ans", "description": null}, {"titre": "Type de concours: ecrit + oral", "description": null}, {"titre": "Series acceptees: C, D", "description": null}]}	2026-07-01 00:00:00	2026-08-18 00:00:00	2026-09-02 00:00:00	2026-09-03 00:00:00	2026-06-16 09:39:07.191	{"criteres": [{"titre": "Nationalite: Beninoise", "description": null}, {"titre": "Diplome requis: Baccalaureat", "description": null}, {"titre": "Mention minimale: Assez-bien", "description": null}, {"titre": "Age maximal: 21 ans", "description": null}, {"titre": "Type de concours: ecrit + oral", "description": null}, {"titre": "Series acceptees: C, D", "description": null}]}	\N	\N	0	\N	\N
22d735a4-8942-488e-8cbe-8c8e1c5184da	Concours EPAC 2026	EPAC	2026-06-15 00:00:00	2026-07-06 00:00:00	2026-07-27 00:00:00	Domaine: Ingenierie & Polytechnique\nFilieres: Genie civil, Genie electrique, Genie biomedical, Genie informatique et telecoms, Genie chimique, Production et sante animales\nDebouches: Ingenieur polytechnicien, Technicien superieur, Ingenieur biomedical\nDuree de formation: 3 ans (Licence) / 5 ans (Ingenieur)\n	5000	{C,D}	{Mathématiques,Physique-Chimie,SVT,"Culture générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}], "criteresEligibilite": [{"titre": "Nationalite: Beninoise", "description": null}, {"titre": "Diplome requis: Baccalaureat", "description": null}, {"titre": "Mention minimale: Assez-bien", "description": null}, {"titre": "Age maximal: 21 ans", "description": null}, {"titre": "Type de concours: ecrit", "description": null}, {"titre": "Series acceptees: C, D", "description": null}]}	2026-06-15 00:00:00	2026-07-06 00:00:00	2026-07-27 00:00:00	2026-07-29 00:00:00	2026-06-16 09:39:07.191	{"criteres": [{"titre": "Nationalite: Beninoise", "description": null}, {"titre": "Diplome requis: Baccalaureat", "description": null}, {"titre": "Mention minimale: Assez-bien", "description": null}, {"titre": "Age maximal: 21 ans", "description": null}, {"titre": "Type de concours: ecrit", "description": null}, {"titre": "Series acceptees: C, D", "description": null}]}	\N	696e24e5-ffbf-4246-bc57-9db5eff6afef	0	\N	\N
7fb1f6a4-2348-4066-8cb3-15b6c3e48908	Concours ENSET 2026	Ecole Nationale Superieure de l'Enseignement Technique (ENSET) - Universite Nationale des Sciences, Technologies, Ingenierie et Mathematiques - Lokossa	2026-08-12 00:00:00	2026-08-26 00:00:00	2026-10-12 00:00:00	Domaine: Enseignement technique\nFilieres: Genie electrique, Genie mecanique, Genie civil, Genie informatique\nDebouches: Professeur de lycee technique, Ingenieur en enseignement technique\nDuree de formation: 3 ans\n\n	5000	{C,D,F1,F2,F3}	{Mathématiques,Physique-Chimie,SVT,"Culture générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}], "criteresEligibilite": [{"titre": "Nationalite: Beninoise", "description": null}, {"titre": "Diplome requis: Baccalaureat", "description": null}, {"titre": "Mention minimale: Assez-bien", "description": null}, {"titre": "Age maximal: 21 ans", "description": null}, {"titre": "Type de concours: ecrit", "description": null}, {"titre": "Series acceptees: C, D, F1, F2, F3", "description": null}]}	2026-08-12 00:00:00	2026-08-26 00:00:00	2026-10-12 00:00:00	2026-10-14 00:00:00	2026-06-16 09:39:07.191	{"criteres": [{"titre": "Nationalite: Beninoise", "description": null}, {"titre": "Diplome requis: Baccalaureat", "description": null}, {"titre": "Mention minimale: Assez-bien", "description": null}, {"titre": "Age maximal: 21 ans", "description": null}, {"titre": "Type de concours: ecrit", "description": null}, {"titre": "Series acceptees: C, D, F1, F2, F3", "description": null}]}	\N	\N	0	\N	\N
3f71c366-7cf4-484a-bde4-8e3d94e10b5b	Concours IUEP-MA 2026	Institut Universitaire d'Enseignement Professionnel aux Metiers de l'Agriculture (IUEP-MA) - Universite d'Abomey-Calavi - Ketou	2026-06-30 09:00:00	2026-08-14 09:00:00	2026-08-29 09:00:00	[MESRS-CONCOURS-2026] Source: MESRS Benin - Concours universitaires officiels\nDomaine: Agriculture\nFilieres: Productions vegetales, Productions animales, Agroalimentaire, Agri-business\nDebouches: Technicien agricole, Agro-entrepreneur, Conseiller agricole\nDuree de formation: 3 ans\nDate epreuves indicative: 29 aout\nPlateforme d'inscription: https://concours.enseignementsuperieur.gouv.bj	5000	{C,D}	{Mathématiques,SVT,Physique-Chimie,"Culture générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}]}	2026-06-30 09:00:00	2026-08-14 09:00:00	2026-08-29 09:00:00	2026-08-30 09:00:00	2026-06-16 09:39:07.191	{"criteres": [{"titre": "Nationalite: Beninoise"}, {"titre": "Diplome requis: Baccalaureat"}, {"titre": "Mention minimale: Assez-bien"}, {"titre": "Age maximal: 21 ans"}, {"titre": "Type de concours: ecrit"}, {"titre": "Series acceptees: C, D"}]}	\N	\N	0	\N	\N
c388fad3-bacf-4c4f-aedf-ee9fe007ed14	Concours ESMA 2026	Ecole Superieure des Metiers de l'Agriculture (ESMA) - Universite Nationale d'Agriculture - Ketou	2026-06-16 00:00:00	2026-07-31 00:00:00	2026-08-15 00:00:00	Domaine: Agriculture & Developpement rural\nFilieres: Agri-business, Developpement rural, Gestion des ressources naturelles\nDebouches: Entrepreneur agricole, Conseiller en developpement rural, Gestionnaire de projets agricoles\nDuree de formation: 3 ans\n	5000	{C,D}	{Mathématiques,SVT,Physique-Chimie,"Culture générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}], "criteresEligibilite": [{"titre": "Nationalite: Beninoise", "description": null}, {"titre": "Diplome requis: Baccalaureat", "description": null}, {"titre": "Mention minimale: Assez-bien", "description": null}, {"titre": "Age maximal: 21 ans", "description": null}, {"titre": "Type de concours: etude de dossiers", "description": null}, {"titre": "Series acceptees: C, D", "description": null}]}	2026-06-16 00:00:00	2026-07-31 00:00:00	2026-08-15 00:00:00	2026-08-16 00:00:00	2026-06-16 09:39:07.191	{"criteres": [{"titre": "Nationalite: Beninoise", "description": null}, {"titre": "Diplome requis: Baccalaureat", "description": null}, {"titre": "Mention minimale: Assez-bien", "description": null}, {"titre": "Age maximal: 21 ans", "description": null}, {"titre": "Type de concours: etude de dossiers", "description": null}, {"titre": "Series acceptees: C, D", "description": null}]}	\N	\N	0	\N	\N
1571da39-de62-466f-b39d-f683c7081398	Concours FSS 2026	Faculte des Sciences de la Sante (FSS) - Universite d'Abomey-Calavi - Cotonou	2026-06-15 00:00:00	2026-06-30 00:00:00	2026-07-06 00:00:00	Domaine: Sciences medicales\nFilieres: Medecine generale, Pharmacie, Chirurgie dentaire / Odontologie\nDebouches: Medecin generaliste / specialiste, Pharmacien, Chirurgien-dentiste\nDuree de formation: 7 ans (Medecine) / 5 ans (Pharmacie)\n	5000	{C,D}	{Mathématiques,SVT,Physique-Chimie,"Culture générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}], "criteresEligibilite": [{"titre": "Nationalite: Beninoise", "description": null}, {"titre": "Diplome requis: Baccalaureat", "description": null}, {"titre": "Mention minimale: Assez-bien", "description": null}, {"titre": "Age maximal: 21 ans", "description": null}, {"titre": "Type de concours: ecrit (concours d'entree en 1ere annee)", "description": null}, {"titre": "Series acceptees: C, D", "description": null}]}	2026-06-15 00:00:00	2026-06-30 00:00:00	2026-07-06 00:00:00	2026-07-08 00:00:00	2026-06-16 09:39:07.191	{"criteres": [{"titre": "Nationalite: Beninoise", "description": null}, {"titre": "Diplome requis: Baccalaureat", "description": null}, {"titre": "Mention minimale: Assez-bien", "description": null}, {"titre": "Age maximal: 21 ans", "description": null}, {"titre": "Type de concours: ecrit (concours d'entree en 1ere annee)", "description": null}, {"titre": "Series acceptees: C, D", "description": null}]}	\N	\N	0	\N	\N
00d6af10-126d-45a9-aa4c-dc7d24790b49	Concours FSA 2026	Faculte des Sciences Agronomiques (FSA) - Universite d'Abomey-Calavi - Abomey-Calavi	2026-06-16 09:00:00	2026-07-31 09:00:00	2026-08-15 09:00:00	[MESRS-CONCOURS-2026] Source: MESRS Benin - Concours universitaires officiels\nDomaine: Agronomie & Environnement\nFilieres: Agronomie, Sciences forestieres, Nutrition et sciences alimentaires, Environnement et protection des vegetaux\nDebouches: Ingenieur agronome, Chercheur en agronomie, Specialiste environnement\nDuree de formation: 3 ans (Licence) / 5 ans (Ingenieur agronome)\nDate epreuves indicative: Aout - Septembre\nPlateforme d'inscription: https://concours.enseignementsuperieur.gouv.bj	5000	{C,D}	{Mathématiques,SVT,Physique-Chimie,"Culture générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}]}	2026-06-16 09:00:00	2026-07-31 09:00:00	2026-08-15 09:00:00	2026-08-16 09:00:00	2026-06-16 09:39:07.191	{"criteres": [{"titre": "Nationalite: Beninoise"}, {"titre": "Diplome requis: Baccalaureat"}, {"titre": "Mention minimale: Assez-bien"}, {"titre": "Age maximal: 21 ans"}, {"titre": "Type de concours: etude de dossiers + ecrit"}, {"titre": "Series acceptees: C, D"}]}	\N	\N	0	\N	\N
d4853265-bc98-482f-a0fa-f4bdda210e6c	Concours IFRI 2026	Institut de Formation et de Recherche en Informatique (IFRI) - Universite d'Abomey-Calavi - Abomey-Calavi	2026-06-16 09:00:00	2026-07-31 09:00:00	2026-08-15 09:00:00	[MESRS-CONCOURS-2026] Source: MESRS Benin - Concours universitaires officiels\nDomaine: Informatique\nFilieres: Genie logiciel, Reseaux et securite informatique, Intelligence artificielle, Systemes d'information\nDebouches: Ingenieur logiciel, Expert en cybersecurite, Data scientist, Architecte systemes\nDuree de formation: 3 ans (Licence) / 5 ans (Master)\nDate epreuves indicative: Aout - Septembre\nPlateforme d'inscription: https://concours.enseignementsuperieur.gouv.bj	5000	{C,D}	{Mathématiques,Physique-Chimie,Anglais,"Culture générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}]}	2026-06-16 09:00:00	2026-07-31 09:00:00	2026-08-15 09:00:00	2026-08-16 09:00:00	2026-06-16 09:39:07.191	{"criteres": [{"titre": "Nationalite: Beninoise"}, {"titre": "Diplome requis: Baccalaureat"}, {"titre": "Mention minimale: Assez-bien"}, {"titre": "Age maximal: 21 ans"}, {"titre": "Type de concours: ecrit"}, {"titre": "Series acceptees: C, D"}]}	\N	\N	0	\N	\N
3d382cc9-75ee-4056-8a91-a7bcac8fbc75	Concours IPEN 2026	Institut de Perfectionnement en Education et Nutrition (IPEN) - Universite d'Abomey-Calavi - Cotonou	2026-06-16 09:00:00	2026-07-31 09:00:00	2026-08-15 09:00:00	[MESRS-CONCOURS-2026] Source: MESRS Benin - Concours universitaires officiels\nDomaine: Sante & Nutrition\nFilieres: Nutrition communautaire, Sante maternelle et infantile, Education pour la sante\nDebouches: Nutritionniste, Educateur de sante, Agent de sante communautaire\nDuree de formation: 3 ans\nDate epreuves indicative: Aout - Septembre\nPlateforme d'inscription: https://concours.enseignementsuperieur.gouv.bj	5000	{C,D}	{Mathématiques,SVT,Physique-Chimie,"Culture générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}]}	2026-06-16 09:00:00	2026-07-31 09:00:00	2026-08-15 09:00:00	2026-08-16 09:00:00	2026-06-16 09:39:07.191	{"criteres": [{"titre": "Nationalite: Beninoise"}, {"titre": "Diplome requis: Baccalaureat"}, {"titre": "Mention minimale: Assez-bien"}, {"titre": "Age maximal: 21 ans"}, {"titre": "Type de concours: ecrit"}, {"titre": "Series acceptees: C, D"}]}	\N	\N	0	\N	\N
299cc72b-5bfd-43fc-9081-25e4626b287e	Concours IUT-Lokossa 2026	Institut Universitaire de Technologie de Lokossa (IUT-Lokossa) - Universite Nationale des Sciences, Technologies, Ingenierie et Mathematiques - Lokossa	2026-06-16 09:00:00	2026-07-31 09:00:00	2026-08-15 09:00:00	[MESRS-CONCOURS-2026] Source: MESRS Benin - Concours universitaires officiels\nDomaine: Technologies appliquees\nFilieres: Genie mecanique et productique, Genie electronique et informatique industrielle, Maintenance industrielle\nDebouches: Technicien superieur, Technicien de maintenance, Responsable production\nDuree de formation: 2 ans (DUT) / 3 ans (Licence Pro)\nDate epreuves indicative: Aout - Septembre\nPlateforme d'inscription: https://concours.enseignementsuperieur.gouv.bj	5000	{C,D,F1,F2,F3}	{Mathématiques,Physique-Chimie,SVT,"Culture générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}]}	2026-06-16 09:00:00	2026-07-31 09:00:00	2026-08-15 09:00:00	2026-08-16 09:00:00	2026-06-16 09:39:07.191	{"criteres": [{"titre": "Nationalite: Beninoise"}, {"titre": "Diplome requis: Baccalaureat"}, {"titre": "Mention minimale: Assez-bien"}, {"titre": "Age maximal: 21 ans"}, {"titre": "Type de concours: etude de dossiers + ecrit"}, {"titre": "Series acceptees: C, D, F1, F2, F3"}]}	\N	\N	0	\N	\N
0f243d92-c2ac-4fd9-9e9b-75b91dea1d4a	Concours d'Architecture	ANAPA	2026-07-06 00:00:00	2026-07-20 00:00:00	2026-07-27 00:00:00	\N	15000	{C,D,F4}	{Mathématiques,Français,"Culture générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}]}	2026-07-06 00:00:00	2026-07-20 00:00:00	2026-07-27 00:00:00	2026-07-29 00:00:00	2026-06-18 09:24:13.15	\N	\N	\N	0	\N	\N
b97bfcc7-5d24-4e7c-8fcb-25e20071affb	Concours INMeS 2026	Institut National Medico-Sanitaire (INMeS) - Universite d'Abomey-Calavi - Cotonou	2026-06-28 09:00:00	2026-08-12 09:00:00	2026-08-27 09:00:00	[MESRS-CONCOURS-2026] Source: MESRS Benin - Concours universitaires officiels\nDomaine: Sante\nFilieres: Sante publique, Gestion hospitaliere, Nutrition\nDebouches: Gestionnaire de la sante, Agent sanitaire, Nutritionniste\nDuree de formation: 3 ans\nDate epreuves indicative: 27 aout\nPlateforme d'inscription: https://concours.enseignementsuperieur.gouv.bj	5000	{C,D}	{Mathématiques,SVT,Physique-Chimie,"Culture générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}]}	2026-06-28 09:00:00	2026-08-12 09:00:00	2026-08-27 09:00:00	2026-08-28 09:00:00	2026-06-16 09:39:07.191	{"criteres": [{"titre": "Nationalite: Beninoise"}, {"titre": "Diplome requis: Baccalaureat"}, {"titre": "Mention minimale: Assez-bien"}, {"titre": "Age maximal: 21 ans"}, {"titre": "Type de concours: ecrit + oral"}, {"titre": "Series acceptees: C, D"}]}	{"note": "Test UniPath — centres de composition", "centres": [{"lieux": [{"nom": "CEG Gbégamey", "adresse": "Cotonou, Bénin"}, {"nom": "Collège Notre Dame des Apôtres", "adresse": "Cotonou, Bénin"}], "ville": "Cotonou"}, {"lieux": [{"nom": "IFSIO", "adresse": "Parakou, Bénin"}], "ville": "Parakou"}], "publieLe": "2026-07-15T00:00:00.000Z"}	c515a381-52d1-4edd-8127-97dbe5d579e5	0	\N	\N
2a1827c2-d282-4d09-97ca-f89e86817e65	Concours ENS Natitingou 2026	Ecole Normale Superieure de Natitingou (ENS Natitingou) - Universite Nationale d'Agriculture - Natitingou	2026-08-05 09:00:00	2026-09-19 09:00:00	2026-10-04 09:00:00	[MESRS-CONCOURS-2026] Source: MESRS Benin - Concours universitaires officiels\nDomaine: Formation des enseignants\nFilieres: Lettres modernes, Histoire-Geographie, Mathematiques, Sciences de la vie et de la terre\nDebouches: Professeur de college/lycee, Conseiller pedagogique\nDuree de formation: 3 ans\nDate epreuves indicative: 4 octobre\nPlateforme d'inscription: https://concours.enseignementsuperieur.gouv.bj	5000	{A,B,C,D}	{Mathématiques,Français,Histoire-Géographie,Anglais,"Culture générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}]}	2026-08-05 09:00:00	2026-09-19 09:00:00	2026-10-04 09:00:00	2026-10-05 09:00:00	2026-06-16 09:39:07.191	{"criteres": [{"titre": "Nationalite: Beninoise"}, {"titre": "Diplome requis: Baccalaureat"}, {"titre": "Mention minimale: Assez-bien"}, {"titre": "Age maximal: 21 ans"}, {"titre": "Type de concours: ecrit"}, {"titre": "Series acceptees: A, B, C, D"}]}	\N	\N	0	\N	\N
86688a22-094e-4938-8dec-d02302d5fcdd	Concours ENSGTI 2026	Ecole Nationale Superieure de Genie des Technologies Industrielles (ENSGTI) - Universite Nationale des Sciences, Technologies, Ingenierie et Mathematiques - Abomey	2026-07-17 09:00:00	2026-08-31 09:00:00	2026-09-15 09:00:00	[MESRS-CONCOURS-2026] Source: MESRS Benin - Concours universitaires officiels\nDomaine: Genie industriel & Energie\nFilieres: Genie industriel, Energies renouvelables, Maintenance industrielle, Automatisme et robotique\nDebouches: Ingenieur industriel, Expert en energie, Automaticien, Responsable maintenance\nDuree de formation: 5 ans (Diplome d'ingenieur)\nDate epreuves indicative: Septembre - Octobre\nPlateforme d'inscription: https://concours.enseignementsuperieur.gouv.bj	5000	{C,D,F1,F2,F3}	{Mathématiques,Physique-Chimie,SVT,"Culture générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}]}	2026-07-17 09:00:00	2026-08-31 09:00:00	2026-09-15 09:00:00	2026-09-16 09:00:00	2026-06-16 09:39:07.191	{"criteres": [{"titre": "Nationalite: Beninoise"}, {"titre": "Diplome requis: Baccalaureat"}, {"titre": "Mention minimale: Assez-bien"}, {"titre": "Age maximal: 21 ans"}, {"titre": "Type de concours: ecrit + oral"}, {"titre": "Series acceptees: C, D, F1, F2, F3"}]}	\N	\N	0	\N	\N
e5107ea0-d118-4a37-be80-553b7dee3f66	Concours ENS Porto-Novo 2026	Ecole Normale Superieure de Porto-Novo (ENS Porto-Novo) - Universite d'Abomey-Calavi - Porto-Novo	2026-08-05 00:00:00	2026-09-19 00:00:00	2026-10-04 00:00:00	Domaine: Formation des enseignants\nFilieres: Lettres modernes, Histoire-Geographie, Mathematiques, Sciences de la vie et de la terre, Physique-Chimie, Anglais\nDebouches: Professeur de college/lycee, Conseiller pedagogique, Formateur\nDuree de formation: 3 ans\n	5000	{A,B,C,D}	{Mathématiques,Français,Histoire-Géographie,Anglais,"Culture générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}], "criteresEligibilite": [{"titre": "Nationalite: Beninoise", "description": null}, {"titre": "Diplome requis: Baccalaureat", "description": null}, {"titre": "Mention minimale: Assez-bien", "description": null}, {"titre": "Age maximal: 21 ans", "description": null}, {"titre": "Type de concours: ecrit", "description": null}, {"titre": "Series acceptees: A, B, C, D", "description": null}]}	2026-08-05 00:00:00	2026-09-19 00:00:00	2026-10-04 00:00:00	2026-10-05 00:00:00	2026-06-16 09:39:07.191	{"criteres": [{"titre": "Nationalite: Beninoise", "description": null}, {"titre": "Diplome requis: Baccalaureat", "description": null}, {"titre": "Mention minimale: Assez-bien", "description": null}, {"titre": "Age maximal: 21 ans", "description": null}, {"titre": "Type de concours: ecrit", "description": null}, {"titre": "Series acceptees: A, B, C, D", "description": null}]}	\N	\N	0	\N	\N
4ac56676-2c58-4a99-9701-3e2eeaaf08e2	Concours ENAM 2026	Ecole Nationale d'Administration et de Magistrature (ENAM) - Ecole Nationale d'Administration et de Magistrature - Cotonou	2026-06-16 09:00:00	2026-07-31 09:00:00	2026-08-15 09:00:00	[MESRS-CONCOURS-2026] Source: MESRS Benin - Concours universitaires officiels\nDomaine: Administration & Droit\nFilieres: Administration generale, Magistrature, Diplomatie / Relations internationales, Finances publiques\nDebouches: Administrateur civil, Magistrat, Diplomate, Fonctionnaire d'Etat\nDuree de formation: 3 ans\nDate epreuves indicative: Aout - Septembre\nPlateforme d'inscription: https://concours.enseignementsuperieur.gouv.bj	5000	{A,B,C,D,G1,G2,G3}	{Français,"Culture générale",Anglais,Mathématiques}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}]}	2026-06-16 09:00:00	2026-07-31 09:00:00	2026-08-15 09:00:00	2026-08-16 09:00:00	2026-06-16 09:39:07.191	{"criteres": [{"titre": "Nationalite: Beninoise"}, {"titre": "Diplome requis: Baccalaureat"}, {"titre": "Mention minimale: Assez-bien"}, {"titre": "Age maximal: 21 ans"}, {"titre": "Type de concours: ecrit + oral"}, {"titre": "Series acceptees: A, B, C, D, G1, G2, G3"}]}	\N	a71e776e-8418-4795-aa85-bf84e505aba4	0	\N	\N
edda9184-3d32-4b68-a8c5-46d19a49004a	Concours EPAC 2026 - Génie Civil	EPAC	2026-06-22 00:00:00	2026-06-26 00:00:00	2026-06-29 00:00:00	Concours d'entrée au département GC	5000	{C,D,F4}	{Mathématiques,Physique,"Culture Générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "predefined": true, "description": "Reçu de paiement des frais de participation", "obligatoire": true, "sourceDossier": null, "nonSupprimable": true}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "predefined": true, "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte d'identité", "formats": ["PDF", "JPEG", "PNG"], "predefined": true, "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG"], "predefined": true, "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes Bac", "formats": ["PDF"], "predefined": true, "obligatoire": true, "sourceDossier": "releve"}], "criteresEligibilite": []}	2026-06-22 00:00:00	2026-06-26 00:00:00	2026-06-29 00:00:00	2026-07-01 00:00:00	2026-06-16 09:05:20.919	\N	{"note": "Test UniPath — centres de composition", "centres": [{"lieux": [{"nom": "CEG Gbégamey", "adresse": "Cotonou, Bénin"}, {"nom": "Collège Notre Dame des Apôtres", "adresse": "Cotonou, Bénin"}], "ville": "Cotonou"}, {"lieux": [{"nom": "IFSIO", "adresse": "Parakou, Bénin"}], "ville": "Parakou"}], "publieLe": "2026-07-15T00:00:00.000Z"}	696e24e5-ffbf-4246-bc57-9db5eff6afef	0	\N	\N
2f5e22e6-3170-4eba-a7fc-ee535eb0eb28	Concours UAC 2026 - Médecine	Faculté des Sciences de la Santé - FSS	2026-07-06 00:00:00	2026-07-17 00:00:00	2026-07-20 00:00:00	Concours médecine 	5000	{C,D}	{Mathématiques,Français,"Culture générale",Chimie,"Sciences de la Vie et de la Terre"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "obligatoire": true, "sourceDossier": null}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte nationale d'identité", "formats": ["PDF", "JPEG", "PNG"], "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG", "PDF"], "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes du Bac", "formats": ["PDF"], "obligatoire": true, "sourceDossier": "releve"}], "criteresEligibilite": []}	2026-07-06 00:00:00	2026-07-17 00:00:00	2026-07-20 00:00:00	2026-07-22 00:00:00	2026-06-16 09:05:22.228	{"criteres": []}	\N	\N	0	\N	\N
0836d7aa-6106-48b6-bd97-7015b5cca366	Concours EPAC 2026 Génie Informatique	EPAC	2026-06-22 00:00:00	2026-06-26 00:00:00	2026-06-29 00:00:00	Concours d'entrée au département GIT	5000	{C,D}	{Mathématiques,Français,"Culture générale"}	{"pieces": [{"id": "quittance", "nom": "Quittance de paiement", "formats": ["PDF"], "predefined": true, "description": "Reçu de paiement des frais de participation", "obligatoire": true, "sourceDossier": null, "nonSupprimable": true}, {"id": "acte_naissance", "nom": "Acte de naissance", "formats": ["PDF"], "predefined": true, "obligatoire": true, "sourceDossier": "acteNaissance"}, {"id": "carte_identite", "nom": "Carte d'identité", "formats": ["PDF", "JPEG", "PNG"], "predefined": true, "obligatoire": true, "sourceDossier": "carteIdentite"}, {"id": "photo_identite", "nom": "Photo d'identité", "formats": ["JPEG", "PNG"], "predefined": true, "obligatoire": true, "sourceDossier": "photo"}, {"id": "releve_bac", "nom": "Relevé de notes Bac", "formats": ["PDF"], "predefined": true, "obligatoire": true, "sourceDossier": "releve"}], "criteresEligibilite": [{"titre": "AVOIR UN BAC RECENT D'AU MAXIMUM 2 ANS", "description": null}]}	2026-06-22 00:00:00	2026-06-26 00:00:00	2026-06-29 00:00:00	2026-07-01 00:00:00	2026-06-16 09:05:19.674	\N	\N	696e24e5-ffbf-4246-bc57-9db5eff6afef	0	\N	\N
\.


--
-- Data for Name: ConcourscentreComposition; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ConcourscentreComposition" (id, "concoursId", "centreId", "anneeAcademique", capacite, "estActif", "createdAt") FROM stdin;
a057bf8b-51b4-44bf-a110-32dedc3e4457	b97bfcc7-5d24-4e7c-8fcb-25e20071affb	ee72686f-43d0-4c73-990e-568f1fd88e7f	2025-2026	\N	t	2026-06-28 17:36:47.021
7b3f1576-f5aa-4230-81b7-f57489a6e7bc	b97bfcc7-5d24-4e7c-8fcb-25e20071affb	0e12066c-efcf-4015-85ef-8e62e0599b67	2025-2026	\N	t	2026-06-28 17:36:50.718
715c2b1d-6e68-4031-99dd-bb043a2e034b	b97bfcc7-5d24-4e7c-8fcb-25e20071affb	95598112-d282-4575-ac33-3a4b16d6e1dc	2025-2026	\N	t	2026-06-28 17:36:56.405
20af0226-3103-4569-93e3-776f380424ec	edda9184-3d32-4b68-a8c5-46d19a49004a	ee72686f-43d0-4c73-990e-568f1fd88e7f	2025-2026	\N	t	2026-06-28 17:37:05.713
63f04cdd-1d7a-41dc-86bb-f9e2463d71ec	edda9184-3d32-4b68-a8c5-46d19a49004a	0e12066c-efcf-4015-85ef-8e62e0599b67	2025-2026	\N	t	2026-06-28 17:37:10.713
2efe7003-df00-4127-90aa-370aa9aa0b46	edda9184-3d32-4b68-a8c5-46d19a49004a	95598112-d282-4575-ac33-3a4b16d6e1dc	2025-2026	\N	t	2026-06-28 17:37:15.497
c3a51919-1eae-4f36-96d1-0fed53df4701	7fb1f6a4-2348-4066-8cb3-15b6c3e48908	0e12066c-efcf-4015-85ef-8e62e0599b67	2025-2026	\N	t	2026-07-02 00:24:22.78
abe4493c-ab4f-4066-9ee0-891b95a657aa	7fb1f6a4-2348-4066-8cb3-15b6c3e48908	95598112-d282-4575-ac33-3a4b16d6e1dc	2025-2026	\N	t	2026-07-02 00:24:56.187
7426887a-5420-4c2b-b916-7d7cf5ac0c30	2f5e22e6-3170-4eba-a7fc-ee535eb0eb28	0e12066c-efcf-4015-85ef-8e62e0599b67	2025-2026	\N	t	2026-07-02 00:29:37.792
54923543-58a8-43be-9e8f-5e143cd7a3e4	2f5e22e6-3170-4eba-a7fc-ee535eb0eb28	ee72686f-43d0-4c73-990e-568f1fd88e7f	2025-2026	\N	t	2026-07-02 00:31:48.278
bdf4050d-dd38-44cd-9f94-e8a829b2cc42	1571da39-de62-466f-b39d-f683c7081398	ee72686f-43d0-4c73-990e-568f1fd88e7f	2025-2026	\N	t	2026-07-02 00:37:26.575
a030313c-a074-4014-8cdf-a859fd838d3a	1571da39-de62-466f-b39d-f683c7081398	95598112-d282-4575-ac33-3a4b16d6e1dc	2025-2026	\N	t	2026-07-02 00:38:06.466
65dd1d19-7053-464c-9149-afb12bb37bb0	1571da39-de62-466f-b39d-f683c7081398	0e12066c-efcf-4015-85ef-8e62e0599b67	2025-2026	\N	t	2026-07-02 00:38:28.664
205137e8-b963-407e-943d-cecadce78d9e	22d735a4-8942-488e-8cbe-8c8e1c5184da	ee72686f-43d0-4c73-990e-568f1fd88e7f	2025-2026	\N	t	2026-07-02 05:40:26.582
1e7182e4-9416-4388-9f05-ceb6844abd64	0836d7aa-6106-48b6-bd97-7015b5cca366	c566845d-2a41-42eb-9a27-eada9c2cb0a9	2025-2026	\N	t	2026-07-02 05:46:40.34
f6eb68ed-7cbf-4412-886d-2d72e0b5b97b	0836d7aa-6106-48b6-bd97-7015b5cca366	0e12066c-efcf-4015-85ef-8e62e0599b67	2025-2026	\N	t	2026-07-02 05:47:27.211
19c69b42-7aa5-4381-bde4-60595654ec75	73ef6938-9e50-4d8a-9bf6-14bb584c6fd8	c566845d-2a41-42eb-9a27-eada9c2cb0a9	2025-2026	\N	t	2026-07-02 05:52:38.377
402cd075-4e40-42c2-9088-8604745e48b5	73ef6938-9e50-4d8a-9bf6-14bb584c6fd8	ee72686f-43d0-4c73-990e-568f1fd88e7f	2025-2026	\N	t	2026-07-02 05:53:34.935
64149cda-6c90-4a85-9256-137a5c82e412	c388fad3-bacf-4c4f-aedf-ee9fe007ed14	ee72686f-43d0-4c73-990e-568f1fd88e7f	2025-2026	\N	t	2026-07-02 07:16:10.044
0e7f4bd7-16be-4015-b391-dbcc9ba6c21e	c388fad3-bacf-4c4f-aedf-ee9fe007ed14	d027bf55-812d-48b9-8a1c-d8f609fa15f1	2025-2026	\N	t	2026-07-02 07:18:20.211
43d1205f-0054-4ef3-ad6b-82ce61a67a61	e5107ea0-d118-4a37-be80-553b7dee3f66	d027bf55-812d-48b9-8a1c-d8f609fa15f1	2025-2026	\N	t	2026-07-02 07:20:02.08
df647e53-abeb-4a2c-bd1a-ef030063301a	e5107ea0-d118-4a37-be80-553b7dee3f66	0e12066c-efcf-4015-85ef-8e62e0599b67	2025-2026	\N	t	2026-07-02 07:20:19.687
\.


--
-- Data for Name: Controleur; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Controleur" (id, nom, prenom, email, telephone, role, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Diplome; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Diplome" (id, "candidatId", type, filiere, "filiereId", etablissement, annee, mention, "createdAt") FROM stdin;
\.


--
-- Data for Name: Dossier; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Dossier" (id, "candidatId", "acteNaissance", "carteIdentite", photo, releve, "createdAt", "updatedAt") FROM stdin;
94230f46-7a00-4bc6-9849-235f722db30c	dd569177-974b-44a6-a51b-e899cc479be1	https://example.com/demo/unipath/acte-1.pdf	https://example.com/demo/unipath/cni-1.pdf	https://example.com/demo/unipath/photo-1.jpg	https://example.com/demo/unipath/releve-1.pdf	2026-07-09 06:37:21.155	2026-07-09 06:42:50.352
be1f4eef-fbb5-43c6-afeb-5aa85558b393	cea47adf-c2b4-42dc-85e1-f77a82853cb0	https://example.com/demo/unipath/acte-2.pdf	https://example.com/demo/unipath/cni-2.pdf	https://example.com/demo/unipath/photo-2.jpg	https://example.com/demo/unipath/releve-2.pdf	2026-07-09 06:37:37.692	2026-07-09 06:43:04.316
5382b918-aa51-45ce-889c-630c6fb59337	ce2842ec-13d7-4b9b-8491-26aa92080b35	https://example.com/demo/unipath/acte-3.pdf	https://example.com/demo/unipath/cni-3.pdf	https://example.com/demo/unipath/photo-3.jpg	https://example.com/demo/unipath/releve-3.pdf	2026-07-09 06:37:53.504	2026-07-09 06:43:18.224
129a07da-59ef-421f-a599-58dee506ef9b	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	https://krqxuoqijkwxouixqudo.supabase.co/storage/v1/object/public/dossiers-candidats/9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f/acteNaissance-1782250653914.pdf	https://krqxuoqijkwxouixqudo.supabase.co/storage/v1/object/public/dossiers-candidats/9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f/carteIdentite-1782250679369.jpeg	https://krqxuoqijkwxouixqudo.supabase.co/storage/v1/object/public/dossiers-candidats/9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f/photo-1782299815424.jpeg	https://krqxuoqijkwxouixqudo.supabase.co/storage/v1/object/public/dossiers-candidats/9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f/releve-1782250724551.pdf	2026-06-23 21:37:34.925	2026-06-24 11:16:56.329
6059810d-936d-4525-af92-69bbf1dbef02	e22b8e9b-8d98-4316-bc74-49126b9f38e8	https://example.com/demo/unipath/acte-4.pdf	https://example.com/demo/unipath/cni-4.pdf	https://example.com/demo/unipath/photo-4.jpg	https://example.com/demo/unipath/releve-4.pdf	2026-07-09 06:38:14.451	2026-07-09 06:43:31.793
9a3ecd01-6c12-4df5-a2b9-3ff0d81a1ecf	7a4993ea-5eb4-4ff8-9e66-c4c5f5d5acf2	https://example.com/demo/unipath/acte-5.pdf	https://example.com/demo/unipath/cni-5.pdf	https://example.com/demo/unipath/photo-5.jpg	https://example.com/demo/unipath/releve-5.pdf	2026-07-09 06:38:28.012	2026-07-09 06:43:45.549
1c3b821c-48c6-4195-8999-b54706bdec44	acec5f54-1db7-44ab-abcd-514941a94b89	https://example.com/demo/unipath/acte-6.pdf	https://example.com/demo/unipath/cni-6.pdf	https://example.com/demo/unipath/photo-6.jpg	https://example.com/demo/unipath/releve-6.pdf	2026-07-09 06:38:41.851	2026-07-09 06:43:59.635
f490e050-3295-4106-b183-08bc2949de17	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	https://krqxuoqijkwxouixqudo.supabase.co/storage/v1/object/public/dossiers-candidats/1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/acteNaissance-1782638269322.pdf	https://krqxuoqijkwxouixqudo.supabase.co/storage/v1/object/public/dossiers-candidats/1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/carteIdentite-1782638291094.pdf	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/photo-1782974709570.jpg	https://krqxuoqijkwxouixqudo.supabase.co/storage/v1/object/public/dossiers-candidats/1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/releve-1782638340072.pdf	2026-06-28 09:17:50.021	2026-07-02 06:45:10.265
1d1a6863-296c-4ac2-9e4e-e310282c65f4	6a4e990b-48f6-4d80-a572-b24a6da10065	https://example.com/demo/unipath/acte-7.pdf	https://example.com/demo/unipath/cni-7.pdf	https://example.com/demo/unipath/photo-7.jpg	https://example.com/demo/unipath/releve-7.pdf	2026-07-09 06:38:55.133	2026-07-09 06:44:13.596
f28f3739-9448-4cf8-874a-56e147e7867a	95798e76-e65d-4a9d-8e4d-6bc1dbe24169	https://example.com/demo/unipath/acte-8.pdf	https://example.com/demo/unipath/cni-8.pdf	https://example.com/demo/unipath/photo-8.jpg	https://example.com/demo/unipath/releve-8.pdf	2026-07-09 06:39:08.97	2026-07-09 06:44:27.996
cfdc275d-c5ed-4f54-95f7-0931f8840439	7dafd101-8703-4048-a7ac-b3e5a59a7a20	https://example.com/demo/unipath/acte-9.pdf	https://example.com/demo/unipath/cni-9.pdf	https://example.com/demo/unipath/photo-9.jpg	https://example.com/demo/unipath/releve-9.pdf	2026-07-09 06:39:22.643	2026-07-09 06:44:41.624
53bb9ac3-1b5c-483a-b10a-593ef2a001ee	63433950-de27-4e70-8f2f-5422ee728631	https://example.com/demo/unipath/acte-10.pdf	https://example.com/demo/unipath/cni-10.pdf	https://example.com/demo/unipath/photo-10.jpg	https://example.com/demo/unipath/releve-10.pdf	2026-07-09 06:39:36.123	2026-07-09 06:44:55.673
c5b02029-2a4e-4c57-8afc-8f36faa4e115	c61477fa-be86-447c-a001-5b043b58d3b3	https://example.com/demo/unipath/acte-11.pdf	https://example.com/demo/unipath/cni-11.pdf	https://example.com/demo/unipath/photo-11.jpg	https://example.com/demo/unipath/releve-11.pdf	2026-07-09 06:39:49.889	2026-07-09 06:45:11.028
827f46f8-4b0f-4dfc-9704-5f577001f2a5	acf582c5-34a6-463f-9ded-c9ae33cec93c	https://example.com/demo/unipath/acte-12.pdf	https://example.com/demo/unipath/cni-12.pdf	https://example.com/demo/unipath/photo-12.jpg	https://example.com/demo/unipath/releve-12.pdf	2026-07-09 06:40:05.58	2026-07-09 06:45:25.777
6099981f-713f-4f58-863d-b39e86fc1418	c489ab2e-1f30-4490-8da7-a4f3be59a9a3	https://example.com/demo/unipath/acte-13.pdf	https://example.com/demo/unipath/cni-13.pdf	https://example.com/demo/unipath/photo-13.jpg	https://example.com/demo/unipath/releve-13.pdf	2026-07-09 06:40:19.605	2026-07-09 06:45:40.625
75726bc9-7ea1-4127-a304-c99a15563c40	d4370a44-36c4-4a83-a694-9ce69b76226b	https://example.com/demo/unipath/acte-14.pdf	https://example.com/demo/unipath/cni-14.pdf	https://example.com/demo/unipath/photo-14.jpg	https://example.com/demo/unipath/releve-14.pdf	2026-07-09 06:40:32.866	2026-07-09 06:45:57.269
24bd13c3-2449-44e7-9852-c8ef0a567382	55c80461-24f9-44dd-b695-d700fba2c36d	https://example.com/demo/unipath/acte-15.pdf	https://example.com/demo/unipath/cni-15.pdf	https://example.com/demo/unipath/photo-15.jpg	https://example.com/demo/unipath/releve-15.pdf	2026-07-09 06:40:46.054	2026-07-09 06:46:11.507
\.


--
-- Data for Name: DossierInscription; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DossierInscription" (id, "inscriptionId", "quittanceUrl", "piecesExtras", statut, "verdict1Par", verdict1, "verdict1Motif", "verdict1Date", "verdict1ModifieCount", "verdict2Par", verdict2, "verdict2Motif", "verdict2Date", "verdict2ModifieCount", "decisionControleur", "decisionControleurMotif", "decisionControleurDate", "decisionControleurPar", "commentaireRejet", "commentaireSousReserve", "decisionCommissionPar", "decisionCommissionDate", "commentaireControleur", "createdAt", "updatedAt", "documentsCompl", "historiqueStatuts", "centreCompositionChoisi", "concoursCentreId", "decisionControleurModifieCount") FROM stdin;
de72a1f8-d74d-496d-a8d7-ad30a427218d	fdb3a986-f90e-4c22-bd37-e2b211d6cd4b	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/01b7434b-1a80-4e64-a0e3-f04eb833e43e/quittance-1782909733088.pdf	{"releve_bac": "https://krqxuoqijkwxouixqudo.supabase.co/storage/v1/object/public/dossiers-candidats/1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/releve-1782638340072.pdf", "acte_naissance": "https://krqxuoqijkwxouixqudo.supabase.co/storage/v1/object/public/dossiers-candidats/1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/acteNaissance-1782638269322.pdf", "carte_identite": "https://krqxuoqijkwxouixqudo.supabase.co/storage/v1/object/public/dossiers-candidats/1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/carteIdentite-1782638291094.pdf", "photo_identite": "https://krqxuoqijkwxouixqudo.supabase.co/storage/v1/object/public/dossiers-candidats/1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/photo-1782638321643.png"}	EN_ATTENTE	adad5263-20b1-4f82-8650-e2011ed199ab	SOUS_RESERVE	Les pièces ne s	2026-07-01 12:51:06.511	0	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-01 12:42:17.272	2026-07-01 12:51:06.906	\N	\N	\N	\N	0
1ae78c5f-bd8a-4533-b70d-997bca802112	92cbd1d5-ffcc-4069-99e5-6a9c16ab596f	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/73ef6938-9e50-4d8a-9bf6-14bb584c6fd8/quittance-1782971709266.pdf	{"releve_bac": "https://krqxuoqijkwxouixqudo.supabase.co/storage/v1/object/public/dossiers-candidats/1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/releve-1782638340072.pdf", "acte_naissance": "https://krqxuoqijkwxouixqudo.supabase.co/storage/v1/object/public/dossiers-candidats/1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/acteNaissance-1782638269322.pdf", "carte_identite": "https://krqxuoqijkwxouixqudo.supabase.co/storage/v1/object/public/dossiers-candidats/1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/carteIdentite-1782638291094.pdf", "photo_identite": "https://krqxuoqijkwxouixqudo.supabase.co/storage/v1/object/public/dossiers-candidats/1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/photo-1782638321643.png"}	VALIDE	20a05243-32ba-41d2-b61f-635df62e2173	SOUS_RESERVE	La carte d&#x27;identité n&#x27;est pas conforme	2026-07-02 05:57:48.162	0	754671cd-2b76-4ccb-a0bb-690adcf34443	VALIDE	Il  a corrigé le dossier et j'ai validé	2026-07-02 07:11:34.534	0	VALIDE	Il  a corrigé le dossier et j'ai validé	2026-07-02 07:11:34.534	754671cd-2b76-4ccb-a0bb-690adcf34443	\N	La carte d&#x27;identité n&#x27;est pas conforme	\N	\N	\N	2026-07-02 05:55:12.868	2026-07-02 07:29:53.997	\N	\N	null	19c69b42-7aa5-4381-bde4-60595654ec75	0
9a8e9aea-4ad2-415d-831f-cfb4595c5d7f	817df7ff-f49c-4532-a286-810f325651ae	https://krqxuoqijkwxouixqudo.supabase.co/storage/v1/object/public/dossiers-candidats/9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f/edda9184-3d32-4b68-a8c5-46d19a49004a/quittance-1782287487104.pdf	{"releve_bac": "https://krqxuoqijkwxouixqudo.supabase.co/storage/v1/object/public/dossiers-candidats/9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f/releve-1782250724551.pdf", "acte_naissance": "https://krqxuoqijkwxouixqudo.supabase.co/storage/v1/object/public/dossiers-candidats/9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f/acteNaissance-1782250653914.pdf", "carte_identite": "https://krqxuoqijkwxouixqudo.supabase.co/storage/v1/object/public/dossiers-candidats/9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f/carteIdentite-1782250679369.jpeg", "photo_identite": "https://krqxuoqijkwxouixqudo.supabase.co/storage/v1/object/public/dossiers-candidats/9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f/photo-1782250701085.png"}	VALIDE_PAR_COMMISSION	adad5263-20b1-4f82-8650-e2011ed199ab	VALIDE	\N	2026-06-24 11:45:40.576	0	754671cd-2b76-4ccb-a0bb-690adcf34443	VALIDE	\N	2026-06-24 11:50:22.57	0	VALIDE	\N	2026-06-24 11:50:22.57	754671cd-2b76-4ccb-a0bb-690adcf34443	\N	\N	\N	\N	\N	2026-06-24 07:51:38.023	2026-07-09 00:58:33.916	\N	\N	{"nom": "Collège Notre Dame des Apôtres", "ville": "Cotonou", "adresse": "Cotonou, Bénin", "choisiLe": "2026-06-28T06:56:25.919Z"}	63f04cdd-1d7a-41dc-86bb-f9e2463d71ec	0
\.


--
-- Data for Name: EmailDelivery; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EmailDelivery" (id, "notificationId", "userId", recipient, subject, status, "messageId", attempts, "lastAttemptAt", "sentAt", "deliveredAt", "bouncedAt", "errorMessage", "smtpCode", "createdAt", "updatedAt", "htmlBody", "textBody", attachments, "nextRetryAt") FROM stdin;
d15eb7a1-7454-4afc-8d97-ed4e91f86c6a	\N	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	thechill000@gmail.com	[UniPath] Confirmez votre adresse email	FAILED	\N	1	2026-06-28 08:12:02.763	\N	\N	\N	\N	\N	2026-06-28 08:12:02.766	2026-06-28 08:12:02.766	\N	\N	\N	\N
b1130016-e0b1-4dc2-a369-da5d16aab2e2	\N	\N	thechill000@gmail.com	[UniPath] Confirmez votre adresse email	SENT	<cbf375a5-e5b6-ec14-b5ad-bcd8ac97d3b8@gmail.com>	1	2026-06-28 08:12:26.283	2026-06-28 08:12:26.283	\N	\N	\N	\N	2026-06-28 08:11:59.638	2026-06-28 08:12:26.286	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Bienvenue sur UniPath</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Keren FAVI</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, \n            veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :\n          </p>\n\n          <div style="text-align: center; margin: 40px 0;">\n            <a href="http://localhost:5173/auth/confirm?token=1f1bc8d1-5f57-47ae-8b9c-952c45ffde14" \n               style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">\n              ✓ Confirmer mon email\n            </a>\n          </div>\n\n          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>⚠️ Important :</strong></p>\n            <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 13px;">\n              Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature.\n            </p>\n          </div>\n\n          <p style="color:#888; font-size:12px; margin-top: 30px;">\n            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>\n            <a href="http://localhost:5173/auth/confirm?token=1f1bc8d1-5f57-47ae-8b9c-952c45ffde14" style="color: #3b82f6; word-break: break-all; font-size: 11px;">http://localhost:5173/auth/confirm?token=1f1bc8d1-5f57-47ae-8b9c-952c45ffde14</a>\n          </p>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025<br/>\n            Si vous n'avez pas créé de compte, ignorez cet email.\n          </p>\n        </div>\n      </div>\n    	🎓 Bienvenue sur UniPath Bonjour Keren FAVI, Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous : ✓ Confirmer mon email ⚠️ Important : Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature. Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur : http://localhost:5173/auth/confirm?token=1f1bc8d1-5f57-47ae-8b9c-952c45ffde14 Université d'Abomey-Calavi Année Académique 2024-2025 Si vous n'avez pas créé de compte, ignorez cet email.	null	\N
46bfcd75-9a75-406a-8f76-ad075d93f343	\N	\N	themcdhy@gmail.com	[UniPath] Confirmez votre adresse email	SENT	<bc7ebc1b-272f-c218-1162-94ae07638291@gmail.com>	1	2026-05-14 15:12:15.283	2026-05-14 15:12:15.283	\N	\N	\N	\N	2026-05-14 15:12:04.153	2026-05-14 15:12:15.286	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Bienvenue sur UniPath</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Rufus DEGBO</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, \n            veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :\n          </p>\n\n          <div style="text-align: center; margin: 40px 0;">\n            <a href="http://localhost:5173/confirmer-email?token=4a84ba0a-b2d6-440f-b753-240b7ff489e9" \n               style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">\n              ✓ Confirmer mon email\n            </a>\n          </div>\n\n          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>⚠️ Important :</strong></p>\n            <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 13px;">\n              Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature.\n            </p>\n          </div>\n\n          <p style="color:#888; font-size:12px; margin-top: 30px;">\n            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>\n            <a href="http://localhost:5173/confirmer-email?token=4a84ba0a-b2d6-440f-b753-240b7ff489e9" style="color: #3b82f6; word-break: break-all; font-size: 11px;">http://localhost:5173/confirmer-email?token=4a84ba0a-b2d6-440f-b753-240b7ff489e9</a>\n          </p>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025<br/>\n            Si vous n'avez pas créé de compte, ignorez cet email.\n          </p>\n        </div>\n      </div>\n    	🎓 Bienvenue sur UniPath Bonjour Rufus DEGBO, Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous : ✓ Confirmer mon email ⚠️ Important : Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature. Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur : http://localhost:5173/confirmer-email?token=4a84ba0a-b2d6-440f-b753-240b7ff489e9 Université d'Abomey-Calavi Année Académique 2024-2025 Si vous n'avez pas créé de compte, ignorez cet email.	null	\N
32baa407-ba56-4598-bc0e-a1309fd33547	\N	\N	themcdhy@gmail.com	[UniPath] Confirmez votre adresse email	SENT	<a4b0004b-43aa-f2cf-71b7-8595cf6ea336@gmail.com>	1	2026-05-14 15:18:44.197	2026-05-14 15:18:44.197	\N	\N	\N	\N	2026-05-14 15:18:37.624	2026-05-14 15:18:44.2	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Bienvenue sur UniPath</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Rufus DEGBO</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, \n            veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :\n          </p>\n\n          <div style="text-align: center; margin: 40px 0;">\n            <a href="http://localhost:5173/confirmer-email?token=4a84ba0a-b2d6-440f-b753-240b7ff489e9" \n               style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">\n              ✓ Confirmer mon email\n            </a>\n          </div>\n\n          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>⚠️ Important :</strong></p>\n            <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 13px;">\n              Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature.\n            </p>\n          </div>\n\n          <p style="color:#888; font-size:12px; margin-top: 30px;">\n            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>\n            <a href="http://localhost:5173/confirmer-email?token=4a84ba0a-b2d6-440f-b753-240b7ff489e9" style="color: #3b82f6; word-break: break-all; font-size: 11px;">http://localhost:5173/confirmer-email?token=4a84ba0a-b2d6-440f-b753-240b7ff489e9</a>\n          </p>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025<br/>\n            Si vous n'avez pas créé de compte, ignorez cet email.\n          </p>\n        </div>\n      </div>\n    	🎓 Bienvenue sur UniPath Bonjour Rufus DEGBO, Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous : ✓ Confirmer mon email ⚠️ Important : Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature. Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur : http://localhost:5173/confirmer-email?token=4a84ba0a-b2d6-440f-b753-240b7ff489e9 Université d'Abomey-Calavi Année Académique 2024-2025 Si vous n'avez pas créé de compte, ignorez cet email.	null	\N
ee8beea0-064f-4927-970a-7e8b2e2fabda	\N	18f6be90-ed86-4bfb-8360-443d70852cc9	test-first-1779802974360@example.com	[UniPath] Confirmez votre adresse email	FAILED	\N	1	2026-05-26 13:43:18.488	\N	\N	\N	validateParams is not a function	\N	2026-05-26 13:43:18.49	2026-05-26 13:43:18.49	\N	\N	\N	\N
6be942ae-e573-4150-bc91-af11b695a94e	\N	f12eb176-bb43-4432-b3ec-9ce3735e1226	test-user1-1779802979366@example.com	[UniPath] Confirmez votre adresse email	FAILED	\N	1	2026-05-26 13:43:23.38	\N	\N	\N	validateParams is not a function	\N	2026-05-26 13:43:23.382	2026-05-26 13:43:23.382	\N	\N	\N	\N
fccbddf2-8dde-4c42-8cb4-f5d5d3fe5079	\N	\N	harrydedji@gmail.com	[UniPath] Confirmez votre adresse email	SENT	<d03a6f05-c268-48b5-7cf1-4ce4751c1a5f@gmail.com>	1	2026-05-28 15:52:15.925	2026-05-28 15:52:15.925	\N	\N	\N	\N	2026-05-28 15:52:06.754	2026-05-28 15:52:15.926	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Bienvenue sur UniPath</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Archimède AHIDOTIN</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, \n            veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :\n          </p>\n\n          <div style="text-align: center; margin: 40px 0;">\n            <a href="http://localhost:5173/confirmer-email?token=147ead57-b2ef-4815-9812-2ca3ce250319" \n               style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">\n              ✓ Confirmer mon email\n            </a>\n          </div>\n\n          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>⚠️ Important :</strong></p>\n            <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 13px;">\n              Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature.\n            </p>\n          </div>\n\n          <p style="color:#888; font-size:12px; margin-top: 30px;">\n            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>\n            <a href="http://localhost:5173/confirmer-email?token=147ead57-b2ef-4815-9812-2ca3ce250319" style="color: #3b82f6; word-break: break-all; font-size: 11px;">http://localhost:5173/confirmer-email?token=147ead57-b2ef-4815-9812-2ca3ce250319</a>\n          </p>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025<br/>\n            Si vous n'avez pas créé de compte, ignorez cet email.\n          </p>\n        </div>\n      </div>\n    	🎓 Bienvenue sur UniPath Bonjour Archimède AHIDOTIN, Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous : ✓ Confirmer mon email ⚠️ Important : Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature. Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur : http://localhost:5173/confirmer-email?token=147ead57-b2ef-4815-9812-2ca3ce250319 Université d'Abomey-Calavi Année Académique 2024-2025 Si vous n'avez pas créé de compte, ignorez cet email.	null	\N
8a0396b2-03c2-4167-8402-f0d9a4c77ee6	\N	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	harrydedji@gmail.com	[UniPath] Confirmez votre adresse email	FAILED	\N	1	2026-05-28 15:52:07.657	\N	\N	\N	\N	\N	2026-05-28 15:52:07.659	2026-05-28 15:52:07.659	\N	\N	\N	\N
705fd068-0763-425a-ad4b-5fc1564cc16e	\N	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	harrydedji@gmail.com	[UniPath] Bienvenue sur la plateforme	SENT	<951dec79-edb5-52a2-96c9-a43f4086ad82@gmail.com>	1	2026-05-28 16:13:36.845	2026-05-28 16:13:36.845	\N	\N	\N	\N	2026-05-28 16:13:22.067	2026-05-28 16:13:36.846	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Bienvenue sur UniPath</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Archimède AHIDOTIN</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Votre compte a été créé et confirmé avec succès ! Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme UniPath.\n          </p>\n\n          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">\n            <p style="margin: 0; font-size: 14px; color: #374151;"><strong>📧 Email :</strong> harrydedji@gmail.com</p>\n            <p style="margin: 10px 0 0 0; font-size: 14px; color: #374151;"><strong>🎫 Matricule :</strong> UnP-2026-000004</p>\n          </div>\n\n          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>📝 Prochaines étapes :</strong></p>\n            <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #1e40af; font-size: 13px;">\n              <li>Complétez votre profil personnel</li>\n              <li>Déposez vos pièces justificatives</li>\n              <li>Consultez les concours disponibles</li>\n              <li>Inscrivez-vous aux concours de votre choix</li>\n            </ol>\n          </div>\n\n          <div style="text-align: center; margin: 30px 0;">\n            <a href="http://localhost:5173/login" \n               style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">\n              🚀 Accéder à mon compte\n            </a>\n          </div>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025<br/>\n            Pour toute question, contactez-nous à harrydedji@gmail.com\n          </p>\n        </div>\n      </div>\n    	🎓 Bienvenue sur UniPath Bonjour Archimède AHIDOTIN, Votre compte a été créé et confirmé avec succès ! Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme UniPath. 📧 Email : harrydedji@gmail.com 🎫 Matricule : UnP-2026-000004 📝 Prochaines étapes : Complétez votre profil personnel Déposez vos pièces justificatives Consultez les concours disponibles Inscrivez-vous aux concours de votre choix 🚀 Accéder à mon compte Université d'Abomey-Calavi Année Académique 2024-2025 Pour toute question, contactez-nous à harrydedji@gmail.com	null	\N
b61f0981-c9e9-4f03-a5a9-06f8f1f33bf3	\N	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	harrydedji@gmail.com	[UniPath] Bienvenue sur la plateforme	SENT	\N	1	2026-05-28 16:13:25.653	2026-05-28 16:13:25.653	\N	\N	\N	\N	2026-05-28 16:13:25.654	2026-05-28 16:13:25.654	\N	\N	\N	\N
de3b4564-cc52-45d8-9268-520e8a722046	\N	40f13c4d-8b63-443e-8191-0b4df12645fb	themcdhy@gmail.com	[UniPath] Confirmez votre adresse email	FAILED	\N	1	2026-05-14 15:01:21.126	\N	\N	\N	confirmationToken is required	\N	2026-05-14 15:01:21.129	2026-05-14 15:01:21.129	\N	\N	\N	\N
a0750fe0-d7ff-4918-8666-0e4c31c3fad4	\N	40f13c4d-8b63-443e-8191-0b4df12645fb	themcdhy@gmail.com	[UniPath] Confirmez votre adresse email	SENT	\N	1	2026-05-14 15:12:06.388	2026-05-14 15:12:06.388	\N	\N	\N	\N	2026-05-14 15:12:06.39	2026-05-14 15:12:06.39	\N	\N	\N	\N
e1a47bcd-0a18-4540-85cb-9519efa7678c	\N	40f13c4d-8b63-443e-8191-0b4df12645fb	themcdhy@gmail.com	[UniPath] Confirmez votre adresse email	SENT	\N	1	2026-05-14 15:18:39.866	2026-05-14 15:18:39.866	\N	\N	\N	\N	2026-05-14 15:18:39.868	2026-05-14 15:18:39.868	\N	\N	\N	\N
3eba1e65-ffd0-4db2-bbbc-d5a73c3f67a3	\N	40f13c4d-8b63-443e-8191-0b4df12645fb	themcdhy@gmail.com	[UniPath] Bienvenue sur la plateforme	SENT	\N	1	2026-05-14 15:42:51.792	2026-05-14 15:42:51.792	\N	\N	\N	\N	2026-05-14 15:42:51.794	2026-05-14 15:42:51.794	\N	\N	\N	\N
0c750f04-2006-48ab-8f8f-f3b5198bb33f	\N	40f13c4d-8b63-443e-8191-0b4df12645fb	themcdhy@gmail.com	[UniPath] Réinitialisation de votre mot de passe	SENT	\N	1	2026-05-14 17:34:53.977	2026-05-14 17:34:53.977	\N	\N	\N	\N	2026-05-14 17:34:53.981	2026-05-14 17:34:53.981	\N	\N	\N	\N
380e580f-b893-49fa-9fba-4e3516aad0bb	\N	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	thechill000@gmail.com	[UniPath] Confirmez votre adresse email	SENT	\N	1	2026-06-28 08:51:41.678	2026-06-28 08:51:41.678	\N	\N	\N	\N	2026-06-28 08:51:41.679	2026-06-28 08:51:41.679	\N	\N	\N	\N
3b8cd09d-8619-4fee-a630-162fa27b2202	\N	40f13c4d-8b63-443e-8191-0b4df12645fb	themcdhy@gmail.com	[UniPath] Bienvenue sur la plateforme	SENT	<2a07778a-959a-6af7-e294-0c1388c183c2@gmail.com>	1	2026-05-14 15:43:06.02	2026-05-14 15:43:06.02	\N	\N	\N	\N	2026-05-14 15:42:49.132	2026-05-14 15:43:06.021	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Bienvenue sur UniPath</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Rufus DEGBO</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Votre compte a été créé et confirmé avec succès ! Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme UniPath.\n          </p>\n\n          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">\n            <p style="margin: 0; font-size: 14px; color: #374151;"><strong>📧 Email :</strong> themcdhy@gmail.com</p>\n            <p style="margin: 10px 0 0 0; font-size: 14px; color: #374151;"><strong>🎫 Matricule :</strong> UnP-2026-000001</p>\n          </div>\n\n          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>📝 Prochaines étapes :</strong></p>\n            <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #1e40af; font-size: 13px;">\n              <li>Complétez votre profil personnel</li>\n              <li>Déposez vos pièces justificatives</li>\n              <li>Consultez les concours disponibles</li>\n              <li>Inscrivez-vous aux concours de votre choix</li>\n            </ol>\n          </div>\n\n          <div style="text-align: center; margin: 30px 0;">\n            <a href="http://localhost:5173/login" \n               style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">\n              🚀 Accéder à mon compte\n            </a>\n          </div>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025<br/>\n            Pour toute question, contactez-nous à harrydedji@gmail.com\n          </p>\n        </div>\n      </div>\n    	🎓 Bienvenue sur UniPath Bonjour Rufus DEGBO, Votre compte a été créé et confirmé avec succès ! Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme UniPath. 📧 Email : themcdhy@gmail.com 🎫 Matricule : UnP-2026-000001 📝 Prochaines étapes : Complétez votre profil personnel Déposez vos pièces justificatives Consultez les concours disponibles Inscrivez-vous aux concours de votre choix 🚀 Accéder à mon compte Université d'Abomey-Calavi Année Académique 2024-2025 Pour toute question, contactez-nous à harrydedji@gmail.com	null	\N
ce1e162b-0c78-4798-8175-223c2e2d68ae	\N	\N	thechill000@gmail.com	[UniPath] Confirmez votre adresse email	SENT	<8e264fb6-3aed-696c-346f-0c0a22b521f5@gmail.com>	1	2026-06-28 08:51:45.291	2026-06-28 08:51:45.291	\N	\N	\N	\N	2026-06-28 08:51:40.811	2026-06-28 08:51:45.293	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Bienvenue sur UniPath</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Keren FAVI</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, \n            veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :\n          </p>\n\n          <div style="text-align: center; margin: 40px 0;">\n            <a href="http://localhost:5173/auth/confirm?token=1f1bc8d1-5f57-47ae-8b9c-952c45ffde14" \n               style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">\n              ✓ Confirmer mon email\n            </a>\n          </div>\n\n          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>⚠️ Important :</strong></p>\n            <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 13px;">\n              Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature.\n            </p>\n          </div>\n\n          <p style="color:#888; font-size:12px; margin-top: 30px;">\n            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>\n            <a href="http://localhost:5173/auth/confirm?token=1f1bc8d1-5f57-47ae-8b9c-952c45ffde14" style="color: #3b82f6; word-break: break-all; font-size: 11px;">http://localhost:5173/auth/confirm?token=1f1bc8d1-5f57-47ae-8b9c-952c45ffde14</a>\n          </p>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025<br/>\n            Si vous n'avez pas créé de compte, ignorez cet email.\n          </p>\n        </div>\n      </div>\n    	🎓 Bienvenue sur UniPath Bonjour Keren FAVI, Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous : ✓ Confirmer mon email ⚠️ Important : Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature. Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur : http://localhost:5173/auth/confirm?token=1f1bc8d1-5f57-47ae-8b9c-952c45ffde14 Université d'Abomey-Calavi Année Académique 2024-2025 Si vous n'avez pas créé de compte, ignorez cet email.	null	\N
7ee36cd6-1acf-49e7-b00b-a339910fff1b	\N	\N	bkoussedoh@gmail.com	[UniPath] Confirmez votre adresse email	SENT	<383a060f-5561-f41d-b314-cbdafdac5aba@gmail.com>	1	2026-06-18 16:52:06.597	2026-06-18 16:52:06.597	\N	\N	\N	\N	2026-06-18 16:51:58.794	2026-06-18 16:52:06.6	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Bienvenue sur UniPath</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Rémi GLIBA</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, \n            veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :\n          </p>\n\n          <div style="text-align: center; margin: 40px 0;">\n            <a href="http://localhost:5173/auth/confirm?token=0c96a04e-7b97-477e-83db-7971e11e0b37" \n               style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">\n              ✓ Confirmer mon email\n            </a>\n          </div>\n\n          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>⚠️ Important :</strong></p>\n            <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 13px;">\n              Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature.\n            </p>\n          </div>\n\n          <p style="color:#888; font-size:12px; margin-top: 30px;">\n            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>\n            <a href="http://localhost:5173/auth/confirm?token=0c96a04e-7b97-477e-83db-7971e11e0b37" style="color: #3b82f6; word-break: break-all; font-size: 11px;">http://localhost:5173/auth/confirm?token=0c96a04e-7b97-477e-83db-7971e11e0b37</a>\n          </p>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025<br/>\n            Si vous n'avez pas créé de compte, ignorez cet email.\n          </p>\n        </div>\n      </div>\n    	🎓 Bienvenue sur UniPath Bonjour Rémi GLIBA, Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous : ✓ Confirmer mon email ⚠️ Important : Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature. Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur : http://localhost:5173/auth/confirm?token=0c96a04e-7b97-477e-83db-7971e11e0b37 Université d'Abomey-Calavi Année Académique 2024-2025 Si vous n'avez pas créé de compte, ignorez cet email.	null	\N
47681f8d-514c-415d-bdbc-99dce09053ba	\N	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	thechill000@gmail.com	[UniPath] Confirmez votre adresse email	SENT	\N	1	2026-06-28 08:51:52.372	2026-06-28 08:51:52.372	\N	\N	\N	\N	2026-06-28 08:51:52.374	2026-06-28 08:51:52.374	\N	\N	\N	\N
e662ee68-b038-438b-9e0c-360c3db5f8b0	\N	\N	thechill000@gmail.com	[UniPath] Confirmez votre adresse email	SENT	<39481cab-7601-0c60-71ca-770a369ea51c@gmail.com>	1	2026-06-28 08:52:04.078	2026-06-28 08:52:04.078	\N	\N	\N	\N	2026-06-28 08:51:51.493	2026-06-28 08:52:04.08	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Bienvenue sur UniPath</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Keren FAVI</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, \n            veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :\n          </p>\n\n          <div style="text-align: center; margin: 40px 0;">\n            <a href="http://localhost:5173/auth/confirm?token=1f1bc8d1-5f57-47ae-8b9c-952c45ffde14" \n               style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">\n              ✓ Confirmer mon email\n            </a>\n          </div>\n\n          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>⚠️ Important :</strong></p>\n            <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 13px;">\n              Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature.\n            </p>\n          </div>\n\n          <p style="color:#888; font-size:12px; margin-top: 30px;">\n            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>\n            <a href="http://localhost:5173/auth/confirm?token=1f1bc8d1-5f57-47ae-8b9c-952c45ffde14" style="color: #3b82f6; word-break: break-all; font-size: 11px;">http://localhost:5173/auth/confirm?token=1f1bc8d1-5f57-47ae-8b9c-952c45ffde14</a>\n          </p>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025<br/>\n            Si vous n'avez pas créé de compte, ignorez cet email.\n          </p>\n        </div>\n      </div>\n    	🎓 Bienvenue sur UniPath Bonjour Keren FAVI, Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous : ✓ Confirmer mon email ⚠️ Important : Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature. Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur : http://localhost:5173/auth/confirm?token=1f1bc8d1-5f57-47ae-8b9c-952c45ffde14 Université d'Abomey-Calavi Année Académique 2024-2025 Si vous n'avez pas créé de compte, ignorez cet email.	null	\N
89ef662a-a547-4126-a428-a30b1b3c7c8a	\N	4b12fd5d-c098-4b02-b03d-43a0a4b69150	bkoussedoh@gmail.com	[UniPath] Confirmez votre adresse email	FAILED	\N	1	2026-06-18 16:51:59.946	\N	\N	\N	\N	\N	2026-06-18 16:51:59.948	2026-06-18 16:51:59.948	\N	\N	\N	\N
af5d345f-7ffc-4314-bd17-dfc51dae9e8d	\N	4b12fd5d-c098-4b02-b03d-43a0a4b69150	bkoussedoh@gmail.com	[UniPath] Bienvenue sur la plateforme	SENT	<0b7fe017-f00a-3d3d-fee9-46a8a0f28569@gmail.com>	1	2026-06-18 17:00:35.131	2026-06-18 17:00:35.131	\N	\N	\N	\N	2026-06-18 17:00:28.268	2026-06-18 17:00:35.134	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Bienvenue sur UniPath</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Rémi GLIBA</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Votre compte a été créé et confirmé avec succès ! Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme UniPath.\n          </p>\n\n          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">\n            <p style="margin: 0; font-size: 14px; color: #374151;"><strong>📧 Email :</strong> bkoussedoh@gmail.com</p>\n            <p style="margin: 10px 0 0 0; font-size: 14px; color: #374151;"><strong>🎫 Matricule :</strong> UnP-2026-000001</p>\n          </div>\n\n          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>📝 Prochaines étapes :</strong></p>\n            <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #1e40af; font-size: 13px;">\n              <li>Complétez votre profil personnel</li>\n              <li>Déposez vos pièces justificatives</li>\n              <li>Consultez les concours disponibles</li>\n              <li>Inscrivez-vous aux concours de votre choix</li>\n            </ol>\n          </div>\n\n          <div style="text-align: center; margin: 30px 0;">\n            <a href="http://localhost:5173/login" \n               style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">\n              🚀 Accéder à mon compte\n            </a>\n          </div>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025<br/>\n            Pour toute question, contactez-nous à harrydedji@gmail.com\n          </p>\n        </div>\n      </div>\n    	🎓 Bienvenue sur UniPath Bonjour Rémi GLIBA, Votre compte a été créé et confirmé avec succès ! Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme UniPath. 📧 Email : bkoussedoh@gmail.com 🎫 Matricule : UnP-2026-000001 📝 Prochaines étapes : Complétez votre profil personnel Déposez vos pièces justificatives Consultez les concours disponibles Inscrivez-vous aux concours de votre choix 🚀 Accéder à mon compte Université d'Abomey-Calavi Année Académique 2024-2025 Pour toute question, contactez-nous à harrydedji@gmail.com	null	\N
bf19d4e7-0938-4007-b4fc-d144ac4daf77	\N	4b12fd5d-c098-4b02-b03d-43a0a4b69150	bkoussedoh@gmail.com	[UniPath] Bienvenue sur la plateforme	SENT	\N	1	2026-06-18 17:00:29.973	2026-06-18 17:00:29.973	\N	\N	\N	\N	2026-06-18 17:00:29.976	2026-06-18 17:00:29.976	\N	\N	\N	\N
07e8c973-d761-47ee-8dda-f871020e0432	\N	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	thechill000@gmail.com	[UniPath] Bienvenue sur la plateforme	SENT	\N	1	2026-06-28 08:52:41.811	2026-06-28 08:52:41.811	\N	\N	\N	\N	2026-06-28 08:52:41.813	2026-06-28 08:52:41.813	\N	\N	\N	\N
828e2bbf-3b2a-40df-9463-3109f4ea3e53	\N	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	unipathepac@gmail.com	[UniPath] Confirmez votre adresse email	FAILED	\N	1	2026-06-23 08:34:10.822	\N	\N	\N	\N	\N	2026-06-23 08:34:10.826	2026-06-23 08:34:10.826	\N	\N	\N	\N
4ea30939-2a83-4647-b462-cf893c27b4a5	\N	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	thechill000@gmail.com	[UniPath] Bienvenue sur la plateforme	SENT	<9906ba6e-ee71-c749-8362-3234d3e5f90a@gmail.com>	1	2026-06-28 08:52:54.057	2026-06-28 08:52:54.057	\N	\N	\N	\N	2026-06-28 08:52:40.93	2026-06-28 08:52:54.059	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Bienvenue sur UniPath</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Keren FAVI</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Votre compte a été créé et confirmé avec succès ! Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme UniPath.\n          </p>\n\n          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">\n            <p style="margin: 0; font-size: 14px; color: #374151;"><strong>📧 Email :</strong> thechill000@gmail.com</p>\n            <p style="margin: 10px 0 0 0; font-size: 14px; color: #374151;"><strong>🎫 Matricule :</strong> UnP-2026-000007</p>\n          </div>\n\n          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>📝 Prochaines étapes :</strong></p>\n            <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #1e40af; font-size: 13px;">\n              <li>Complétez votre profil personnel</li>\n              <li>Déposez vos pièces justificatives</li>\n              <li>Consultez les concours disponibles</li>\n              <li>Inscrivez-vous aux concours de votre choix</li>\n            </ol>\n          </div>\n\n          <div style="text-align: center; margin: 30px 0;">\n            <a href="http://localhost:5173/login" \n               style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">\n              🚀 Accéder à mon compte\n            </a>\n          </div>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025<br/>\n            Pour toute question, contactez-nous à harrydedji@gmail.com\n          </p>\n        </div>\n      </div>\n    	🎓 Bienvenue sur UniPath Bonjour Keren FAVI, Votre compte a été créé et confirmé avec succès ! Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme UniPath. 📧 Email : thechill000@gmail.com 🎫 Matricule : UnP-2026-000007 📝 Prochaines étapes : Complétez votre profil personnel Déposez vos pièces justificatives Consultez les concours disponibles Inscrivez-vous aux concours de votre choix 🚀 Accéder à mon compte Université d'Abomey-Calavi Année Académique 2024-2025 Pour toute question, contactez-nous à harrydedji@gmail.com	null	\N
249a2e84-7bcf-4522-ae7f-fa9542d7fb83	\N	\N	unipathepac@gmail.com	[UniPath] Confirmez votre adresse email	SENT	<e996830c-9102-0d31-9a34-88508631ea20@gmail.com>	1	2026-06-23 08:34:17.124	2026-06-23 08:34:17.124	\N	\N	\N	\N	2026-06-23 08:34:09.873	2026-06-23 08:34:17.127	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Bienvenue sur UniPath</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Sidney DEVI</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, \n            veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :\n          </p>\n\n          <div style="text-align: center; margin: 40px 0;">\n            <a href="http://localhost:5173/auth/confirm?token=9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f" \n               style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">\n              ✓ Confirmer mon email\n            </a>\n          </div>\n\n          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>⚠️ Important :</strong></p>\n            <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 13px;">\n              Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature.\n            </p>\n          </div>\n\n          <p style="color:#888; font-size:12px; margin-top: 30px;">\n            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>\n            <a href="http://localhost:5173/auth/confirm?token=9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f" style="color: #3b82f6; word-break: break-all; font-size: 11px;">http://localhost:5173/auth/confirm?token=9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f</a>\n          </p>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025<br/>\n            Si vous n'avez pas créé de compte, ignorez cet email.\n          </p>\n        </div>\n      </div>\n    	🎓 Bienvenue sur UniPath Bonjour Sidney DEVI, Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous : ✓ Confirmer mon email ⚠️ Important : Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature. Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur : http://localhost:5173/auth/confirm?token=9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f Université d'Abomey-Calavi Année Académique 2024-2025 Si vous n'avez pas créé de compte, ignorez cet email.	null	\N
839cdc4b-1423-4c7f-9513-018c46b79a21	\N	8b6f294e-f2b8-4611-82f7-63d59df1804a	test_candidat_1782243949123@example.com	[UniPath] Confirmez votre adresse email	FAILED	\N	1	2026-06-23 19:45:59.034	\N	\N	\N	\N	\N	2026-06-23 19:45:59.038	2026-06-23 19:45:59.038	\N	\N	\N	\N
9f1640ba-d57e-4a3a-9cda-ccbecde11713	\N	\N	test_candidat_1782243949123@example.com	[UniPath] Confirmez votre adresse email	SENT	<c98b4e6a-1516-90f7-32e9-c6b53fd66e1a@gmail.com>	1	2026-06-23 19:46:45.614	2026-06-23 19:46:45.614	\N	\N	\N	\N	2026-06-23 19:45:58.082	2026-06-23 19:46:45.623	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Bienvenue sur UniPath</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>TestPrenom TestNom</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, \n            veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :\n          </p>\n\n          <div style="text-align: center; margin: 40px 0;">\n            <a href="http://localhost:5173/auth/confirm?token=8b6f294e-f2b8-4611-82f7-63d59df1804a" \n               style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">\n              ✓ Confirmer mon email\n            </a>\n          </div>\n\n          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>⚠️ Important :</strong></p>\n            <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 13px;">\n              Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature.\n            </p>\n          </div>\n\n          <p style="color:#888; font-size:12px; margin-top: 30px;">\n            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>\n            <a href="http://localhost:5173/auth/confirm?token=8b6f294e-f2b8-4611-82f7-63d59df1804a" style="color: #3b82f6; word-break: break-all; font-size: 11px;">http://localhost:5173/auth/confirm?token=8b6f294e-f2b8-4611-82f7-63d59df1804a</a>\n          </p>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025<br/>\n            Si vous n'avez pas créé de compte, ignorez cet email.\n          </p>\n        </div>\n      </div>\n    	🎓 Bienvenue sur UniPath Bonjour TestPrenom TestNom, Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous : ✓ Confirmer mon email ⚠️ Important : Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature. Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur : http://localhost:5173/auth/confirm?token=8b6f294e-f2b8-4611-82f7-63d59df1804a Université d'Abomey-Calavi Année Académique 2024-2025 Si vous n'avez pas créé de compte, ignorez cet email.	null	\N
c9b52cb9-cd85-4f3f-9675-bcb97869f6b3	\N	34c03c09-c954-48f0-8b3b-ae670ba5220e	vignonkanlinhanon5@gmail.com	[UniPath] Confirmez votre adresse email	FAILED	\N	1	2026-06-23 19:48:18.85	\N	\N	\N	\N	\N	2026-06-23 19:48:18.851	2026-06-23 19:48:18.851	\N	\N	\N	\N
81a32f9b-802d-4db8-a17d-7fd7d9e38b9a	\N	\N	vignonkanlinhanon5@gmail.com	[UniPath] Confirmez votre adresse email	SENT	<b31a804e-4953-2c7f-f247-c29ee70a4e9f@gmail.com>	1	2026-06-23 19:48:24.808	2026-06-23 19:48:24.808	\N	\N	\N	\N	2026-06-23 19:48:17.926	2026-06-23 19:48:24.81	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Bienvenue sur UniPath</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Vignon KANLINHANON</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, \n            veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :\n          </p>\n\n          <div style="text-align: center; margin: 40px 0;">\n            <a href="http://localhost:5173/auth/confirm?token=34c03c09-c954-48f0-8b3b-ae670ba5220e" \n               style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">\n              ✓ Confirmer mon email\n            </a>\n          </div>\n\n          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>⚠️ Important :</strong></p>\n            <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 13px;">\n              Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature.\n            </p>\n          </div>\n\n          <p style="color:#888; font-size:12px; margin-top: 30px;">\n            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>\n            <a href="http://localhost:5173/auth/confirm?token=34c03c09-c954-48f0-8b3b-ae670ba5220e" style="color: #3b82f6; word-break: break-all; font-size: 11px;">http://localhost:5173/auth/confirm?token=34c03c09-c954-48f0-8b3b-ae670ba5220e</a>\n          </p>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025<br/>\n            Si vous n'avez pas créé de compte, ignorez cet email.\n          </p>\n        </div>\n      </div>\n    	🎓 Bienvenue sur UniPath Bonjour Vignon KANLINHANON, Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous : ✓ Confirmer mon email ⚠️ Important : Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature. Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur : http://localhost:5173/auth/confirm?token=34c03c09-c954-48f0-8b3b-ae670ba5220e Université d'Abomey-Calavi Année Académique 2024-2025 Si vous n'avez pas créé de compte, ignorez cet email.	null	\N
a7599984-fa9b-49a7-bf77-f3aef86c438b	\N	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	unipathepac@gmail.com	[UniPath] Confirmez votre adresse email	SENT	\N	1	2026-06-23 19:54:02.514	2026-06-23 19:54:02.514	\N	\N	\N	\N	2026-06-23 19:54:02.516	2026-06-23 19:54:02.516	\N	\N	\N	\N
1d37d902-7eaf-4c02-970c-4a0b7d6e0a14	\N	\N	unipathepac@gmail.com	[UniPath] Confirmez votre adresse email	SENT	<3821a825-40b5-faa0-4a7d-f4d4d7a8b849@gmail.com>	1	2026-06-23 19:54:20.032	2026-06-23 19:54:20.032	\N	\N	\N	\N	2026-06-23 19:54:01.439	2026-06-23 19:54:20.039	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Bienvenue sur UniPath</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Sidney DEVI</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, \n            veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :\n          </p>\n\n          <div style="text-align: center; margin: 40px 0;">\n            <a href="http://localhost:5173/auth/confirm?token=9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f" \n               style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">\n              ✓ Confirmer mon email\n            </a>\n          </div>\n\n          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>⚠️ Important :</strong></p>\n            <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 13px;">\n              Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature.\n            </p>\n          </div>\n\n          <p style="color:#888; font-size:12px; margin-top: 30px;">\n            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>\n            <a href="http://localhost:5173/auth/confirm?token=9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f" style="color: #3b82f6; word-break: break-all; font-size: 11px;">http://localhost:5173/auth/confirm?token=9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f</a>\n          </p>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025<br/>\n            Si vous n'avez pas créé de compte, ignorez cet email.\n          </p>\n        </div>\n      </div>\n    	🎓 Bienvenue sur UniPath Bonjour Sidney DEVI, Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous : ✓ Confirmer mon email ⚠️ Important : Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature. Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur : http://localhost:5173/auth/confirm?token=9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f Université d'Abomey-Calavi Année Académique 2024-2025 Si vous n'avez pas créé de compte, ignorez cet email.	null	\N
5812c933-8b9d-4463-bc3d-321c8bce6de2	\N	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	unipathepac@gmail.com	[UniPath] Bienvenue sur la plateforme	SENT	\N	1	2026-06-23 19:57:26.834	2026-06-23 19:57:26.834	\N	\N	\N	\N	2026-06-23 19:57:26.838	2026-06-23 19:57:26.838	\N	\N	\N	\N
1e682b45-f8ae-48ea-b693-29ae0824b08f	\N	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	unipathepac@gmail.com	[UniPath] Bienvenue sur la plateforme	SENT	<ef3a9824-d6f1-026b-6a12-77fefdd50945@gmail.com>	1	2026-06-23 19:57:34.787	2026-06-23 19:57:34.787	\N	\N	\N	\N	2026-06-23 19:57:25.9	2026-06-23 19:57:34.788	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Bienvenue sur UniPath</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Sidney DEVI</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Votre compte a été créé et confirmé avec succès ! Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme UniPath.\n          </p>\n\n          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">\n            <p style="margin: 0; font-size: 14px; color: #374151;"><strong>📧 Email :</strong> unipathepac@gmail.com</p>\n            <p style="margin: 10px 0 0 0; font-size: 14px; color: #374151;"><strong>🎫 Matricule :</strong> UnP-2026-000004</p>\n          </div>\n\n          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>📝 Prochaines étapes :</strong></p>\n            <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #1e40af; font-size: 13px;">\n              <li>Complétez votre profil personnel</li>\n              <li>Déposez vos pièces justificatives</li>\n              <li>Consultez les concours disponibles</li>\n              <li>Inscrivez-vous aux concours de votre choix</li>\n            </ol>\n          </div>\n\n          <div style="text-align: center; margin: 30px 0;">\n            <a href="http://localhost:5173/login" \n               style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">\n              🚀 Accéder à mon compte\n            </a>\n          </div>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025<br/>\n            Pour toute question, contactez-nous à harrydedji@gmail.com\n          </p>\n        </div>\n      </div>\n    	🎓 Bienvenue sur UniPath Bonjour Sidney DEVI, Votre compte a été créé et confirmé avec succès ! Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme UniPath. 📧 Email : unipathepac@gmail.com 🎫 Matricule : UnP-2026-000004 📝 Prochaines étapes : Complétez votre profil personnel Déposez vos pièces justificatives Consultez les concours disponibles Inscrivez-vous aux concours de votre choix 🚀 Accéder à mon compte Université d'Abomey-Calavi Année Académique 2024-2025 Pour toute question, contactez-nous à harrydedji@gmail.com	null	\N
a83e4c4a-ffc9-4465-a588-f78c846448ad	\N	2ceb478d-1a3b-49e7-a64c-bab998d8aa3f	dhvrris@gmail.com	UniPath — Accès administrateur Ecole Superieure Africaine des TIC	SENT	<8955fb17-959d-52b7-5773-0d57f664e6a2@gmail.com>	1	2026-06-24 12:36:56.204	2026-06-24 12:36:56.204	\N	\N	\N	\N	2026-06-24 12:36:43.589	2026-06-24 12:36:56.209	\n          <h2>Bienvenue sur UniPath</h2>\n          <p>Bonjour Girès DJIMON,</p>\n          <p>Un compte administrateur a été créé pour l'établissement <strong>Ecole Superieure Africaine des TIC</strong>.</p>\n          <p><strong>Email :</strong> dhvrris@gmail.com</p>\n          <p><strong>Mot de passe temporaire :</strong> a5BBVthZPMIf</p>\n          <p>Connectez-vous sur <a href="http://localhost:5173/login">http://localhost:5173/login</a> et changez votre mot de passe dès la première connexion.</p>\n        	Bonjour Girès DJIMON, votre compte admin UniPath pour Ecole Superieure Africaine des TIC : email dhvrris@gmail.com, mot de passe temporaire a5BBVthZPMIf. Connexion : http://localhost:5173/login	null	\N
60d3a6f3-c203-4758-a155-61f5e55f7a21	ea670273-7061-4147-a78c-e3de4f9aff49	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	unipathepac@gmail.com	[UniPath] Confirmation de votre pré-inscription	SENT	\N	0	\N	2026-06-24 10:53:29.787	\N	\N	\N	\N	2026-06-24 10:53:29.788	2026-06-24 10:53:29.788	\N	\N	\N	\N
642f7db7-ca90-418d-9888-719fb7a04243	\N	3e1050d6-a7b8-47d6-8142-68a6ce1e3de8	forfait199@gmail.com	UniPath — Accès administrateur Pigier Bénin	SENT	<6fe1196a-2001-bb85-a524-6ab8fc0e8a67@gmail.com>	1	2026-06-28 14:55:14.489	2026-06-28 14:55:14.489	\N	\N	\N	\N	2026-06-28 14:55:05.13	2026-06-28 14:55:14.49	\n          <h2>Bienvenue sur UniPath</h2>\n          <p>Bonjour Marcos ALI,</p>\n          <p>Un compte administrateur a été créé pour l'établissement <strong>Pigier Bénin</strong>.</p>\n          <p><strong>Email :</strong> forfait199@gmail.com</p>\n          <p><strong>Mot de passe temporaire :</strong> zTt_V8LsL2oi</p>\n          <p><strong>Validité :</strong> 48 heures à compter de la réception de cet email.</p>\n          <p>Connectez-vous sur <a href="http://localhost:5173/login">http://localhost:5173/login</a>. Vous devrez <strong>immédiatement définir un mot de passe personnel</strong> (le temporaire ne sera plus utilisable ensuite).</p>\n        	Bonjour Marcos ALI, votre compte admin UniPath pour Pigier Bénin : email forfait199@gmail.com, mot de passe temporaire zTt_V8LsL2oi (valable 48h). Connexion : http://localhost:5173/login. Vous devrez définir un mot de passe personnel à la première connexion.	null	\N
411a55be-90e5-4440-9701-c6fc1537256e	\N	\N	unipathepac@gmail.com	[UniPath] Confirmation de votre pré-inscription	SENT	<4a127ad0-8b38-8f99-ad6a-8162812a33f9@gmail.com>	1	2026-06-24 10:53:37.023	2026-06-24 10:53:37.023	\N	\N	\N	\N	2026-06-24 10:53:28.776	2026-06-24 10:53:37.025	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">✅ Pré-inscription confirmée</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Sidney DEVI</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Votre pré-inscription au concours <strong>Concours EPAC 2026 - Génie Civil</strong> a bien été enregistrée.\n          </p>\n\n          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">\n            <p style="margin: 0; font-size: 14px; color: #374151;"><strong>📋 Concours :</strong> Concours EPAC 2026 - Génie Civil</p>\n            <p style="margin: 10px 0 0 0; font-size: 14px; color: #374151;"><strong>🎫 Numéro de dossier :</strong> INS-2026-000001</p>\n          </div>\n\n          \n            <div style="background: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">\n              <p style="margin: 0; color: #166534; font-size: 14px;">\n                <strong>📎 Fiche de pré-inscription jointe</strong><br/>\n                <span style="font-size: 13px;">Votre fiche de pré-inscription est jointe à cet email.</span>\n              </p>\n            </div>\n          \n\n          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>📌 Prochaines étapes :</strong></p>\n            <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 13px;">\n              La commission étudiera votre dossier et vous serez notifié par email de la décision.\n            </p>\n          </div>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025\n          </p>\n        </div>\n      </div>\n    	✅ Pré-inscription confirmée Bonjour Sidney DEVI, Votre pré-inscription au concours Concours EPAC 2026 - Génie Civil a bien été enregistrée. 📋 Concours : Concours EPAC 2026 - Génie Civil 🎫 Numéro de dossier : INS-2026-000001 📎 Fiche de pré-inscription jointe Votre fiche de pré-inscription est jointe à cet email. 📌 Prochaines étapes : La commission étudiera votre dossier et vous serez notifié par email de la décision. Université d'Abomey-Calavi Année Académique 2024-2025	[{"path": "C:\\\\Users\\\\ELITEBOOK 840 G5\\\\unipath-mvp\\\\unipath-api\\\\temp\\\\fiche-preinscription-INS-2026-000001.pdf", "filename": "fiche-preinscription-INS-2026-000001.pdf"}]	\N
2666819b-79be-4b6d-b542-52661e371729	\N	6a2e2a2f-b49e-4dc1-b8e3-3e26fa46eedc	forsuree15@gmail.com	UniPath — Accès examinateur EPAC	SENT	<e199b19c-dcfb-2ffd-eab2-b6d2d7e38e51@gmail.com>	1	2026-07-02 07:55:17.269	2026-07-02 07:55:17.269	\N	\N	\N	\N	2026-07-02 07:55:01.022	2026-07-02 07:55:17.27	\n          <h2>Bienvenue sur UniPath</h2>\n          <p>Bonjour Paul FASSINOU,</p>\n          <p>Un compte <strong>examinateur</strong> a été créé pour la commission de l'établissement <strong>EPAC</strong>.</p>\n          <p><strong>Email :</strong> forsuree15@gmail.com</p>\n          <p><strong>Mot de passe temporaire :</strong> XDEx96H2c7zd</p>\n          <p><strong>Validité :</strong> 48 heures.</p>\n          <p>Connectez-vous sur <a href="http://localhost:5173/login">http://localhost:5173/login</a> puis définissez votre mot de passe personnel.</p>\n        	Bonjour Paul FASSINOU, compte examinateur UniPath pour EPAC : forsuree15@gmail.com / XDEx96H2c7zd (valable 48h). Connexion : http://localhost:5173/login	null	\N
e8fc40a9-79fe-4d68-aee6-54633236c5d1	\N	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	unipathepac@gmail.com	[UniPath] 🎉 Convocation au concours Concours EPAC 2026 - Génie Civil	SENT	<9d555750-977f-3fac-7d3b-171a0cb674cf@gmail.com>	1	2026-06-24 11:50:36.483	2026-06-24 11:50:36.483	\N	\N	\N	\N	2026-06-24 11:50:28.881	2026-06-24 11:50:36.484	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #16a34a 0%, #008751 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Dossier validé !</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Sidney DEVI</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Félicitations ! Votre dossier pour le concours <strong>Concours EPAC 2026 - Génie Civil</strong> a été validé par la commission.\n          </p>\n\n          <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #16a34a;">\n            <p style="margin: 0; font-size: 14px; color: #166534;"><strong>🎫 Numéro de dossier :</strong> INS-2026-000001</p>\n            <p style="margin: 10px 0 0 0; font-size: 14px; color: #166534;"><strong>📅 Date de l'examen :</strong> 29/06/2026</p>\n            <p style="margin: 10px 0 0 0; font-size: 14px; color: #166534;"><strong>📍 Lieu :</strong> EPAC</p>\n          </div>\n\n          \n            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">\n              <p style="margin: 0; color: #1e40af; font-size: 14px;">\n                <strong>📎 Convocation officielle jointe</strong><br/>\n                <span style="font-size: 13px;">Votre convocation officielle est jointe à cet email.</span>\n              </p>\n            </div>\n          \n\n          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #991b1b; font-size: 14px;">\n              <strong>⚠️ Important :</strong><br/>\n              <span style="font-size: 13px;">Présentez-vous avec cette convocation et une pièce d'identité valide le jour de l'examen.</span>\n            </p>\n          </div>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025<br/>\n            Bonne chance pour votre concours !\n          </p>\n        </div>\n      </div>\n    	🎉 Dossier validé ! Bonjour Sidney DEVI, Félicitations ! Votre dossier pour le concours Concours EPAC 2026 - Génie Civil a été validé par la commission. 🎫 Numéro de dossier : INS-2026-000001 📅 Date de l'examen : 29/06/2026 📍 Lieu : EPAC 📎 Convocation officielle jointe Votre convocation officielle est jointe à cet email. ⚠️ Important : Présentez-vous avec cette convocation et une pièce d'identité valide le jour de l'examen. Université d'Abomey-Calavi Année Académique 2024-2025 Bonne chance pour votre concours !	[{"path": "C:\\\\Users\\\\ELITEBOOK 840 G5\\\\unipath-mvp\\\\unipath-api\\\\temp\\\\convocation-UnP-2026-000004.pdf", "filename": "convocation-DEVI-Sidney.pdf"}]	\N
4a33bca1-4709-4a99-be71-376f7809a27b	\N	d953f6f7-2cb6-445d-9356-f51141f6916c	jerzeyshop8@gmail.com	UniPath — Accès administrateur Ecole Superieure Africaine des TIC	SENT	<5604f9a8-fbac-4313-8cec-3b32d36c1cb4@gmail.com>	1	2026-06-24 12:32:35.597	2026-06-24 12:32:35.597	\N	\N	\N	\N	2026-06-24 12:32:20.177	2026-06-24 12:32:35.599	\n          <h2>Bienvenue sur UniPath</h2>\n          <p>Bonjour Didier DIGBA,</p>\n          <p>Un compte administrateur a été créé pour l'établissement <strong>Ecole Superieure Africaine des TIC</strong>.</p>\n          <p><strong>Email :</strong> jerzeyshop8@gmail.com</p>\n          <p><strong>Mot de passe temporaire :</strong> IlPN2d6tPPjt</p>\n          <p>Connectez-vous sur <a href="http://localhost:5173/login">http://localhost:5173/login</a> et changez votre mot de passe dès la première connexion.</p>\n        	Bonjour Didier DIGBA, votre compte admin UniPath pour Ecole Superieure Africaine des TIC : email jerzeyshop8@gmail.com, mot de passe temporaire IlPN2d6tPPjt. Connexion : http://localhost:5173/login	null	\N
78155819-a6e3-4ddb-b2b9-679159be7890	b5b8b88d-f691-437e-9a08-48e4993df521	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	thechill000@gmail.com	[UniPath] Confirmation de votre pré-inscription	SENT	\N	0	\N	2026-07-01 12:42:23.351	\N	\N	\N	\N	2026-07-01 12:42:23.352	2026-07-01 12:42:23.352	\N	\N	\N	\N
75b93f67-df04-49e8-838b-78dd9dd047c4	\N	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	thechill000@gmail.com	[UniPath] ⚠️ Dossier accepté sous réserve - Concours ENSPD 2026	SENT	<f9f4ff3c-4348-22ef-df35-91299d664265@gmail.com>	1	2026-07-02 06:08:05.355	2026-07-02 06:08:05.355	\N	\N	\N	\N	2026-07-02 06:07:53.944	2026-07-02 06:08:05.357	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Dossier accepté sous réserve</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Keren FAVI</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Votre dossier pour le concours <strong>Concours ENSPD 2026</strong> a été accepté sous réserve par la commission.\n          </p>\n\n          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">\n            <p style="margin: 0; font-size: 14px; color: #374151;"><strong>🎫 Numéro de dossier :</strong> INS-2026-000003</p>\n          </div>\n\n          <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #9a3412; font-size: 14px;"><strong>📋 Conditions à remplir :</strong></p>\n            <p style="margin: 10px 0 0 0; color: #9a3412; font-size: 13px;">La carte d&#x27;identité n&#x27;est pas conforme</p>\n          </div>\n\n          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #991b1b; font-size: 14px;">\n              <strong>⚠️ Action requise :</strong><br/>\n              <span style="font-size: 13px;">Vous devez régulariser votre situation avant le <strong>04/07/2026</strong> (48 heures). Veuillez compléter ou corriger les éléments mentionnés ci-dessus dans les plus brefs délais.</span>\n            </p>\n          </div>\n\n          <div style="text-align: center; margin: 30px 0;">\n            <a href="http://localhost:5173/inscription/92cbd1d5-ffcc-4069-99e5-6a9c16ab596f"\n               style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">\n              Compléter mon dossier\n            </a>\n          </div>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025\n          </p>\n        </div>\n      </div>\n    	⚠️ Dossier accepté sous réserve Bonjour Keren FAVI, Votre dossier pour le concours Concours ENSPD 2026 a été accepté sous réserve par la commission. 🎫 Numéro de dossier : INS-2026-000003 📋 Conditions à remplir : La carte d&#x27;identité n&#x27;est pas conforme ⚠️ Action requise : Vous devez régulariser votre situation avant le 04/07/2026 (48 heures). Veuillez compléter ou corriger les éléments mentionnés ci-dessus dans les plus brefs délais. Compléter mon dossier Université d'Abomey-Calavi Année Académique 2024-2025	null	\N
01c2f0b3-c003-4b29-9175-1b0bab596ed6	\N	\N	thechill000@gmail.com	[UniPath] Confirmation de votre pré-inscription	FAILED	\N	6	2026-07-02 09:32:54.065	\N	\N	\N	ENOENT: no such file or directory, open 'C:\\Users\\ELITEBOOK 840 G5\\unipath-mvp\\unipath-api\\temp\\fiche-preinscription-INS-2026-000002.pdf'	ESTREAM	2026-07-01 12:42:22.519	2026-07-02 09:32:54.066	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">✅ Pré-inscription confirmée</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Keren FAVI</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Votre pré-inscription au concours <strong>Concours INSPEI 2026</strong> a bien été enregistrée.\n          </p>\n\n          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">\n            <p style="margin: 0; font-size: 14px; color: #374151;"><strong>📋 Concours :</strong> Concours INSPEI 2026</p>\n            <p style="margin: 10px 0 0 0; font-size: 14px; color: #374151;"><strong>🎫 Numéro de dossier :</strong> INS-2026-000002</p>\n          </div>\n\n          \n            <div style="background: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">\n              <p style="margin: 0; color: #166534; font-size: 14px;">\n                <strong>📎 Fiche de pré-inscription jointe</strong><br/>\n                <span style="font-size: 13px;">Votre fiche de pré-inscription est jointe à cet email.</span>\n              </p>\n            </div>\n          \n\n          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>📌 Prochaines étapes :</strong></p>\n            <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 13px;">\n              La commission étudiera votre dossier et vous serez notifié par email de la décision.\n            </p>\n          </div>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025\n          </p>\n        </div>\n      </div>\n    	✅ Pré-inscription confirmée Bonjour Keren FAVI, Votre pré-inscription au concours Concours INSPEI 2026 a bien été enregistrée. 📋 Concours : Concours INSPEI 2026 🎫 Numéro de dossier : INS-2026-000002 📎 Fiche de pré-inscription jointe Votre fiche de pré-inscription est jointe à cet email. 📌 Prochaines étapes : La commission étudiera votre dossier et vous serez notifié par email de la décision. Université d'Abomey-Calavi Année Académique 2024-2025	[{"path": "C:\\\\Users\\\\ELITEBOOK 840 G5\\\\unipath-mvp\\\\unipath-api\\\\temp\\\\fiche-preinscription-INS-2026-000002.pdf", "filename": "fiche-preinscription-INS-2026-000002.pdf"}]	\N
224d5ec9-4a39-4325-bf2c-0afc44c2628c	\N	\N	thechill000@gmail.com	[UniPath] Confirmation de votre pré-inscription	FAILED	\N	6	2026-07-02 11:18:04.072	\N	\N	\N	ENOENT: no such file or directory, open 'C:\\Users\\ELITEBOOK 840 G5\\unipath-mvp\\unipath-api\\temp\\fiche-preinscription-INS-2026-000003.pdf'	ESTREAM	2026-07-02 05:55:19.463	2026-07-02 11:18:04.074	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">✅ Pré-inscription confirmée</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Keren FAVI</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Votre pré-inscription au concours <strong>Concours ENSPD 2026</strong> a bien été enregistrée.\n          </p>\n\n          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">\n            <p style="margin: 0; font-size: 14px; color: #374151;"><strong>📋 Concours :</strong> Concours ENSPD 2026</p>\n            <p style="margin: 10px 0 0 0; font-size: 14px; color: #374151;"><strong>🎫 Numéro de dossier :</strong> INS-2026-000003</p>\n          </div>\n\n          \n            <div style="background: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">\n              <p style="margin: 0; color: #166534; font-size: 14px;">\n                <strong>📎 Fiche de pré-inscription jointe</strong><br/>\n                <span style="font-size: 13px;">Votre fiche de pré-inscription est jointe à cet email.</span>\n              </p>\n            </div>\n          \n\n          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>📌 Prochaines étapes :</strong></p>\n            <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 13px;">\n              La commission étudiera votre dossier et vous serez notifié par email de la décision.\n            </p>\n          </div>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025\n          </p>\n        </div>\n      </div>\n    	✅ Pré-inscription confirmée Bonjour Keren FAVI, Votre pré-inscription au concours Concours ENSPD 2026 a bien été enregistrée. 📋 Concours : Concours ENSPD 2026 🎫 Numéro de dossier : INS-2026-000003 📎 Fiche de pré-inscription jointe Votre fiche de pré-inscription est jointe à cet email. 📌 Prochaines étapes : La commission étudiera votre dossier et vous serez notifié par email de la décision. Université d'Abomey-Calavi Année Académique 2024-2025	[{"path": "C:\\\\Users\\\\ELITEBOOK 840 G5\\\\unipath-mvp\\\\unipath-api\\\\temp\\\\fiche-preinscription-INS-2026-000003.pdf", "filename": "fiche-preinscription-INS-2026-000003.pdf"}]	\N
a35b6385-caf2-4268-aee5-b2875fdbaec0	a74aa66d-e2ce-46ac-b012-c9adb6c0247b	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	thechill000@gmail.com	[UniPath] Confirmation de votre pré-inscription	SENT	\N	0	\N	2026-07-02 05:55:20.495	\N	\N	\N	\N	2026-07-02 05:55:20.496	2026-07-02 05:55:20.496	\N	\N	\N	\N
fe72cd9b-18e6-4b0b-b13d-0b3011b2d447	\N	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	thechill000@gmail.com	[UniPath] 🎉 Convocation au concours Concours ENSPD 2026	SENT	<5134d907-3f13-c33b-7edf-e5d4abd25bcd@gmail.com>	1	2026-07-02 07:11:55.675	2026-07-02 07:11:55.675	\N	\N	\N	\N	2026-07-02 07:11:49.585	2026-07-02 07:11:55.677	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #16a34a 0%, #008751 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Dossier validé !</h1>\n        </div>\n        \n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Keren FAVI</strong>,</p>\n          \n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Félicitations ! Votre dossier pour le concours <strong>Concours ENSPD 2026</strong> a été validé par la commission.\n          </p>\n\n          <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #16a34a;">\n            <p style="margin: 0; font-size: 14px; color: #166534;"><strong>🎫 Numéro de dossier :</strong> INS-2026-000003</p>\n            <p style="margin: 10px 0 0 0; font-size: 14px; color: #166534;"><strong>📅 Date de l'examen :</strong> 29/08/2026</p>\n            <p style="margin: 10px 0 0 0; font-size: 14px; color: #166534;"><strong>📍 Lieu :</strong> Ecole Nationale de la Statistique, de la Planification et de la Demographie (ENSPD) - Universite de Parakou - Parakou</p>\n          </div>\n\n          \n            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">\n              <p style="margin: 0; color: #1e40af; font-size: 14px;">\n                <strong>📎 Convocation officielle jointe</strong><br/>\n                <span style="font-size: 13px;">Votre convocation officielle est jointe à cet email.</span>\n              </p>\n            </div>\n          \n\n          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #991b1b; font-size: 14px;">\n              <strong>⚠️ Important :</strong><br/>\n              <span style="font-size: 13px;">Présentez-vous avec cette convocation et une pièce d'identité valide le jour de l'examen.</span>\n            </p>\n          </div>\n\n          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>\n          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">\n            <strong>Université d'Abomey-Calavi</strong><br/>\n            Année Académique 2024-2025<br/>\n            Bonne chance pour votre concours !\n          </p>\n        </div>\n      </div>\n    	🎉 Dossier validé ! Bonjour Keren FAVI, Félicitations ! Votre dossier pour le concours Concours ENSPD 2026 a été validé par la commission. 🎫 Numéro de dossier : INS-2026-000003 📅 Date de l'examen : 29/08/2026 📍 Lieu : Ecole Nationale de la Statistique, de la Planification et de la Demographie (ENSPD) - Universite de Parakou - Parakou 📎 Convocation officielle jointe Votre convocation officielle est jointe à cet email. ⚠️ Important : Présentez-vous avec cette convocation et une pièce d'identité valide le jour de l'examen. Université d'Abomey-Calavi Année Académique 2024-2025 Bonne chance pour votre concours !	[{"path": "C:\\\\Users\\\\ELITEBOOK 840 G5\\\\unipath-mvp\\\\unipath-api\\\\temp\\\\convocation-UnP-2026-000007.pdf", "filename": "convocation-FAVI-Keren.pdf"}]	\N
ba2306b0-2961-475a-a651-e81227e5eec7	\N	20a05243-32ba-41d2-b61f-635df62e2173	examinateur2@test.com	[UniPath] Retour sur votre évaluation — arbitrage divergent (INS-2026-000003)	SENT	<6aae23cc-4a20-20d5-66c3-3a7e8815cbd0@gmail.com>	1	2026-07-02 07:11:54.351	2026-07-02 07:11:54.351	\N	\N	\N	\N	2026-07-02 07:11:41.496	2026-07-02 07:11:54.355	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center;">\n          <h1 style="color: white; margin: 0; font-size: 24px;">Arbitrage divergent</h1>\n        </div>\n        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">\n          <p style="font-size: 16px; color: #374151;">Bonjour <strong>Examinateur2 TEST</strong>,</p>\n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Le contrôleur a rendu une décision différente de la vôtre sur le dossier\n            <strong>INS-2026-000003</strong> (Concours ENSPD 2026).\n          </p>\n          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 14px;">\n            <p style="margin: 0 0 8px 0;"><strong>Votre verdict :</strong> Sous réserve</p>\n            <p style="margin: 0;"><strong>Décision du contrôleur :</strong> Validé</p>\n          </div>\n          <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">\n            <p style="margin: 0; color: #9a3412; font-size: 14px;"><strong>Motif du contrôleur :</strong></p>\n            <p style="margin: 10px 0 0 0; color: #9a3412; font-size: 13px; white-space: pre-wrap;">Il  a corrigé le dossier et j'ai validé</p>\n          </div>\n          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">\n            Ce retour vous est transmis pour que vous puissiez en tenir compte dans vos prochaines évaluations.\n          </p>\n          <div style="text-align: center; margin: 30px 0;">\n            <a href="http://localhost:5173/examinateur/dossiers"\n               style="background: #1e3a8a; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">\n              Accéder à mes dossiers\n            </a>\n          </div>\n        </div>\n      </div>\n    	Arbitrage divergent Bonjour Examinateur2 TEST, Le contrôleur a rendu une décision différente de la vôtre sur le dossier INS-2026-000003 (Concours ENSPD 2026). Votre verdict : Sous réserve Décision du contrôleur : Validé Motif du contrôleur : Il a corrigé le dossier et j'ai validé Ce retour vous est transmis pour que vous puissiez en tenir compte dans vos prochaines évaluations. Accéder à mes dossiers	null	\N
\.


--
-- Data for Name: Etablissement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Etablissement" (id, nom, type, ville, "createdAt", adresse, email, "matriculeFormat", telephone, "siteWeb", description, "agrementMESRS", "anneeCreation", "logoUrl", facebook, instagram, linkedin) FROM stdin;
a0473338-5942-40cd-b6b3-fcde17b7889b	ESGT Benin	PRIVE	Cotonou	2026-05-26 19:03:30.24	Cotonou, Benin	contact@esgt.bj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
520e3096-707c-4646-97d5-7514df97676f	École Supérieure de Gestion et de Technologie du Bénin	PRIVE	Cotonou	2026-06-26 13:42:50.765	Avenue Jean-Paul II, Cotonou	contact@esgt-benin.bj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b1e3926a-2029-4ccb-9667-9e53b8f1534d	École Supérieure de Gestion, d'Informatique et des Sciences	PRIVE	Cotonou	2026-06-26 13:42:58.215	Quartier Gbégamey, Cotonou	contact@esgis.bj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2521c204-eb38-4056-ade2-45e61ef858b7	Hautes Études Commerciales et de Management	PRIVE	Cotonou	2026-06-26 13:43:05.064	Rue du Commerce, Cotonou	contact@hecm.bj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c0b4f455-c9af-440f-b891-1fde018b7998	Institut Supérieur de Management du Bénin	PRIVE	Porto-Novo	2026-06-26 13:43:10.815	Avenue des Martyrs, Porto-Novo	contact@ism-benin.bj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1e3dd9e9-2ac9-48c5-8c87-13f63eb02038	École Supérieure de Commerce et d'Administration des Entreprises	PRIVE	Cotonou	2026-06-26 13:43:22.662	Quartier Akpakpa, Cotonou	contact@escae-benin.bj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ca83cd26-daaa-4ad0-a359-c2e5b638823f	École Supérieure de Management et d'Administration	PRIVE	Cotonou	2026-06-26 13:43:28.973	Quartier Fidjrossè, Cotonou	contact@esma-benin.bj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e81c0f9c-1a75-41c9-9f53-77776c11ccd9	École Supérieure d'Administration et d'Économie	PRIVE	Cotonou	2026-06-28 07:09:13.507	Atinkanmey, Quartier Gbèdjromèdé, Cotonou	contact@esae.bj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
696e24e5-ffbf-4246-bc57-9db5eff6afef	EPAC	PUBLIC	Abomey-Calavi	2026-07-01 01:56:49.143	Université d'Abomey-Calavi	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c515a381-52d1-4edd-8127-97dbe5d579e5	INMeS	PUBLIC	Cotonou	2026-07-01 01:56:53.257	Institut National Médico-Sanitaire	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
00ad3530-1007-4342-b254-1ad272bf26ae	FAST	PUBLIC	Abomey-Calavi	2026-07-01 01:56:55.14	Faculté des Sciences et Techniques	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a71e776e-8418-4795-aa85-bf84e505aba4	ENAM	PUBLIC	Cotonou	2026-07-01 01:56:56.938	École Nationale d'Administration et de Magistrature	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1f24e172-54e3-4089-8552-e7135b44e840	FADESP	PUBLIC	Abomey-Calavi	2026-07-01 01:56:59.03	Faculté de Droit et de Sciences Politiques	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7e3bec34-f129-4eb4-9729-23619e9d3089	FLASH	PUBLIC	Abomey-Calavi	2026-07-01 01:57:01.1	Faculté des Lettres, Arts et Sciences Humaines	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
43e64660-0162-46fc-8a62-f4c0cf3dfa5f	FSEA	PUBLIC	Abomey-Calavi	2026-07-01 01:57:03.738	Faculté des Sciences Agronomiques	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b4c1c7a7-5608-4abd-9955-c0a411cf945c	IFSIO	PUBLIC	Cotonou	2026-07-01 01:57:06.139	Institut de Formation Sociale et d'Ingénierie Organisationnelle	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
94d4bed2-c875-44f4-8162-50d0994582be	FSS	PUBLIC	Cotonou	2026-07-01 01:57:08.029	Faculté des Sciences de la Santé	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
19563b8b-7dab-4e37-b476-9fb51a877e54	ENEAM	PUBLIC	Cotonou	2026-07-01 01:57:09.981	École Nationale d'Économie Appliquée et de Management	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6973c925-08b6-4967-b1a9-d6ef0f46a4e2	ENSPD	PUBLIC	Parakou	2026-07-02 07:50:53.601	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
22222222-2222-2222-2222-222222222222	Ecole Superieure Africaine des TIC	PRIVE	Cotonou	2026-05-12 20:01:18.692	\N	\N	\N	\N	\N	\N	\N	\N	/api/public/etablissements/logo-22222222-2222-2222-2222-222222222222.png	\N	\N	\N
eb18c3d8-8756-4e5e-bb01-c19a8409428d	École Supérieure de Management du Bénin	PRIVE	Cotonou	2026-06-28 07:10:47.939	Quartier Fidjrossè, Cotonou	contact@esm-benin.bj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f34ed1d5-c65c-4de4-8cec-8bed55c36a40	Université Catholique d'Afrique de l'Ouest	PRIVE	Cotonou	2026-06-28 07:10:58.19	Quartier Missèbo, Cotonou	contact@ucao-benin.bj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
688bc6b3-e29e-4d07-854b-06da1337a7b5	Institut Universitaire Panafricain	PRIVE	Porto-Novo	2026-06-28 07:11:08.41	Avenue des Martyrs, Porto-Novo	contact@iup-benin.bj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c2073e47-1e76-4c8d-b042-16fbcf356638	École Supérieure de l'Enseignement Professionnel Le Berger	PRIVE	Cotonou	2026-06-28 07:11:15.921	Quartier Sainte Rita, Cotonou	contact@esep-leberger.bj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c70df463-0f8f-4cf9-9da1-ef5526d5e6e6	IRGIB Africa University	PRIVE	Cotonou	2026-06-28 07:09:26.896	Face Stade René Pleven, Akpakpa, Cotonou	contact@irgib.bj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8b091357-0bd9-4cf2-95ac-297743896231	Institut Supérieur de Communication et de Gestion	PRIVE	Cotonou	2026-06-28 07:09:40.514	Quartier Cadjèhoun, Cotonou	contact@iscg-benin.bj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1e8f8742-21b9-4801-8fa7-f7588875a074	Institut Supérieur des Métiers de l'Audiovisuel	PRIVE	Cotonou	2026-06-28 07:09:53.477	Quartier Gbégamey, Cotonou	contact@isma-benin.bj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
27862738-53ec-496d-835f-a5c24245c653	Haute École de Commerce et de Management	PRIVE	Cotonou	2026-06-28 07:10:02.839	Quartier Akpakpa, Cotonou	contact@hecm-benin.bj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
504d0e86-c98f-4fc2-a4e8-235788a21a30	Pigier Bénin	PRIVE	Cotonou	2026-06-28 07:10:13.185	Avenue Jean-Paul II, Cotonou	contact@pigier-benin.bj	\N	\N	\N	\N	\N	\N	/uploads/etablissements/logo-504d0e86-c98f-4fc2-a4e8-235788a21a30.webp	\N	\N	\N
6d578bb6-6a1d-45e7-89ed-b18db9cec6a8	Institut Supérieur de Management Adonaï	PRIVE	Cotonou	2026-06-28 07:10:28.439	Quartier Fifadji, Cotonou	contact@ism-adonai.bj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7338f85e-731a-4e03-84ee-891f4c7d8e12	Université Africaine de Technologie et de Management	PRIVE	Cotonou	2026-06-28 07:10:37.347	Rue du Commissariat, Cotonou	contact@uatm-gasa.bj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: Filiere; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Filiere" (id, nom, "etablissementId", "dureeAnnees", "createdAt", code, niveau, "matriculeCompteur", sigle, "fraisScolariteAnnuels", "fraisInscriptionEffective", "fraisAutres", debouches, "partenariatsEntreprises", "partenariatsUniversites", "tauxReussite", "dureeStage", "langueEnseignement") FROM stdin;
78d1f8b1-fbc1-4d7a-8859-9308139fb1e8	Administration des Finances	e81c0f9c-1a75-41c9-9f53-77776c11ccd9	3	2026-06-28 07:09:15.602	ESAE-AF-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e55ea198-4a33-4c97-9e95-e433c413796c	Sciences de Gestion	e81c0f9c-1a75-41c9-9f53-77776c11ccd9	3	2026-06-28 07:09:17.781	ESAE-SG-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
73b1104a-9326-458c-92a2-2d761d5a2803	Developpement Logiciel	22222222-2222-2222-2222-222222222222	3	2026-05-12 20:01:21.759	FIL-003	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
380c5772-1f3e-4721-a168-b6be06f175b5	Genie Info	a0473338-5942-40cd-b6b3-fcde17b7889b	2	2026-05-26 19:03:30.24	GI-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
482c18be-0ba4-4a1b-8596-8d00a72c4f71	Gestion Commerciale et Marketing	520e3096-707c-4646-97d5-7514df97676f	3	2026-06-26 13:42:51.551	ESGT-GCM-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0dd5a6ed-17ec-4b07-83a7-88adb3f986cf	Comptabilité et Audit	520e3096-707c-4646-97d5-7514df97676f	3	2026-06-26 13:42:52.363	ESGT-CA-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5c4ded34-f714-4b67-9e24-df14c5e88c4c	Gestion des Ressources Humaines	520e3096-707c-4646-97d5-7514df97676f	3	2026-06-26 13:42:53.262	ESGT-GRH-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e370215c-c687-451a-a8de-d191d64f595c	Management des Organisations	520e3096-707c-4646-97d5-7514df97676f	2	2026-06-26 13:42:54.145	ESGT-MO-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
642c2376-70dc-4dab-82d6-ca6561bc2bdb	Informatique de Gestion	b1e3926a-2029-4ccb-9667-9e53b8f1534d	3	2026-06-26 13:42:58.954	ESGIS-IG-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c3b62ada-a4f1-4305-aa20-4f4fd995246e	Finance et Comptabilité	b1e3926a-2029-4ccb-9667-9e53b8f1534d	3	2026-06-26 13:42:59.71	ESGIS-FC-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cedcfea4-e529-4947-a0ae-cb11599d0f94	Commerce International	b1e3926a-2029-4ccb-9667-9e53b8f1534d	3	2026-06-26 13:43:00.547	ESGIS-CI-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ea4c8f3c-ac44-4729-af1a-9ce7fc4a1e62	Audit et Contrôle de Gestion	b1e3926a-2029-4ccb-9667-9e53b8f1534d	2	2026-06-26 13:43:01.359	ESGIS-ACG-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e9705b16-e66c-4ffa-8d13-1c0acd6203ac	Sciences Juridiques	e81c0f9c-1a75-41c9-9f53-77776c11ccd9	3	2026-06-28 07:09:18.909	ESAE-SJ-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c4dbc6aa-490c-4190-9357-79d176f09288	Marketing et Communication	2521c204-eb38-4056-ade2-45e61ef858b7	3	2026-06-26 13:43:06.563	HECM-MC-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5187d466-fcab-40bf-a3da-6522cac45f35	Banque et Finance	2521c204-eb38-4056-ade2-45e61ef858b7	2	2026-06-26 13:43:07.298	HECM-BF-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c77d20ac-c5c3-4fa0-bda7-cf2eb7dbda73	Administration des Affaires	c0b4f455-c9af-440f-b891-1fde018b7998	3	2026-06-26 13:43:11.54	ISM-AA-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
621debe8-b2ba-4a79-ba62-0a8b04e06c44	Logistique et Transport	c0b4f455-c9af-440f-b891-1fde018b7998	3	2026-06-26 13:43:12.406	ISM-LT-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
afd2c079-d716-4c8b-9548-ab1c1220abd5	Management Stratégique	c0b4f455-c9af-440f-b891-1fde018b7998	2	2026-06-26 13:43:13.145	ISM-MS-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f00c340e-81b3-4a68-a0f7-9735d5b50442	Commerce et Distribution	1e3dd9e9-2ac9-48c5-8c87-13f63eb02038	3	2026-06-26 13:43:23.401	ESCAE-CD-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
863b90af-9e7a-4d3c-a525-2500e201bf98	Entrepreneuriat et Innovation	1e3dd9e9-2ac9-48c5-8c87-13f63eb02038	3	2026-06-26 13:43:24.125	ESCAE-EI-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c2e849ac-71fe-4566-9092-21236b2449ff	Management International	1e3dd9e9-2ac9-48c5-8c87-13f63eb02038	2	2026-06-26 13:43:24.954	ESCAE-MI-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0e43cc9e-b2b3-440d-829c-b8d76097bc8e	Management et Administration des Entreprises	ca83cd26-daaa-4ad0-a359-c2e5b638823f	3	2026-06-26 13:43:29.71	ESMA-MAE-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4cf2f339-6ca4-4d95-a78f-606f64da88e4	Gestion Financière	ca83cd26-daaa-4ad0-a359-c2e5b638823f	3	2026-06-26 13:43:30.438	ESMA-GF-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2504cf80-c1be-4157-9992-d3d2de3dd82e	Ressources Humaines et Communication	ca83cd26-daaa-4ad0-a359-c2e5b638823f	2	2026-06-26 13:43:31.162	ESMA-RHC-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
03f255a3-072d-4d01-a9d9-fbdeb9a8fbfe	Journalisme et Médias	e81c0f9c-1a75-41c9-9f53-77776c11ccd9	3	2026-06-28 07:09:19.833	ESAE-JM-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
bb7ff878-b48f-40c9-a1a7-dcb7bc920b95	Administration des Affaires	e81c0f9c-1a75-41c9-9f53-77776c11ccd9	2	2026-06-28 07:09:20.83	ESAE-AA-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a703665a-48cf-4a0d-9278-2e96bd54268f	Gestion des Ressources Humaines	e81c0f9c-1a75-41c9-9f53-77776c11ccd9	2	2026-06-28 07:09:21.909	ESAE-GRH-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7fde5ad7-ded1-4bc0-b18f-d224024c1289	Génie des Technologies de l'Information et de la Communication	c70df463-0f8f-4cf9-9da1-ef5526d5e6e6	3	2026-06-28 07:09:27.907	IRGIB-GTIC-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5d98466e-45e1-4b34-8648-8a7f23beacbe	Génie des Procédés de Productions Industrielles	c70df463-0f8f-4cf9-9da1-ef5526d5e6e6	3	2026-06-28 07:09:28.839	IRGIB-GPPI-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4ce23399-864e-4300-add4-2ea33e37a7af	Administration des Affaires	c70df463-0f8f-4cf9-9da1-ef5526d5e6e6	3	2026-06-28 07:09:30.171	IRGIB-AA-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1548a2d7-dace-4bf9-b82e-cfe1b249cedd	Sciences Économiques	c70df463-0f8f-4cf9-9da1-ef5526d5e6e6	3	2026-06-28 07:09:31.298	IRGIB-SE-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6e03ece5-e241-40cf-8d5c-85dcf3bf68d4	Analyses Biomédicales	c70df463-0f8f-4cf9-9da1-ef5526d5e6e6	3	2026-06-28 07:09:32.426	IRGIB-AB-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
eacc6e7e-9811-4ebe-9a32-3c32c1d09767	Procédés de Productions Industrielles	c70df463-0f8f-4cf9-9da1-ef5526d5e6e6	2	2026-06-28 07:09:33.651	IRGIB-PPI-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0e40782a-969a-426e-980e-9138261932ce	Administration des Affaires	c70df463-0f8f-4cf9-9da1-ef5526d5e6e6	2	2026-06-28 07:09:34.664	IRGIB-AA-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6942ef38-62aa-4c19-8017-5ae34b069ac2	Analyses Biomédicales	c70df463-0f8f-4cf9-9da1-ef5526d5e6e6	2	2026-06-28 07:09:35.701	IRGIB-AB-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9e2ec4f4-56fa-4f44-ad6a-0711e2fe41ff	Banque et Finance	8b091357-0bd9-4cf2-95ac-297743896231	3	2026-06-28 07:09:41.435	ISCG-BF-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6627e4d1-65b9-4e5b-a9ed-53a4f4ec2b23	Comptabilité, Contrôle et Audit	8b091357-0bd9-4cf2-95ac-297743896231	3	2026-06-28 07:09:42.407	ISCG-CCA-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
47ca028b-6240-4f67-98e0-c66028ad31d2	Journalisme	8b091357-0bd9-4cf2-95ac-297743896231	3	2026-06-28 07:09:43.264	ISCG-JO-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
fa47a00c-5236-430e-b2e4-c08746fa140a	Sciences Économiques	e81c0f9c-1a75-41c9-9f53-77776c11ccd9	3	2026-06-28 07:09:14.528	ESAE-SE-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4e7fa1b6-bc51-47f0-ad8e-dd1d06287254	Administration Générale	e81c0f9c-1a75-41c9-9f53-77776c11ccd9	3	2026-06-28 07:09:16.658	ESAE-AG-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cc8e4500-7d04-4240-86fc-df727601a078	Banque et Finance	8b091357-0bd9-4cf2-95ac-297743896231	2	2026-06-28 07:09:46.604	ISCG-BF-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
893ed4b9-1ca5-474b-846c-7699e6add76d	Comptabilité, Contrôle et Audit	8b091357-0bd9-4cf2-95ac-297743896231	2	2026-06-28 07:09:47.791	ISCG-CCA-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
fec04454-58e2-4dd6-a06f-6c52c55641db	Gestion des Ressources Humaines	8b091357-0bd9-4cf2-95ac-297743896231	2	2026-06-28 07:09:48.778	ISCG-GRH-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
95e903eb-b782-4dde-9aa9-ca40d6484664	Journalisme et Communication	1e8f8742-21b9-4801-8fa7-f7588875a074	3	2026-06-28 07:09:54.545	ISMA-JC-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
59967784-071e-480f-9370-db3332065ca3	Production Audiovisuelle	1e8f8742-21b9-4801-8fa7-f7588875a074	3	2026-06-28 07:09:55.458	ISMA-PA-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1c28ca4f-8c7e-47e3-a8e6-008b6e3d0e0e	Communication et Marketing Digital	1e8f8742-21b9-4801-8fa7-f7588875a074	3	2026-06-28 07:09:56.408	ISMA-CMD-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7b79bc3e-eab8-41e9-a075-2c43622711fe	Management de la Communication	1e8f8742-21b9-4801-8fa7-f7588875a074	2	2026-06-28 07:09:57.532	ISMA-MC-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7d0cbf1e-82ae-4749-8a79-b6d5cbff992f	Management des Entreprises	27862738-53ec-496d-835f-a5c24245c653	3	2026-06-26 13:43:05.788	HECM-ME-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9ca6e685-5abd-4dc8-af6b-c951ed2cab93	Commerce International	27862738-53ec-496d-835f-a5c24245c653	3	2026-06-28 07:10:04.99	HECM-CI-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3b5205e4-0dab-42cc-bd8a-1e863162856f	Finance et Comptabilité	27862738-53ec-496d-835f-a5c24245c653	3	2026-06-28 07:10:06.012	HECM-FC-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7098c66a-ba39-480a-bd8e-f8cafb4d2813	Management Stratégique	27862738-53ec-496d-835f-a5c24245c653	2	2026-06-28 07:10:07.038	HECM-MS-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
83ae995b-1b8b-4a8c-a693-2be7c060b577	Finance	27862738-53ec-496d-835f-a5c24245c653	2	2026-06-28 07:10:08.163	HECM-FI-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
399c5183-887d-4587-963d-ada6cede79ce	Audit et Contrôle de Gestion	504d0e86-c98f-4fc2-a4e8-235788a21a30	3	2026-06-28 07:10:14.205	PIGIER-ACG-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7e01c588-abc1-4948-90fe-c36f84cefa0e	Réseaux et Génie Logiciel	504d0e86-c98f-4fc2-a4e8-235788a21a30	3	2026-06-28 07:10:15.303	PIGIER-RGL-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d0193336-eddb-44b1-9847-35a7c6aa68de	Management des Ressources Humaines	504d0e86-c98f-4fc2-a4e8-235788a21a30	3	2026-06-28 07:10:16.486	PIGIER-MRH-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2ab7f4c4-53c8-407c-9f5f-e6f8c958d138	Gestion des Transports et Logistique	504d0e86-c98f-4fc2-a4e8-235788a21a30	3	2026-06-28 07:10:17.77	PIGIER-GTL-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d23516b9-66c2-4230-b8ea-5a57ef2082e7	Négociation et Communication Multimédia	504d0e86-c98f-4fc2-a4e8-235788a21a30	3	2026-06-28 07:10:18.918	PIGIER-NCM-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f8bb94cf-b93c-4517-942d-963103395814	Management des Ressources Humaines	504d0e86-c98f-4fc2-a4e8-235788a21a30	2	2026-06-28 07:10:20.049	PIGIER-MRH-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e0a8515-df98-42c2-922c-ea6559ac74e3	Finance	504d0e86-c98f-4fc2-a4e8-235788a21a30	2	2026-06-28 07:10:21.071	PIGIER-FI-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6ed7ec73-71a9-43e5-a0c0-f974a1b5e1eb	Audit et Contrôle de Gestion	504d0e86-c98f-4fc2-a4e8-235788a21a30	2	2026-06-28 07:10:22.092	PIGIER-ACG-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
12342ae2-b254-4f99-84c5-f21bbf5b8d1d	Communication et Marketing	504d0e86-c98f-4fc2-a4e8-235788a21a30	2	2026-06-28 07:10:23.217	PIGIER-CM-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9811ada3-f644-4ea8-bc49-5931037541fa	Gestion des Entreprises	6d578bb6-6a1d-45e7-89ed-b18db9cec6a8	3	2026-06-28 07:10:29.448	ISMA-GE-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
83634027-b216-4746-a2e4-2c44f54bb9c5	Informatique de Gestion	6d578bb6-6a1d-45e7-89ed-b18db9cec6a8	3	2026-06-28 07:10:30.465	ISMA-IG-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f67a4712-d347-4c6a-97de-9d44c379c9ca	Management des Organisations	6d578bb6-6a1d-45e7-89ed-b18db9cec6a8	2	2026-06-28 07:10:32.533	ISMA-MO-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
859c2c8c-3470-4d6a-a7d0-2ab149d2840b	Génie Informatique	7338f85e-731a-4e03-84ee-891f4c7d8e12	3	2026-06-28 07:10:38.263	UATM-GI-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6a60e8e9-163b-4223-a14e-77d963a4e35e	Management des Organisations	7338f85e-731a-4e03-84ee-891f4c7d8e12	3	2026-06-28 07:10:39.342	UATM-MO-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0792acee-9846-4cf6-a55a-622382443f06	Génie Civil	7338f85e-731a-4e03-84ee-891f4c7d8e12	3	2026-06-28 07:10:40.222	UATM-GC-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
25207810-d7a1-451f-97e4-1d306c4b5709	Électrotechnique	7338f85e-731a-4e03-84ee-891f4c7d8e12	3	2026-06-28 07:10:41.236	UATM-ET-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e2f7e954-5947-4805-a0c5-1c02c110f1a4	Génie Informatique	7338f85e-731a-4e03-84ee-891f4c7d8e12	2	2026-06-28 07:10:42.183	UATM-GI-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
546587d4-5acb-4b4f-adeb-a4e377ef635b	Management des Organisations	7338f85e-731a-4e03-84ee-891f4c7d8e12	2	2026-06-28 07:10:43.051	UATM-MO-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5dd45f0a-18fb-4b05-8657-ec6609165070	Management et Administration des Entreprises	eb18c3d8-8756-4e5e-bb01-c19a8409428d	3	2026-06-28 07:10:49.232	ESM-MAE-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9c7855c7-6b9b-4dfb-b3b9-87a6042db262	Finance et Comptabilité	eb18c3d8-8756-4e5e-bb01-c19a8409428d	3	2026-06-28 07:10:50.208	ESM-FC-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
578acb9c-5388-4929-a0f1-928d0e1049d5	Marketing et Stratégie Commerciale	eb18c3d8-8756-4e5e-bb01-c19a8409428d	3	2026-06-28 07:10:51.228	ESM-MSC-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4be54a90-4572-4e47-9ddb-e538d7295597	Management Stratégique	eb18c3d8-8756-4e5e-bb01-c19a8409428d	2	2026-06-28 07:10:52.184	ESM-MS-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
bdd9d03d-e395-43b4-88f6-1eeb60f4140c	Finance	eb18c3d8-8756-4e5e-bb01-c19a8409428d	2	2026-06-28 07:10:53.22	ESM-FI-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2382c64d-2502-4dd0-bbc7-6283c93b3026	Droit	f34ed1d5-c65c-4de4-8cec-8bed55c36a40	3	2026-06-28 07:10:59.163	UCAO-DR-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
fb06e7f8-0a7f-4a59-a321-2d5299fa6ec3	Sciences Économiques et Gestion	f34ed1d5-c65c-4de4-8cec-8bed55c36a40	3	2026-06-28 07:11:00.103	UCAO-SEG-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e1b73298-26cf-4cd9-aaf8-0847b276018f	Philosophie et Sciences Humaines	f34ed1d5-c65c-4de4-8cec-8bed55c36a40	3	2026-06-28 07:11:01.103	UCAO-PSH-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ad995e1e-ed27-48fe-929d-d96b22753948	Droit des Affaires	f34ed1d5-c65c-4de4-8cec-8bed55c36a40	2	2026-06-28 07:11:02.229	UCAO-DA-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5402d899-cdb1-4244-808e-894e840303db	Économie et Développement	f34ed1d5-c65c-4de4-8cec-8bed55c36a40	2	2026-06-28 07:11:03.261	UCAO-ED-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
11b8146f-55b6-49b2-ac20-a082e73b25bf	Sciences de Gestion	688bc6b3-e29e-4d07-854b-06da1337a7b5	3	2026-06-28 07:11:09.299	IUP-SG-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
af96e8e9-957d-4420-b55d-bc603c4815e7	Informatique Appliquée	688bc6b3-e29e-4d07-854b-06da1337a7b5	3	2026-06-28 07:11:10.204	IUP-IA-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
982ad32b-c2a7-4409-9f09-4a4143736f65	Administration et Gestion	688bc6b3-e29e-4d07-854b-06da1337a7b5	2	2026-06-28 07:11:11.222	IUP-AG-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
fd5d1d8a-8595-4fc2-8b50-05f2898add90	Gestion des Ressources Humaines	8b091357-0bd9-4cf2-95ac-297743896231	3	2026-06-28 07:09:45.605	ISCG-GRH-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3b2d34f0-9eab-4034-a1a1-42d8bd125557	Sciences Juridiques	8b091357-0bd9-4cf2-95ac-297743896231	3	2026-06-28 07:09:44.203	ISCG-SJ-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
fb5132f3-b256-4427-9ee2-56846743d5d6	Droit des Affaires	6d578bb6-6a1d-45e7-89ed-b18db9cec6a8	3	2026-06-28 07:10:31.412	ISMA-DA-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cb966a36-2648-4449-aa57-055be9c1aa8a	Gestion Commerciale	c2073e47-1e76-4c8d-b042-16fbcf356638	3	2026-06-28 07:11:16.841	ESEP-GC-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5128cf6a-58f1-4dda-b990-e7356b57c513	Informatique de Gestion	c2073e47-1e76-4c8d-b042-16fbcf356638	3	2026-06-28 07:11:17.803	ESEP-IG-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9e9a494d-0790-4328-b1be-27e5421dea07	Comptabilité et Finance	c2073e47-1e76-4c8d-b042-16fbcf356638	3	2026-06-28 07:11:18.825	ESEP-CF-L	LICENCE	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
dfe95517-fa67-41c7-9aeb-b6b89c2ecb89	Management des Organisations	c2073e47-1e76-4c8d-b042-16fbcf356638	2	2026-06-28 07:11:20.125	ESEP-MO-M	MASTER	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: Inscription; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Inscription" (id, "numeroInscription", "candidatId", "concoursId", note, "createdAt") FROM stdin;
817df7ff-f49c-4532-a286-810f325651ae	INS-2026-000001	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	edda9184-3d32-4b68-a8c5-46d19a49004a	\N	2026-06-24 07:51:37.502
fdb3a986-f90e-4c22-bd37-e2b211d6cd4b	INS-2026-000002	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	01b7434b-1a80-4e64-a0e3-f04eb833e43e	\N	2026-07-01 12:42:15.824
92cbd1d5-ffcc-4069-99e5-6a9c16ab596f	INS-2026-000003	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	73ef6938-9e50-4d8a-9bf6-14bb584c6fd8	\N	2026-07-02 05:55:12.468
\.


--
-- Data for Name: InscriptionAcademique; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."InscriptionAcademique" (id, "candidatId", "etablissementId", "filiereId", "anneeAcademique", "createdAt", niveau, statut, matricule, "quittanceBancaire", "quittanceSoumiseLe", "quittanceValideeLe") FROM stdin;
\.


--
-- Data for Name: MembreCommission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MembreCommission" (id, nom, prenom, email, telephone, role, "createdAt", "updatedAt", "sousRole", "etablissementId") FROM stdin;
adad5263-20b1-4f82-8650-e2011ed199ab	TEST	Examinateur	examinateur@test.com	+22997000004	COMMISSION	2026-06-16 07:26:23.508	2026-06-16 07:26:23.508	EXAMINATEUR	\N
754671cd-2b76-4ccb-a0bb-690adcf34443	TEST	Controleur	controleur-commission@test.com	+22997000005	COMMISSION	2026-06-16 07:26:26.208	2026-06-16 07:26:26.208	CONTROLEUR	\N
20a05243-32ba-41d2-b61f-635df62e2173	TEST	Examinateur2	examinateur2@test.com	+22997000006	COMMISSION	2026-06-16 07:32:41.619	2026-06-16 07:32:41.619	EXAMINATEUR	\N
7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef	TEST	Commission	commission@test.com	+22997000002	COMMISSION	2026-06-16 10:00:23.221	2026-06-18 15:38:41.25	MEMBRE	\N
6a2e2a2f-b49e-4dc1-b8e3-3e26fa46eedc	FASSINOU	Paul	forsuree15@gmail.com	\N	COMMISSION	2026-07-02 07:54:57.402	2026-07-02 07:54:57.402	EXAMINATEUR	696e24e5-ffbf-4246-bc57-9db5eff6afef
\.


--
-- Data for Name: Note; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Note" (id, "inscriptionAcadId", matiere, "noteCC", "noteExamen", "noteMoyenne", credits, semestre, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notification" (id, "userId", type, title, message, data, read, "readAt", priority, "createdAt", "updatedAt", "expiresAt") FROM stdin;
86cad73a-007e-4f2b-ab6d-76c4b2e3b6ea	18f6be90-ed86-4bfb-8360-443d70852cc9	SYSTEME	Bienvenue sur UniPath	Bonjour Harry DEDJI, votre compte a été créé avec succès. Veuillez confirmer votre email pour accéder à toutes les fonctionnalités.	{"matricule": "UnP-2026-000002", "emailConfirmationRequired": true}	f	\N	HIGH	2026-05-26 13:43:15.49	2026-05-26 13:43:15.49	\N
66b96095-525e-4d35-b8ac-132f43c248c7	f12eb176-bb43-4432-b3ec-9ce3735e1226	SYSTEME	Bienvenue sur UniPath	Bonjour Harry DEDJI, votre compte a été créé avec succès. Veuillez confirmer votre email pour accéder à toutes les fonctionnalités.	{"matricule": "UnP-2026-000003", "emailConfirmationRequired": true}	f	\N	HIGH	2026-05-26 13:43:22.095	2026-05-26 13:43:22.095	\N
6540d113-e930-4754-b017-cfb69d9c57fb	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	SYSTEME	Bienvenue sur UniPath	Bonjour Archimède AHIDOTIN, votre compte a été créé avec succès. Veuillez confirmer votre email pour accéder à toutes les fonctionnalités.	{"matricule": "UnP-2026-000004", "emailConfirmationRequired": true}	f	\N	HIGH	2026-05-28 15:52:05.699	2026-05-28 15:52:05.699	\N
101048b3-0c2e-45ee-93e6-b30361306b99	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c	SYSTEME	Email confirmé avec succès	Félicitations Archimède ! Votre email a été confirmé. Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme.	\N	f	\N	NORMAL	2026-05-28 16:13:17.666	2026-05-28 16:13:17.666	\N
57cf6dda-7c30-437a-80f5-895e849135f5	40f13c4d-8b63-443e-8191-0b4df12645fb	SYSTEME	Bienvenue sur UniPath	Bonjour Rufus DEGBO, votre compte a été créé avec succès. Veuillez confirmer votre email pour accéder à toutes les fonctionnalités.	{"matricule": "UnP-2026-000001", "emailConfirmationRequired": true}	f	\N	HIGH	2026-05-14 15:01:19.995	2026-05-14 15:01:19.995	\N
5ee8e5f7-fe24-4277-ae21-cf17ff92ae56	40f13c4d-8b63-443e-8191-0b4df12645fb	SYSTEME	Email confirmé avec succès	Félicitations Rufus ! Votre email a été confirmé. Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme.	\N	f	\N	NORMAL	2026-05-14 15:42:42.98	2026-05-14 15:42:42.98	\N
2e66144c-237b-4b01-8fb4-5ed979d8a914	40f13c4d-8b63-443e-8191-0b4df12645fb	SYSTEME	Demande de réinitialisation de mot de passe	Un email de réinitialisation de mot de passe a été envoyé à votre adresse.	\N	f	\N	NORMAL	2026-05-14 17:34:55.008	2026-05-14 17:34:55.008	\N
450f4623-692c-4d38-b6dd-fd791f8a1b61	4b12fd5d-c098-4b02-b03d-43a0a4b69150	SYSTEME	Bienvenue sur UniPath	Bonjour Rémi GLIBA, votre compte a été créé avec succès. Veuillez confirmer votre email pour accéder à toutes les fonctionnalités.	{"matricule": "UnP-2026-000001", "emailConfirmationRequired": true}	f	\N	HIGH	2026-06-18 16:51:57.791	2026-06-18 16:51:57.791	\N
898badad-3aee-4118-bc3b-60cc34119c0b	4b12fd5d-c098-4b02-b03d-43a0a4b69150	SYSTEME	Email confirmé avec succès	Félicitations Rémi ! Votre email a été confirmé. Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme.	\N	f	\N	NORMAL	2026-06-18 17:00:20.756	2026-06-18 17:00:20.756	\N
8e423320-329a-4864-8a09-fd3acfab1f6e	8b6f294e-f2b8-4611-82f7-63d59df1804a	SYSTEME	Bienvenue sur UniPath	Bonjour TestPrenom TestNom, votre compte a été créé avec succès. Veuillez confirmer votre email pour accéder à toutes les fonctionnalités.	{"matricule": "UnP-2026-000005", "emailConfirmationRequired": true}	f	\N	HIGH	2026-06-23 19:45:57.03	2026-06-23 19:45:57.03	\N
4b5d9f6e-459c-4b62-8043-ffefd74f1eb2	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	SYSTEME	Bienvenue sur UniPath	Bonjour Sidney DEVI, votre compte a été créé avec succès. Veuillez confirmer votre email pour accéder à toutes les fonctionnalités.	{"matricule": "UnP-2026-000004", "emailConfirmationRequired": true}	t	2026-06-27 09:28:39.605	HIGH	2026-06-23 08:34:09.022	2026-06-27 09:28:39.607	\N
7a340c67-c20f-40e0-822e-496502cded3d	34c03c09-c954-48f0-8b3b-ae670ba5220e	SYSTEME	Bienvenue sur UniPath	Bonjour Vignon KANLINHANON, votre compte a été créé avec succès. Veuillez confirmer votre email pour accéder à toutes les fonctionnalités.	{"matricule": "UnP-2026-000006", "emailConfirmationRequired": true}	f	\N	HIGH	2026-06-23 19:48:16.825	2026-06-23 19:48:16.825	\N
5913699a-2c4b-45e6-8818-00bda99a4827	754671cd-2b76-4ccb-a0bb-690adcf34443	NOUVEAU_DOSSIER	Verdict examinateur — arbitrage requis	Un examinateur a rendu son verdict (VALIDE) sur le dossier INS-2026-000001 (DEVI Sidney). Arbitrage du contrôleur attendu.	{"numeroInscription": "INS-2026-000001", "verdictExaminateur": "VALIDE", "dossierInscriptionId": "9a8e9aea-4ad2-415d-831f-cfb4595c5d7f"}	f	\N	NORMAL	2026-06-24 11:45:42.645	2026-06-24 11:45:42.645	\N
0aa2bf5d-1059-4c5c-8388-5683787d0f46	adad5263-20b1-4f82-8650-e2011ed199ab	NOUVEAU_DOSSIER	Décision du contrôleur enregistrée	Le contrôleur a confirmé votre verdict (VALIDE) sur le dossier INS-2026-000001.	{"decision": "VALIDE", "verdictExaminateur": "VALIDE", "dossierInscriptionId": "9a8e9aea-4ad2-415d-831f-cfb4595c5d7f"}	f	\N	NORMAL	2026-06-24 11:50:24.889	2026-06-24 11:50:24.889	\N
213c7610-6ed2-4029-adc6-40067d7dca52	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	VALIDATION	Décision finale sur votre dossier	Votre dossier pour le concours Concours EPAC 2026 - Génie Civil a été validé	{"motif": null, "decision": "VALIDE", "dossierInscriptionId": "9a8e9aea-4ad2-415d-831f-cfb4595c5d7f"}	t	2026-06-24 11:55:00.857	HIGH	2026-06-24 11:50:23.929	2026-06-24 11:55:00.858	\N
ea670273-7061-4147-a78c-e3de4f9aff49	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	PRE_INSCRIPTION	Pré-inscription enregistrée	Votre pré-inscription au concours Concours EPAC 2026 - Génie Civil a été enregistrée.	{"concours": "Concours EPAC 2026 - Génie Civil", "candidatNom": "DEVI", "candidatEmail": "unipathepac@gmail.com", "inscriptionId": "817df7ff-f49c-4532-a286-810f325651ae", "numeroDossier": "INS-2026-000001", "candidatPrenom": "Sidney", "concoursDateFin": "2026-06-26T00:00:00.000Z", "candidatDateNaiss": "2006-10-09T00:00:00.000Z", "candidatLieuNaiss": "Kpota", "candidatMatricule": "UnP-2026-000004", "candidatTelephone": "+229 0144269133", "concoursDateDebut": "2026-06-22T00:00:00.000Z", "concoursDescription": "Concours d'entrée au département GC"}	t	2026-06-27 09:28:32.25	HIGH	2026-06-24 10:53:27.729	2026-06-27 09:28:32.252	2028-06-23 10:53:27.727
1b27b432-d495-461f-8918-9593cf26de36	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f	SYSTEME	Email confirmé avec succès	Félicitations Sidney ! Votre email a été confirmé. Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme.	\N	t	2026-06-27 09:28:35.674	NORMAL	2026-06-23 19:57:22.393	2026-06-27 09:28:35.677	\N
edf84fcb-4fb5-4465-99e5-3d45f336f88b	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	SYSTEME	Bienvenue sur UniPath	Bonjour Keren FAVI, votre compte a été créé avec succès. Veuillez confirmer votre email pour accéder à toutes les fonctionnalités.	{"matricule": "UnP-2026-000007", "emailConfirmationRequired": true}	f	\N	HIGH	2026-06-28 08:11:57.926	2026-06-28 08:11:57.926	\N
718c07e5-cb59-4c31-a0ef-8820f06ec6b7	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	SYSTEME	Email confirmé avec succès	Félicitations Keren ! Votre email a été confirmé. Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme.	\N	f	\N	NORMAL	2026-06-28 08:52:37.453	2026-06-28 08:52:37.453	\N
b5b8b88d-f691-437e-9a08-48e4993df521	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	PRE_INSCRIPTION	Pré-inscription enregistrée	Votre pré-inscription au concours Concours INSPEI 2026 a été enregistrée.	{"concours": "Concours INSPEI 2026", "candidatNom": "FAVI", "candidatEmail": "thechill000@gmail.com", "inscriptionId": "fdb3a986-f90e-4c22-bd37-e2b211d6cd4b", "numeroDossier": "INS-2026-000002", "candidatPrenom": "Keren", "concoursDateFin": "2026-08-18T00:00:00.000Z", "candidatDateNaiss": "2008-01-18T00:00:00.000Z", "candidatLieuNaiss": "Yamoussoukro", "candidatMatricule": "UnP-2026-000007", "candidatTelephone": "+229 0144443333", "concoursDateDebut": "2026-07-01T00:00:00.000Z", "concoursDescription": "[MESRS-CONCOURS-2026] Source: MESRS Benin - Concours universitaires officiels\\nDomaine: Classes Preparatoires\\nFilieres: MPSI, PCSI, TSI\\nDebouches: Integration en ecole d'ingenieurs, Ingenieur generaliste\\nDuree de formation: 2 ans (prepa) -> Grandes Ecoles\\nDate epreuves indicative: 2 septembre\\nPlateforme d'inscription: https://concours.enseignementsuperieur.gouv.bj"}	f	\N	HIGH	2026-07-01 12:42:21.103	2026-07-01 12:42:21.103	2028-06-30 12:42:21.101
a7e18837-f6d7-44e8-b642-a2ee60cbb4cc	754671cd-2b76-4ccb-a0bb-690adcf34443	NOUVEAU_DOSSIER	Verdict examinateur — arbitrage requis	Un examinateur a rendu son verdict (SOUS_RESERVE) sur le dossier INS-2026-000002 (FAVI Keren). Arbitrage du contrôleur attendu.	{"numeroInscription": "INS-2026-000002", "verdictExaminateur": "SOUS_RESERVE", "dossierInscriptionId": "de72a1f8-d74d-496d-a8d7-ad30a427218d"}	f	\N	NORMAL	2026-07-01 12:51:09.21	2026-07-01 12:51:09.21	\N
a74aa66d-e2ce-46ac-b012-c9adb6c0247b	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	PRE_INSCRIPTION	Pré-inscription enregistrée	Votre pré-inscription au concours Concours ENSPD 2026 a été enregistrée.	{"concours": "Concours ENSPD 2026", "candidatNom": "FAVI", "candidatEmail": "thechill000@gmail.com", "inscriptionId": "92cbd1d5-ffcc-4069-99e5-6a9c16ab596f", "numeroDossier": "INS-2026-000003", "candidatPrenom": "Keren", "concoursDateFin": "2026-08-14T00:00:00.000Z", "candidatDateNaiss": "2008-01-18T00:00:00.000Z", "candidatLieuNaiss": "Yamoussoukro", "candidatMatricule": "UnP-2026-000007", "candidatTelephone": "+229 0144443333", "concoursDateDebut": "2026-06-30T00:00:00.000Z", "concoursDescription": "Domaine: Statistique & Planification\\nFilieres: Statistique, Planification du developpement, Demographie\\nDebouches: Statisticien, Planificateur, Demographe, Analyste de donnees\\nDuree de formation: 3 ans\\n"}	f	\N	HIGH	2026-07-02 05:55:17.874	2026-07-02 05:55:17.874	2028-07-01 05:55:17.873
e263bdde-1002-4ba7-b7f1-0f75991d90bb	754671cd-2b76-4ccb-a0bb-690adcf34443	NOUVEAU_DOSSIER	Verdict examinateur — arbitrage requis	Un examinateur a rendu son verdict (SOUS_RESERVE) sur le dossier INS-2026-000003 (FAVI Keren). Arbitrage du contrôleur attendu.	{"numeroInscription": "INS-2026-000003", "verdictExaminateur": "SOUS_RESERVE", "dossierInscriptionId": "1ae78c5f-bd8a-4533-b70d-997bca802112"}	f	\N	NORMAL	2026-07-02 05:57:50.363	2026-07-02 05:57:50.363	\N
84580d81-7b20-499f-8024-d4c27862a2d1	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14	ALERTE	Décision finale sur votre dossier	Votre dossier pour le concours Concours ENSPD 2026 a été validé sous réserve	{"motif": "La carte d&#x27;identité n&#x27;est pas conforme", "decision": "SOUS_RESERVE", "dossierInscriptionId": "1ae78c5f-bd8a-4533-b70d-997bca802112"}	f	\N	HIGH	2026-07-02 06:07:48.886	2026-07-02 06:07:48.886	\N
e4b5e060-67ba-4496-b04a-31dda0c8961d	20a05243-32ba-41d2-b61f-635df62e2173	NOUVEAU_DOSSIER	Décision du contrôleur enregistrée	Le contrôleur a confirmé votre verdict (SOUS_RESERVE) sur le dossier INS-2026-000003.	{"decision": "SOUS_RESERVE", "verdictExaminateur": "SOUS_RESERVE", "dossierInscriptionId": "1ae78c5f-bd8a-4533-b70d-997bca802112"}	f	\N	NORMAL	2026-07-02 06:07:49.868	2026-07-02 06:07:49.868	\N
17367cdd-fba8-44c8-bd8f-ff0d741a7e3a	20a05243-32ba-41d2-b61f-635df62e2173	ALERTE	Arbitrage divergent — retour du contrôleur	Sur le dossier INS-2026-000003, le contrôleur a arbitré « Validé » alors que vous aviez « Sous réserve ». Motif : Il  a corrigé le dossier et j'ai validé	{"motifArbitrage": "Il  a corrigé le dossier et j'ai validé", "numeroInscription": "INS-2026-000003", "decisionControleur": "VALIDE", "verdictExaminateur": "SOUS_RESERVE", "dossierInscriptionId": "1ae78c5f-bd8a-4533-b70d-997bca802112"}	f	\N	HIGH	2026-07-02 07:11:37.196	2026-07-02 07:11:37.196	\N
\.


--
-- Data for Name: NotificationAuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."NotificationAuditLog" (id, "eventType", "userId", "actorId", "resourceId", "resourceType", details, "ipAddress", "userAgent", "timestamp") FROM stdin;
\.


--
-- Data for Name: NotificationTemplate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."NotificationTemplate" (id, name, type, subject, "htmlBody", "textBody", variables, "isActive", "isDefault", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Payment" (id, "applicationId", "paymentType", amount, currency, "paymentProvider", "paymentMethod", status, "externalRef", "providerPayload", "createdAt", "updatedAt") FROM stdin;
6e8e4389-1b5c-46d7-896c-ff2456b5c3f6	362accc7-c04c-4727-8f09-7827f7e9c869	DOSSIER_FEES	5000	XOF	MOCK_PROVIDER	PLATFORM_GATEWAY	CONFIRMED	PAY-1782303926496-4439	{"mode": "mock", "confirmedAt": "2026-06-24T12:25:26.496Z"}	2026-06-24 12:25:26.498	2026-06-24 12:25:26.498
06db2651-7d14-4e61-a939-8a16bb8c9f14	b50a11f1-1f97-488e-b459-33c2815ccbc3	DOSSIER_FEES	5000	XOF	\N	PLATFORM_GATEWAY	CONFIRMED	DEMO-PAY-2026-001	\N	2026-07-09 06:37:28.293	2026-07-09 06:42:56.637
05be632e-2a11-4411-a75a-9a8f313099bc	69af54a1-2fdd-470c-8967-36d7f6dbdf59	DOSSIER_FEES	5000	XOF	\N	PLATFORM_GATEWAY	CONFIRMED	DEMO-PAY-2026-002	\N	2026-07-09 06:37:45.903	2026-07-09 06:43:10.752
63e44b0b-e1bf-47db-a939-026ad6c76726	4bc15290-aa5b-4229-a213-830763772954	DOSSIER_FEES	5000	XOF	\N	PLATFORM_GATEWAY	CONFIRMED	DEMO-PAY-2026-003	\N	2026-07-09 06:38:03.707	2026-07-09 06:43:24.349
d8f931fd-9fcb-401a-985c-0adc5f1cf12a	6bbb6cf8-0c49-4d83-921a-83d9c0312d70	DOSSIER_FEES	5000	XOF	\N	PLATFORM_GATEWAY	CONFIRMED	DEMO-PAY-2026-004	\N	2026-07-09 06:38:21.135	2026-07-09 06:43:37.894
e6b98b21-bcf1-4d0d-87a0-c63cd96f5974	f01d57bb-c800-461f-9a93-12d25ce01ea3	DOSSIER_FEES	5000	XOF	\N	PLATFORM_GATEWAY	CONFIRMED	DEMO-PAY-2026-005	\N	2026-07-09 06:38:34.237	2026-07-09 06:43:51.602
83eca9ca-c194-4fe1-9bb9-d13c000b4a35	5d2c4a06-3b2e-4457-9576-e924a2216007	DOSSIER_FEES	5000	XOF	\N	PLATFORM_GATEWAY	CONFIRMED	DEMO-PAY-2026-006	\N	2026-07-09 06:38:48.158	2026-07-09 06:44:05.755
29e1c171-4a03-4d0a-98f1-7684edcc59cf	26cbc0ab-1e55-44a2-9194-1ad5a059afcf	DOSSIER_FEES	5000	XOF	\N	PLATFORM_GATEWAY	CONFIRMED	DEMO-PAY-2026-007	\N	2026-07-09 06:39:01.455	2026-07-09 06:44:19.757
384624c8-90a1-4327-a44a-72586bfad73e	4fce3a1a-cc2b-4574-aeb1-387659b9bbd8	DOSSIER_FEES	5000	XOF	\N	PLATFORM_GATEWAY	CONFIRMED	DEMO-PAY-2026-008	\N	2026-07-09 06:39:15.14	2026-07-09 06:44:34.075
9fe8b0db-e9d9-4e91-bd64-dfcc2c681359	ac652308-5a03-4629-98e3-8b22e7627926	DOSSIER_FEES	5000	XOF	\N	PLATFORM_GATEWAY	CONFIRMED	DEMO-PAY-2026-009	\N	2026-07-09 06:39:28.831	2026-07-09 06:44:48.077
1e8bb6d2-15c5-40d2-b55e-c6f4f52cfa42	b15d84a8-89f7-467b-8a77-78bed28fef6c	DOSSIER_FEES	5000	XOF	\N	PLATFORM_GATEWAY	CONFIRMED	DEMO-PAY-2026-010	\N	2026-07-09 06:39:42.512	2026-07-09 06:45:02.167
186f06b3-25b1-4df2-b2f2-e46d6798a24e	1b36570d-b9ff-4235-8c8f-d6649ece3d15	DOSSIER_FEES	5000	XOF	\N	PLATFORM_GATEWAY	CONFIRMED	DEMO-PAY-2026-011	\N	2026-07-09 06:39:56.695	2026-07-09 06:45:17.405
a56840f7-0683-4fdf-b109-2d1242a976b1	2913c814-ddef-44ec-a0da-10372a43b378	DOSSIER_FEES	5000	XOF	\N	PLATFORM_GATEWAY	CONFIRMED	DEMO-PAY-2026-012	\N	2026-07-09 06:40:12.386	2026-07-09 06:45:32.325
1db4623d-b0a9-4abc-b310-74ac4521aeb2	b6ef3ca7-e6b3-496f-93a1-e320b8d97ab5	DOSSIER_FEES	5000	XOF	\N	PLATFORM_GATEWAY	CONFIRMED	DEMO-PAY-2026-013	\N	2026-07-09 06:40:25.808	2026-07-09 06:45:47.129
e15c2a46-a8d4-4876-b2c2-758de45ff549	a52cc3a8-4f64-4ac6-9e25-f0750575a86c	DOSSIER_FEES	5000	XOF	\N	PLATFORM_GATEWAY	CONFIRMED	DEMO-PAY-2026-014	\N	2026-07-09 06:40:38.974	2026-07-09 06:46:03.442
609d7a8b-8d85-414f-ac72-fc3098f2e09b	0d0f6f4e-a977-41b3-b836-b50997f918d4	DOSSIER_FEES	5000	XOF	\N	PLATFORM_GATEWAY	CONFIRMED	DEMO-PAY-2026-015	\N	2026-07-09 06:40:53.479	2026-07-09 06:46:21.356
\.


--
-- Data for Name: PreinscriptionEtablissement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PreinscriptionEtablissement" (id, "numeroPreinscription", "candidatId", "filiereId", "etablissementId", "anneeAcademique", niveau, statut, "motifDecision", "decidedAt", "decidedBy", "inscriptionAcadId", "createdAt", "updatedAt", "commentaireAdmin", "documentsCompl", "historiqueStatuts") FROM stdin;
7c64b731-6abc-4130-b274-feaf8f975eb8	DEMO-PE-2026-001	dd569177-974b-44a6-a51b-e899cc479be1	fa47a00c-5236-430e-b2e4-c08746fa140a	e81c0f9c-1a75-41c9-9f53-77776c11ccd9	2026-2027	1	VALIDE	\N	2026-07-05 10:30:00	seed-demo	\N	2026-07-05 10:30:00	2026-07-09 06:42:57.484	\N	\N	\N
e441879c-a578-471d-a854-a44b6328f62b	DEMO-PE-2026-002	cea47adf-c2b4-42dc-85e1-f77a82853cb0	7fde5ad7-ded1-4bc0-b18f-d224024c1289	c70df463-0f8f-4cf9-9da1-ef5526d5e6e6	2026-2027	1	VALIDE	\N	2026-07-08 14:15:00	seed-demo	\N	2026-07-08 14:15:00	2026-07-09 06:43:11.613	\N	\N	\N
db5fe1fe-5b7e-44a7-b8a8-f0975bf28388	DEMO-PE-2026-003	ce2842ec-13d7-4b9b-8491-26aa92080b35	9e2ec4f4-56fa-4f44-ad6a-0711e2fe41ff	8b091357-0bd9-4cf2-95ac-297743896231	2026-2027	1	REJETE	Relevé de notes non conforme aux exigences de la filière.	2026-07-10 09:00:00	seed-demo	\N	2026-07-10 09:00:00	2026-07-09 06:43:25.157	\N	\N	\N
6662568d-4027-4368-b090-922bd4d31cf0	DEMO-PE-2026-004	e22b8e9b-8d98-4316-bc74-49126b9f38e8	95e903eb-b782-4dde-9aa9-ca40d6484664	1e8f8742-21b9-4801-8fa7-f7588875a074	2026-2027	1	REJETE	Pièce d'identité illisible ou expirée.	2026-07-12 16:45:00	seed-demo	\N	2026-07-12 16:45:00	2026-07-09 06:43:38.713	\N	\N	\N
3c1486d8-fc11-41ca-80f8-8917883d2507	DEMO-PE-2026-005	7a4993ea-5eb4-4ff8-9e66-c4c5f5d5acf2	7d0cbf1e-82ae-4749-8a79-b6d5cbff992f	27862738-53ec-496d-835f-a5c24245c653	2026-2027	1	EN_ATTENTE	\N	\N	\N	\N	2026-07-15 11:20:00	2026-07-09 06:43:52.472	\N	\N	\N
071fbe30-d3ca-4c12-8b61-47d71153c8de	DEMO-PE-2026-006	acec5f54-1db7-44ab-abcd-514941a94b89	7e01c588-abc1-4948-90fe-c36f84cefa0e	504d0e86-c98f-4fc2-a4e8-235788a21a30	2026-2027	1	EN_ATTENTE	\N	\N	\N	\N	2026-07-18 08:50:00	2026-07-09 06:44:06.611	\N	\N	\N
527e38f1-7483-43cb-b04c-ef3ec760cecd	DEMO-PE-2026-007	6a4e990b-48f6-4d80-a572-b24a6da10065	9811ada3-f644-4ea8-bc49-5931037541fa	6d578bb6-6a1d-45e7-89ed-b18db9cec6a8	2026-2027	1	SOUS_RESERVE	\N	2026-07-20 13:10:00	seed-demo	\N	2026-07-20 13:10:00	2026-07-09 06:44:20.685	Merci de fournir une attestation de réussite au BAC complémentaire.	\N	\N
520d1e7b-8314-4ba9-aba1-0c74b91d2509	DEMO-PE-2026-008	95798e76-e65d-4a9d-8e4d-6bc1dbe24169	859c2c8c-3470-4d6a-a7d0-2ab149d2840b	7338f85e-731a-4e03-84ee-891f4c7d8e12	2026-2027	1	SOUS_RESERVE	\N	2026-07-22 15:40:00	seed-demo	\N	2026-07-22 15:40:00	2026-07-09 06:44:34.954	Photo d'identité non conforme aux normes requises.	\N	\N
e6c58340-1f86-4ee7-8f54-335e6e0e24e1	DEMO-PE-2026-009	7dafd101-8703-4048-a7ac-b3e5a59a7a20	5dd45f0a-18fb-4b05-8657-ec6609165070	eb18c3d8-8756-4e5e-bb01-c19a8409428d	2026-2027	1	VALIDE	\N	2026-07-25 10:05:00	seed-demo	\N	2026-07-25 10:05:00	2026-07-09 06:44:48.903	\N	\N	\N
ee6be6f7-2419-44a7-89d7-cb16a248e509	DEMO-PE-2026-010	63433950-de27-4e70-8f2f-5422ee728631	fb06e7f8-0a7f-4a59-a321-2d5299fa6ec3	f34ed1d5-c65c-4de4-8cec-8bed55c36a40	2026-2027	1	VALIDE	\N	2026-07-28 17:25:00	seed-demo	\N	2026-07-28 17:25:00	2026-07-09 06:45:03.388	\N	\N	\N
42baee97-f93f-490a-a8a0-84094cfc6052	DEMO-PE-2026-011	c61477fa-be86-447c-a001-5b043b58d3b3	11b8146f-55b6-49b2-ac20-a082e73b25bf	688bc6b3-e29e-4d07-854b-06da1337a7b5	2026-2027	1	REJETE	Dossier incomplet : absence de certificat de scolarité.	2026-08-01 09:35:00	seed-demo	\N	2026-08-01 09:35:00	2026-07-09 06:45:18.321	\N	\N	\N
b17d0f42-c1f3-4d9c-8e38-e94271df82b4	DEMO-PE-2026-012	acf582c5-34a6-463f-9ded-c9ae33cec93c	cb966a36-2648-4449-aa57-055be9c1aa8a	c2073e47-1e76-4c8d-b042-16fbcf356638	2026-2027	1	EN_ATTENTE	\N	\N	\N	\N	2026-08-05 12:00:00	2026-07-09 06:45:33.482	\N	\N	\N
4616d7a9-8544-42b1-84e8-b99bbf7f2bce	DEMO-PE-2026-013	c489ab2e-1f30-4490-8da7-a4f3be59a9a3	78d1f8b1-fbc1-4d7a-8859-9308139fb1e8	e81c0f9c-1a75-41c9-9f53-77776c11ccd9	2026-2027	1	SOUS_RESERVE	\N	2026-08-08 14:55:00	seed-demo	\N	2026-08-08 14:55:00	2026-07-09 06:45:47.975	Relevé de notes du BAC en attente de validation par l'établissement.	\N	\N
86b7c7af-9370-4930-9097-0db32055cc69	DEMO-PE-2026-014	d4370a44-36c4-4a83-a694-9ce69b76226b	4ce23399-864e-4300-add4-2ea33e37a7af	c70df463-0f8f-4cf9-9da1-ef5526d5e6e6	2026-2027	1	SOUS_RESERVE	\N	2026-08-10 11:15:00	seed-demo	\N	2026-08-10 11:15:00	2026-07-09 06:46:04.309	Acte de naissance à fournir en version certifiée conforme.	\N	\N
8fd9deb5-c855-4346-82ea-35e4dee3dae4	DEMO-PE-2026-015	55c80461-24f9-44dd-b695-d700fba2c36d	9ca6e685-5abd-4dc8-af6b-c951ed2cab93	27862738-53ec-496d-835f-a5c24245c653	2026-2027	1	EN_ATTENTE	\N	\N	\N	\N	2026-08-12 16:30:00	2026-07-09 06:46:22.162	\N	\N	\N
\.


--
-- Data for Name: Receipt; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Receipt" (id, "paymentId", "applicationId", "receiptNumber", "receiptType", "receiptUrl", "issuedAt", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SchoolRequirement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SchoolRequirement" (id, "etablissementId", code, label, "requirementType", "profileFieldKey", "isRequired", "createdAt", "updatedAt") FROM stdin;
7f85df9d-14cb-4c6e-bd29-17b1c6629b07	504d0e86-c98f-4fc2-a4e8-235788a21a30	acte_naissance	Acte de naissance	PROFILE_FIELD	acteNaissance	t	2026-06-28 17:11:57.702	2026-06-28 17:12:09.075
5ae1b9a3-7722-4b87-a4ff-fdae34d1304b	504d0e86-c98f-4fc2-a4e8-235788a21a30	releve_bac	Relevé du BAC	PROFILE_FIELD	releve	t	2026-06-28 17:13:45.932	2026-06-28 17:13:45.932
5b4062a7-56e4-4635-9486-b54969c81ad0	504d0e86-c98f-4fc2-a4e8-235788a21a30	photo_identite	Photo d'identité	PROFILE_FIELD	photo	t	2026-06-28 17:15:25.976	2026-06-28 17:15:25.976
f051cbd3-9eee-4b9e-a0f7-c1060773b4c8	504d0e86-c98f-4fc2-a4e8-235788a21a30	carte_identite	Carte d'identité	PROFILE_FIELD	carteIdentite	t	2026-06-28 17:16:42.195	2026-06-28 17:16:42.195
29336be6-589f-49b7-a61c-da5eca100af9	504d0e86-c98f-4fc2-a4e8-235788a21a30	attestation_bac	Attestation de réussite au BAC	DOCUMENT_UPLOAD	\N	t	2026-06-28 17:17:59.236	2026-06-28 17:17:59.236
\.


--
-- Data for Name: SystemAlert; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SystemAlert" (id, type, severity, title, message, data, resolved, "resolvedAt", "resolvedBy", "createdAt", "updatedAt") FROM stdin;
6fa1a5f7-a524-414c-915c-f4c7aeccef83	DELIVERY_ISSUE	ERROR	Email delivery failed permanently	Email 01c2f0b3-c003-4b29-9175-1b0bab596ed6 to thechill000@gmail.com failed after 6 attempts	{"error": "ENOENT: no such file or directory, open 'C:\\\\Users\\\\ELITEBOOK 840 G5\\\\unipath-mvp\\\\unipath-api\\\\temp\\\\fiche-preinscription-INS-2026-000002.pdf'", "emailId": "01c2f0b3-c003-4b29-9175-1b0bab596ed6", "subject": "[UniPath] Confirmation de votre pré-inscription", "smtpCode": "ESTREAM", "recipient": "thechill000@gmail.com"}	f	\N	\N	2026-07-02 09:32:54.886	2026-07-02 09:32:54.886
de5259ae-a999-4d31-a9a0-02db368c5551	DELIVERY_ISSUE	ERROR	Email delivery failed permanently	Email 224d5ec9-4a39-4325-bf2c-0afc44c2628c to thechill000@gmail.com failed after 6 attempts	{"error": "ENOENT: no such file or directory, open 'C:\\\\Users\\\\ELITEBOOK 840 G5\\\\unipath-mvp\\\\unipath-api\\\\temp\\\\fiche-preinscription-INS-2026-000003.pdf'", "emailId": "224d5ec9-4a39-4325-bf2c-0afc44c2628c", "subject": "[UniPath] Confirmation de votre pré-inscription", "smtpCode": "ESTREAM", "recipient": "thechill000@gmail.com"}	f	\N	\N	2026-07-02 11:18:05.02	2026-07-02 11:18:05.02
\.


--
-- Data for Name: UserPreferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserPreferences" (id, "userId", preferences, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
7e8fef8f-161b-4b1f-b29f-ca72fde61b15	1043cf7d341a830f7af23a035bc279b89d806745f8eeccab6c3a1a58875013c3	2026-05-07 09:53:48.560808+00	20250104_add_action_history	\N	\N	2026-05-07 09:53:47.864899+00	1
50a0e910-9e78-4776-b56e-32c1d919048d	4d28876d96315ff5ef5aeaa591b3db5dbe57fbcbaf4a18e32f3a4f5f17468304	2026-05-07 09:54:03.284236+00	20260507095359_add_pieces_extras	\N	\N	2026-05-07 09:54:01.61186+00	1
fe17ab61-ae42-46ee-b76b-9a4107e6c8ba	e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855	2026-05-11 15:03:44.81334+00	20260510173725_refonte_dossier_inscription	\N	\N	2026-05-11 15:03:43.818274+00	1
406ca926-3d14-48bc-83ce-dc87f8538463	28741342d687da8ceb652c822ee675a236b9011aa64a187a9b8bf370eb8f0db8	2026-05-11 15:03:46.222902+00	20260511160307_add_email_content_fields	\N	\N	2026-05-11 15:03:45.242013+00	1
88dafa4f-ac68-408a-a9a9-b0a0dc31d6fb	3c3cf90899eefc0222b387607f504147e07e8d64d4388ec185b2771f000d6058	2026-05-12 14:43:57.696559+00	20260116000000_add_double_verdict_fields		\N	2026-05-12 14:43:57.696559+00	0
4f0b9a55-be11-4cf0-8947-51d650bb17f2	bfb9415488cf6b92718ca16b9759f26f46dc1c485c5df729e33d5c2bf146d900	2026-06-09 16:49:59.252897+00	20260527133000_add_private_school_application_flow	\N	\N	2026-06-09 16:49:56.958237+00	1
7227daa7-2f8f-4122-85fb-5734feb223c4	1361a2a3ae14fd90687e01e2cfe09db19f92652bbac2a460f67e0cd8c3bf17ee	\N	20260529120000_add_etudiant_role	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260529120000_add_etudiant_role\n\nDatabase error code: 55P04\n\nDatabase error:\nERROR: unsafe use of new value "ETUDIANT" of enum type "Role"\nHINT: New enum values must be committed before they can be used.\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E55P04), message: "unsafe use of new value \\"ETUDIANT\\" of enum type \\"Role\\"", detail: None, hint: Some("New enum values must be committed before they can be used."), position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("enum.c"), line: Some(97), routine: Some("check_safe_enum_use") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260529120000_add_etudiant_role"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260529120000_add_etudiant_role"\n             at schema-engine\\core\\src\\commands\\apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:226	2026-06-16 02:46:03.392391+00	2026-06-09 16:54:44.01994+00	0
13ff07a2-d688-4d7d-83e4-074b1b075d59	1361a2a3ae14fd90687e01e2cfe09db19f92652bbac2a460f67e0cd8c3bf17ee	2026-06-16 02:46:03.761211+00	20260529120000_add_etudiant_role		\N	2026-06-16 02:46:03.761211+00	0
a1855c76-df4f-4821-81d7-6e784e8420aa	5b323c679559346f2f83f96be2ede0104f40705ec12b54d92298325fa72f091e	\N	20260605130000_add_campagne_inscription	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260605130000_add_campagne_inscription\n\nDatabase error code: 55P04\n\nDatabase error:\nERROR: unsafe use of new value "ADMIN_ETABLISSEMENT" of enum type "Role"\nHINT: New enum values must be committed before they can be used.\n\nPosition:\n[1m  9[0m     "id" TEXT NOT NULL,\n[1m 10[0m     "nom" TEXT NOT NULL,\n[1m 11[0m     "prenom" TEXT NOT NULL,\n[1m 12[0m     "email" TEXT NOT NULL,\n[1m 13[0m     "telephone" TEXT,\n[1m 14[1;31m     "role" "Role" NOT NULL DEFAULT 'ADMIN_ETABLISSEMENT',[0m\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E55P04), message: "unsafe use of new value \\"ADMIN_ETABLISSEMENT\\" of enum type \\"Role\\"", detail: None, hint: Some("New enum values must be committed before they can be used."), position: Some(Original(406)), where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("enum.c"), line: Some(97), routine: Some("check_safe_enum_use") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260605130000_add_campagne_inscription"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260605130000_add_campagne_inscription"\n             at schema-engine\\core\\src\\commands\\apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:226	2026-06-16 02:47:53.310029+00	2026-06-16 02:47:20.478392+00	0
c230eac8-2698-4e8a-9ae8-25bad84c24ad	eeb6b91c56ced3fefb25473c4d14d3ab1357c9e0ff70d331e9711d157b955629	2026-06-16 02:48:31.093865+00	20260605130000_add_campagne_inscription	\N	\N	2026-06-16 02:48:30.152991+00	1
a92d69ab-6b64-42e7-8127-040b67bddda3	8d8effbb0a253d9abe0c05c08678dc02c6b6cc7a3d62027afd0040e8fa1df3ae	2026-06-26 16:28:11.3039+00	20260627120000_dossier_inscription_complements	\N	\N	2026-06-26 16:28:10.428439+00	1
669eab25-40bf-49dd-a517-d1464e498e34	87687c6df6d3862131e45c4e1a356b1b2b37e7b3a63987ed1225457855286721	2026-06-16 02:48:33.366012+00	20260605130100_add_campagne_inscription_tables	\N	\N	2026-06-16 02:48:31.429697+00	1
e5a6d55d-f31d-4b67-853a-29b8e9c94656	17e29621851ee0430cd7ded1b23a06474e296f14d38fac2a65fa16066ad0a530	2026-06-16 02:50:53.873982+00	20260529120100_set_etudiant_default	\N	\N	2026-06-16 02:50:52.959182+00	1
55ee31a0-f5fc-409a-86cb-04e53125d980	1a2250cee6cb4dd5f571b7c3cf1be1231e1f69c0d5c4d334c0f1226d81884548	2026-06-16 09:48:34.22536+00	20260616120000_add_centres_composition_concours	\N	\N	2026-06-16 09:48:32.95216+00	1
96004b12-a83b-4f5f-99a9-be68c185d25c	a84909750b792d6cd00e74dff4f8bf72a52e67d2f96aab875d4cff1f013b1877	2026-06-27 13:27:36.274927+00	20260529120000_add_centre_composition_choisi_dossier	\N	\N	2026-06-27 13:27:35.295012+00	1
33dd608f-b96c-4e3e-9108-2569ffa93fdf	cbc058d31be9b9c5785eaf975af478b5ce2a8cd2874769d1bcfc71fb29ac96ca	2026-06-26 14:26:55.294906+00	20260616130000_add_v_statistiques_dges	\N	\N	2026-06-26 14:26:54.213892+00	1
c937843e-177e-40f0-bd26-6cde5f2ba0ac	23888d4ccb8b17426ba6dbf9b10aeedcebd527e876bb28942e0089ec8de1010d	2026-06-26 14:26:56.62526+00	20260626143000_enrichissement_inscription_academique	\N	\N	2026-06-26 14:26:55.617529+00	1
4d1c15cd-d184-4c42-9f78-ca1930270423	8b56202c6d3165718e6bd78d8b382af7b557f1f2b42eabf8b27e1d2da706bc29	2026-06-30 23:47:35.633866+00	20260529190000_link_concours_etablissement_public	\N	\N	2026-06-30 23:47:33.837474+00	1
ed38af9b-581e-46b0-8def-5d51b4fdbd23	249368b0401298e7142a8ab3c87bd9966e2b3291e10c9b4184f9adef728b3c6c	2026-06-28 09:12:25.767868+00	20260628120000_add_campagne_filiere_id_application	\N	\N	2026-06-28 09:12:24.918095+00	1
23630600-d0be-4962-8f46-f358943cb372	7b09a7ccb13a2f1ad267039c061a4fb418ac46b0ec31d219393a310bfc2c4f7e	2026-06-28 12:20:38.954648+00	20260628130100_add_etablissement_profile_fields	\N	\N	2026-06-28 12:20:37.911798+00	1
d53f2c63-e341-48ae-805c-1203e7f6168e	c5d32829f98820cc2e72736118d410671039634710a43341c7d93159b0209dc7	2026-06-28 12:24:26.040763+00	20260628130200_add_filiere_pedagogique_fields	\N	\N	2026-06-28 12:24:25.053572+00	1
e491265d-0574-4cbf-b000-4330f509c3f1	c8ea1cd37bd3359dfb290ffe15e7a02000698243273e8154507f7759b4d59352	2026-07-01 06:26:19.946201+00	20260529200000_membre_commission_etablissement	\N	\N	2026-07-01 06:26:18.82422+00	1
810fecad-7d09-4755-93a0-e587362aac94	fddfc8527ebc6812182daa97dc56ec0e88a788df6c7a804bf2692bcc0c667277	2026-06-28 17:36:04.769456+00	20260529140000_add_centres_composition_relationnels	\N	\N	2026-06-28 17:36:03.796735+00	1
102fbdac-c17c-4439-8444-568752cd7e1e	3e37b237740cd6af191d8520a5b66580ad13333f6d09cc5daad4d64c1e1a4e9d	2026-06-30 22:03:21.467756+00	20260529180000_add_email_confirm_token	\N	\N	2026-06-30 22:03:20.520308+00	1
e3baabad-b425-4629-93f3-7f68043d8111	ef88f83040d1f68dc7f3784a834d269a8bf70d7db4be644ca3594a56b61c1805	2026-07-02 07:18:25.345159+00	20260702120000_decision_controleur_modifie_count	\N	\N	2026-07-02 07:18:24.458412+00	1
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2026-04-06 12:20:08
20211116045059	2026-04-06 12:20:08
20211116050929	2026-04-06 12:20:08
20211116051442	2026-04-06 12:20:08
20211116212300	2026-04-06 12:20:08
20211116213355	2026-04-06 12:20:08
20211116213934	2026-04-06 12:20:08
20211116214523	2026-04-06 12:20:08
20211122062447	2026-04-06 12:20:08
20211124070109	2026-04-06 12:20:08
20211202204204	2026-04-06 12:20:08
20211202204605	2026-04-06 12:20:08
20211210212804	2026-04-06 12:20:08
20211228014915	2026-04-06 12:20:08
20220107221237	2026-04-06 12:20:08
20220228202821	2026-04-06 12:20:08
20220312004840	2026-04-06 12:20:08
20220603231003	2026-04-06 12:20:08
20220603232444	2026-04-06 12:20:08
20220615214548	2026-04-06 12:20:08
20220712093339	2026-04-06 12:20:08
20220908172859	2026-04-06 12:20:08
20220916233421	2026-04-06 12:20:08
20230119133233	2026-04-06 12:20:09
20230128025114	2026-04-06 12:20:09
20230128025212	2026-04-06 12:20:09
20230227211149	2026-04-06 12:20:09
20230228184745	2026-04-06 12:20:09
20230308225145	2026-04-06 12:20:09
20230328144023	2026-04-06 12:20:09
20231018144023	2026-04-06 12:20:09
20231204144023	2026-04-06 12:20:09
20231204144024	2026-04-06 12:20:09
20231204144025	2026-04-06 12:20:09
20240108234812	2026-04-06 12:20:09
20240109165339	2026-04-06 12:20:09
20240227174441	2026-04-06 12:20:09
20240311171622	2026-04-06 12:20:09
20240321100241	2026-04-06 12:20:09
20240401105812	2026-04-06 12:20:09
20240418121054	2026-04-06 12:20:09
20240523004032	2026-04-06 12:20:09
20240618124746	2026-04-06 12:20:09
20240801235015	2026-04-06 12:20:09
20240805133720	2026-04-06 12:20:09
20240827160934	2026-04-06 12:20:09
20240919163303	2026-04-06 12:20:09
20240919163305	2026-04-06 12:20:09
20241019105805	2026-04-06 12:20:09
20241030150047	2026-04-06 12:20:09
20241108114728	2026-04-06 12:20:09
20241121104152	2026-04-06 12:20:09
20241130184212	2026-04-06 12:20:09
20241220035512	2026-04-06 12:20:09
20241220123912	2026-04-06 12:20:09
20241224161212	2026-04-06 12:20:09
20250107150512	2026-04-06 12:20:09
20250110162412	2026-04-06 12:20:09
20250123174212	2026-04-06 12:20:09
20250128220012	2026-04-06 12:20:09
20250506224012	2026-04-06 12:20:09
20250523164012	2026-04-06 12:20:09
20250714121412	2026-04-06 12:20:09
20250905041441	2026-04-06 12:20:09
20251103001201	2026-04-06 12:20:09
20251120212548	2026-04-06 12:20:09
20251120215549	2026-04-06 12:20:09
20260218120000	2026-04-06 12:20:09
20260326120000	2026-04-10 13:47:43
20260514120000	2026-06-09 16:20:47
20260527120000	2026-06-09 16:20:47
20260528120000	2026-06-09 16:20:47
20260603120000	2026-06-09 16:20:47
20260605120000	2026-06-23 09:16:55
20260606110000	2026-06-23 09:16:55
20260616120000	2026-06-25 16:00:32
20260624120000	2026-06-25 16:00:32
20260626120000	2026-07-03 14:12:13
20260706120000	2026-07-08 12:17:53
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at, action_filter, selected_columns) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
dossiers-candidats	dossiers-candidats	\N	2026-04-10 15:29:18.081961+00	2026-04-10 15:29:18.081961+00	f	f	5242880	{image/jpeg,image/png,application/pdf}	\N	STANDARD
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2026-04-06 12:20:08.601296
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2026-04-06 12:20:08.634718
2	storage-schema	f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd	2026-04-06 12:20:08.638815
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2026-04-06 12:20:08.666701
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2026-04-06 12:20:08.678534
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2026-04-06 12:20:08.682681
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2026-04-06 12:20:08.687688
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2026-04-06 12:20:08.692517
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2026-04-06 12:20:08.697019
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2026-04-06 12:20:08.701595
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2026-04-06 12:20:08.706682
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2026-04-06 12:20:08.711471
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2026-04-06 12:20:08.716581
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2026-04-06 12:20:08.722759
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2026-04-06 12:20:08.729036
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2026-04-06 12:20:08.761424
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2026-04-06 12:20:08.767782
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2026-04-06 12:20:08.773923
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2026-04-06 12:20:08.779843
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2026-04-06 12:20:08.786517
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2026-04-06 12:20:08.791981
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2026-04-06 12:20:08.7986
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2026-04-06 12:20:08.81464
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2026-04-06 12:20:08.825728
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2026-04-06 12:20:08.830642
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2026-04-06 12:20:08.835936
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2026-04-06 12:20:08.842984
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2026-04-06 12:20:08.846931
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2026-04-06 12:20:08.850951
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2026-04-06 12:20:08.854935
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2026-04-06 12:20:08.859205
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2026-04-06 12:20:08.864343
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2026-04-06 12:20:08.868362
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2026-04-06 12:20:08.872137
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2026-04-06 12:20:08.876308
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2026-04-06 12:20:08.880404
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2026-04-06 12:20:08.884781
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2026-04-06 12:20:08.888388
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2026-04-06 12:20:08.893451
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2026-04-06 12:20:08.910124
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2026-04-06 12:20:08.914117
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2026-04-06 12:20:08.918537
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2026-04-06 12:20:08.922443
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2026-04-06 12:20:08.926474
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2026-04-06 12:20:08.931371
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2026-04-06 12:20:08.936342
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2026-04-06 12:20:08.945729
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2026-04-06 12:20:08.950443
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2026-04-06 12:20:08.95607
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2026-04-06 12:20:08.971827
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-04-06 12:20:08.976364
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-04-06 12:20:09.624757
52	drop-not-used-indexes-and-functions	5cc44c8696749ac11dd0dc37f2a3802075f3a171	2026-04-06 12:20:09.62675
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-04-06 12:20:09.635478
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-04-06 12:20:09.637952
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-04-06 12:20:09.639665
57	s3-multipart-uploads-metadata	f127886e00d1b374fadbc7c6b31e09336aad5287	2026-04-06 17:38:42.643886
58	operation-ergonomics	00ca5d483b3fe0d522133d9002ccc5df98365120	2026-04-06 17:38:42.727639
56	fix-optimized-search-function	b823ed1e418101032fa01374edc9a436e54e3ed4	2026-04-06 12:20:09.644774
59	drop-unused-functions	38456f13e39691c2bbb4b5151d0d1cdbabd4a8c4	2026-05-10 16:19:15.13732
60	optimize-existing-functions-again	db35e1c91a9201e59f4fef8d972c2f277d68b157	2026-05-10 16:19:15.145097
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
28bafdec-3436-43a0-9d19-2960f13b9549	dossiers-candidats	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c/photo-1775903933774.pdf	\N	2026-04-11 10:38:59.456938+00	2026-04-11 10:38:59.456938+00	2026-04-11 10:38:59.456938+00	{"eTag": "\\"bae4fefd8ee3fa0ae638d0f0d0c1b8ae\\"", "size": 145388, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-04-11T10:39:00.000Z", "contentLength": 145388, "httpStatusCode": 200}	1e53b3f3-ca1c-4f3f-ac99-b76524d3eab8	\N	{}
1cb1d2f7-622b-4ff7-a0fd-686af75fd6bc	dossiers-candidats	ec032fe4-9093-4825-a3ff-af8a8c4b2fad/photo-1776320057773.pdf	\N	2026-04-16 06:14:18.927801+00	2026-04-16 06:14:18.927801+00	2026-04-16 06:14:18.927801+00	{"eTag": "\\"bae4fefd8ee3fa0ae638d0f0d0c1b8ae\\"", "size": 145388, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-04-16T06:14:19.000Z", "contentLength": 145388, "httpStatusCode": 200}	3a382a90-8280-456e-9657-3753a0b7ba2f	\N	{}
8443f3a7-0fc7-4698-bac7-ab50ecf7bd7a	dossiers-candidats	1edb2bf5-83ef-46f1-b926-ea889ef8cf7c/photo-1776846723286.jpg	\N	2026-04-22 09:32:09.994639+00	2026-04-22 09:32:09.994639+00	2026-04-22 09:32:09.994639+00	{"eTag": "\\"138a42f9bd9c6fcccaea1d349f3042e1\\"", "size": 180501, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-22T09:32:10.000Z", "contentLength": 180501, "httpStatusCode": 200}	2d42425c-211f-47dd-937a-3164a57cd56d	\N	{}
4cc3c9b6-78a7-4f42-b460-c6604bc7acef	dossiers-candidats	8e237b3f-2e09-4938-899b-b97d12deee1a/acteNaissance-1778022243461.pdf	\N	2026-05-05 23:04:05.841528+00	2026-05-05 23:04:05.841528+00	2026-05-05 23:04:05.841528+00	{"eTag": "\\"ea788c163ea97760dc6bc2ca291a018f\\"", "size": 1289601, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-05-05T23:04:06.000Z", "contentLength": 1289601, "httpStatusCode": 200}	ff7d85bb-67e3-4347-ba51-a2454c134c2f	\N	{}
bb943334-3523-4e6b-93d1-4f1bc238eb59	dossiers-candidats	8e237b3f-2e09-4938-899b-b97d12deee1a/carteIdentite-1778022493794.jpg	\N	2026-05-05 23:08:15.299896+00	2026-05-05 23:08:15.299896+00	2026-05-05 23:08:15.299896+00	{"eTag": "\\"8d45bd9f1936d0041406ff2e9aa9faff\\"", "size": 181665, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-05T23:08:16.000Z", "contentLength": 181665, "httpStatusCode": 200}	08e298f8-a298-4122-8bcf-08d9a599f44f	\N	{}
07a1a7f4-a56a-46bf-9338-b81fed583a0e	dossiers-candidats	8e237b3f-2e09-4938-899b-b97d12deee1a/photo-1778022510580.jpg	\N	2026-05-05 23:08:31.719171+00	2026-05-05 23:08:31.719171+00	2026-05-05 23:08:31.719171+00	{"eTag": "\\"9fffd79c3dce00a58095c1c53e6019f3\\"", "size": 34966, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-05T23:08:32.000Z", "contentLength": 34966, "httpStatusCode": 200}	23557812-d959-468b-8375-400c89ecc1b4	\N	{}
17df65ad-ef32-4fb1-a9a6-32d355e026a5	dossiers-candidats	8e237b3f-2e09-4938-899b-b97d12deee1a/releve-1778022537786.pdf	\N	2026-05-05 23:08:59.094824+00	2026-05-05 23:08:59.094824+00	2026-05-05 23:08:59.094824+00	{"eTag": "\\"2e1b3f48d7515a45195a18140a32d53a\\"", "size": 72506, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-05-05T23:09:00.000Z", "contentLength": 72506, "httpStatusCode": 200}	bc731509-fdd7-40d1-b7d9-d92bca54e23a	\N	{}
61483aca-dcf9-4de6-ac3d-1dd47417976b	dossiers-candidats	8e237b3f-2e09-4938-899b-b97d12deee1a/quittance-1778022552049.pdf	\N	2026-05-05 23:09:14.358082+00	2026-05-05 23:09:14.358082+00	2026-05-05 23:09:14.358082+00	{"eTag": "\\"ea788c163ea97760dc6bc2ca291a018f\\"", "size": 1289601, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-05-05T23:09:15.000Z", "contentLength": 1289601, "httpStatusCode": 200}	f667bb66-8e54-40f3-88f5-74df0367c1c6	\N	{}
2a1ac858-1029-4e9d-8e52-e2b0c5730b35	dossiers-candidats	47f79776-a2d5-497b-80fa-8b38670461f4/acteNaissance-1778105726936.pdf	\N	2026-05-06 22:15:27.984141+00	2026-05-06 22:15:27.984141+00	2026-05-06 22:15:27.984141+00	{"eTag": "\\"26d1fd971c9c3e1660d8b0018a7fd35a\\"", "size": 75889, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-05-06T22:15:28.000Z", "contentLength": 75889, "httpStatusCode": 200}	d15c11f7-1276-4a7e-b883-03cb9875eb10	\N	{}
e4620c3e-a5fd-43db-b245-9712479f729f	dossiers-candidats	47f79776-a2d5-497b-80fa-8b38670461f4/carteIdentite-1778105741688.pdf	\N	2026-05-06 22:15:42.485003+00	2026-05-06 22:15:42.485003+00	2026-05-06 22:15:42.485003+00	{"eTag": "\\"d2138dbefc0de365493f288bead6c325\\"", "size": 75889, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-05-06T22:15:43.000Z", "contentLength": 75889, "httpStatusCode": 200}	a5f02894-0a29-4429-b738-26dd6af56e25	\N	{}
7fc81ae8-779b-45e3-b0b7-775d8682fdfb	dossiers-candidats	47f79776-a2d5-497b-80fa-8b38670461f4/photo-1778105764422.jpg	\N	2026-05-06 22:16:05.068197+00	2026-05-06 22:16:05.068197+00	2026-05-06 22:16:05.068197+00	{"eTag": "\\"9fffd79c3dce00a58095c1c53e6019f3\\"", "size": 34966, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-06T22:16:06.000Z", "contentLength": 34966, "httpStatusCode": 200}	23022371-5337-4127-9f59-f32b644d4154	\N	{}
8c08606b-8711-485c-8527-06b6a4048132	dossiers-candidats	47f79776-a2d5-497b-80fa-8b38670461f4/releve-1778105779388.pdf	\N	2026-05-06 22:16:20.146716+00	2026-05-06 22:16:20.146716+00	2026-05-06 22:16:20.146716+00	{"eTag": "\\"26d1fd971c9c3e1660d8b0018a7fd35a\\"", "size": 75889, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-05-06T22:16:21.000Z", "contentLength": 75889, "httpStatusCode": 200}	6e06ada5-0fc4-495d-bfb7-a8eca4ea4d43	\N	{}
59177245-5717-4390-bf95-496a774db963	dossiers-candidats	4b12fd5d-c098-4b02-b03d-43a0a4b69150/acteNaissance-1778146768206.pdf	\N	2026-05-07 09:39:37.911495+00	2026-05-07 09:39:37.911495+00	2026-05-07 09:39:37.911495+00	{"eTag": "\\"fd93a50984e3228b2ebb40e85b4c8978\\"", "size": 629909, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-05-07T09:39:38.000Z", "contentLength": 629909, "httpStatusCode": 200}	314c9f87-f679-47ad-a446-646962f1dff2	\N	{}
8ea97b52-754a-4e5d-b9f8-a3f4a9cc645f	dossiers-candidats	4b12fd5d-c098-4b02-b03d-43a0a4b69150/carteIdentite-1778146856441.pdf	\N	2026-05-07 09:41:02.048811+00	2026-05-07 09:41:02.048811+00	2026-05-07 09:41:02.048811+00	{"eTag": "\\"d4cc35e612ef7c6f2ca5cc6213a7afbf\\"", "size": 209471, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-05-07T09:41:02.000Z", "contentLength": 209471, "httpStatusCode": 200}	2f471040-7e6a-438e-9c15-51450173e2f0	\N	{}
53a68d6c-4925-42a0-a066-110e9719bbaf	dossiers-candidats	4b12fd5d-c098-4b02-b03d-43a0a4b69150/photo-1778147032284.jpg	\N	2026-05-07 09:44:15.586757+00	2026-05-07 09:44:15.586757+00	2026-05-07 09:44:15.586757+00	{"eTag": "\\"aeb6a986ee81d3209071aced34adca81\\"", "size": 181558, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-07T09:44:16.000Z", "contentLength": 181558, "httpStatusCode": 200}	e29c5d05-71f1-437c-963b-c8ed9f3ee199	\N	{}
9f09d79e-9daf-4ffd-875a-623c573d3eea	dossiers-candidats	4b12fd5d-c098-4b02-b03d-43a0a4b69150/releve-1778147110362.pdf	\N	2026-05-07 09:45:15.274031+00	2026-05-07 09:45:15.274031+00	2026-05-07 09:45:15.274031+00	{"eTag": "\\"fd93a50984e3228b2ebb40e85b4c8978\\"", "size": 629909, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-05-07T09:45:16.000Z", "contentLength": 629909, "httpStatusCode": 200}	f185ad62-3f35-4ac6-8e13-513c912531c1	\N	{}
d41e339e-3a03-4dc8-bb48-eeae52a88510	dossiers-candidats	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f/acteNaissance-1782250653914.pdf	\N	2026-06-23 21:37:35.425298+00	2026-06-23 21:37:35.425298+00	2026-06-23 21:37:35.425298+00	{"eTag": "\\"438fe279ccd1cad3c271844a884f8a73\\"", "size": 122663, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T21:37:36.000Z", "contentLength": 122663, "httpStatusCode": 200}	ddf520a9-e566-4120-b9cf-8e41403328d2	\N	{}
b853879f-44cc-4f64-a052-0be289995e6d	dossiers-candidats	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f/carteIdentite-1782250679369.jpeg	\N	2026-06-23 21:38:03.836221+00	2026-06-23 21:38:03.836221+00	2026-06-23 21:38:03.836221+00	{"eTag": "\\"060e529d4d1e87772c96fd3d1075d6d4\\"", "size": 63352, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T21:38:04.000Z", "contentLength": 63352, "httpStatusCode": 200}	fe3e7c66-0c15-4adb-85f2-5ddddcbb765a	\N	{}
7ddcad1a-51ce-4c9d-a683-8d4eb99cef2b	dossiers-candidats	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f/photo-1782250701085.png	\N	2026-06-23 21:38:25.173606+00	2026-06-23 21:38:25.173606+00	2026-06-23 21:38:25.173606+00	{"eTag": "\\"4dc34feb2d9453f8e18be589cdcf268f\\"", "size": 1057531, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T21:38:26.000Z", "contentLength": 1057531, "httpStatusCode": 200}	8fa6673c-dd30-4969-b9ad-cf9aa70489e1	\N	{}
f19718ae-9479-42b9-a924-b74eaa224dd9	dossiers-candidats	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f/releve-1782250724551.pdf	\N	2026-06-23 21:38:47.438928+00	2026-06-23 21:38:47.438928+00	2026-06-23 21:38:47.438928+00	{"eTag": "\\"7488f1b6ff5acdfe88ee29c7d83b7cae\\"", "size": 785671, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T21:38:48.000Z", "contentLength": 785671, "httpStatusCode": 200}	ca1a6b2d-fcb8-47f2-b74f-9e0e5181244a	\N	{}
a2aa710d-102d-4d5a-9f58-1cad00f58609	dossiers-candidats	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f/edda9184-3d32-4b68-a8c5-46d19a49004a/quittance-1782287487104.pdf	\N	2026-06-24 07:51:32.747018+00	2026-06-24 07:51:32.747018+00	2026-06-24 07:51:32.747018+00	{"eTag": "\\"438fe279ccd1cad3c271844a884f8a73\\"", "size": 122663, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-06-24T07:51:33.000Z", "contentLength": 122663, "httpStatusCode": 200}	ff4d1e18-42e7-4f43-93b0-cbfff9202801	\N	{}
fd83f9ac-0a77-47b7-8803-32b487c14a31	dossiers-candidats	9c7bd3dc-ebc0-428f-a6ed-ee96aa5af83f/photo-1782299815424.jpeg	\N	2026-06-24 11:16:58.022566+00	2026-06-24 11:16:58.022566+00	2026-06-24 11:16:58.022566+00	{"eTag": "\\"7a851e96552b63d0a2b8bfd31dc39704\\"", "size": 61070, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-24T11:16:58.000Z", "contentLength": 61070, "httpStatusCode": 200}	70e57ed2-6946-4b39-a29c-0ad2088039b4	\N	{}
e0ebb1fb-f0f7-4cac-9e63-5ffe31cc7e7b	dossiers-candidats	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/acteNaissance-1782638269322.pdf	\N	2026-06-28 09:17:52.299452+00	2026-06-28 09:17:52.299452+00	2026-06-28 09:17:52.299452+00	{"eTag": "\\"45f2984267103382aed60e5484232bd3\\"", "size": 76550, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T09:17:53.000Z", "contentLength": 76550, "httpStatusCode": 200}	6d773932-a195-47d2-9662-4997273ecb02	\N	{}
d7ddca0e-00ab-4ce7-9473-221d21ef50f7	dossiers-candidats	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/carteIdentite-1782638291094.pdf	\N	2026-06-28 09:18:13.913845+00	2026-06-28 09:18:13.913845+00	2026-06-28 09:18:13.913845+00	{"eTag": "\\"697627b6a10c26735b62877dcab3371a\\"", "size": 76049, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T09:18:14.000Z", "contentLength": 76049, "httpStatusCode": 200}	2be39a3a-a0fd-4f74-8ed9-e88bc9177494	\N	{}
41369c6b-5407-4d82-8b5f-5540f14997d6	dossiers-candidats	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/photo-1782638321643.png	\N	2026-06-28 09:18:44.341074+00	2026-06-28 09:18:44.341074+00	2026-06-28 09:18:44.341074+00	{"eTag": "\\"b3c954361888727f124f28b5ee69babd\\"", "size": 23042, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T09:18:45.000Z", "contentLength": 23042, "httpStatusCode": 200}	95177993-ea2d-449e-9889-cccca559513d	\N	{}
91d849c6-b354-47cc-a3f2-1ce16d9f17dc	dossiers-candidats	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/releve-1782638340072.pdf	\N	2026-06-28 09:19:02.794754+00	2026-06-28 09:19:02.794754+00	2026-06-28 09:19:02.794754+00	{"eTag": "\\"d90fb8c169181074b7abba6c6ff3fd9a\\"", "size": 76423, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T09:19:03.000Z", "contentLength": 76423, "httpStatusCode": 200}	12036020-01ad-4ae8-a026-cbbab7f3afdf	\N	{}
ab13b98b-8905-4624-ad2a-21c45000a07d	dossiers-candidats	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/01b7434b-1a80-4e64-a0e3-f04eb833e43e/quittance-1782909733088.pdf	\N	2026-07-01 12:42:12.854907+00	2026-07-01 12:42:12.854907+00	2026-07-01 12:42:12.854907+00	{"eTag": "\\"87af8794694b25ab69b7d1dd5d03e51b\\"", "size": 137525, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-07-01T12:42:13.000Z", "contentLength": 137525, "httpStatusCode": 200}	7f9d32a7-e90f-4147-9ecb-94b6874b5337	\N	{}
1a7788c9-05e9-4c89-9382-822a7ffedcf1	dossiers-candidats	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/73ef6938-9e50-4d8a-9bf6-14bb584c6fd8/quittance-1782971709266.pdf	\N	2026-07-02 05:55:11.427877+00	2026-07-02 05:55:11.427877+00	2026-07-02 05:55:11.427877+00	{"eTag": "\\"45f2984267103382aed60e5484232bd3\\"", "size": 76550, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-07-02T05:55:12.000Z", "contentLength": 76550, "httpStatusCode": 200}	79507d60-4558-4724-ae59-eef98178d29c	\N	{}
f3ec9035-94cd-4b30-83d4-0c1cb19ffdbb	dossiers-candidats	1f1bc8d1-5f57-47ae-8b9c-952c45ffde14/photo-1782974709570.jpg	\N	2026-07-02 06:45:10.638926+00	2026-07-02 06:45:10.638926+00	2026-07-02 06:45:10.638926+00	{"eTag": "\\"4c17770ca44c501f21cb2ef5c4c77436\\"", "size": 757, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-02T06:45:11.000Z", "contentLength": 757, "httpStatusCode": 200}	6df93edb-f047-449f-b847-98a3a9d546b7	\N	{}
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata, metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 508, true);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_admin
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: ActionHistory ActionHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ActionHistory"
    ADD CONSTRAINT "ActionHistory_pkey" PRIMARY KEY (id);


--
-- Name: AdminEtablissement AdminEtablissement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AdminEtablissement"
    ADD CONSTRAINT "AdminEtablissement_pkey" PRIMARY KEY (id);


--
-- Name: AdministrateurDGES AdministrateurDGES_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AdministrateurDGES"
    ADD CONSTRAINT "AdministrateurDGES_pkey" PRIMARY KEY (id);


--
-- Name: ApplicationDocument ApplicationDocument_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApplicationDocument"
    ADD CONSTRAINT "ApplicationDocument_pkey" PRIMARY KEY (id);


--
-- Name: Application Application_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_pkey" PRIMARY KEY (id);


--
-- Name: CampagneFiliere CampagneFiliere_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CampagneFiliere"
    ADD CONSTRAINT "CampagneFiliere_pkey" PRIMARY KEY (id);


--
-- Name: CampagneInscription CampagneInscription_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CampagneInscription"
    ADD CONSTRAINT "CampagneInscription_pkey" PRIMARY KEY (id);


--
-- Name: Candidat Candidat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Candidat"
    ADD CONSTRAINT "Candidat_pkey" PRIMARY KEY (id);


--
-- Name: CentreComposition CentreComposition_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CentreComposition"
    ADD CONSTRAINT "CentreComposition_pkey" PRIMARY KEY (id);


--
-- Name: Concours Concours_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Concours"
    ADD CONSTRAINT "Concours_pkey" PRIMARY KEY (id);


--
-- Name: ConcourscentreComposition ConcourscentreComposition_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ConcourscentreComposition"
    ADD CONSTRAINT "ConcourscentreComposition_pkey" PRIMARY KEY (id);


--
-- Name: Controleur Controleur_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Controleur"
    ADD CONSTRAINT "Controleur_pkey" PRIMARY KEY (id);


--
-- Name: Diplome Diplome_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Diplome"
    ADD CONSTRAINT "Diplome_pkey" PRIMARY KEY (id);


--
-- Name: DossierInscription DossierInscription_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DossierInscription"
    ADD CONSTRAINT "DossierInscription_pkey" PRIMARY KEY (id);


--
-- Name: Dossier Dossier_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Dossier"
    ADD CONSTRAINT "Dossier_pkey" PRIMARY KEY (id);


--
-- Name: EmailDelivery EmailDelivery_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EmailDelivery"
    ADD CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY (id);


--
-- Name: Etablissement Etablissement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Etablissement"
    ADD CONSTRAINT "Etablissement_pkey" PRIMARY KEY (id);


--
-- Name: Filiere Filiere_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Filiere"
    ADD CONSTRAINT "Filiere_pkey" PRIMARY KEY (id);


--
-- Name: InscriptionAcademique InscriptionAcademique_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InscriptionAcademique"
    ADD CONSTRAINT "InscriptionAcademique_pkey" PRIMARY KEY (id);


--
-- Name: Inscription Inscription_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Inscription"
    ADD CONSTRAINT "Inscription_pkey" PRIMARY KEY (id);


--
-- Name: MembreCommission MembreCommission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembreCommission"
    ADD CONSTRAINT "MembreCommission_pkey" PRIMARY KEY (id);


--
-- Name: Note Note_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Note"
    ADD CONSTRAINT "Note_pkey" PRIMARY KEY (id);


--
-- Name: NotificationAuditLog NotificationAuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NotificationAuditLog"
    ADD CONSTRAINT "NotificationAuditLog_pkey" PRIMARY KEY (id);


--
-- Name: NotificationTemplate NotificationTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NotificationTemplate"
    ADD CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: PreinscriptionEtablissement PreinscriptionEtablissement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PreinscriptionEtablissement"
    ADD CONSTRAINT "PreinscriptionEtablissement_pkey" PRIMARY KEY (id);


--
-- Name: Receipt Receipt_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Receipt"
    ADD CONSTRAINT "Receipt_pkey" PRIMARY KEY (id);


--
-- Name: SchoolRequirement SchoolRequirement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SchoolRequirement"
    ADD CONSTRAINT "SchoolRequirement_pkey" PRIMARY KEY (id);


--
-- Name: SystemAlert SystemAlert_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemAlert"
    ADD CONSTRAINT "SystemAlert_pkey" PRIMARY KEY (id);


--
-- Name: UserPreferences UserPreferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserPreferences"
    ADD CONSTRAINT "UserPreferences_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: messages messages_payload_exclusive; Type: CHECK CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages
    ADD CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL))) NOT VALID;


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: ActionHistory_dossierInscriptionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ActionHistory_dossierInscriptionId_idx" ON public."ActionHistory" USING btree ("dossierInscriptionId");


--
-- Name: ActionHistory_dossierInscriptionId_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ActionHistory_dossierInscriptionId_timestamp_idx" ON public."ActionHistory" USING btree ("dossierInscriptionId", "timestamp" DESC);


--
-- Name: ActionHistory_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ActionHistory_timestamp_idx" ON public."ActionHistory" USING btree ("timestamp");


--
-- Name: ActionHistory_typeAction_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ActionHistory_typeAction_idx" ON public."ActionHistory" USING btree ("typeAction");


--
-- Name: ActionHistory_utilisateurId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ActionHistory_utilisateurId_idx" ON public."ActionHistory" USING btree ("utilisateurId");


--
-- Name: ActionHistory_utilisateurId_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ActionHistory_utilisateurId_timestamp_idx" ON public."ActionHistory" USING btree ("utilisateurId", "timestamp" DESC);


--
-- Name: AdminEtablissement_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "AdminEtablissement_email_key" ON public."AdminEtablissement" USING btree (email);


--
-- Name: AdminEtablissement_etablissementId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AdminEtablissement_etablissementId_idx" ON public."AdminEtablissement" USING btree ("etablissementId");


--
-- Name: AdministrateurDGES_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "AdministrateurDGES_email_key" ON public."AdministrateurDGES" USING btree (email);


--
-- Name: ApplicationDocument_applicationId_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ApplicationDocument_applicationId_code_key" ON public."ApplicationDocument" USING btree ("applicationId", code);


--
-- Name: ApplicationDocument_applicationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ApplicationDocument_applicationId_idx" ON public."ApplicationDocument" USING btree ("applicationId");


--
-- Name: Application_campagneFiliereId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Application_campagneFiliereId_idx" ON public."Application" USING btree ("campagneFiliereId");


--
-- Name: Application_candidatId_filiereId_anneeAcademique_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Application_candidatId_filiereId_anneeAcademique_key" ON public."Application" USING btree ("candidatId", "filiereId", "anneeAcademique");


--
-- Name: Application_candidatId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Application_candidatId_idx" ON public."Application" USING btree ("candidatId");


--
-- Name: Application_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Application_createdAt_idx" ON public."Application" USING btree ("createdAt");


--
-- Name: Application_etablissementId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Application_etablissementId_status_idx" ON public."Application" USING btree ("etablissementId", status);


--
-- Name: Application_numeroApplication_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Application_numeroApplication_key" ON public."Application" USING btree ("numeroApplication");


--
-- Name: Application_preinscriptionId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Application_preinscriptionId_key" ON public."Application" USING btree ("preinscriptionId");


--
-- Name: CampagneFiliere_campagneId_filiereId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CampagneFiliere_campagneId_filiereId_key" ON public."CampagneFiliere" USING btree ("campagneId", "filiereId");


--
-- Name: CampagneFiliere_campagneId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CampagneFiliere_campagneId_idx" ON public."CampagneFiliere" USING btree ("campagneId");


--
-- Name: CampagneFiliere_filiereId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CampagneFiliere_filiereId_idx" ON public."CampagneFiliere" USING btree ("filiereId");


--
-- Name: CampagneInscription_dateCloture_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CampagneInscription_dateCloture_idx" ON public."CampagneInscription" USING btree ("dateCloture");


--
-- Name: CampagneInscription_dateOuverture_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CampagneInscription_dateOuverture_idx" ON public."CampagneInscription" USING btree ("dateOuverture");


--
-- Name: CampagneInscription_etablissementId_statut_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CampagneInscription_etablissementId_statut_idx" ON public."CampagneInscription" USING btree ("etablissementId", statut);


--
-- Name: Candidat_anip_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Candidat_anip_idx" ON public."Candidat" USING btree (anip);


--
-- Name: Candidat_anip_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Candidat_anip_key" ON public."Candidat" USING btree (anip);


--
-- Name: Candidat_emailConfirmToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Candidat_emailConfirmToken_key" ON public."Candidat" USING btree ("emailConfirmToken");


--
-- Name: Candidat_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Candidat_email_key" ON public."Candidat" USING btree (email);


--
-- Name: Candidat_matricule_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Candidat_matricule_key" ON public."Candidat" USING btree (matricule);


--
-- Name: CentreComposition_actif_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CentreComposition_actif_idx" ON public."CentreComposition" USING btree (actif);


--
-- Name: CentreComposition_ville_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CentreComposition_ville_idx" ON public."CentreComposition" USING btree (ville);


--
-- Name: Concours_dateDebutDepot_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Concours_dateDebutDepot_idx" ON public."Concours" USING btree ("dateDebutDepot");


--
-- Name: Concours_dateFinDepot_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Concours_dateFinDepot_idx" ON public."Concours" USING btree ("dateFinDepot");


--
-- Name: Concours_etablissementId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Concours_etablissementId_idx" ON public."Concours" USING btree ("etablissementId");


--
-- Name: ConcourscentreComposition_centreId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ConcourscentreComposition_centreId_idx" ON public."ConcourscentreComposition" USING btree ("centreId");


--
-- Name: ConcourscentreComposition_concoursId_centreId_anneeAcademiq_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ConcourscentreComposition_concoursId_centreId_anneeAcademiq_key" ON public."ConcourscentreComposition" USING btree ("concoursId", "centreId", "anneeAcademique");


--
-- Name: ConcourscentreComposition_concoursId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ConcourscentreComposition_concoursId_idx" ON public."ConcourscentreComposition" USING btree ("concoursId");


--
-- Name: Controleur_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Controleur_email_key" ON public."Controleur" USING btree (email);


--
-- Name: Diplome_annee_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Diplome_annee_idx" ON public."Diplome" USING btree (annee);


--
-- Name: Diplome_candidatId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Diplome_candidatId_key" ON public."Diplome" USING btree ("candidatId");


--
-- Name: Diplome_filiereId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Diplome_filiereId_idx" ON public."Diplome" USING btree ("filiereId");


--
-- Name: Diplome_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Diplome_type_idx" ON public."Diplome" USING btree (type);


--
-- Name: DossierInscription_concoursCentreId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DossierInscription_concoursCentreId_idx" ON public."DossierInscription" USING btree ("concoursCentreId");


--
-- Name: DossierInscription_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DossierInscription_createdAt_idx" ON public."DossierInscription" USING btree ("createdAt");


--
-- Name: DossierInscription_decisionControleurPar_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DossierInscription_decisionControleurPar_idx" ON public."DossierInscription" USING btree ("decisionControleurPar");


--
-- Name: DossierInscription_inscriptionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DossierInscription_inscriptionId_idx" ON public."DossierInscription" USING btree ("inscriptionId");


--
-- Name: DossierInscription_inscriptionId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DossierInscription_inscriptionId_key" ON public."DossierInscription" USING btree ("inscriptionId");


--
-- Name: DossierInscription_statut_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DossierInscription_statut_idx" ON public."DossierInscription" USING btree (statut);


--
-- Name: DossierInscription_verdict1Par_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DossierInscription_verdict1Par_idx" ON public."DossierInscription" USING btree ("verdict1Par");


--
-- Name: DossierInscription_verdict2Par_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DossierInscription_verdict2Par_idx" ON public."DossierInscription" USING btree ("verdict2Par");


--
-- Name: Dossier_candidatId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Dossier_candidatId_key" ON public."Dossier" USING btree ("candidatId");


--
-- Name: EmailDelivery_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EmailDelivery_createdAt_idx" ON public."EmailDelivery" USING btree ("createdAt" DESC);


--
-- Name: EmailDelivery_createdAt_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EmailDelivery_createdAt_status_idx" ON public."EmailDelivery" USING btree ("createdAt", status);


--
-- Name: EmailDelivery_notificationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EmailDelivery_notificationId_idx" ON public."EmailDelivery" USING btree ("notificationId");


--
-- Name: EmailDelivery_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EmailDelivery_status_idx" ON public."EmailDelivery" USING btree (status);


--
-- Name: EmailDelivery_status_nextRetryAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EmailDelivery_status_nextRetryAt_idx" ON public."EmailDelivery" USING btree (status, "nextRetryAt") WHERE (status = ANY (ARRAY['QUEUED'::public."DeliveryStatus", 'FAILED'::public."DeliveryStatus"]));


--
-- Name: EmailDelivery_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EmailDelivery_userId_createdAt_idx" ON public."EmailDelivery" USING btree ("userId", "createdAt") WHERE ("userId" IS NOT NULL);


--
-- Name: EmailDelivery_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EmailDelivery_userId_idx" ON public."EmailDelivery" USING btree ("userId");


--
-- Name: Etablissement_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Etablissement_email_key" ON public."Etablissement" USING btree (email);


--
-- Name: Etablissement_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Etablissement_type_idx" ON public."Etablissement" USING btree (type);


--
-- Name: Etablissement_ville_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Etablissement_ville_idx" ON public."Etablissement" USING btree (ville);


--
-- Name: Filiere_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Filiere_code_key" ON public."Filiere" USING btree (code);


--
-- Name: Filiere_etablissementId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Filiere_etablissementId_idx" ON public."Filiere" USING btree ("etablissementId");


--
-- Name: Filiere_niveau_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Filiere_niveau_idx" ON public."Filiere" USING btree (niveau);


--
-- Name: InscriptionAcademique_anneeAcademique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "InscriptionAcademique_anneeAcademique_idx" ON public."InscriptionAcademique" USING btree ("anneeAcademique");


--
-- Name: InscriptionAcademique_candidatId_filiereId_anneeAcademique_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "InscriptionAcademique_candidatId_filiereId_anneeAcademique_key" ON public."InscriptionAcademique" USING btree ("candidatId", "filiereId", "anneeAcademique");


--
-- Name: InscriptionAcademique_candidatId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "InscriptionAcademique_candidatId_idx" ON public."InscriptionAcademique" USING btree ("candidatId");


--
-- Name: InscriptionAcademique_etablissementId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "InscriptionAcademique_etablissementId_idx" ON public."InscriptionAcademique" USING btree ("etablissementId");


--
-- Name: InscriptionAcademique_filiereId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "InscriptionAcademique_filiereId_idx" ON public."InscriptionAcademique" USING btree ("filiereId");


--
-- Name: InscriptionAcademique_matricule_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "InscriptionAcademique_matricule_key" ON public."InscriptionAcademique" USING btree (matricule);


--
-- Name: Inscription_candidatId_concoursId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Inscription_candidatId_concoursId_key" ON public."Inscription" USING btree ("candidatId", "concoursId");


--
-- Name: Inscription_candidatId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Inscription_candidatId_idx" ON public."Inscription" USING btree ("candidatId");


--
-- Name: Inscription_concoursId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Inscription_concoursId_idx" ON public."Inscription" USING btree ("concoursId");


--
-- Name: Inscription_numeroInscription_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Inscription_numeroInscription_key" ON public."Inscription" USING btree ("numeroInscription");


--
-- Name: MembreCommission_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MembreCommission_email_key" ON public."MembreCommission" USING btree (email);


--
-- Name: MembreCommission_etablissementId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MembreCommission_etablissementId_idx" ON public."MembreCommission" USING btree ("etablissementId");


--
-- Name: MembreCommission_etablissementId_sousRole_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MembreCommission_etablissementId_sousRole_idx" ON public."MembreCommission" USING btree ("etablissementId", "sousRole");


--
-- Name: MembreCommission_sousRole_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MembreCommission_sousRole_idx" ON public."MembreCommission" USING btree ("sousRole");


--
-- Name: Note_inscriptionAcadId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Note_inscriptionAcadId_idx" ON public."Note" USING btree ("inscriptionAcadId");


--
-- Name: Note_semestre_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Note_semestre_idx" ON public."Note" USING btree (semestre);


--
-- Name: NotificationAuditLog_actorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "NotificationAuditLog_actorId_idx" ON public."NotificationAuditLog" USING btree ("actorId");


--
-- Name: NotificationAuditLog_eventType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "NotificationAuditLog_eventType_idx" ON public."NotificationAuditLog" USING btree ("eventType");


--
-- Name: NotificationAuditLog_resourceType_resourceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "NotificationAuditLog_resourceType_resourceId_idx" ON public."NotificationAuditLog" USING btree ("resourceType", "resourceId");


--
-- Name: NotificationAuditLog_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "NotificationAuditLog_timestamp_idx" ON public."NotificationAuditLog" USING btree ("timestamp" DESC);


--
-- Name: NotificationAuditLog_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "NotificationAuditLog_userId_idx" ON public."NotificationAuditLog" USING btree ("userId");


--
-- Name: NotificationTemplate_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "NotificationTemplate_isActive_idx" ON public."NotificationTemplate" USING btree ("isActive");


--
-- Name: NotificationTemplate_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "NotificationTemplate_name_key" ON public."NotificationTemplate" USING btree (name);


--
-- Name: NotificationTemplate_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "NotificationTemplate_type_idx" ON public."NotificationTemplate" USING btree (type);


--
-- Name: Notification_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_expiresAt_idx" ON public."Notification" USING btree ("expiresAt");


--
-- Name: Notification_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_type_idx" ON public."Notification" USING btree (type);


--
-- Name: Notification_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_userId_createdAt_idx" ON public."Notification" USING btree ("userId", "createdAt" DESC);


--
-- Name: Notification_userId_read_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_userId_read_idx" ON public."Notification" USING btree ("userId", read);


--
-- Name: Payment_applicationId_paymentType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_applicationId_paymentType_idx" ON public."Payment" USING btree ("applicationId", "paymentType");


--
-- Name: Payment_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_status_idx" ON public."Payment" USING btree (status);


--
-- Name: PreinscriptionEtablissement_candidatId_filiereId_anneeAcade_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PreinscriptionEtablissement_candidatId_filiereId_anneeAcade_key" ON public."PreinscriptionEtablissement" USING btree ("candidatId", "filiereId", "anneeAcademique");


--
-- Name: PreinscriptionEtablissement_candidatId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PreinscriptionEtablissement_candidatId_idx" ON public."PreinscriptionEtablissement" USING btree ("candidatId");


--
-- Name: PreinscriptionEtablissement_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PreinscriptionEtablissement_createdAt_idx" ON public."PreinscriptionEtablissement" USING btree ("createdAt");


--
-- Name: PreinscriptionEtablissement_etablissementId_statut_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PreinscriptionEtablissement_etablissementId_statut_idx" ON public."PreinscriptionEtablissement" USING btree ("etablissementId", statut);


--
-- Name: PreinscriptionEtablissement_inscriptionAcadId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PreinscriptionEtablissement_inscriptionAcadId_key" ON public."PreinscriptionEtablissement" USING btree ("inscriptionAcadId");


--
-- Name: PreinscriptionEtablissement_numeroPreinscription_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PreinscriptionEtablissement_numeroPreinscription_key" ON public."PreinscriptionEtablissement" USING btree ("numeroPreinscription");


--
-- Name: Receipt_applicationId_receiptType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Receipt_applicationId_receiptType_idx" ON public."Receipt" USING btree ("applicationId", "receiptType");


--
-- Name: Receipt_paymentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Receipt_paymentId_key" ON public."Receipt" USING btree ("paymentId");


--
-- Name: Receipt_receiptNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Receipt_receiptNumber_key" ON public."Receipt" USING btree ("receiptNumber");


--
-- Name: SchoolRequirement_etablissementId_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SchoolRequirement_etablissementId_code_key" ON public."SchoolRequirement" USING btree ("etablissementId", code);


--
-- Name: SchoolRequirement_etablissementId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SchoolRequirement_etablissementId_idx" ON public."SchoolRequirement" USING btree ("etablissementId");


--
-- Name: SystemAlert_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SystemAlert_createdAt_idx" ON public."SystemAlert" USING btree ("createdAt" DESC);


--
-- Name: SystemAlert_resolved_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SystemAlert_resolved_idx" ON public."SystemAlert" USING btree (resolved);


--
-- Name: SystemAlert_severity_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SystemAlert_severity_idx" ON public."SystemAlert" USING btree (severity);


--
-- Name: UserPreferences_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserPreferences_userId_idx" ON public."UserPreferences" USING btree ("userId");


--
-- Name: UserPreferences_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserPreferences_userId_key" ON public."UserPreferences" USING btree ("userId");


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_selec; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_selec ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter, COALESCE(selected_columns, '{}'::text[]));


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: InscriptionAcademique trg_check_progression; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_check_progression BEFORE INSERT ON public."InscriptionAcademique" FOR EACH ROW EXECUTE FUNCTION public.check_progression();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ActionHistory ActionHistory_dossierInscriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ActionHistory"
    ADD CONSTRAINT "ActionHistory_dossierInscriptionId_fkey" FOREIGN KEY ("dossierInscriptionId") REFERENCES public."DossierInscription"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AdminEtablissement AdminEtablissement_etablissementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AdminEtablissement"
    ADD CONSTRAINT "AdminEtablissement_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES public."Etablissement"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ApplicationDocument ApplicationDocument_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApplicationDocument"
    ADD CONSTRAINT "ApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ApplicationDocument ApplicationDocument_schoolRequirementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApplicationDocument"
    ADD CONSTRAINT "ApplicationDocument_schoolRequirementId_fkey" FOREIGN KEY ("schoolRequirementId") REFERENCES public."SchoolRequirement"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Application Application_campagneFiliereId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_campagneFiliereId_fkey" FOREIGN KEY ("campagneFiliereId") REFERENCES public."CampagneFiliere"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Application Application_candidatId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES public."Candidat"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Application Application_etablissementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES public."Etablissement"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Application Application_filiereId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES public."Filiere"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Application Application_preinscriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_preinscriptionId_fkey" FOREIGN KEY ("preinscriptionId") REFERENCES public."PreinscriptionEtablissement"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CampagneFiliere CampagneFiliere_campagneId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CampagneFiliere"
    ADD CONSTRAINT "CampagneFiliere_campagneId_fkey" FOREIGN KEY ("campagneId") REFERENCES public."CampagneInscription"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CampagneFiliere CampagneFiliere_filiereId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CampagneFiliere"
    ADD CONSTRAINT "CampagneFiliere_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES public."Filiere"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CampagneInscription CampagneInscription_etablissementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CampagneInscription"
    ADD CONSTRAINT "CampagneInscription_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES public."Etablissement"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Concours Concours_etablissementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Concours"
    ADD CONSTRAINT "Concours_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES public."Etablissement"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ConcourscentreComposition ConcourscentreComposition_centreId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ConcourscentreComposition"
    ADD CONSTRAINT "ConcourscentreComposition_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES public."CentreComposition"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ConcourscentreComposition ConcourscentreComposition_concoursId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ConcourscentreComposition"
    ADD CONSTRAINT "ConcourscentreComposition_concoursId_fkey" FOREIGN KEY ("concoursId") REFERENCES public."Concours"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Diplome Diplome_candidatId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Diplome"
    ADD CONSTRAINT "Diplome_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES public."Candidat"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Diplome Diplome_filiereId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Diplome"
    ADD CONSTRAINT "Diplome_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES public."Filiere"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DossierInscription DossierInscription_concoursCentreId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DossierInscription"
    ADD CONSTRAINT "DossierInscription_concoursCentreId_fkey" FOREIGN KEY ("concoursCentreId") REFERENCES public."ConcourscentreComposition"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DossierInscription DossierInscription_inscriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DossierInscription"
    ADD CONSTRAINT "DossierInscription_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES public."Inscription"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Dossier Dossier_candidatId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Dossier"
    ADD CONSTRAINT "Dossier_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES public."Candidat"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Filiere Filiere_etablissementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Filiere"
    ADD CONSTRAINT "Filiere_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES public."Etablissement"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InscriptionAcademique InscriptionAcademique_candidatId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InscriptionAcademique"
    ADD CONSTRAINT "InscriptionAcademique_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES public."Candidat"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InscriptionAcademique InscriptionAcademique_etablissementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InscriptionAcademique"
    ADD CONSTRAINT "InscriptionAcademique_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES public."Etablissement"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InscriptionAcademique InscriptionAcademique_filiereId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InscriptionAcademique"
    ADD CONSTRAINT "InscriptionAcademique_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES public."Filiere"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Inscription Inscription_candidatId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Inscription"
    ADD CONSTRAINT "Inscription_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES public."Candidat"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Inscription Inscription_concoursId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Inscription"
    ADD CONSTRAINT "Inscription_concoursId_fkey" FOREIGN KEY ("concoursId") REFERENCES public."Concours"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MembreCommission MembreCommission_etablissementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembreCommission"
    ADD CONSTRAINT "MembreCommission_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES public."Etablissement"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Note Note_inscriptionAcadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Note"
    ADD CONSTRAINT "Note_inscriptionAcadId_fkey" FOREIGN KEY ("inscriptionAcadId") REFERENCES public."InscriptionAcademique"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Payment Payment_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PreinscriptionEtablissement PreinscriptionEtablissement_candidatId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PreinscriptionEtablissement"
    ADD CONSTRAINT "PreinscriptionEtablissement_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES public."Candidat"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PreinscriptionEtablissement PreinscriptionEtablissement_etablissementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PreinscriptionEtablissement"
    ADD CONSTRAINT "PreinscriptionEtablissement_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES public."Etablissement"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PreinscriptionEtablissement PreinscriptionEtablissement_filiereId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PreinscriptionEtablissement"
    ADD CONSTRAINT "PreinscriptionEtablissement_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES public."Filiere"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PreinscriptionEtablissement PreinscriptionEtablissement_inscriptionAcadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PreinscriptionEtablissement"
    ADD CONSTRAINT "PreinscriptionEtablissement_inscriptionAcadId_fkey" FOREIGN KEY ("inscriptionAcadId") REFERENCES public."InscriptionAcademique"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Receipt Receipt_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Receipt"
    ADD CONSTRAINT "Receipt_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Receipt Receipt_paymentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Receipt"
    ADD CONSTRAINT "Receipt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES public."Payment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SchoolRequirement SchoolRequirement_etablissementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SchoolRequirement"
    ADD CONSTRAINT "SchoolRequirement_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES public."Etablissement"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: Etablissement; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Etablissement" ENABLE ROW LEVEL SECURITY;

--
-- Name: Filiere; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."Filiere" ENABLE ROW LEVEL SECURITY;

--
-- Name: InscriptionAcademique; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."InscriptionAcademique" ENABLE ROW LEVEL SECURITY;

--
-- Name: InscriptionAcademique etablissement_delete_inscriptions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY etablissement_delete_inscriptions ON public."InscriptionAcademique" FOR DELETE TO authenticated USING (("etablissementId" = (auth.uid())::text));


--
-- Name: InscriptionAcademique etablissement_insert_inscriptions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY etablissement_insert_inscriptions ON public."InscriptionAcademique" FOR INSERT TO authenticated WITH CHECK (("etablissementId" = (auth.uid())::text));


--
-- Name: InscriptionAcademique etablissement_select_inscriptions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY etablissement_select_inscriptions ON public."InscriptionAcademique" FOR SELECT TO authenticated USING (("etablissementId" = (auth.uid())::text));


--
-- Name: InscriptionAcademique etablissement_update_inscriptions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY etablissement_update_inscriptions ON public."InscriptionAcademique" FOR UPDATE TO authenticated USING (("etablissementId" = (auth.uid())::text)) WITH CHECK (("etablissementId" = (auth.uid())::text));


--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Politique pour permettre l'upload 14czswc_0; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Politique pour permettre l'upload 14czswc_0" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'dossiers-candidats'::text));


--
-- Name: objects Politique pour permettre la lecture 14czswc_0; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Politique pour permettre la lecture 14czswc_0" ON storage.objects FOR SELECT TO authenticated USING ((bucket_id = 'dossiers-candidats'::text));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION pg_reload_conf(); Type: ACL; Schema: pg_catalog; Owner: supabase_admin
--

GRANT ALL ON FUNCTION pg_catalog.pg_reload_conf() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO supabase_realtime_admin;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO supabase_realtime_admin;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO service_role;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO supabase_realtime_admin;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION send_binary(payload bytea, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO supabase_realtime_admin;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO supabase_realtime_admin;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: FUNCTION wal2json_escape_identifier(name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.wal2json_escape_identifier(name text) TO postgres;
GRANT ALL ON FUNCTION realtime.wal2json_escape_identifier(name text) TO dashboard_user;


--
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE custom_oauth_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.custom_oauth_providers TO postgres;
GRANT ALL ON TABLE auth.custom_oauth_providers TO dashboard_user;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- Name: TABLE oauth_client_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_client_states TO postgres;
GRANT ALL ON TABLE auth.oauth_client_states TO dashboard_user;


--
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE webauthn_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.webauthn_challenges TO postgres;
GRANT ALL ON TABLE auth.webauthn_challenges TO dashboard_user;


--
-- Name: TABLE webauthn_credentials; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.webauthn_credentials TO postgres;
GRANT ALL ON TABLE auth.webauthn_credentials TO dashboard_user;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;
GRANT SELECT ON TABLE realtime.schema_migrations TO anon;
GRANT SELECT ON TABLE realtime.schema_migrations TO authenticated;
GRANT SELECT ON TABLE realtime.schema_migrations TO service_role;
GRANT ALL ON TABLE realtime.schema_migrations TO supabase_realtime_admin;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;
GRANT ALL ON TABLE realtime.subscription TO supabase_realtime_admin;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO supabase_realtime_admin;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.buckets FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.buckets TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;
GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;
GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;
GRANT SELECT ON TABLE storage.buckets_vectors TO anon;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.objects FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.objects TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;
GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;
GRANT SELECT ON TABLE storage.vector_indexes TO anon;


--
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- PostgreSQL database dump complete
--

\unrestrict Lpfja9Iyye1oHRlGPOZ8xit5oFX0CiTGh4gWnKlQhhhx5GcgYB4vud3QREvnSJt

