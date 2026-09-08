/**
 * VeriSpect Identity - High-Fidelity Test Scenarios & Synthetic Documents
 * Realistic test cases covering genuine, tampered, poor-quality, and duplicate submissions
 */

// Helper to convert an SVG string into a data URL
function svgToDataUrl(svgString) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString.trim());
}

// 1. Synthetic Driver's License (Tampered Expiry Date & Cloned Seal)
const svgDriverLicenseTampered = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <linearGradient id="dlBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EFF6FF"/>
      <stop offset="50%" stop-color="#DBEAFE"/>
      <stop offset="100%" stop-color="#BFDBFE"/>
    </linearGradient>
    <pattern id="guilloche" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M0 20 Q 10 0, 20 20 T 40 20" fill="none" stroke="#93C5FD" stroke-width="0.75" opacity="0.6"/>
      <path d="M0 20 Q 10 40, 20 20 T 40 20" fill="none" stroke="#60A5FA" stroke-width="0.75" opacity="0.4"/>
    </pattern>
  </defs>

  <!-- Card Base -->
  <rect width="800" height="500" rx="24" fill="url(#dlBg)" stroke="#94A3B8" stroke-width="2"/>
  <rect width="800" height="500" rx="24" fill="url(#guilloche)"/>

  <!-- Card Header -->
  <rect x="0" y="0" width="800" height="85" rx="24" fill="#1E3A8A"/>
  <rect x="0" y="60" width="800" height="25" fill="#1E3A8A"/>
  <text x="35" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" fill="#FFFFFF" letter-spacing="1">STATE DRIVER LICENSE</text>
  <text x="680" y="50" font-family="monospace" font-size="18" font-weight="700" fill="#93C5FD">USA</text>

  <!-- Gold Star Real ID Emblem -->
  <circle cx="730" cy="130" r="22" fill="#F59E0B"/>
  <polygon points="730,113 735,124 747,125 738,133 741,145 730,138 719,145 722,133 713,125 725,124" fill="#FFFFFF"/>

  <!-- Portrait Photo Box -->
  <rect x="35" y="115" width="180" height="230" rx="10" fill="#CBD5E1" stroke="#475569" stroke-width="1.5"/>
  <!-- Synthetic Face Silhouette -->
  <circle cx="125" cy="180" r="45" fill="#64748B"/>
  <path d="M 65 310 Q 125 240 185 310" fill="#475569"/>
  <text x="125" y="335" font-family="sans-serif" font-size="11" font-weight="600" fill="#475569" text-anchor="middle">OFFICIAL PORTRAIT</text>

  <!-- Document Details -->
  <!-- License No -->
  <text x="240" y="125" font-family="sans-serif" font-size="11" font-weight="700" fill="#64748B">DL NUMBER</text>
  <text x="240" y="150" font-family="monospace" font-size="22" font-weight="800" fill="#0F172A">D-8492-9102-09</text>

  <!-- Names -->
  <text x="240" y="185" font-family="sans-serif" font-size="11" font-weight="700" fill="#64748B">NAME (SURNAME, GIVEN)</text>
  <text x="240" y="210" font-family="sans-serif" font-size="20" font-weight="700" fill="#0F172A">MILLER, DAVID ANTHONY</text>

  <!-- DOB & Issue -->
  <text x="240" y="248" font-family="sans-serif" font-size="11" font-weight="700" fill="#64748B">DOB: <tspan fill="#0F172A" font-weight="700">1988-04-14</tspan></text>
  <text x="440" y="248" font-family="sans-serif" font-size="11" font-weight="700" fill="#64748B">ISSUED: <tspan fill="#0F172A" font-weight="700">2018-04-14</tspan></text>

  <!-- Tampered Expiration Date Area (Altered from 2024 to 2029 with visible artifact) -->
  <text x="240" y="295" font-family="sans-serif" font-size="12" font-weight="800" fill="#DC2626">EXPIRATION DATE</text>
  <!-- Forensic anomaly patch behind date -->
  <rect x="238" y="302" width="170" height="34" fill="#E2E8F0" opacity="0.9" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="3,3"/>
  <text x="248" y="327" font-family="'Courier New', monospace" font-size="24" font-weight="900" fill="#1E293B" letter-spacing="2">2029-04-14</text>

  <!-- Address -->
  <text x="240" y="375" font-family="sans-serif" font-size="11" font-weight="700" fill="#64748B">ADDRESS</text>
  <text x="240" y="395" font-family="sans-serif" font-size="13" font-weight="600" fill="#334155">742 EVERGREEN TERRACE, SPRINGFIELD, IL 62704</text>

  <!-- PDF417 Barcode Strip at Bottom -->
  <rect x="35" y="425" width="730" height="48" fill="#1E293B" rx="4"/>
  <!-- Simulated barcode strips -->
  <g fill="#FFFFFF" opacity="0.85">
    <rect x="45" y="430" width="3" height="38"/>
    <rect x="52" y="430" width="8" height="38"/>
    <rect x="64" y="430" width="4" height="38"/>
    <rect x="72" y="430" width="6" height="38"/>
    <rect x="84" y="430" width="2" height="38"/>
    <rect x="92" y="430" width="10" height="38"/>
    <rect x="110" y="430" width="5" height="38"/>
    <rect x="120" y="430" width="14" height="38"/>
    <rect x="145" y="430" width="3" height="38"/>
    <rect x="160" y="430" width="12" height="38"/>
    <rect x="180" y="430" width="6" height="38"/>
    <rect x="195" y="430" width="9" height="38"/>
    <rect x="220" y="430" width="4" height="38"/>
    <rect x="240" y="430" width="16" height="38"/>
    <rect x="270" y="430" width="5" height="38"/>
    <rect x="300" y="430" width="8" height="38"/>
    <rect x="330" y="430" width="12" height="38"/>
    <rect x="360" y="430" width="4" height="38"/>
    <rect x="380" y="430" width="18" height="38"/>
    <rect x="410" y="430" width="6" height="38"/>
    <rect x="440" y="430" width="10" height="38"/>
    <rect x="470" y="430" width="15" height="38"/>
    <rect x="505" y="430" width="5" height="38"/>
    <rect x="530" y="430" width="20" height="38"/>
    <rect x="570" y="430" width="8" height="38"/>
    <rect x="600" y="430" width="12" height="38"/>
    <rect x="630" y="430" width="6" height="38"/>
    <rect x="660" y="430" width="14" height="38"/>
    <rect x="700" y="430" width="8" height="38"/>
    <rect x="730" y="430" width="20" height="38"/>
  </g>
