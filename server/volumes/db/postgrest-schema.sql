-- Restore PostgREST's default exposed GraphQL schema on retained volumes.
CREATE SCHEMA IF NOT EXISTS graphql_public;
GRANT USAGE ON SCHEMA graphql_public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA graphql_public TO postgres;
