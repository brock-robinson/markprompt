## Encryption

Sometimes, tables cannot be altered due to computed views. This is a bug in Supabase:

> The bug where unrelated tables trigger view regeneration was fixed in pgsodium 3.1.8, you are on 3.1.5, so that fix is not present.

It usually complains about `decrypted_query_stats`. The solution is to:

- Drop the `v_insights_query_stats` view

```
drop view v_insights_query_stats;
```

- Perform the table altering

- Recreate the `v_insights_query_stats` view.

```
create view v_insights_query_stats
# Use latest definition of the view
```
