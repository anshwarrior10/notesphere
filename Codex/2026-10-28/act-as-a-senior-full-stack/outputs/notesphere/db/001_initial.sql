CREATE SCHEMA IF NOT EXISTS notesphere;
SET search_path TO notesphere,public;
CREATE TABLE IF NOT EXISTS migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS departments (id text PRIMARY KEY, name text UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS courses (id text PRIMARY KEY, department_id text REFERENCES departments(id), name text UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS subjects (id text PRIMARY KEY, course_id text REFERENCES courses(id), name text UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY, email text UNIQUE NOT NULL, password_hash text NOT NULL,
 name text NOT NULL, college text NOT NULL DEFAULT '', course text NOT NULL DEFAULT '', branch text NOT NULL DEFAULT '',
 semester integer NOT NULL DEFAULT 1 CHECK(semester BETWEEN 1 AND 12), interests text NOT NULL DEFAULT '',
 avatar text NOT NULL DEFAULT '', role text NOT NULL DEFAULT 'student' CHECK(role IN ('student','admin')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (token_hash text PRIMARY KEY, user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL, expires_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS password_resets (token_hash text PRIMARY KEY, user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL, expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS notes (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 title text NOT NULL, description text NOT NULL, subject_id text NOT NULL REFERENCES subjects(id),
 course_id text NOT NULL REFERENCES courses(id), branch text NOT NULL, college text NOT NULL,
 semester integer NOT NULL CHECK(semester BETWEEN 1 AND 12), topic text NOT NULL DEFAULT '', academic_year text NOT NULL,
 language text NOT NULL DEFAULT 'English', visibility text NOT NULL CHECK(visibility IN ('public','private')),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','draft')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notes_filters ON notes(status,visibility,subject_id,semester);
CREATE INDEX IF NOT EXISTS notes_owner ON notes(user_id);
CREATE INDEX IF NOT EXISTS notes_search ON notes USING gin(to_tsvector('english',title || ' ' || description || ' ' || topic));
CREATE TABLE IF NOT EXISTS files (note_id uuid PRIMARY KEY REFERENCES notes(id) ON DELETE CASCADE, storage_key text NOT NULL UNIQUE, original_name text NOT NULL, mime text NOT NULL, size integer NOT NULL, hash text NOT NULL, UNIQUE(hash,note_id));
CREATE INDEX IF NOT EXISTS files_hash ON files(hash);
CREATE TABLE IF NOT EXISTS tags (id uuid PRIMARY KEY, name text UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS note_tags (note_id uuid REFERENCES notes(id) ON DELETE CASCADE, tag_id uuid REFERENCES tags(id) ON DELETE CASCADE, PRIMARY KEY(note_id,tag_id));
CREATE TABLE IF NOT EXISTS reviews (id uuid PRIMARY KEY, note_id uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5), content text NOT NULL CHECK(char_length(content) BETWEEN 10 AND 2000), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(note_id,user_id));
CREATE TABLE IF NOT EXISTS bookmarks (user_id uuid REFERENCES users(id) ON DELETE CASCADE, note_id uuid REFERENCES notes(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,note_id));
CREATE TABLE IF NOT EXISTS collections (id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, name text NOT NULL CHECK(char_length(name) BETWEEN 1 AND 60), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,name));
CREATE TABLE IF NOT EXISTS collection_notes (collection_id uuid REFERENCES collections(id) ON DELETE CASCADE, note_id uuid REFERENCES notes(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(collection_id,note_id));
CREATE TABLE IF NOT EXISTS events (id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, note_id uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE, kind text NOT NULL CHECK(kind IN ('view','download')), created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS events_note ON events(note_id,kind);
CREATE INDEX IF NOT EXISTS events_user ON events(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS notifications (id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, message text NOT NULL, note_id uuid REFERENCES notes(id) ON DELETE CASCADE, is_read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS notifications_user ON notifications(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS reports (id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, note_id uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE, review_id uuid REFERENCES reviews(id) ON DELETE CASCADE, reason text NOT NULL, status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved')), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS rate_limits (key text PRIMARY KEY, hits integer NOT NULL DEFAULT 1, expires_at timestamptz NOT NULL);
INSERT INTO departments VALUES ('cse','Computer Science'),('ece','Electronics'),('me','Mechanical Engineering') ON CONFLICT DO NOTHING;
INSERT INTO courses VALUES ('btech-cs','cse','B.Tech Computer Science'),('btech-ec','ece','B.Tech Electronics'),('btech-me','me','B.Tech Mechanical') ON CONFLICT DO NOTHING;
INSERT INTO subjects VALUES ('dsa','btech-cs','Data Structures'),('dbms','btech-cs','Database Systems'),('os','btech-cs','Operating Systems'),('math','btech-cs','Engineering Mathematics'),('networks','btech-cs','Computer Networks'),('circuits','btech-ec','Circuit Theory'),('mechanics','btech-me','Engineering Mechanics') ON CONFLICT DO NOTHING;
-- A private schema and deny-by-default RLS prevent direct client database access.
-- The trusted backend connects as the schema owner; authorization is in the API.
REVOKE ALL ON SCHEMA notesphere FROM PUBLIC;
DO $$ DECLARE item record; BEGIN
 FOR item IN SELECT tablename FROM pg_tables WHERE schemaname='notesphere' LOOP
  EXECUTE format('ALTER TABLE notesphere.%I ENABLE ROW LEVEL SECURITY',item.tablename);
  EXECUTE format('REVOKE ALL ON notesphere.%I FROM PUBLIC',item.tablename);
 END LOOP;
END $$;
