-- Run after an import to measure actual table/index usage. Compare with your project's CURRENT quota.
select relname, n_live_tup, pg_size_pretty(pg_total_relation_size(relid)) as total_with_indexes
from pg_stat_user_tables where schemaname='public' order by pg_total_relation_size(relid) desc;
select pg_size_pretty(pg_database_size(current_database())) as database_size;
-- Expected: false for all operations below. Verify with the actual anon HTTP client as well.
select tablename, has_table_privilege('anon', 'public.'||tablename, 'INSERT') as anon_insert,
 has_table_privilege('anon', 'public.'||tablename, 'UPDATE') as anon_update,
 has_table_privilege('anon', 'public.'||tablename, 'DELETE') as anon_delete
from pg_tables where schemaname='public';