</svg>
`;

// 2. Synthetic Genuine International Passport (ICAO 9303 Compliant TD3)
const svgPassportGenuine = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="800" height="520">
  <defs>
    <radialGradient id="passBg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#FFFBEB"/>
      <stop offset="60%" stop-color="#FEF3C7"/>
      <stop offset="100%" stop-color="#FDE68A"/>
    </radialGradient>
    <pattern id="passWatermark" width="60" height="60" patternUnits="userSpaceOnUse">
      <circle cx="30" cy="30" r="20" fill="none" stroke="#F59E0B" stroke-width="0.5" opacity="0.3"/>
      <path d="M 10 30 L 50 30 M 30 10 L 30 50" stroke="#F59E0B" stroke-width="0.4" opacity="0.3"/>
    </pattern>
  </defs>

  <rect width="800" height="520" rx="16" fill="url(#passBg)" stroke="#D97706" stroke-width="1.5"/>
  <rect width="800" height="520" rx="16" fill="url(#passWatermark)"/>

  <!-- Passport Header -->
  <text x="40" y="48" font-family="'Times New Roman', serif" font-size="22" font-weight="700" fill="#78350F" letter-spacing="3">PASSPORT / PASSEPORT</text>
  <text x="680" y="48" font-family="sans-serif" font-size="16" font-weight="800" fill="#B45309">UTOPIA</text>
  <line x1="40" y1="62" x2="760" y2="62" stroke="#B45309" stroke-width="1.5"/>

  <!-- Portrait Photo -->
  <rect x="40" y="85" width="170" height="225" rx="6" fill="#FDE68A" stroke="#92400E" stroke-width="1.5"/>
  <circle cx="125" cy="155" r="42" fill="#78350F"/>
  <path d="M 68 280 Q 125 210 182 280" fill="#92400E"/>
  <!-- Subtle Holographic Ghost Image Overlay -->
  <circle cx="270" cy="270" r="30" fill="none" stroke="#F59E0B" stroke-width="1" stroke-dasharray="2,2" opacity="0.8"/>
  <circle cx="270" cy="262" r="12" fill="#F59E0B" opacity="0.25"/>

  <!-- Data Grid -->
  <text x="240" y="98" font-family="sans-serif" font-size="10" font-weight="600" fill="#78350F">TYPE / CODE / PASSPORT NO.</text>
  <text x="240" y="118" font-family="monospace" font-size="16" font-weight="800" fill="#0F172A">P  UTO  L898902C3</text>

  <text x="240" y="148" font-family="sans-serif" font-size="10" font-weight="600" fill="#78350F">SURNAME / NOM</text>
  <text x="240" y="168" font-family="sans-serif" font-size="16" font-weight="800" fill="#0F172A">ERIKSSON</text>

  <text x="240" y="198" font-family="sans-serif" font-size="10" font-weight="600" fill="#78350F">GIVEN NAMES / PRENOMS</text>
  <text x="240" y="218" font-family="sans-serif" font-size="15" font-weight="700" fill="#0F172A">ANNA MARIA</text>

  <text x="240" y="248" font-family="sans-serif" font-size="10" font-weight="600" fill="#78350F">NATIONALITY</text>
  <text x="240" y="268" font-family="sans-serif" font-size="14" font-weight="700" fill="#0F172A">UTOPIAN</text>

  <text x="440" y="248" font-family="sans-serif" font-size="10" font-weight="600" fill="#78350F">DATE OF BIRTH</text>
  <text x="440" y="268" font-family="monospace" font-size="14" font-weight="700" fill="#0F172A">12 AUG 1974</text>

  <text x="610" y="248" font-family="sans-serif" font-size="10" font-weight="600" fill="#78350F">SEX</text>
  <text x="610" y="268" font-family="monospace" font-size="14" font-weight="700" fill="#0F172A">F</text>

  <text x="240" y="298" font-family="sans-serif" font-size="10" font-weight="600" fill="#78350F">DATE OF ISSUE</text>
  <text x="240" y="318" font-family="monospace" font-size="14" font-weight="700" fill="#0F172A">15 APR 2022</text>

  <text x="440" y="298" font-family="sans-serif" font-size="10" font-weight="600" fill="#78350F">DATE OF EXPIRY</text>
  <text x="440" y="318" font-family="monospace" font-size="14" font-weight="700" fill="#0F172A">15 APR 2032</text>

  <!-- Machine Readable Zone (MRZ TD3) -->
  <rect x="25" y="375" width="750" height="115" rx="8" fill="#0F172A" stroke="#334155" stroke-width="1.5"/>
  <text x="45" y="420" font-family="'OCR-B', 'Courier New', monospace" font-size="18.5" font-weight="700" fill="#F8FAFC" letter-spacing="4.5">P&lt;UTOERIKSSON&lt;&lt;ANNA&lt;MARIA&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
  <text x="45" y="465" font-family="'OCR-B', 'Courier New', monospace" font-size="18.5" font-weight="700" fill="#F8FAFC" letter-spacing="4.5">L898902C36UTO7408122F1204159ZE184226B&lt;&lt;&lt;&lt;&lt;10</text>
</svg>
`;

