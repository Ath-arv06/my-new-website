const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '..', 'data', 'verified_documents.json');
const docs = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

let sql = `-- ===============================================================
-- SUPABASE DATABASE SCHEMA FOR VERISPECT IDENTITY PLATFORM
-- Run this entire script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ===============================================================

-- 1. Create verified_documents table
CREATE TABLE IF NOT EXISTS public.verified_documents (
  "Document_ID" TEXT PRIMARY KEY,
  "Document_Type" TEXT NOT NULL,
  "Extracted_ID_Number" TEXT,
  "Document_Hash" TEXT,
  "Upload_Date" TEXT,
  "Admin_ID" TEXT DEFAULT 'OFF-1042',
  "Holder_Name" TEXT NOT NULL,
  "Issuing_Authority" TEXT,
  "Notes" TEXT,
  "Father_Name" TEXT DEFAULT '',
  "Date_Of_Birth" TEXT DEFAULT '',
  "Gender" TEXT DEFAULT '',
  "Address" TEXT DEFAULT '',
  "Issue_Date" TEXT DEFAULT '',
  "Validity_Date" TEXT DEFAULT '',
  "Blood_Group" TEXT DEFAULT '',
  "Extracted_Fields" JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.verified_documents ENABLE ROW LEVEL SECURITY;

-- 3. Permissive RLS Policies for Anon / Public Access
-- (Allows your web application frontend & backend to read, add, and delete records seamlessly)
DROP POLICY IF EXISTS "Allow public read on verified_documents" ON public.verified_documents;
CREATE POLICY "Allow public read on verified_documents"
  ON public.verified_documents FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert on verified_documents" ON public.verified_documents;
CREATE POLICY "Allow public insert on verified_documents"
  ON public.verified_documents FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on verified_documents" ON public.verified_documents;
CREATE POLICY "Allow public update on verified_documents"
  ON public.verified_documents FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow public delete on verified_documents" ON public.verified_documents;
CREATE POLICY "Allow public delete on verified_documents"
  ON public.verified_documents FOR DELETE
  USING (true);

-- 4. Realtime Replication (Enables live instant updates across all browsers)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'verified_documents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.verified_documents;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- In case publication does not exist or permission restricted, proceed safely
  NULL;
END $$;

-- 5. Seed Authentic Baseline Documents (19 Authentic Records)
`;

docs.forEach(d => {
  const esc = (s) => (s ? String(s).replace(/'/g, "''") : '');
  const id = esc(d.Document_ID);
  const type = esc(d.Document_Type);
  const num = esc(d.Extracted_ID_Number);
  const hash = esc(d.Document_Hash);
  const date = esc(d.Upload_Date);
  const admin = esc(d.Admin_ID || 'OFF-1042');
  const name = esc(d.Holder_Name);
  const auth = esc(d.Issuing_Authority);
  const notes = esc(d.Notes);
  const father = esc(d.Father_Name);
  const dob = esc(d.Date_Of_Birth);
  const gender = esc(d.Gender);
  const addr = esc(d.Address);
  const issue = esc(d.Issue_Date);
  const validity = esc(d.Validity_Date);
  const blood = esc(d.Blood_Group);
  const fields = d.Extracted_Fields ? JSON.stringify(d.Extracted_Fields).replace(/'/g, "''") : '{}';

  sql += `INSERT INTO public.verified_documents ("Document_ID", "Document_Type", "Extracted_ID_Number", "Document_Hash", "Upload_Date", "Admin_ID", "Holder_Name", "Issuing_Authority", "Notes", "Father_Name", "Date_Of_Birth", "Gender", "Address", "Issue_Date", "Validity_Date", "Blood_Group", "Extracted_Fields")
VALUES ('${id}', '${type}', '${num}', '${hash}', '${date}', '${admin}', '${name}', '${auth}', '${notes}', '${father}', '${dob}', '${gender}', '${addr}', '${issue}', '${validity}', '${blood}', '${fields}'::jsonb)
ON CONFLICT ("Document_ID") DO NOTHING;\n\n`;
});

const outFile = path.join(__dirname, '..', 'supabase_schema.sql');
fs.writeFileSync(outFile, sql, 'utf8');
console.log('Successfully generated:', outFile, 'Bytes:', fs.statSync(outFile).size);
