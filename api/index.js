const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
// Load .env configuration if present
try {
  const envFile = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envFile)) {
    fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[k]) process.env[k] = v;
      }
    });
  }
} catch (e) {}

// File paths for persistence (supports Vercel Serverless read-only environment)
const LOCAL_DATA_FILE = path.join(__dirname, '..', 'data', 'verified_documents.json');
const SEED_100_FILE = path.join(__dirname, '..', 'data', 'verified_documents_100_seed.json');
const TMP_DATA_FILE = path.join('/tmp', 'verified_documents_v3_user.json');

// In-memory cache
let inMemoryDb = null;

function load100SeedData() {
  try {
    if (fs.existsSync(SEED_100_FILE)) {
      const data = JSON.parse(fs.readFileSync(SEED_100_FILE, 'utf8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
    if (fs.existsSync(LOCAL_DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(LOCAL_DATA_FILE, 'utf8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.error('Error loading seed file:', e);
  }
  return [];
}

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const FIREBASE_URL = process.env.FIREBASE_DATABASE_URL || process.env.FIREBASE_URL;

// Supabase Cloud PostgreSQL Configuration
const SUPABASE_URL = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.replace(/\/$/, '') : null;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

async function loadFromSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/verified_documents?select=*&order=Upload_Date.desc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } else {
      console.warn('Supabase fetch returned:', resp.status, await resp.text());
    }
  } catch (e) {
    console.error('Supabase load error:', e.message);
  }
  return null;
}

async function upsertToSupabase(doc) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return false;
  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/verified_documents`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(doc)
    });
    return resp.ok;
  } catch (e) {
    console.error('Supabase upsert error:', e.message);
    return false;
  }
}

async function deleteFromSupabase(docId) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return false;
  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/verified_documents?Document_ID=eq.${encodeURIComponent(docId)}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    return resp.ok;
  } catch (e) {
    console.error('Supabase delete error:', e.message);
    return false;
  }
}

async function loadFromCloudKv() {
  // Check Supabase first (preferred cloud database)
  const supabaseDocs = await loadFromSupabase();
  if (supabaseDocs && supabaseDocs.length > 0) return supabaseDocs;

  if (KV_URL && KV_TOKEN) {
    try {
      const resp = await fetch(`${KV_URL}/get/authbridge_verified_docs`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json && json.result) {
          const parsed = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {}
  }
  if (FIREBASE_URL) {
    try {
      const url = FIREBASE_URL.replace(/\/$/, '') + '/verified_documents.json';
      const resp = await fetch(url);
      if (resp.ok) {
        const json = await resp.json();
        if (Array.isArray(json) && json.length > 0) return json;
      }
    } catch (e) {}
  }
  return null;
}

function saveToCloudKv(data) {
  if (KV_URL && KV_TOKEN) {
    fetch(`${KV_URL}/set/authbridge_verified_docs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).catch(() => {});
  }
  if (FIREBASE_URL) {
    const url = FIREBASE_URL.replace(/\/$/, '') + '/verified_documents.json';
    fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {});
  }
}

function loadDb() {
  if (inMemoryDb && Array.isArray(inMemoryDb) && inMemoryDb.length > 0) {
    return inMemoryDb;
  }

  // Try /tmp first if running on serverless
  try {
    if (fs.existsSync(TMP_DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(TMP_DATA_FILE, 'utf8'));
      if (Array.isArray(data) && data.length > 0) {
        inMemoryDb = data;
        return inMemoryDb;
      }
    }
  } catch (e) {
    console.warn('Error reading from /tmp:', e);
  }

  // Fallback to local files
  inMemoryDb = load100SeedData();
  return inMemoryDb;
}