// 3. Sub-Standard Quality Capture (Severe Specular Glare & Optical Blur)
const svgIdCardGlare = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <filter id="blurFilter">
      <feGaussianBlur stdDeviation="3.5" />
    </filter>
    <!-- Severe Specular Flash Glare Hotspot -->
    <radialGradient id="glareHotspot" cx="65%" cy="35%" r="35%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.98"/>
      <stop offset="35%" stop-color="#FFFFFF" stop-opacity="0.85"/>
      <stop offset="70%" stop-color="#FFFFFF" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Blurred Background Card -->
  <g filter="url(#blurFilter)">
    <rect width="800" height="500" rx="20" fill="#E2E8F0" stroke="#94A3B8" stroke-width="2"/>
    <rect x="0" y="0" width="800" height="80" rx="20" fill="#047857"/>
    <text x="40" y="52" font-family="sans-serif" font-size="24" font-weight="700" fill="#FFFFFF">NATIONAL IDENTITY CARD</text>
    
    <!-- Photo Area -->
    <rect x="40" y="110" width="180" height="230" fill="#CBD5E1" rx="8"/>
    <circle cx="130" cy="180" r="45" fill="#64748B"/>
    <path d="M 70 310 Q 130 240 190 310" fill="#475569"/>

    <!-- Text Fields (Washed out) -->
    <text x="250" y="140" font-family="sans-serif" font-size="12" fill="#64748B">CARD IDENTIFICATION NO.</text>
    <text x="250" y="170" font-family="monospace" font-size="22" font-weight="700" fill="#0F172A">ID-99201-8492X</text>

    <text x="250" y="215" font-family="sans-serif" font-size="12" fill="#64748B">LEGAL NAME</text>
    <text x="250" y="245" font-family="sans-serif" font-size="20" font-weight="700" fill="#0F172A">VANCE, MARCUS ELLIOT</text>
  </g>

  <!-- Flash Overexposure Glare covering Document ID and Expiry -->
  <ellipse cx="480" cy="180" rx="220" ry="140" fill="url(#glareHotspot)"/>
  <ellipse cx="480" cy="180" rx="90" ry="60" fill="#FFFFFF" opacity="0.95"/>
