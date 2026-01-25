-- Create storage bucket for carousel images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('carousel-images', 'carousel-images', true);

-- Allow public to view carousel images
CREATE POLICY "Public can view carousel images"
ON storage.objects FOR SELECT
USING (bucket_id = 'carousel-images');

-- Allow authenticated users (admins) to upload carousel images
CREATE POLICY "Authenticated users can upload carousel images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'carousel-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update carousel images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'carousel-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete carousel images
CREATE POLICY "Authenticated users can delete carousel images"
ON storage.objects FOR DELETE
USING (bucket_id = 'carousel-images' AND auth.role() = 'authenticated');