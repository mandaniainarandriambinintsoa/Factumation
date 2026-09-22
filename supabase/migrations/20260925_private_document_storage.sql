-- Private immutable PDF storage. Apply after document v2 foundations.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('document-pdfs', 'document-pdfs', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "document_pdf_owner_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'document-pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "document_pdf_owner_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'document-pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND storage.extension(name) = 'pdf'
);

-- Generated PDFs are immutable. A new template version writes a new path;
-- authenticated clients deliberately receive no UPDATE or DELETE policy.