</svg>
`;

// Helper for portrait selfies
const selfieAnnaMaria = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="200" height="240">
  <rect width="200" height="240" fill="#F1F5F9"/>
  <!-- Neutral Lighting Selfie Headshot -->
  <circle cx="100" cy="95" r="50" fill="#D97706" opacity="0.8"/>
  <path d="M 35 220 Q 100 155 165 220" fill="#1E3A8A"/>
  <circle cx="85" cy="90" r="6" fill="#0F172A"/>
  <circle cx="115" cy="90" r="6" fill="#0F172A"/>
  <path d="M 90 120 Q 100 128 110 120" stroke="#0F172A" stroke-width="2.5" fill="none"/>
  <rect x="0" y="215" width="200" height="25" fill="#0F172A" opacity="0.75"/>
  <text x="100" y="232" font-family="sans-serif" font-size="10" font-weight="600" fill="#FFFFFF" text-anchor="middle">LIVE VERIFIED SELFIE</text>
</svg>
`);

const selfieDavidMiller = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="200" height="240">
  <rect width="200" height="240" fill="#F8FAFC"/>
  <!-- Slight mismatch angle selfie -->
  <circle cx="100" cy="95" r="48" fill="#94A3B8"/>
  <path d="M 40 220 Q 100 160 160 220" fill="#475569"/>
  <circle cx="84" cy="92" r="5" fill="#1E293B"/>
  <circle cx="116" cy="92" r="5" fill="#1E293B"/>
  <path d="M 92 118 Q 100 122 108 118" stroke="#1E293B" stroke-width="2" fill="none"/>
  <rect x="0" y="215" width="200" height="25" fill="#0F172A" opacity="0.75"/>
  <text x="100" y="232" font-family="sans-serif" font-size="10" font-weight="600" fill="#FFFFFF" text-anchor="middle">APPLICANT SUBMISSION</text>
