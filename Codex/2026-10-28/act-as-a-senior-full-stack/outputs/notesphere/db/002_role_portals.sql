SET search_path TO notesphere,public;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS admin_invitations (
 id uuid PRIMARY KEY,
 code_hash text UNIQUE NOT NULL,
 created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL,
 used_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE admin_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON admin_invitations FROM PUBLIC;
INSERT INTO migrations(id) VALUES ('002_role_portals') ON CONFLICT DO NOTHING;
