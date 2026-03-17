-- Hash existing plaintext API tokens with SHA-256.
-- After this migration the apiToken column stores sha256(plaintext_token) in hex.
-- Existing browser sessions remain valid because the auth middleware now hashes
-- the incoming Bearer token before the DB lookup.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE "User"
SET "apiToken" = encode(digest("apiToken", 'sha256'), 'hex');