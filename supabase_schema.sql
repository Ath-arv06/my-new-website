-- ===============================================================
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
INSERT INTO public.verified_documents ("Document_ID", "Document_Type", "Extracted_ID_Number", "Document_Hash", "Upload_Date", "Admin_ID", "Holder_Name", "Issuing_Authority", "Notes", "Father_Name", "Date_Of_Birth", "Gender", "Address", "Issue_Date", "Validity_Date", "Blood_Group", "Extracted_Fields")
VALUES ('DOC-VER-021', 'Aadhaar', '9372 7070 4044', '96d8e11a795d509119250292df73a52d9558cf857bc52096859c67b329628e87', '2026-09-08T08:32:16.815Z', 'OFF-1042', 'Saurabh Singh', 'Aadhaar Official Authority', 'Genuine baseline uploaded via Database References on 08/09/2026', '', '', '', '', '', '', '', '{}'::jsonb)
ON CONFLICT ("Document_ID") DO NOTHING;

INSERT INTO public.verified_documents ("Document_ID", "Document_Type", "Extracted_ID_Number", "Document_Hash", "Upload_Date", "Admin_ID", "Holder_Name", "Issuing_Authority", "Notes", "Father_Name", "Date_Of_Birth", "Gender", "Address", "Issue_Date", "Validity_Date", "Blood_Group", "Extracted_Fields")
VALUES ('DOC-VER-020', 'Aadhaar', '9302 1307 7797', 'c526b8391b295cb2f2d14e8c595e0fb4eff7924b934d4abaa55d6ff80d1200c1', '2026-09-08T15:16:42.798Z', 'OFF-1042', 'Divyansh Singh', 'UNIQUE IDENTIFICATION AUTHORITY OF INDIA (UIDAI)', 'Genuine baseline uploaded via Database References on 9/8/2026', '', '15/12/2005', '', '', '', '', '', '{}'::jsonb)
ON CONFLICT ("Document_ID") DO NOTHING;

INSERT INTO public.verified_documents ("Document_ID", "Document_Type", "Extracted_ID_Number", "Document_Hash", "Upload_Date", "Admin_ID", "Holder_Name", "Issuing_Authority", "Notes", "Father_Name", "Date_Of_Birth", "Gender", "Address", "Issue_Date", "Validity_Date", "Blood_Group", "Extracted_Fields")
VALUES ('DOC-VER-019', 'PAN', 'FAVPG7366H', '5929e3f5779af4644f3069847a8ff7d76debd6b4745fe74ff4dc9b5051dcc9a5', '2026-09-08T08:21:23.773Z', 'OFF-1042', 'Shubh Gupta', 'PAN Official Authority', 'Genuine baseline uploaded via Database References on 08/09/2026', '', '', '', '', '', '', '', '{}'::jsonb)
ON CONFLICT ("Document_ID") DO NOTHING;

INSERT INTO public.verified_documents ("Document_ID", "Document_Type", "Extracted_ID_Number", "Document_Hash", "Upload_Date", "Admin_ID", "Holder_Name", "Issuing_Authority", "Notes", "Father_Name", "Date_Of_Birth", "Gender", "Address", "Issue_Date", "Validity_Date", "Blood_Group", "Extracted_Fields")
VALUES ('DOC-VER-018', 'PAN', 'DVEPS1339Q', '5d7ce61e8abd7aed613a4d5b409d41b84a6a5bd1fffce3426d0269e29060fd02', '2026-09-08T08:20:32.674Z', 'OFF-1042', 'RUCHI CHOUDHARY', 'PAN Official Authority', 'Genuine baseline uploaded via Database References on 08/09/2026', '', '', '', '', '', '', '', '{}'::jsonb)
ON CONFLICT ("Document_ID") DO NOTHING;

INSERT INTO public.verified_documents ("Document_ID", "Document_Type", "Extracted_ID_Number", "Document_Hash", "Upload_Date", "Admin_ID", "Holder_Name", "Issuing_Authority", "Notes", "Father_Name", "Date_Of_Birth", "Gender", "Address", "Issue_Date", "Validity_Date", "Blood_Group", "Extracted_Fields")
VALUES ('DOC-VER-017', 'PAN', 'KCUPM5157C', '32cf5383459a88d004c46cee8f04b9c084b4e2f50cab092d1126a129682ee0ba', '2026-09-08T08:17:33.954Z', 'OFF-1042', 'Alwin Mathew', 'PAN Official Authority', 'Genuine baseline uploaded via Database References on 08/09/2026', '', '', '', '', '', '', '', '{}'::jsonb)
ON CONFLICT ("Document_ID") DO NOTHING;

