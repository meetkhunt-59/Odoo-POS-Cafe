-- Run this in your Supabase SQL Editor

-- 1. Add image_url to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Create the Storage Bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Setup Storage Policies for the new bucket
-- Allow public read access
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

-- Allow authenticated users to upload/update/delete
CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'product-images' AND 
    auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'product-images' AND 
    auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'product-images' AND 
    auth.role() = 'authenticated'
);
