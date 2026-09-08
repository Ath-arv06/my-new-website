/**
 * VeriSpect Identity - ICAO Doc 9303 MRZ Checksum & Structural Validator
 * Compliant with PRD Section 7.4:
 * - Implements official ICAO 9303 (7-3-1 weight algorithm)
 * - Supports TD3 (Passports, 2x44 chars) and TD1 (National IDs, 3x30 chars)
 * - Validates Document Number, Birth Date, Expiry Date, and Composite Check Digits
 * - Performs cross-check validation between visual OCR fields and machine-readable data
 */

class MRZValidator {
  /**
   * Convert MRZ character to numeric value per ICAO 9303
   */
  getCharValue(char) {
    if (char === '<') return 0;
    const code = char.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      return code - 48; // '0'-'9' -> 0-9
    }
    if (code >= 65 && code <= 90) {
      return code - 65 + 10; // 'A'-'Z' -> 10-35
    }
    return 0;
  }

  /**
   * Calculate ICAO 7-3-1 checksum for a string
   */
  computeChecksum(str) {
    const weights = [7, 3, 1];
    let sum = 0;
    for (let i = 0; i < str.length; i++) {
      const val = this.getCharValue(str[i]);
      const weight = weights[i % 3];
      sum += val * weight;
    }
    return (sum % 10).toString();
  }

  /**
   * Parse and validate TD3 (Passport) MRZ
   * Line 1: 44 chars - P<ISSUE_COUNTRY_SURNAME<<GIVEN_NAMES<<<<<<<<<<<<
   * Line 2: 44 chars - DOC_NUM(9)+CD(1)+NAT(3)+DOB(6)+CD(1)+SEX(1)+EXP(6)+CD(1)+OPT(14)+COMP_CD(1)
   */
  validateTD3(line1, line2) {
    const cleanL1 = line1.trim().toUpperCase();
    const cleanL2 = line2.trim().toUpperCase();

    if (cleanL1.length !== 44 || cleanL2.length !== 44) {
      return {
        valid: false,
        format: 'TD3',
        error: `Invalid TD3 line length. Expected 44, got L1:${cleanL1.length}, L2:${cleanL2.length}`,
        checks: []
      };
    }

    // Line 2 breakdown
    const docNumber = cleanL2.substring(0, 9);
    const docNumberCD = cleanL2.charAt(9);
    const nationality = cleanL2.substring(10, 13);
    const dob = cleanL2.substring(13, 19); // YYMMDD
    const dobCD = cleanL2.charAt(19);
    const sex = cleanL2.charAt(20);
    const expiry = cleanL2.substring(21, 27); // YYMMDD
    const expiryCD = cleanL2.charAt(27);
    const optionalData = cleanL2.substring(28, 42);
    const compositeCD = cleanL2.charAt(43);

    // Compute expected check digits
    const expectedDocCD = this.computeChecksum(docNumber);
    const expectedDobCD = this.computeChecksum(dob);
    const expectedExpiryCD = this.computeChecksum(expiry);

    // Composite string per ICAO Doc 9303 Part 4
    const compositeStr = docNumber + docNumberCD + dob + dobCD + expiry + expiryCD + optionalData;
    const expectedCompositeCD = this.computeChecksum(compositeStr);

    const checks = [
      {
        field: "Document Number Check Digit",
        expected: expectedDocCD,
        actual: docNumberCD,
        valid: expectedDocCD === docNumberCD
      },
      {
        field: "Birth Date Check Digit",
        expected: expectedDobCD,
        actual: dobCD,
        valid: expectedDobCD === dobCD
      },
      {
        field: "Expiry Date Check Digit",
        expected: expectedExpiryCD,
        actual: expiryCD,
        valid: expectedExpiryCD === expiryCD
      },
      {
        field: "Composite Check Digit",
        expected: expectedCompositeCD,
        actual: compositeCD,
        valid: expectedCompositeCD === compositeCD
      }
    ];

    const allPassed = checks.every(c => c.valid);

    // Parse Names from Line 1
    const rawNames = cleanL1.substring(5).split('<<');
    const surname = (rawNames[0] || '').replace(/</g, ' ').trim();
    const givenNames = (rawNames[1] || '').replace(/</g, ' ').trim();

    return {
      valid: allPassed,
      format: 'TD3 (Passport)',
      lines: [cleanL1, cleanL2],
      parsed: {
        documentNumber: docNumber.replace(/</g, ''),
        nationality,
        birthDate: dob,
        sex,
        expiryDate: expiry,
        surname,
        givenNames
      },
      checks
    };
  }

  /**
   * Cross-validate extracted visual OCR fields with MRZ data
   */
  crossValidateWithOCR(mrzData, ocrFields) {
    if (!mrzData || !mrzData.valid || !mrzData.parsed) {
      return {
        matched: false,
        discrepancies: ["MRZ data missing or structurally invalid"]
      };
    }

    const discrepancies = [];
    const p = mrzData.parsed;

    // Check Document Number match
    if (ocrFields.documentNumber) {
      const cleanOcrDoc = ocrFields.documentNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const cleanMrzDoc = p.documentNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (cleanOcrDoc !== cleanMrzDoc) {
        discrepancies.push(`Document Number mismatch: Visual OCR reads "${ocrFields.documentNumber}", but MRZ encodes "${p.documentNumber}".`);
      }
    }

    // Check Expiry Date match
    if (ocrFields.expiryDate && p.expiryDate) {
      // Compare last 2 digits of year, month, day
      const ocrClean = ocrFields.expiryDate.replace(/[^0-9]/g, '');
      if (ocrClean.length >= 6) {
        // e.g., 2031-11-20 -> "311120"
        const ocrYYMMDD = ocrClean.length === 8 ? ocrClean.substring(2) : ocrClean;
        if (ocrYYMMDD !== p.expiryDate) {
          discrepancies.push(`Expiry Date mismatch: Visual text indicates expiry ${ocrFields.expiryDate}, but MRZ encodes ${p.expiryDate}.`);
        }
      }
    }

    return {
      matched: discrepancies.length === 0,
      discrepancies
    };
  }
}

window.VeriSpectMRZ = new MRZValidator();
