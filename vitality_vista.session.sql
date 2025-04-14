SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' -- Assuming your tables are in the 'public' schema
ORDER BY table_name;