</svg>
`);

// Pre-configured Test Cases
window.MOCK_CASES = [
  {
    id: "CASE-2026-9041",
    applicantName: "David Anthony Miller",
    docType: "State Driver's License",
    country: "USA",
    submittedAt: "2026-09-04T10:14:30Z",
    status: "PENDING_REVIEW",
    reviewer: "Unassigned",
    docFingerprint: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    imageSrc: svgToDataUrl(svgDriverLicenseTampered),
    selfieSrc: selfieDavidMiller,
    
    // Forensics & Tamper
    tamperAnalysis: {
      digitalEditingDetected: true,
      alteredField: "Expiration Date (2029-04-14)",
      fontInconsistency: true,
      screenRecaptureDetected: false
    },
    tamperedRegions: [
      { x: 235, y: 300, w: 180, h: 38, label: "MODIFIED EXPIRY DATE" }
    ],

    // Quality Gate
    qualityOverride: {
      blurScore: 92,
      glareScore: 88,
      skewDeg: 0.3
    },

    // Extracted Fields
    extractedFields: [
      { name: "Document Number", value: "D-8492-9102-09", normalized: "D8492910209", confidence: 98, status: "PASS" },
      { name: "Full Name", value: "MILLER, DAVID ANTHONY", normalized: "DAVID ANTHONY MILLER", confidence: 96, status: "PASS" },
      { name: "Date of Birth", value: "1988-04-14", normalized: "1988-04-14", confidence: 94, status: "PASS" },
      { name: "Issue Date", value: "2018-04-14", normalized: "2018-04-14", confidence: 92, status: "PASS" },
      { name: "Expiry Date", value: "2029-04-14", normalized: "2029-04-14", confidence: 64, status: "FAIL", note: "Font disparity & ELA anomaly" },
      { name: "Residential Address", value: "742 EVERGREEN TERRACE, SPRINGFIELD, IL", normalized: "742 EVERGREEN TER, SPRINGFIELD IL", confidence: 95, status: "PASS" }
    ],

    fieldBoundingBoxes: [
      { x: 235, y: 130, w: 220, h: 28, label: "DL NO", confidence: 98 },
      { x: 235, y: 190, w: 320, h: 28, label: "NAME", confidence: 96 },
      { x: 235, y: 300, w: 180, h: 36, label: "EXPIRY", confidence: 64 }
    ],

    // Structural & MRZ Check
    mrzValidation: null, // Driver's license uses barcode

    // Biometrics
    biometrics: {
      similarity: 82.5,
      confidenceInterval: "± 2.1%",
      liveness: {
        passed: true,
        textureCheck: "Pass",
        reflectionCheck: "Pass"
      }
    },

    // Duplicate Check
    duplicateAlert: {
      hasDuplicate: false,
      priorOccurrences: []
    }
  },

  {
    id: "CASE-2026-9042",
    applicantName: "Anna Maria Eriksson",
    docType: "International Passport",
    country: "UTO (Utopia)",
    submittedAt: "2026-09-04T12:30:10Z",
    status: "AUTO_CLEARED",
    reviewer: "Automated Policy Engine",
    docFingerprint: "4a28f729b10c59e8432a10f8234e7912bc04918e7623a9d1045b82194680eaf5",
    imageSrc: svgToDataUrl(svgPassportGenuine),
    selfieSrc: selfieAnnaMaria,

    // Forensics & Tamper
    tamperAnalysis: {
      digitalEditingDetected: false,
      fontInconsistency: false,
      screenRecaptureDetected: false
    },
    tamperedRegions: [],

    // Quality Gate
    qualityOverride: {
      blurScore: 98,
      glareScore: 95,
      skewDeg: 0.1
    },

    // Extracted Fields
    extractedFields: [
      { name: "Document Number", value: "L898902C3", normalized: "L898902C3", confidence: 99, status: "PASS" },
      { name: "Surname", value: "ERIKSSON", normalized: "ERIKSSON", confidence: 99, status: "PASS" },
      { name: "Given Names", value: "ANNA MARIA", normalized: "ANNA MARIA", confidence: 98, status: "PASS" },
      { name: "Nationality", value: "UTOPIAN", normalized: "UTO", confidence: 98, status: "PASS" },
      { name: "Date of Birth", value: "1974-08-12", normalized: "1974-08-12", confidence: 97, status: "PASS" },
      { name: "Date of Expiry", value: "2032-04-15", normalized: "2032-04-15", confidence: 98, status: "PASS" },
      { name: "Sex", value: "F", normalized: "F", confidence: 99, status: "PASS" }
    ],

    fieldBoundingBoxes: [
      { x: 235, y: 100, w: 200, h: 25, label: "PASSPORT NO", confidence: 99 },
      { x: 235, y: 150, w: 180, h: 25, label: "SURNAME", confidence: 99 },
      { x: 235, y: 200, w: 220, h: 25, label: "GIVEN NAMES", confidence: 98 },
      { x: 25, y: 375, w: 750, h: 115, label: "MRZ TD3", confidence: 99 }
    ],

    // MRZ Validation (Standard ICAO TD3)
    rawMrz: [
      "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<",
      "L898902C36UTO7408122F1204159ZE184226B<<<<<10"
    ],
    mrzValidation: {
      valid: true,
      format: "TD3 (Passport)",
      checks: [
        { field: "Document Number Check Digit ('6')", expected: "6", actual: "6", valid: true },
        { field: "Birth Date Check Digit ('2')", expected: "2", actual: "2", valid: true },
        { field: "Expiry Date Check Digit ('9')", expected: "9", actual: "9", valid: true },
        { field: "Composite Check Digit ('0')", expected: "0", actual: "0", valid: true }
      ]
    },
    mrzCrossCheck: {
      matched: true,
      discrepancies: []
    },

    // Biometrics
    biometrics: {
      similarity: 96.4,
      confidenceInterval: "± 0.8%",
      liveness: {
        passed: true,
        textureCheck: "Pass (3D Natural Depth)",
        reflectionCheck: "Pass (No screen reflections)"
      }
    },

    // Duplicate Check
    duplicateAlert: {
      hasDuplicate: false,
      priorOccurrences: []
    }
  },

  {
    id: "CASE-2026-9043",
    applicantName: "Marcus Elliot Vance",
    docType: "National Identity Card",
    country: "USA",
    submittedAt: "2026-09-04T13:45:00Z",
    status: "RESUBMISSION_REQUESTED",
    reviewer: "Sarah Jenkins (L2 Reviewer)",
    docFingerprint: "1198f420b92e7c1048a946b201a9df8326194ca810bd65ef210874a329c01827",
    imageSrc: svgToDataUrl(svgIdCardGlare),
    selfieSrc: selfieDavidMiller,

    tamperAnalysis: {
      digitalEditingDetected: false,
      fontInconsistency: false,
      screenRecaptureDetected: false
    },
    tamperedRegions: [],

    qualityOverride: {
      blurScore: 42,
      glareScore: 36,
      skewDeg: 2.1
    },

    extractedFields: [
      { name: "Document Number", value: "ID-99201-8492X", normalized: "ID992018492X", confidence: 48, status: "WARN", note: "Obscured by specular glare" },
      { name: "Full Name", value: "VANCE, MARCUS ELLIOT", normalized: "MARCUS ELLIOT VANCE", confidence: 84, status: "PASS" },
      { name: "Expiry Date", value: "[UNREADABLE]", normalized: null, confidence: 22, status: "FAIL", note: "Excessive glare hotspot" }
    ],

    fieldBoundingBoxes: [
      { x: 245, y: 150, w: 220, h: 32, label: "ID NO (GLARE)", confidence: 48 }
    ],

    mrzValidation: null,

    biometrics: {
      similarity: 79.0,
      confidenceInterval: "± 3.8%",
      liveness: {
        passed: true,
        textureCheck: "Pass",
        reflectionCheck: "Warning: High Ambient Light"
      }
    },

    duplicateAlert: {
      hasDuplicate: false,
      priorOccurrences: []
    }
  },

  {
    id: "CASE-2026-9044",
    applicantName: "Alex K. Cruz",
    docType: "National Identity Card",
    country: "USA",
    submittedAt: "2026-09-04T14:10:00Z",
    status: "PENDING_REVIEW",
    reviewer: "Unassigned",
    // Fingerprint matches the historical record seeded in crypto-ledger.js!
    docFingerprint: "8f4b23c91e7a5d6290b38c20146f8812e35a9d0738e4a910bc4ef71295bca203",
    imageSrc: svgToDataUrl(svgDriverLicenseTampered),
    selfieSrc: selfieDavidMiller,

    tamperAnalysis: {
      digitalEditingDetected: true,
      alteredField: "Holder Name Header",
      fontInconsistency: true,
      screenRecaptureDetected: false
    },
    tamperedRegions: [
      { x: 235, y: 185, w: 340, h: 35, label: "ALTERED APPLICANT NAME" }
    ],

    qualityOverride: {
      blurScore: 89,
      glareScore: 91,
      skewDeg: 0.4
    },

    extractedFields: [
      { name: "Document Number", value: "D-8492-9102-09", normalized: "D8492910209", confidence: 97, status: "PASS" },
      { name: "Name", value: "CRUZ, ALEX K.", normalized: "ALEX K CRUZ", confidence: 81, status: "WARN", note: "Fingerprint linked to earlier applicant 'David Miller'" }
    ],

    fieldBoundingBoxes: [
      { x: 235, y: 185, w: 340, h: 35, label: "NAME (RE-SUBMISSION)", confidence: 81 }
    ],

    mrzValidation: null,

    biometrics: {
      similarity: 71.0,
      confidenceInterval: "± 2.9%",
      liveness: {
        passed: true,
        textureCheck: "Pass",
        reflectionCheck: "Pass"
      }
    },

    duplicateAlert: {
      hasDuplicate: true,
      priorOccurrences: [
        {
          caseId: "CASE-2026-8801",
          submittedAt: "2026-09-02T11:15:20Z",
          tenant: "FinCorp Global",
          decision: "REJECTED_SUSPICIOUS"
        }
      ]
    }
  }
];
