SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' -- Or any other schema you're interested in
ORDER BY table_name;