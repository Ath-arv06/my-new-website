/**
 * VeriSpect Identity - Tamper-Evident Ledger Module
 * Compliant with PRD Section 7.9:
 * - Computes cryptographic document fingerprints & record hashes via Web Crypto API SHA-256
 * - Anchors verification results to a permissioned blockchain ledger simulation
 * - Stores ZERO direct PII on-ledger (only cryptographic fingerprints & risk metadata)
 * - Enables live recomputation & proof verification of record integrity
 * - Tracks duplicate / repeat submissions
 */

class CryptographicLedger {
  constructor() {
    this.chain = [];
    this.pendingTransactions = [];
    this.fingerprintIndex = new Map(); // docFingerprint -> [caseIds]
    this.initLedger();
  }

  /**
   * Compute a secure SHA-256 hex string using browser Web Crypto API
   */
  async computeSHA256(dataString) {
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Compute stable document fingerprint from image byte sample or synthetic canonical representation
   */
  async computeDocumentFingerprint(imageSignature) {
    return await this.computeSHA256(`DOC-FP:${imageSignature}`);
  }

  /**
   * Compute tamper-evident record hash from canonical non-PII verification metadata
   */
  async computeRecordHash(caseData) {
    // Zero PII on ledger - only cryptographic hashes of attributes, score, and software versions
    const canonicalPayload = JSON.stringify({
      caseId: caseData.id,
      docType: caseData.docType,
      fingerprint: caseData.docFingerprint,
      riskScore: caseData.riskScore,
      riskBand: caseData.riskBand,
      mrzChecksumValid: caseData.mrzValidation ? caseData.mrzValidation.valid : null,
      faceMatchSimilarity: caseData.biometrics ? caseData.biometrics.similarity : null,
      timestamp: caseData.submittedAt,
      engineVersion: "v2.4.1-enterprise"
    });
    return await this.computeSHA256(canonicalPayload);
  }

  /**
   * Initialize ledger with enterprise Genesis block and realistic pre-existing transactions
   */
  async initLedger() {
    // Genesis Block
    const genesisBlock = {
      index: 0,
      timestamp: "2026-09-01T08:00:00.000Z",
      previousHash: "0000000000000000000000000000000000000000000000000000000000000000",
      hash: "0000a4b9c8d7e6f5123456789abcdef0123456789abcdef0123456789abcdef0",
      transactions: [
        {
          txId: "tx_genesis_root_001",
          type: "SYSTEM_INITIALIZE",
          operator: "Aegis Ledger Authority",
          tenant: "FinCorp Global Production"
        }
      ]
    };
    this.chain.push(genesisBlock);

    // Block #1: Historical entry with duplicate test fingerprint
    const historicalDocFp = "8f4b23c91e7a5d6290b38c20146f8812e35a9d0738e4a910bc4ef71295bca203";
    this.fingerprintIndex.set(historicalDocFp, [
      {
        caseId: "CASE-2026-8801",
        submittedAt: "2026-09-02T11:15:20Z",
        tenant: "FinCorp Global",
        decision: "REJECTED_SUSPICIOUS"
      }
    ]);

    const block1 = {
      index: 1,
      timestamp: "2026-09-02T11:16:00.000Z",
      previousHash: genesisBlock.hash,
      hash: "82a9f1c305b98f2194c798e102bc4501a9df8326194ca810bd65ef210874a329",
      transactions: [
        {
          txId: "tx_anchor_2026_8801",
          caseId: "CASE-2026-8801",
          docFingerprint: historicalDocFp,
          recordHash: "c0182749adfe98103746a810f92b7c430291a84f3e72bc194680ef12948ca210",
          riskScore: 78,
          riskBand: "HIGH_RISK",
          status: "COMMITTED"
        }
      ]
    };
    this.chain.push(block1);
  }

  /**
   * Commit a newly analyzed case to the tamper-evident ledger
   */
  async anchorCase(caseData) {
    const recordHash = await this.computeRecordHash(caseData);
    const txId = `tx_anchor_${caseData.id.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
    
    const tx = {
      txId,
      caseId: caseData.id,
      docFingerprint: caseData.docFingerprint,
      recordHash,
      riskScore: caseData.riskScore,
      riskBand: caseData.riskBand,
      status: "COMMITTED",
      timestamp: new Date().toISOString()
    };

    const previousBlock = this.chain[this.chain.length - 1];
    const newBlockIndex = this.chain.length;
    const blockPayload = `${newBlockIndex}:${previousBlock.hash}:${JSON.stringify([tx])}:${tx.timestamp}`;
    const blockHash = await this.computeSHA256(blockPayload);

    const newBlock = {
      index: newBlockIndex,
      timestamp: tx.timestamp,
      previousHash: previousBlock.hash,
      hash: blockHash,
      transactions: [tx]
    };

    this.chain.push(newBlock);

    // Update fingerprint index
    if (!this.fingerprintIndex.has(caseData.docFingerprint)) {
      this.fingerprintIndex.set(caseData.docFingerprint, []);
    }
    this.fingerprintIndex.get(caseData.docFingerprint).push({
      caseId: caseData.id,
      submittedAt: tx.timestamp,
      decision: caseData.status || "PENDING"
    });

    return {
      blockHeight: newBlockIndex,
      blockHash,
      txId,
      recordHash
    };
  }

  /**
   * Check if the document has been seen previously in the system
   */
  checkPriorSubmissions(docFingerprint, currentCaseId) {
    if (!this.fingerprintIndex.has(docFingerprint)) {
      return { hasDuplicate: false, priorOccurrences: [] };
    }
    const matches = this.fingerprintIndex.get(docFingerprint).filter(item => item.caseId !== currentCaseId);
    return {
      hasDuplicate: matches.length > 0,
      priorOccurrences: matches
    };
  }

  /**
   * Cryptographically verify the integrity of a stored case against the ledger
   */
  async verifyIntegrity(caseData) {
    const computedRecordHash = await this.computeRecordHash(caseData);
    
    // Find transaction in the chain
    let matchingTx = null;
    let containingBlock = null;

    for (const block of this.chain) {
      const found = block.transactions.find(t => t.caseId === caseData.id);
      if (found) {
        matchingTx = found;
        containingBlock = block;
        break;
      }
    }

    if (!matchingTx) {
      return {
        verified: false,
        reason: "No anchor transaction found on ledger for this case ID."
      };
    }

    const hashesMatch = (computedRecordHash === matchingTx.recordHash);
    return {
      verified: hashesMatch,
      computedRecordHash,
      ledgerRecordHash: matchingTx.recordHash,
      txId: matchingTx.txId,
      blockHeight: containingBlock.index,
      blockHash: containingBlock.hash,
      timestamp: matchingTx.timestamp,
      tamperDetected: !hashesMatch
    };
  }
}

// Instantiate global instance
window.VeriSpectLedger = new CryptographicLedger();