INSERT INTO public.verified_documents ("Document_ID", "Document_Type", "Extracted_ID_Number", "Document_Hash", "Upload_Date", "Admin_ID", "Holder_Name", "Issuing_Authority", "Notes", "Father_Name", "Date_Of_Birth", "Gender", "Address", "Issue_Date", "Validity_Date", "Blood_Group", "Extracted_Fields")
VALUES ('DOC-VER-016', 'VoterID', 'TEE3397882', '072840dbc3f3eb24cbead2bf8e083813fd722c9f82ab0f141f1bf0220c4932e3', '2026-09-08T08:16:41.823Z', 'OFF-1042', 'MANAS KASAUDHAN', 'VoterID Official Authority', 'Genuine baseline uploaded via Database References on 08/09/2026', '', '', '', '', '', '', '', '{}'::jsonb)
ON CONFLICT ("Document_ID") DO NOTHING;

INSERT INTO public.verified_documents ("Document_ID", "Document_Type", "Extracted_ID_Number", "Document_Hash", "Upload_Date", "Admin_ID", "Holder_Name", "Issuing_Authority", "Notes", "Father_Name", "Date_Of_Birth", "Gender", "Address", "Issue_Date", "Validity_Date", "Blood_Group", "Extracted_Fields")
VALUES ('DOC-VER-015', 'Aadhaar', '8727 4007 5987', '838a556674f0e6dd9d8c711cf89a29c03987d33f4048981a7357413b74a5626b', '2026-09-08T08:16:03.037Z', 'OFF-1042', 'Aarush Pandey', 'Aadhaar Official Authority', 'Genuine baseline uploaded via Database References on 08/09/2026', '', '', '', '', '', '', '', '{}'::jsonb)
ON CONFLICT ("Document_ID") DO NOTHING;

INSERT INTO public.verified_documents ("Document_ID", "Document_Type", "Extracted_ID_Number", "Document_Hash", "Upload_Date", "Admin_ID", "Holder_Name", "Issuing_Authority", "Notes", "Father_Name", "Date_Of_Birth", "Gender", "Address", "Issue_Date", "Validity_Date", "Blood_Group", "Extracted_Fields")
VALUES ('DOC-VER-014', 'VoterID', 'NCY1515949', '73e1125a22870edd9819f14eb58ab1f79423d9c36fd0dbde99d56193c4c6bcff', '2026-09-08T08:15:00.018Z', 'OFF-1042', 'SONI SHRIVASTAVA', 'VoterID Official Authority', 'Genuine baseline uploaded via Database References on 08/09/2026', '', '', '', '', '', '', '', '{}'::jsonb)
ON CONFLICT ("Document_ID") DO NOTHING;

INSERT INTO public.verified_documents ("Document_ID", "Document_Type", "Extracted_ID_Number", "Document_Hash", "Upload_Date", "Admin_ID", "Holder_Name", "Issuing_Authority", "Notes", "Father_Name", "Date_Of_Birth", "Gender", "Address", "Issue_Date", "Validity_Date", "Blood_Group", "Extracted_Fields")
VALUES ('DOC-VER-013', 'Aadhaar', '849198678039', '3dfb1cea69c61ec7445243fc39b97e9bbaee7f857ed0e26a3733645f059c8eeb', '2026-09-08T08:14:16.232Z', 'OFF-1042', 'Prateek Sharma', 'Aadhaar Official Authority', 'Genuine baseline uploaded via Database References on 08/09/2026', '', '', '', '', '', '', '', '{}'::jsonb)
ON CONFLICT ("Document_ID") DO NOTHING;

