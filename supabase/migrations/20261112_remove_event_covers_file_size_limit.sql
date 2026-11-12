-- Migration: Remove file size limit on event-covers storage bucket
-- Allows image uploads of any size without bucket-level 5MB rejection.

UPDATE storage.buckets
SET file_size_limit = NULL
WHERE id = 'event-covers';