function saveDb(data) {
  inMemoryDb = data;
  let saved = false;

  // Try saving to /tmp (always writable on Vercel)
  try {
    fs.writeFileSync(TMP_DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    saved = true;
  } catch (e) {
    console.warn('Could not write to /tmp:', e.message);
  }

  // Also attempt saving to local data dir if writable (local dev)
  try {
    const dir = path.dirname(LOCAL_DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    saved = true;
  } catch (e) {
    // Expected on read-only serverless filesystems
  }

  // Asynchronously push to cloud KV if configured
  saveToCloudKv(data);
  return saved;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache'
  });
  res.end(JSON.stringify(payload));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const host = req.headers.host || 'localhost';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const parsedUrl = new URL(req.url, `${protocol}://${host}`);
  let pathname = parsedUrl.pathname;

  // Normalize path if /api prefix is stripped or kept
  if (!pathname.startsWith('/api')) {
    pathname = '/api' + pathname;
  }

  // 0. GET /api/db-status (Check active database provider and health)
  if (pathname === '/api/db-status' && req.method === 'GET') {
    const isSupabase = !!(SUPABASE_URL && SUPABASE_KEY);
    const docs = loadDb();
    return sendJson(res, 200, {
      success: true,
      provider: isSupabase ? 'Supabase (PostgreSQL)' : 'Local File / Ephemeral Cache',
      supabaseConfigured: isSupabase,
      supabaseUrl: SUPABASE_URL ? SUPABASE_URL.replace(/https:\/\/(.{4}).*(\.supabase\.co)/, 'https://$1***$2') : null,
      recordCount: docs.length
    });
  }

  // 1. GET /api/verified-documents
  if (pathname === '/api/verified-documents' && req.method === 'GET') {
    const cloudDocs = await loadFromCloudKv();
    if (cloudDocs && Array.isArray(cloudDocs) && cloudDocs.length > 0) {
      saveDb(cloudDocs);
      return sendJson(res, 200, { success: true, count: cloudDocs.length, data: cloudDocs, source: SUPABASE_URL ? 'supabase' : 'cloud' });
    }
    const docs = loadDb();
    return sendJson(res, 200, { success: true, count: docs.length, data: docs, source: 'local' });
  }

  // 2. POST / PUT /api/verified-documents
  if (pathname === '/api/verified-documents' && (req.method === 'POST' || req.method === 'PUT')) {
    try {
      const body = await parseJsonBody(req);
      const docs = loadDb();

      const documentType = body.Document_Type || 'Unknown';
      let docHash = body.Document_Hash;

      if (!docHash && body.ImageData) {
        let raw = body.ImageData;
        if (raw.includes(',')) raw = raw.split(',')[1];
        docHash = crypto.createHash('sha256').update(Buffer.from(raw, 'base64')).digest('hex');
      }

      if (!docHash && body.Extracted_ID_Number) {
        docHash = crypto.createHash('sha256').update(`${documentType}-${body.Extracted_ID_Number}-${Date.now()}`).digest('hex');
      }

      let documentId = body.Document_ID;
      if (!documentId) {
        let maxNum = 0;
        docs.forEach(d => {
          const m = (d.Document_ID || '').match(/DOC-VER-(\d+)/i);
          if (m) {
            const n = parseInt(m[1], 10);
            if (n > maxNum) maxNum = n;
          }
        });
        let nextNum = maxNum + 1;
        documentId = `DOC-VER-${String(nextNum).padStart(3, '0')}`;
        while (docs.some(d => d.Document_ID === documentId)) {
          nextNum++;
          documentId = `DOC-VER-${String(nextNum).padStart(3, '0')}`;
        }
      }

      // Check for existing record strictly by Document_ID
      const cleanHash = (docHash || '').toLowerCase().trim();
      const existingIdx = docs.findIndex(d => d.Document_ID === documentId);
      const existingRecord = existingIdx >= 0 ? docs[existingIdx] : {};

      const newRecord = {
        ...existingRecord,
        Document_ID: documentId,
        Document_Type: documentType || existingRecord.Document_Type || 'Unknown',
        Extracted_ID_Number: (body.Extracted_ID_Number !== undefined ? body.Extracted_ID_Number : (existingRecord.Extracted_ID_Number || '')).trim(),
        Document_Hash: (cleanHash || existingRecord.Document_Hash || '').toLowerCase().trim(),
        Upload_Date: body.Upload_Date || existingRecord.Upload_Date || new Date().toISOString(),
        Admin_ID: body.Admin_ID || existingRecord.Admin_ID || 'OFF-1042',
        Holder_Name: (body.Holder_Name !== undefined ? body.Holder_Name : (existingRecord.Holder_Name || 'Verified Subject')).trim(),
        Father_Name: (body.Father_Name !== undefined ? body.Father_Name : (existingRecord.Father_Name || '')).trim(),
        Date_Of_Birth: (body.Date_Of_Birth !== undefined ? body.Date_Of_Birth : (body.DOB || existingRecord.Date_Of_Birth || '')).trim(),
        Gender: (body.Gender !== undefined ? body.Gender : (existingRecord.Gender || '')).trim(),
        Address: (body.Address !== undefined ? body.Address : (existingRecord.Address || '')).trim(),
        Issue_Date: (body.Issue_Date !== undefined ? body.Issue_Date : (existingRecord.Issue_Date || '')).trim(),
        Validity_Date: (body.Validity_Date !== undefined ? body.Validity_Date : (existingRecord.Validity_Date || '')).trim(),
        Blood_Group: (body.Blood_Group !== undefined ? body.Blood_Group : (existingRecord.Blood_Group || '')).trim(),
        Issuing_Authority: body.Issuing_Authority || existingRecord.Issuing_Authority || `${documentType} National Authority`,
        Notes: body.Notes !== undefined ? body.Notes : (existingRecord.Notes || 'Manually registered genuine document in trusted registry'),
        Extracted_Fields: body.Extracted_Fields || body.extractedFields || existingRecord.Extracted_Fields || null
      };

      if (existingIdx >= 0) {
        docs[existingIdx] = newRecord;
      } else {
        docs.unshift(newRecord);
      }

      saveDb(docs);
      await upsertToSupabase(newRecord);

      return sendJson(res, existingIdx >= 0 ? 200 : 201, {
        success: true,
        message: 'Document successfully registered/updated in Verified_Documents database',
        record: newRecord,
        syncedToSupabase: !!(SUPABASE_URL && SUPABASE_KEY)
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 3. DELETE /api/verified-documents
  if (pathname === '/api/verified-documents' && req.method === 'DELETE') {
    try {
      const docId = parsedUrl.searchParams.get('id');
      if (!docId) {
        return sendJson(res, 400, { success: false, error: 'Missing document id parameter' });
      }
      let docs = loadDb();
      const initialLen = docs.length;
      docs = docs.filter(d => d.Document_ID !== docId);
      if (docs.length === initialLen) {
        return sendJson(res, 404, { success: false, error: 'Document ID not found' });
      }
      saveDb(docs);
      await deleteFromSupabase(docId);

      return sendJson(res, 200, {
        success: true,
        message: `Document ${docId} removed from verified registry`,
        remaining: docs.length,
        syncedToSupabase: !!(SUPABASE_URL && SUPABASE_KEY)
      });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 4. POST /api/verified-documents/bulk
  if (pathname === '/api/verified-documents/bulk' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const incomingDocs = Array.isArray(body) ? body : (body.documents || body.records || []);

      if (!Array.isArray(incomingDocs) || incomingDocs.length === 0) {
        return sendJson(res, 400, { success: false, error: 'Expected non-empty array of document objects or { documents: [...] }' });
      }

      let currentDocs = loadDb();
      let importedCount = 0;
      let updatedCount = 0;

      for (let i = 0; i < incomingDocs.length; i++) {
        const item = incomingDocs[i];
        if (!item || typeof item !== 'object') continue;

        const documentType = item.Document_Type || item.type || 'Unknown';
        let extractedId = (item.Extracted_ID_Number || item.ID_Number || item.idNumber || item.ID || '').toString().trim();
        let docHash = (item.Document_Hash || item.hash || '').toString().trim().toLowerCase();

        if (!docHash && extractedId) {
          docHash = crypto.createHash('sha256').update(`${documentType}-${extractedId}-${item.Holder_Name || ''}`).digest('hex');
        } else if (!docHash) {
          docHash = crypto.createHash('sha256').update(`DOC-IMPORT-${Date.now()}-${i}-${Math.random()}`).digest('hex');
        }

        const cleanHash = docHash.toLowerCase();
        let targetId = item.Document_ID || item.documentId || '';
        let existingIdx = -1;

        if (targetId) {
          existingIdx = currentDocs.findIndex(d => d.Document_ID === targetId);
        }
        if (existingIdx === -1 && cleanHash) {
          existingIdx = currentDocs.findIndex(d => (d.Document_Hash || '').toLowerCase() === cleanHash);
        }
        if (existingIdx === -1 && extractedId) {
          const normExtracted = extractedId.replace(/[\s-]/g, '').toUpperCase();
          if (normExtracted.length >= 5) {
            existingIdx = currentDocs.findIndex(d => (d.Extracted_ID_Number || '').replace(/[\s-]/g, '').toUpperCase() === normExtracted);
          }
        }

        const existingRecord = existingIdx >= 0 ? currentDocs[existingIdx] : {};
        if (!targetId) {
          if (existingIdx >= 0 && existingRecord.Document_ID) {
            targetId = existingRecord.Document_ID;
          } else {
            const nextIdx = currentDocs.length + 1;
            targetId = `DOC-VER-${String(nextIdx).padStart(3, '0')}`;
          }
        }

        const record = {
          ...existingRecord,
          Document_ID: targetId,
          Document_Type: documentType || existingRecord.Document_Type || 'Unknown',
          Extracted_ID_Number: extractedId || existingRecord.Extracted_ID_Number || '',
          Document_Hash: cleanHash || existingRecord.Document_Hash || '',
          Upload_Date: item.Upload_Date || existingRecord.Upload_Date || new Date().toISOString(),
          Admin_ID: item.Admin_ID || existingRecord.Admin_ID || 'BULK-IMPORT',
          Holder_Name: (item.Holder_Name || item.name || existingRecord.Holder_Name || 'Verified Subject').toString().trim(),
          Father_Name: (item.Father_Name || item.fatherName || existingRecord.Father_Name || '').toString().trim(),
          Date_Of_Birth: (item.Date_Of_Birth || item.DOB || item.dob || existingRecord.Date_Of_Birth || '').toString().trim(),
          Gender: (item.Gender || item.gender || existingRecord.Gender || '').toString().trim(),
          Address: (item.Address || item.address || existingRecord.Address || '').toString().trim(),
          Issue_Date: (item.Issue_Date || existingRecord.Issue_Date || '').toString().trim(),
          Validity_Date: (item.Validity_Date || existingRecord.Validity_Date || '').toString().trim(),
          Blood_Group: (item.Blood_Group || existingRecord.Blood_Group || '').toString().trim(),
          Issuing_Authority: item.Issuing_Authority || existingRecord.Issuing_Authority || `${documentType} Authority`,
          Notes: item.Notes || existingRecord.Notes || 'Bulk imported authoritative document input',
          Extracted_Fields: item.Extracted_Fields || existingRecord.Extracted_Fields || null
        };

        if (existingIdx >= 0) {
          currentDocs[existingIdx] = record;
          updatedCount++;
        } else {
          currentDocs.push(record);
          importedCount++;
        }
      }

      saveDb(currentDocs);
      return sendJson(res, 200, {
        success: true,
        message: `Successfully processed ${incomingDocs.length} records (${importedCount} new inputs added, ${updatedCount} updated)`,
        importedCount,
        updatedCount,
        totalCount: currentDocs.length
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 5. POST /api/verified-documents/seed-100
  if (pathname === '/api/verified-documents/seed-100' && req.method === 'POST') {
    const seeds100 = load100SeedData();
    saveDb(seeds100);
    return sendJson(res, 200, {
      success: true,
      message: `Database populated with ${seeds100.length} authoritative verified records`,
      count: seeds100.length,
      data: seeds100
    });
  }

  // 6. GET /api/verified-documents/export
  if (pathname === '/api/verified-documents/export' && req.method === 'GET') {
    const docs = loadDb();
    const format = (parsedUrl.searchParams.get('format') || 'json').toLowerCase();

    if (format === 'csv') {
      const headers = ['Document_ID', 'Document_Type', 'Extracted_ID_Number', 'Document_Hash', 'Holder_Name', 'Father_Name', 'Date_Of_Birth', 'Gender', 'Address', 'Issuing_Authority', 'Issue_Date', 'Validity_Date', 'Blood_Group', 'Admin_ID', 'Upload_Date', 'Notes'];
      const rows = docs.map(d => headers.map(h => {
        const val = (d[h] || '').toString().replace(/"/g, '""');
        return `"${val}"`;
      }).join(','));
      const csvContent = [headers.join(','), ...rows].join('\r\n');

      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="verified_documents_${docs.length}_records.csv"`,
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(csvContent);
    }

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="verified_documents_${docs.length}_records.json"`,
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(JSON.stringify(docs, null, 2));
  }

  // 7. GET /api/verified-documents/template-csv
  if (pathname === '/api/verified-documents/template-csv' && req.method === 'GET') {
    const headers = ['Document_Type', 'Extracted_ID_Number', 'Holder_Name', 'Father_Name', 'Date_Of_Birth', 'Gender', 'Address', 'Issuing_Authority', 'Issue_Date', 'Validity_Date', 'Blood_Group', 'Notes'];
    const sampleRows = [
      ['PAN', 'ABCDE1234F', 'SURESH KUMAR', 'RAMESH KUMAR', '15/08/1985', 'Male', '124 Model Town, Lucknow, Uttar Pradesh', 'INCOME TAX DEPARTMENT', '10/01/2018', 'Permanent', 'O+', 'Verified PAN baseline'],
      ['Aadhaar', '9018 4821 7362', 'PRIYA SHARMA', 'ANIL SHARMA', '22/11/1992', 'Female', '45 Park View, Bengaluru, Karnataka', 'UIDAI', '05/05/2019', 'Permanent', 'B+', 'Verified Aadhaar demographic record'],
      ['DL', 'UP14 20210018429', 'AMIT VERMA', 'SURESH VERMA', '10/03/1990', 'Male', '78 Civil Lines, Agra, Uttar Pradesh', 'Transport Department Uttar Pradesh', '12/04/2021', '11/04/2041', 'A+', 'Union Driving Licence verified'],
      ['Passport', 'Z2849102', 'ANANYA IYER', 'KALYAN IYER', '04/07/1995', 'Female', '12 Marine Drive, Mumbai, Maharashtra', 'MINISTRY OF EXTERNAL AFFAIRS', '20/09/2020', '19/09/2030', 'AB+', 'Machine Readable Passport'],
      ['VoterID', 'FSZ1842901', 'ROHAN CHOUDHARY', 'VIKRAM CHOUDHARY', '18/09/1988', 'Male', '56 Lake Road, Kolkata, West Bengal', 'ELECTION COMMISSION OF INDIA', '15/01/2017', 'Permanent', 'O+', 'EPIC Electoral roll verified']
    ];
    const csvContent = [headers.join(','), ...sampleRows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(','))].join('\r\n');

    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="verified_documents_import_template.csv"',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(csvContent);
  }

  // 8. POST /api/verify
  if (pathname === '/api/verify' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const docs = loadDb();

      const targetHash = (body.hash || '').toLowerCase().trim();
      const targetIdNum = (body.extractedId || '').replace(/[\s-]/g, '').toUpperCase().trim();

      let matchedRecord = null;
      let matchMethod = 'NONE';

      if (targetHash) {
        matchedRecord = docs.find(d => (d.Document_Hash || '').toLowerCase() === targetHash);
        if (matchedRecord) matchMethod = 'EXACT_HASH_MATCH';
      }

      if (!matchedRecord && targetIdNum) {
        matchedRecord = docs.find(d => {
          const storedNorm = (d.Extracted_ID_Number || '').replace(/[\s-]/g, '').toUpperCase();
          return storedNorm.length > 4 && storedNorm === targetIdNum;
        });
        if (matchedRecord) matchMethod = 'EXTRACTED_ID_MATCH';
      }

      if (matchedRecord) {
        return sendJson(res, 200, {
          verdict: 'GENUINE',
          isGenuine: true,
          matchMethod,
          matchedRecord,
          message: `Verification Successful: Matches verified record ${matchedRecord.Document_ID} in trusted database`
        });
      } else {
        return sendJson(res, 200, {
          verdict: 'FAKE / UNVERIFIED',
          isGenuine: false,
          matchMethod: 'NONE',
          matchedRecord: null,
          message: 'Verification Failed: Document hash and extracted ID do not match any genuine baseline record in trusted database'
        });
      }
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 9. System health / status
  if (pathname === '/api/system-status' || pathname === '/api/health') {
    const docs = loadDb();
    return sendJson(res, 200, {
      status: 'operational',
      environment: 'vercel-serverless',
      verifiedDocumentCount: docs.length,
      timestamp: new Date().toISOString()
    });
  }

  return sendJson(res, 404, { success: false, error: `API route ${pathname} not found` });
};