INSERT INTO public.verified_documents ("Document_ID", "Document_Type", "Extracted_ID_Number", "Document_Hash", "Upload_Date", "Admin_ID", "Holder_Name", "Issuing_Authority", "Notes", "Father_Name", "Date_Of_Birth", "Gender", "Address", "Issue_Date", "Validity_Date", "Blood_Group", "Extracted_Fields")
VALUES ('DOC-VER-012', 'Aadhaar', '6099 5669 7236', '4e102bb3535e9d762785065ca6d72f061c528c4d4bcbcf02e23e98363234ac4f', '2026-09-08T08:13:37.150Z', 'OFF-1042', 'Pranati Choudhary', 'Aadhaar Official Authority', 'Genuine baseline uploaded via Database References on 08/09/2026', '', '', '', '', '', '', '', '{}'::jsonb)
ON CONFLICT ("Document_ID") DO NOTHING;

INSERT INTO public.verified_documents ("Document_ID", "Document_Type", "Extracted_ID_Number", "Document_Hash", "Upload_Date", "Admin_ID", "Holder_Name", "Issuing_Authority", "Notes", "Father_Name", "Date_Of_Birth", "Gender", "Address", "Issue_Date", "Validity_Date", "Blood_Group", "Extracted_Fields")
VALUES ('DOC-VER-011', 'Aadhaar', '9388 3573 2118', '598b5ee5e67c96be68d8483c6740bebe83a27fcc2cb8a73f35c36b3f211cc5a8', '2026-09-08T08:13:13.215Z', 'OFF-1042', 'Pawan Singh', 'Aadhaar Official Authority', 'Genuine baseline uploaded via Database References on 08/09/2026', '', '', '', '', '', '', '', '{}'::jsonb)
ON CONFLICT ("Document_ID") DO NOTHING;

INSERT INTO public.verified_documents ("Document_ID", "Document_Type", "Extracted_ID_Number", "Document_Hash", "Upload_Date", "Admin_ID", "Holder_Name", "Issuing_Authority", "Notes", "Father_Name", "Date_Of_Birth", "Gender", "Address", "Issue_Date", "Validity_Date", "Blood_Group", "Extracted_Fields")
VALUES ('DOC-VER-010', 'PAN', 'URGPS3759P', 'b762294acde0d80818ad746a9af8ca7bd3c2188012ad67b89905e00f69d22c49', '2026-09-08T08:12:52.548Z', 'OFF-1042', 'SANYA SHRIVASTAVA', 'PAN Official Authority', 'Genuine baseline uploaded via Database References on 08/09/2026', '', '', '', '', '', '', '', '{}'::jsonb)
ON CONFLICT ("Document_ID") DO NOTHING;

INSERT INTO public.verified_documents ("Document_ID", "Document_Type", "Extracted_ID_Number", "Document_Hash", "Upload_Date", "Admin_ID", "Holder_Name", "Issuing_Authority", "Notes", "Father_Name", "Date_Of_Birth", "Gender", "Address", "Issue_Date", "Validity_Date", "Blood_Group", "Extracted_Fields")
VALUES ('DOC-VER-008', 'Aadhaar', '417514794065', 'c66f33a163b2709899402e130b00d354a45917fc8bf4b0c022bdbdb0f1a70fe2', '2026-09-08T05:31:20.644Z', 'OFF-1042', 'SANYA SHRIVASTAVA', 'Aadhaar National Authority', 'Officially registered genuine credential', '', '', '', '', '', '', '', '{}'::jsonb)
ON CONFLICT ("Document_ID") DO NOTHING;

INSERT INTO public.verified_documents ("Document_ID", "Document_Type", "Extracted_ID_Number", "Document_Hash", "Upload_Date", "Admin_ID", "Holder_Name", "Issuing_Authority", "Notes", "Father_Name", "Date_Of_Birth", "Gender", "Address", "Issue_Date", "Validity_Date", "Blood_Group", "Extracted_Fields")
VALUES ('DOC-VER-007', 'Aadhaar', '226895661166', 'f19f5e82e7c4f713f26137c9ab4d821b25b18c66f82dd03968faddbe4819f426', '2026-09-08T03:56:53.911Z', 'OFF-1042', 'ATHARV SRIVASTAVA', 'Aadhaar Official Authority', 'Genuine baseline uploaded via Database References on 8/9/2026', '', '', '', '', '', '', '', '{}'::jsonb)
ON CONFLICT ("Document_ID") DO NOTHING;

