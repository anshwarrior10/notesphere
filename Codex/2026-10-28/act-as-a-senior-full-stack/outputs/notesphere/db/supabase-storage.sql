-- Run once in a dedicated NoteSphere Supabase project's SQL editor.
-- Keep the application schema out of the exposed Data API schemas.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('notesphere','notesphere',false,20971520,ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.presentationml.presentation'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
-- No browser policies: storage is accessed only by the server after session and note authorization.
REVOKE ALL ON SCHEMA notesphere FROM anon,authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA notesphere FROM anon,authenticated;
