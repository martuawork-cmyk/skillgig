-- Add unique index on source_url for Remotive upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_gigs_source_url 
ON gigs(source_url) 
WHERE source_url IS NOT NULL;