INSERT INTO public.verified_documents ("Document_ID", "Document_Type", "Extracted_ID_Number", "Document_Hash", "Upload_Date", "Admin_ID", "Holder_Name", "Issuing_Authority", "Notes", "Father_Name", "Date_Of_Birth", "Gender", "Address", "Issue_Date", "Validity_Date", "Blood_Group", "Extracted_Fields")
VALUES ('DOC-VER-006', 'Aadhaar', '518034528577', '21f91eb97a1d4a1c8b8399b3ada88351980be1d44dc786bf9754534e1fc90b5d', '2026-09-08T03:55:21.882Z', 'OFF-1042', 'PRAHARSH CHOUDHARY', 'Aadhaar Official Authority', 'Genuine baseline uploaded via Database References on 8/9/2026', '', '', '', '', '', '', '', '{}'::jsonb)
ON CONFLICT ("Document_ID") DO NOTHING;

INSERT INTO public.verified_documents ("Document_ID", "Document_Type", "Extracted_ID_Number", "Document_Hash", "Upload_Date", "Admin_ID", "Holder_Name", "Issuing_Authority", "Notes", "Father_Name", "Date_Of_Birth", "Gender", "Address", "Issue_Date", "Validity_Date", "Blood_Group", "Extracted_Fields")
VALUES ('DOC-VER-005', 'PAN', 'DLGPC1327G', 'f6ad41e07f2b026be281b8e2c827c2761c19475ebb70dffe3b58e7f24c9b53b6', '2026-09-08T03:53:14.419Z', 'OFF-1042', 'PRAHARSH CHOUDHARY', 'PAN Official Authority', 'Genuine baseline uploaded via Database References on 8/9/2026', '', '', '', '', '', '', '', '{}'::jsonb)
ON CONFLICT ("Document_ID") DO NOTHING;

INSERT INTO public.verified_documents ("Document_ID", "Document_Type", "Extracted_ID_Number", "Document_Hash", "Upload_Date", "Admin_ID", "Holder_Name", "Issuing_Authority", "Notes", "Father_Name", "Date_Of_Birth", "Gender", "Address", "Issue_Date", "Validity_Date", "Blood_Group", "Extracted_Fields")
VALUES ('DOC-VER-003', 'DL', 'UP93 20250009578', '608f5fe9c637f720a95b82fe5ef4cb42654ab63a1f132990f436a26eb0930203', '2026-09-08T03:50:57.002Z', 'OFF-1042', 'BHOOMIKA   MAHOR', 'DL Official Authority', 'Genuine baseline uploaded via Database References on 8/9/2026', '', '', '', '', '', '', '', '{}'::jsonb)
ON CONFLICT ("Document_ID") DO NOTHING;

INSERT INTO public.verified_documents ("Document_ID", "Document_Type", "Extracted_ID_Number", "Document_Hash", "Upload_Date", "Admin_ID", "Holder_Name", "Issuing_Authority", "Notes", "Father_Name", "Date_Of_Birth", "Gender", "Address", "Issue_Date", "Validity_Date", "Blood_Group", "Extracted_Fields")
VALUES ('DOC-VER-002', 'DL', 'MP 07 20260017915', 'db5f95aff327eb32773f6629272c532246e92c59cb50c141260d8bb59884d0dd', '2026-09-08T03:47:43.962Z', 'OFF-1042', 'SHUBH GUPTA', 'DL Official Authority', 'Genuine baseline uploaded via Database References on 8/9/2026', '', '', '', '', '', '', '', '{}'::jsonb)
ON CONFLICT ("Document_ID") DO NOTHING;

INSERT INTO public.verified_documents ("Document_ID", "Document_Type", "Extracted_ID_Number", "Document_Hash", "Upload_Date", "Admin_ID", "Holder_Name", "Issuing_Authority", "Notes", "Father_Name", "Date_Of_Birth", "Gender", "Address", "Issue_Date", "Validity_Date", "Blood_Group", "Extracted_Fields")
VALUES ('DOC-VER-001', 'DL', 'UP34 20250011079', '23eece2786b2c32f7e0525ba3e17fa22c59a573045e16b35d1223d01cfd4a7f9', '2026-09-08T03:46:28.250Z', 'OFF-1042', 'PRAHARSH CHOUDHARY', 'DL Official Authority', 'Genuine baseline uploaded via Database References on 8/9/2026', '', '', '', '', '', '', '', '{}'::jsonb)
ON CONFLICT ("Document_ID") DO NOTHING;

