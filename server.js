const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'verispect-identity');
const DATA_DIR = path.join(PUBLIC_DIR, 'data');
const DB_FILE = path.join(DATA_DIR, 'verified_documents.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

// Verified Genuine Document References Baseline
const SEED_DATA = [
  {
    "Document_ID": "DOC-VER-021",
    "Document_Type": "Aadhaar",
    "Extracted_ID_Number": "9372 7070 4044",
    "Document_Hash": "96d8e11a795d509119250292df73a52d9558cf857bc52096859c67b329628e87",
    "Upload_Date": "2026-09-08T08:32:16.815Z",
    "Admin_ID": "OFF-1042",
    "Holder_Name": "Saurabh Singh",
    "Issuing_Authority": "Aadhaar Official Authority",
    "Notes": "Genuine baseline uploaded via Database References on 08/09/2026"
  },
  {
    "Document_ID": "DOC-VER-020",
    "Document_Type": "Aadhaar",
    "Extracted_ID_Number": "9302 1307 7797",
    "Document_Hash": "c526b8391b295cb2f2d14e8c595e0fb4eff7924b934d4abaa55d6ff80d1200c1",
    "Upload_Date": "2026-09-08T15:16:42.798Z",
    "Admin_ID": "OFF-1042",
    "Holder_Name": "Divyansh Singh",
    "Issuing_Authority": "UNIQUE IDENTIFICATION AUTHORITY OF INDIA (UIDAI)",
    "Notes": "Genuine baseline uploaded via Database References on 9/8/2026",
    "Father_Name": "",
    "Date_Of_Birth": "15/12/2005",
    "Gender": "",
    "Address": "",
    "Issue_Date": "",
    "Validity_Date": "",
    "Blood_Group": "",
    "Extracted_Fields": null
  },
  {
    "Document_ID": "DOC-VER-019",
    "Document_Type": "PAN",
    "Extracted_ID_Number": "FAVPG7366H",
    "Document_Hash": "5929e3f5779af4644f3069847a8ff7d76debd6b4745fe74ff4dc9b5051dcc9a5",
    "Upload_Date": "2026-09-08T08:21:23.773Z",
    "Admin_ID": "OFF-1042",
    "Holder_Name": "Shubh Gupta",
    "Issuing_Authority": "PAN Official Authority",
    "Notes": "Genuine baseline uploaded via Database References on 08/09/2026"
  },
  {
    "Document_ID": "DOC-VER-018",
    "Document_Type": "PAN",
    "Extracted_ID_Number": "DVEPS1339Q",
    "Document_Hash": "5d7ce61e8abd7aed613a4d5b409d41b84a6a5bd1fffce3426d0269e29060fd02",
    "Upload_Date": "2026-09-08T08:20:32.674Z",
    "Admin_ID": "OFF-1042",
    "Holder_Name": "RUCHI CHOUDHARY",
    "Issuing_Authority": "PAN Official Authority",
    "Notes": "Genuine baseline uploaded via Database References on 08/09/2026"
  },
  {
    "Document_ID": "DOC-VER-017",
    "Document_Type": "PAN",
    "Extracted_ID_Number": "KCUPM5157C",
    "Document_Hash": "32cf5383459a88d004c46cee8f04b9c084b4e2f50cab092d1126a129682ee0ba",
    "Upload_Date": "2026-09-08T08:17:33.954Z",
    "Admin_ID": "OFF-1042",
    "Holder_Name": "Alwin Mathew",
    "Issuing_Authority": "PAN Official Authority",
    "Notes": "Genuine baseline uploaded via Database References on 08/09/2026"
  },
  {
    "Document_ID": "DOC-VER-016",
    "Document_Type": "VoterID",
    "Extracted_ID_Number": "TEE3397882",
    "Document_Hash": "072840dbc3f3eb24cbead2bf8e083813fd722c9f82ab0f141f1bf0220c4932e3",
    "Upload_Date": "2026-09-08T08:16:41.823Z",
    "Admin_ID": "OFF-1042",
    "Holder_Name": "MANAS KASAUDHAN",
    "Issuing_Authority": "VoterID Official Authority",
    "Notes": "Genuine baseline uploaded via Database References on 08/09/2026"
  },
  {
    "Document_ID": "DOC-VER-015",
    "Document_Type": "Aadhaar",
    "Extracted_ID_Number": "8727 4007 5987",
    "Document_Hash": "838a556674f0e6dd9d8c711cf89a29c03987d33f4048981a7357413b74a5626b",
    "Upload_Date": "2026-09-08T08:16:03.037Z",
    "Admin_ID": "OFF-1042",
    "Holder_Name": "Aarush Pandey",
    "Issuing_Authority": "Aadhaar Official Authority",
    "Notes": "Genuine baseline uploaded via Database References on 08/09/2026"
  },
  {
    "Document_ID": "DOC-VER-014",
    "Document_Type": "VoterID",
    "Extracted_ID_Number": "NCY1515949",
    "Document_Hash": "73e1125a22870edd9819f14eb58ab1f79423d9c36fd0dbde99d56193c4c6bcff",
    "Upload_Date": "2026-09-08T08:15:00.018Z",
    "Admin_ID": "OFF-1042",
    "Holder_Name": "SONI SHRIVASTAVA",
    "Issuing_Authority": "VoterID Official Authority",
    "Notes": "Genuine baseline uploaded via Database References on 08/09/2026"
  },
  {
    "Document_ID": "DOC-VER-013",
    "Document_Type": "Aadhaar",
    "Extracted_ID_Number": "849198678039",
    "Document_Hash": "3dfb1cea69c61ec7445243fc39b97e9bbaee7f857ed0e26a3733645f059c8eeb",
    "Upload_Date": "2026-09-08T08:14:16.232Z",
    "Admin_ID": "OFF-1042",
    "Holder_Name": "Prateek Sharma",
    "Issuing_Authority": "Aadhaar Official Authority",
    "Notes": "Genuine baseline uploaded via Database References on 08/09/2026"
  },
  {
    "Document_ID": "DOC-VER-012",
    "Document_Type": "Aadhaar",
    "Extracted_ID_Number": "6099 5669 7236",
    "Document_Hash": "4e102bb3535e9d762785065ca6d72f061c528c4d4bcbcf02e23e98363234ac4f",
    "Upload_Date": "2026-09-08T08:13:37.150Z",
    "Admin_ID": "OFF-1042",
    "Holder_Name": "Pranati Choudhary",
    "Issuing_Authority": "Aadhaar Official Authority",
    "Notes": "Genuine baseline uploaded via Database References on 08/09/2026"
  },
  {
    "Document_ID": "DOC-VER-011",
    "Document_Type": "Aadhaar",
    "Extracted_ID_Number": "9388 3573 2118",
    "Document_Hash": "598b5ee5e67c96be68d8483c6740bebe83a27fcc2cb8a73f35c36b3f211cc5a8",
    "Upload_Date": "2026-09-08T08:13:13.215Z",
    "Admin_ID": "OFF-1042",
    "Holder_Name": "Pawan Singh",
    "Issuing_Authority": "Aadhaar Official Authority",
    "Notes": "Genuine baseline uploaded via Database References on 08/09/2026"
  },
  {
    "Document_ID": "DOC-VER-010",
    "Document_Type": "PAN",
    "Extracted_ID_Number": "URGPS3759P",
    "Document_Hash": "b762294acde0d80818ad746a9af8ca7bd3c2188012ad67b89905e00f69d22c49",
    "Upload_Date": "2026-09-08T08:12:52.548Z",
    "Admin_ID": "OFF-1042",
    "Holder_Name": "SANYA SHRIVASTAVA",
    "Issuing_Authority": "PAN Official Authority",
    "Notes": "Genuine baseline uploaded via Database References on 08/09/2026"
  },
  {
    "Document_ID": "DOC-VER-008",
    "Document_Type": "Aadhaar",
    "Extracted_ID_Number": "417514794065",
    "Document_Hash": "c66f33a163b2709899402e130b00d354a45917fc8bf4b0c022bdbdb0f1a70fe2",
    "Upload_Date": "2026-09-08T05:31:20.644Z",
    "Admin_ID": "OFF-1042",
    "Holder_Name": "SANYA SHRIVASTAVA",
    "Issuing_Authority": "Aadhaar National Authority",
    "Notes": "Officially registered genuine credential"
  },
  {
    "Document_ID": "DOC-VER-007",
    "Document_Type": "Aadhaar",
    "Extracted_ID_Number": "226895661166",
    "Document_Hash": "f19f5e82e7c4f713f26137c9ab4d821b25b18c66f82dd03968faddbe4819f426",
    "Upload_Date": "2026-09-08T03:56:53.911Z",
    "Admin_ID": "OFF-1042",
    "Holder_Name": "ATHARV SRIVASTAVA",
    "Issuing_Authority": "Aadhaar Official Authority",
    "Notes": "Genuine baseline uploaded via Database References on 8/9/2026"
  },
  {
    "Document_ID": "DOC-VER-006",
    "Document_Type": "Aadhaar",
    "Extracted_ID_Number": "518034528577",
    "Document_Hash": "21f91eb97a1d4a1c8b8399b3ada88351980be1d44dc786bf9754534e1fc90b5d",
    "Upload_Date": "2026-09-08T03:55:21.882Z",
    "Admin_ID": "OFF-1042",
    "Holder_Name": "PRAHARSH CHOUDHARY",
    "Issuing_Authority": "Aadhaar Official Authority",
    "Notes": "Genuine baseline uploaded via Database References on 8/9/2026"
  },
  {
    "Document_ID": "DOC-VER-005",
    "Document_Type": "PAN",
    "Extracted_ID_Number": "DLGPC1327G",
    "Document_Hash": "f6ad41e07f2b026be281b8e2c827c2761c19475ebb70dffe3b58e7f24c9b53b6",
    "Upload_Date": "2026-09-08T03:53:14.419Z",
    "Admin_ID": "OFF-1042",
    "Holder_Name": "PRAHARSH CHOUDHARY",
    "Issuing_Authority": "PAN Official Authority",
    "Notes": "Genuine baseline uploaded via Database References on 8/9/2026"
  },
  {
    "Document_ID": "DOC-VER-003",
    "Document_Type": "DL",
    "Extracted_ID_Number": "UP93 20250009578",
    "Document_Hash": "608f5fe9c637f720a95b82fe5ef4cb42654ab63a1f132990f436a26eb0930203",
    "Upload_Date": "2026-09-08T03:50:57.002Z",
    "Admin_ID": "OFF-1042",
    "Holder_Name": "BHOOMIKA   MAHOR",
    "Issuing_Authority": "DL Official Authority",
    "Notes": "Genuine baseline uploaded via Database References on 8/9/2026"
  },
  {
    "Document_ID": "DOC-VER-002",
    "Document_Type": "DL",
    "Extracted_ID_Number": "MP 07 20260017915",
    "Document_Hash": "db5f95aff327eb32773f6629272c532246e92c59cb50c141260d8bb59884d0dd",
    "Upload_Date": "2026-09-08T03:47:43.962Z",
    "Admin_ID": "OFF-1042",
    "Holder_Name": "SHUBH GUPTA",
    "Issuing_Authority": "DL Official Authority",
    "Notes": "Genuine baseline uploaded via Database References on 8/9/2026",
    "Father_Name": "",
    "Date_Of_Birth": "",
    "Gender": "",
    "Address": "",
    "Issue_Date": "",
    "Validity_Date": "",
    "Blood_Group": "",
    "Extracted_Fields": null
  },
  {
    "Document_ID": "DOC-VER-001",
    "Document_Type": "DL",
    "Extracted_ID_Number": "UP34 20250011079",
    "Document_Hash": "23eece2786b2c32f7e0525ba3e17fa22c59a573045e16b35d1223d01cfd4a7f9",
    "Upload_Date": "2026-09-08T03:46:28.250Z",
    "Admin_ID": "OFF-1042",
    "Holder_Name": "PRAHARSH CHOUDHARY",
    "Issuing_Authority": "DL Official Authority",
    "Notes": "Genuine baseline uploaded via Database References on 8/9/2026"
  }
];

const SEED_100_FILE = path.join(DATA_DIR, 'verified_documents_100_seed.json');

function get100Seeds() {
  try {
    const candidates = [
      SEED_100_FILE,
      path.join(__dirname, 'data', 'verified_documents_100_seed.json'),
      path.join(__dirname, 'verispect-identity', 'data', 'verified_documents_100_seed.json'),
      path.join(__dirname, 'data', 'verified_documents.json'),
      path.join(__dirname, 'verispect-identity', 'data', 'verified_documents.json')
    ];
    for (const f of candidates) {
      if (fs.existsSync(f)) {
        const raw = fs.readFileSync(f, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Could not read 100 seeds file:', e);
  }
  return SEED_DATA;
}

let inMemoryServerDb = null;
const TMP_SERVER_DB = path.join('/tmp', 'verified_documents_v3_user.json');

function loadDb() {
  if (inMemoryServerDb && Array.isArray(inMemoryServerDb) && inMemoryServerDb.length > 0) {
    return inMemoryServerDb;
  }
  const defaultSeeds = get100Seeds();
  // Try /tmp first (for warm serverless lambdas)
  try {
    if (fs.existsSync(TMP_SERVER_DB)) {
      const parsed = JSON.parse(fs.readFileSync(TMP_SERVER_DB, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryServerDb = parsed;
        return inMemoryServerDb;
      }
    }
  } catch (e) {}

  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      inMemoryServerDb = (Array.isArray(parsed) && parsed.length > 0) ? parsed : [...defaultSeeds];
      return inMemoryServerDb;
    }
    inMemoryServerDb = get100Seeds();
    return inMemoryServerDb;
  } catch (err) {
    console.error('Error loading DB file:', err);
    inMemoryServerDb = get100Seeds();
    return inMemoryServerDb;
  }
}

let cloudDbPromise = null;
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const FIREBASE_URL = process.env.FIREBASE_DATABASE_URL || process.env.FIREBASE_URL;

async function loadFromCloudKv() {
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

function saveDb(data) {
  inMemoryServerDb = data;
  let success = false;
  // Always try writing to /tmp
  try {
    fs.writeFileSync(TMP_SERVER_DB, JSON.stringify(data, null, 2), 'utf8');
    success = true;
  } catch (e) {}

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    success = true;

    // Also sync to root data folder if it exists
    const rootDataFile = path.join(__dirname, 'data', 'verified_documents.json');
    if (fs.existsSync(path.dirname(rootDataFile))) {
      fs.writeFileSync(rootDataFile, JSON.stringify(data, null, 2), 'utf8');
    }
  } catch (err) {
    // Read-only filesystem is normal on serverless platforms
  }

  // Asynchronously push to cloud KV if configured
  saveToCloudKv(data);
  return success;
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
      if (body.length > 50 * 1024 * 1024) { // 50 MB limit
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

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle favicon gracefully to prevent 404 spam
  if (req.url === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  // --------------------------------------------------------------------------
  // REST API: Verified_Documents Database Endpoints
  // --------------------------------------------------------------------------

  // 1. GET /api/verified-documents
  if (pathname === '/api/verified-documents' && req.method === 'GET') {
    const docs = loadDb();
    return sendJson(res, 200, { success: true, count: docs.length, data: docs });
  }

  // 2. POST / PUT /api/verified-documents (Register or Update Verified Document)
  if (pathname === '/api/verified-documents' && (req.method === 'POST' || req.method === 'PUT')) {
    try {
      const body = await parseJsonBody(req);
      const docs = loadDb();

      const documentType = body.Document_Type || 'Unknown';
      let docHash = body.Document_Hash;

      // Auto-compute SHA-256 hash if raw image data or file content was provided
      if (!docHash && body.ImageData) {
        let raw = body.ImageData;
        if (raw.includes(',')) raw = raw.split(',')[1];
        docHash = crypto.createHash('sha256').update(Buffer.from(raw, 'base64')).digest('hex');
      }

      if (!docHash && body.Extracted_ID_Number) {
        docHash = crypto.createHash('sha256').update(`${documentType}-${body.Extracted_ID_Number}-${Date.now()}`).digest('hex');
      }

      const nextNum = docs.length + 1;
      const documentId = body.Document_ID || `DOC-VER-${String(nextNum).padStart(3, '0')}`;

      // Check for existing record by Document_ID or Document_Hash
      const cleanHash = (docHash || '').toLowerCase().trim();
      const existingIdx = docs.findIndex(d => d.Document_ID === documentId || (cleanHash && d.Document_Hash === cleanHash));
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
      return sendJson(res, existingIdx >= 0 ? 200 : 201, { success: true, message: 'Document successfully registered/updated in Verified_Documents database', record: newRecord });
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
      return sendJson(res, 200, { success: true, message: `Document ${docId} removed from verified registry`, remaining: docs.length });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 4. POST /api/verified-documents/bulk (Bulk Save / Import up to 100+ Inputs)
  if (pathname === '/api/verified-documents/bulk' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const incoming = Array.isArray(body) ? body : (body.records || body.data || []);
      if (!Array.isArray(incoming) || incoming.length === 0) {
        return sendJson(res, 400, { success: false, error: 'Expected an array of document records or { records: [...] }' });
      }

      const docs = loadDb();
      let importedCount = 0;

      for (const item of incoming) {
        if (!item || typeof item !== 'object') continue;
        const documentType = item.Document_Type || 'Unknown';
        const idNumber = (item.Extracted_ID_Number || item.ID_Number || '').trim();
        const holderName = (item.Holder_Name || item.Name || 'Verified Subject').trim();

        let docHash = item.Document_Hash;
        if (!docHash && item.ImageData) {
          let raw = item.ImageData;
          if (raw.includes(',')) raw = raw.split(',')[1];
          docHash = crypto.createHash('sha256').update(Buffer.from(raw, 'base64')).digest('hex');
        }
        if (!docHash && idNumber) {
          docHash = crypto.createHash('sha256').update(`${documentType}-${idNumber}-${holderName}`).digest('hex');
        }
        if (!docHash) {
          docHash = crypto.createHash('sha256').update(`${documentType}-${Date.now()}-${Math.random()}`).digest('hex');
        }

        const cleanHash = docHash.toLowerCase().trim();
        let documentId = item.Document_ID;
        if (!documentId) {
          const nextNum = docs.length + 1;
          documentId = `DOC-VER-${String(nextNum).padStart(3, '0')}`;
        }

        const existingIdx = docs.findIndex(d => d.Document_ID === documentId || (cleanHash && d.Document_Hash === cleanHash));
        const existingRecord = existingIdx >= 0 ? docs[existingIdx] : {};

        const newRecord = {
          ...existingRecord,
          Document_ID: documentId,
          Document_Type: documentType || existingRecord.Document_Type || 'Unknown',
          Extracted_ID_Number: idNumber || existingRecord.Extracted_ID_Number || '',
          Document_Hash: cleanHash || existingRecord.Document_Hash || '',
          Upload_Date: item.Upload_Date || existingRecord.Upload_Date || new Date().toISOString(),
          Admin_ID: item.Admin_ID || existingRecord.Admin_ID || 'OFF-1042',
          Holder_Name: holderName || existingRecord.Holder_Name || 'Verified Subject',
          Father_Name: (item.Father_Name !== undefined ? item.Father_Name : (existingRecord.Father_Name || '')).trim(),
          Date_Of_Birth: (item.Date_Of_Birth !== undefined ? item.Date_Of_Birth : (item.DOB || existingRecord.Date_Of_Birth || '')).trim(),
          Gender: (item.Gender !== undefined ? item.Gender : (existingRecord.Gender || '')).trim(),
          Address: (item.Address !== undefined ? item.Address : (existingRecord.Address || '')).trim(),
          Issue_Date: (item.Issue_Date !== undefined ? item.Issue_Date : (existingRecord.Issue_Date || '')).trim(),
          Validity_Date: (item.Validity_Date !== undefined ? item.Validity_Date : (existingRecord.Validity_Date || '')).trim(),
          Blood_Group: (item.Blood_Group !== undefined ? item.Blood_Group : (existingRecord.Blood_Group || '')).trim(),
          Issuing_Authority: item.Issuing_Authority || existingRecord.Issuing_Authority || `${documentType} National Authority`,
          Notes: item.Notes !== undefined ? item.Notes : (existingRecord.Notes || 'Imported via Bulk Database Intake'),
          Extracted_Fields: item.Extracted_Fields || existingRecord.Extracted_Fields || null
        };

        if (existingIdx >= 0) {
          docs[existingIdx] = newRecord;
        } else {
          docs.unshift(newRecord);
        }
        importedCount++;
      }

      saveDb(docs);
      return sendJson(res, 200, {
        success: true,
        message: `Successfully processed and saved ${importedCount} document inputs to database`,
        importedCount,
        totalCount: docs.length,
        data: docs
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 5. POST /api/verified-documents/seed-100 (Seed or Restore 100 Verified Records)
  if (pathname === '/api/verified-documents/seed-100' && req.method === 'POST') {
    const seeds100 = get100Seeds();
    saveDb(seeds100);
    return sendJson(res, 200, {
      success: true,
      message: `Database populated with ${seeds100.length} authoritative verified records`,
      count: seeds100.length,
      data: seeds100
    });
  }

  // 6. GET /api/verified-documents/export (Download all records as CSV or JSON)
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

  // 7. GET /api/verified-documents/template-csv (Download 100-Input Ready Template)
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

  // 8. POST /api/verified-documents/seed (Reset to baseline 12 seed records)
  if (pathname === '/api/verified-documents/seed' && req.method === 'POST') {
    saveDb(SEED_DATA);
    return sendJson(res, 200, { success: true, message: 'Database reset to 12 baseline seed records', count: SEED_DATA.length, data: SEED_DATA });
  }

  // 5. POST /api/verify (Cross-reference hash and extracted data against database)
  if (pathname === '/api/verify' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const docs = loadDb();

      const targetHash = (body.hash || '').toLowerCase().trim();
      const targetDocType = (body.docType || '').trim();
      const targetIdNum = (body.extractedId || '').replace(/[\s-]/g, '').toUpperCase().trim();

      // Look for match by exact hash or normalized extracted ID number
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

  // --------------------------------------------------------------------------
  // Proxy /v1/* and /health to Python Verification Service (port 8000)
  // --------------------------------------------------------------------------
  if (pathname.startsWith('/v1/') || pathname === '/health') {
    const proxyReq = http.request({
      hostname: '127.0.0.1',
      port: 8000,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: '127.0.0.1:8000' }
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', (err) => {
      sendJson(res, 502, { error: 'Python verification service unreachable on port 8000', detail: err.message });
    });
    req.pipe(proxyReq);
    return;
  }

  // --------------------------------------------------------------------------
  // Static File Serving
  // --------------------------------------------------------------------------


  let safePath = decodeURIComponent(pathname);
  if (safePath === '/') safePath = '/index.html';

  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500);
      }
      res.end();
    });
    stream.pipe(res);
  });
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`AuthBridge server listening on http://localhost:${PORT}/`);
    console.log(`Serving: ${PUBLIC_DIR}`);
    console.log(`Verified_Documents DB: ${DB_FILE}`);
  });
}

module.exports = server;
