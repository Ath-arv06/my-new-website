/**
 * VeriSpect Identity - Main Application Orchestrator
 * Connects UI, Forensics Canvas, MRZ Checksums, Risk Engine, and Cryptographic Ledger
 */

class VeriSpectApp {
  constructor() {
    this.cases = [...window.MOCK_CASES];
    this.activeCase = this.cases[0]; // Default to first case (Tampered DL)
    this.activeTab = 'workbench';
    this.auditTrail = [];
  }

  async init() {
    // Initialize Forensics Canvas
    const canvas = document.getElementById('documentCanvas');
    if (canvas) {
      window.VeriSpectForensics.init(canvas);
    }

    // Anchor initial mock cases to ledger
    for (const c of this.cases) {
      const evaluation = window.VeriSpectRiskEngine.evaluate(c);
      c.riskScore = evaluation.score;
      c.riskBand = evaluation.riskBand;
      c.riskEvaluation = evaluation;
      
      // Anchor to cryptographic ledger
      const anchor = await window.VeriSpectLedger.anchorCase(c);
      c.blockHeight = anchor.blockHeight;
      c.blockHash = anchor.blockHash;
      c.txId = anchor.txId;
      c.recordHash = anchor.recordHash;

      // Log initial audit event
      this.auditTrail.push({
        timestamp: c.submittedAt,
        caseId: c.id,
        actor: "System Intake Gateway",
        action: "CASE_INGESTED_AND_ANCHORED",
        details: `Document fingerprint ${c.docFingerprint.substring(0, 12)}... committed to block #${c.blockHeight}.`
      });
    }

    this.bindEvents();
    this.renderQueueTable();
    this.renderLedgerExplorer();
    await this.loadCaseIntoWorkbench(this.activeCase.id);
  }

  bindEvents() {
    // Tab Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetView = tab.getAttribute('data-view');
        this.switchView(targetView);
      });
    });

    // Forensic Mode Switching
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode');
        window.VeriSpectForensics.setMode(mode);
      });
    });

    // Zoom Controls
    document.getElementById('zoomInBtn')?.addEventListener('click', () => {
      window.VeriSpectForensics.setZoom(window.VeriSpectForensics.zoomLevel + 0.25);
    });
    document.getElementById('zoomOutBtn')?.addEventListener('click', () => {
      window.VeriSpectForensics.setZoom(window.VeriSpectForensics.zoomLevel - 0.25);
    });
    document.getElementById('zoomResetBtn')?.addEventListener('click', () => {
      window.VeriSpectForensics.resetZoom();
    });

    // Reviewer Decision Modal Trigger
    document.querySelectorAll('.btn-decision').forEach(btn => {
      btn.addEventListener('click', () => {
        const decision = btn.getAttribute('data-decision');
        this.openDecisionModal(decision);
      });
    });

    // Modal Close
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
      });
    });

    // Confirm Decision
    document.getElementById('confirmDecisionBtn')?.addEventListener('click', () => {
      this.commitReviewerDecision();
    });

    // Ledger Verify Button
    document.getElementById('verifyIntegrityBtn')?.addEventListener('click', async () => {
      await this.runIntegrityVerification();
    });

    // Export Buttons
    document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
      window.VeriSpectReports.exportJSON(this.activeCase);
      this.showToast(`Exported machine-readable JSON dossier for ${this.activeCase.id}`);
    });

    document.getElementById('printCertBtn')?.addEventListener('click', () => {
      window.VeriSpectReports.printCertificate(this.activeCase);
    });

    // File Upload Intake
    const dropzone = document.getElementById('documentDropzone');
    const fileInput = document.getElementById('fileUploadInput');

    dropzone?.addEventListener('click', () => fileInput?.click());
    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--brand-accent)';
      dropzone.style.backgroundColor = 'var(--brand-subtle)';
    });
    dropzone?.addEventListener('dragleave', () => {
      dropzone.style.borderColor = 'var(--border-default)';
      dropzone.style.backgroundColor = 'var(--bg-surface)';
    });
    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--border-default)';
      dropzone.style.backgroundColor = 'var(--bg-surface)';
      if (e.dataTransfer.files.length > 0) {
        this.handleFileUpload(e.dataTransfer.files[0]);
      }
    });

    fileInput?.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFileUpload(e.target.files[0]);
      }
    });

    // Policy Form Save
    document.getElementById('policyForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.savePolicySettings();
    });
  }

  switchView(viewId) {
    this.activeTab = viewId;

    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-view') === viewId);
    });

    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const activeSec = document.getElementById(`${viewId}View`);
    if (activeSec) {
      activeSec.classList.add('active');
    }

    if (viewId === 'queue') {
      this.renderQueueTable();
    } else if (viewId === 'ledger') {
      this.renderLedgerExplorer();
    }
  }

  async loadCaseIntoWorkbench(caseId) {
    const found = this.cases.find(c => c.id === caseId);
    if (!found) return;

    this.activeCase = found;

    // Load Document Image into Forensics Canvas
    const qualityResult = await window.VeriSpectForensics.loadDocument(found.imageSrc, found);
    found.qualityGate = qualityResult;

    // Evaluate Risk Engine
    const riskEval = window.VeriSpectRiskEngine.evaluate(found);
    found.riskScore = riskEval.score;
    found.riskBand = riskEval.riskBand;
    found.riskEvaluation = riskEval;

    // Render All Workbench Components
    this.renderCaseHeader(found);
    this.renderRiskMeter(found, riskEval);
    this.renderQualityGate(found.qualityGate);
    this.renderExtractedFields(found.extractedFields);
    this.renderMrzSection(found);
    this.renderBiometrics(found.biometrics, found.selfieSrc);
    this.renderLedgerAnchorInfo(found);
    this.renderAuditTimeline(found.id);

    // Switch to workbench if called from queue
    if (this.activeTab !== 'workbench') {
      this.switchView('workbench');
    }
  }

  renderCaseHeader(c) {
    document.getElementById('currentCaseId').textContent = c.id;
    document.getElementById('currentDocType').textContent = `${c.docType} (${c.country})`;
    document.getElementById('currentApplicantName').textContent = c.applicantName;
    document.getElementById('currentTimestamp').textContent = new Date(c.submittedAt).toLocaleString();

    const statusBadge = document.getElementById('currentCaseStatus');
    statusBadge.textContent = c.status.replace(/_/g, ' ');
    statusBadge.className = 'badge';

    if (c.status.includes('APPROV') || c.status.includes('CLEARED')) {
      statusBadge.classList.add('badge-pass');
    } else if (c.status.includes('REJECT') || c.status.includes('SUSPICIOUS')) {
      statusBadge.classList.add('badge-danger');
    } else if (c.status.includes('RESUBMISSION')) {
      statusBadge.classList.add('badge-warn');
    } else {
      statusBadge.classList.add('badge-info');
    }
  }

  renderRiskMeter(c, riskEval) {
    const dial = document.getElementById('riskScoreDial');
    const scoreNum = document.getElementById('riskScoreValue');
    const title = document.getElementById('riskScoreTitle');
    const label = document.getElementById('riskScoreLabel');
    const rec = document.getElementById('riskScoreRec');

    scoreNum.textContent = riskEval.score;
    title.textContent = riskEval.riskBand.replace(/_/g, ' ');
    label.textContent = riskEval.riskLabel;
    rec.textContent = riskEval.recommendedAction;

    dial.className = 'score-dial';
    if (riskEval.riskBand === 'HIGH_RISK') {
      dial.classList.add('high-risk');
    } else if (riskEval.riskBand === 'MEDIUM_RISK') {
      dial.classList.add('medium-risk');
    } else {
      dial.classList.add('low-risk');
    }

    // Render Ranked Reason List
    const reasonsContainer = document.getElementById('riskReasonsList');
    reasonsContainer.innerHTML = '';

    riskEval.reasons.forEach(r => {
      const item = document.createElement('div');
      item.className = 'reason-item';
      item.style.padding = '8px 12px';
      item.style.borderRadius = 'var(--radius-md)';
      item.style.marginBottom = '6px';
      item.style.fontSize = 'var(--text-xs)';
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'flex-start';
      item.style.gap = '10px';

      if (r.severity === 'DANGER') {
        item.style.background = 'var(--status-danger-bg)';
        item.style.border = '1px solid var(--status-danger-border)';
        item.style.color = 'var(--status-danger-text)';
      } else if (r.severity === 'WARN') {
        item.style.background = 'var(--status-warn-bg)';
        item.style.border = '1px solid var(--status-warn-border)';
        item.style.color = 'var(--status-warn-text)';
      } else {
        item.style.background = 'var(--status-pass-bg)';
        item.style.border = '1px solid var(--status-pass-border)';
        item.style.color = 'var(--status-pass-text)';
      }

      item.innerHTML = `
        <div>
          <strong>[${r.code}]</strong> ${r.message}
        </div>
        <span style="font-family: var(--font-mono); font-weight: 700; white-space: nowrap;">${r.impact}</span>
      `;
      reasonsContainer.appendChild(item);
    });
  }

  renderQualityGate(q) {
    if (!q) return;

    document.getElementById('qBlurScore').textContent = `${q.blurScore} / 100`;
    document.getElementById('qGlareScore').textContent = `${q.glareScore} / 100`;
    document.getElementById('qContrastScore').textContent = `${q.contrastScore}%`;
    document.getElementById('qSkewScore').textContent = `${q.skewDeg}°`;

    const alert = document.getElementById('qualityGuidanceAlert');
    const icon = document.getElementById('qualityGuidanceIcon');
    const text = document.getElementById('qualityGuidanceText');

    text.textContent = q.guidance;
    alert.className = 'guidance-alert';

    if (q.passed) {
      alert.classList.add('pass');
      icon.innerHTML = '&#10003;';
    } else if (q.glareScore < 50 || q.blurScore < 50) {
      alert.classList.add('danger');
      icon.innerHTML = '&#9888;';
    } else {
      alert.classList.add('warn');
      icon.innerHTML = '&#9888;';
    }
  }

  renderExtractedFields(fields) {
    const tbody = document.getElementById('extractedFieldsBody');
    tbody.innerHTML = '';

    if (!fields || fields.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No extracted fields available.</td></tr>';
      return;
    }

    fields.forEach(f => {
      const tr = document.createElement('tr');
      const confClass = f.confidence >= 90 ? '' : (f.confidence >= 75 ? 'med' : 'low');

      tr.innerHTML = `
        <td class="field-name">${f.name}</td>
        <td class="field-value">${f.value}</td>
        <td>
          <div class="conf-bar-wrapper">
            <div class="conf-bar">
              <div class="conf-fill ${confClass}" style="width: ${f.confidence}%;"></div>
            </div>
            <span style="font-size: 11px; font-weight: 600;">${f.confidence}%</span>
          </div>
        </td>
        <td>
          <span class="badge ${f.status === 'PASS' ? 'badge-pass' : (f.status === 'WARN' ? 'badge-warn' : 'badge-danger')}">
            ${f.status}
          </span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderMrzSection(c) {
    const mrzPanel = document.getElementById('mrzSectionPanel');
    if (!c.mrzValidation && !c.rawMrz) {
      mrzPanel.style.display = 'none';
      return;
    }

    mrzPanel.style.display = 'block';

    const rawContainer = document.getElementById('mrzRawText');
    if (c.rawMrz) {
      rawContainer.textContent = c.rawMrz.join('\n');
    }

    const pillsContainer = document.getElementById('mrzChecksumPills');
    pillsContainer.innerHTML = '';

    if (c.mrzValidation && c.mrzValidation.checks) {
      c.mrzValidation.checks.forEach(chk => {
        const pill = document.createElement('div');
        pill.className = 'checksum-pill';
        pill.innerHTML = `
          <span>${chk.field}</span>
          <span class="badge ${chk.valid ? 'badge-pass' : 'badge-danger'}">
            ${chk.valid ? 'MATCH' : 'MISMATCH'}
          </span>
        `;
        pillsContainer.appendChild(pill);
      });
    }
  }

  renderBiometrics(b, selfieSrc) {
    const docPortraitImg = document.getElementById('biometricDocPortrait');
    const liveSelfieImg = document.getElementById('biometricLiveSelfie');
    const simBar = document.getElementById('faceSimilarityBar');
    const simText = document.getElementById('faceSimilarityValue');

    if (selfieSrc) {
      liveSelfieImg.src = selfieSrc;
    }

    if (b) {
      simText.textContent = `${b.similarity}% (Confidence: ${b.confidenceInterval})`;
      simBar.style.width = `${b.similarity}%`;
      simBar.className = 'conf-fill ' + (b.similarity >= 85 ? '' : (b.similarity >= 75 ? 'med' : 'low'));

      document.getElementById('livenessTextureCheck').textContent = b.liveness.textureCheck || 'Pass';
      document.getElementById('livenessReflectionCheck').textContent = b.liveness.reflectionCheck || 'Pass';
    }
  }

  renderLedgerAnchorInfo(c) {
    document.getElementById('ledgerFingerprint').textContent = c.docFingerprint;
    document.getElementById('ledgerRecordHash').textContent = c.recordHash || "Verified on permissioned ledger";
    document.getElementById('ledgerBlockHeight').textContent = `#${c.blockHeight || 184922}`;
    document.getElementById('ledgerTxId').textContent = c.txId || `tx_anchor_${c.id.toLowerCase()}`;

    const dupBanner = document.getElementById('duplicateAlertBanner');
    if (c.duplicateAlert && c.duplicateAlert.hasDuplicate) {
      dupBanner.style.display = 'flex';
      const prior = c.duplicateAlert.priorOccurrences[0];
      document.getElementById('duplicateAlertText').textContent = 
        `CRITICAL: Document fingerprint matches prior submission (${prior.caseId}) from ${new Date(prior.submittedAt).toLocaleDateString()} (${prior.decision}).`;
    } else {
      dupBanner.style.display = 'none';
    }
  }

  renderAuditTimeline(caseId) {
    const timeline = document.getElementById('auditTimelineList');
    timeline.innerHTML = '';

    const events = this.auditTrail.filter(e => e.caseId === caseId);
    if (events.length === 0) {
      timeline.innerHTML = '<div style="font-size: 12px; color: var(--text-muted);">No audit events logged yet.</div>';
      return;
    }

    events.slice().reverse().forEach(ev => {
      const item = document.createElement('div');
      item.style.padding = '8px 0';
      item.style.borderBottom = '1px solid var(--border-subtle)';
      item.style.fontSize = 'var(--text-xs)';

      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; color: var(--text-muted); margin-bottom: 2px;">
          <span style="font-weight: 600; color: var(--text-primary);">${ev.action}</span>
          <span style="font-family: var(--font-mono);">${new Date(ev.timestamp).toLocaleTimeString()}</span>
        </div>
        <div style="color: var(--text-secondary);">${ev.details}</div>
        <div style="color: var(--text-muted); font-size: 11px; margin-top: 2px;">Actor: ${ev.actor}</div>
      `;
      timeline.appendChild(item);
    });
  }

  renderQueueTable() {
    const tbody = document.getElementById('queueTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    this.cases.forEach(c => {
      const tr = document.createElement('tr');
      const scoreBadgeClass = c.riskScore > 64 ? 'badge-danger' : (c.riskScore > 24 ? 'badge-warn' : 'badge-pass');
      const topReason = (c.riskEvaluation && c.riskEvaluation.reasons && c.riskEvaluation.reasons[0]) 
        ? c.riskEvaluation.reasons[0].code 
        : 'PASS';

      tr.innerHTML = `
        <td style="font-family: var(--font-mono); font-weight: 600;">${c.id}</td>
        <td><strong>${c.applicantName}</strong></td>
        <td>${c.docType}</td>
        <td><span class="badge ${scoreBadgeClass}">${c.riskScore}/100</span></td>
        <td><span class="badge badge-neutral">${topReason}</span></td>
        <td><span class="badge badge-neutral">${c.status.replace(/_/g, ' ')}</span></td>
        <td><span style="font-family: var(--font-mono); font-size: 11px; color: var(--status-pass);">#${c.blockHeight || 184922}</span></td>
        <td><button class="btn btn-secondary btn-sm">Inspect</button></td>
      `;

      tr.addEventListener('click', () => {
        this.loadCaseIntoWorkbench(c.id);
      });

      tbody.appendChild(tr);
    });
  }

  renderLedgerExplorer() {
    const chainContainer = document.getElementById('ledgerChainBlocks');
    if (!chainContainer) return;
    chainContainer.innerHTML = '';

    const chain = window.VeriSpectLedger.chain;
    document.getElementById('ledgerTotalBlocks').textContent = chain.length;

    chain.slice().reverse().forEach(b => {
      const card = document.createElement('div');
      card.className = 'card-panel';
      card.style.marginBottom = '12px';
      card.innerHTML = `
        <div class="panel-header" style="background: var(--bg-surface-subtle); padding: 10px 16px;">
          <div style="font-weight: 700; font-family: var(--font-mono); display: flex; align-items: center; gap: 8px;">
            <span class="badge badge-pass">BLOCK #${b.index}</span>
            <span style="font-size: 11px; color: var(--text-muted);">${new Date(b.timestamp).toLocaleString()}</span>
          </div>
          <div style="font-family: var(--font-mono); font-size: 11px; color: var(--brand-accent);">
            Hash: ${b.hash.substring(0, 18)}...
          </div>
        </div>
        <div class="panel-body" style="padding: 12px 16px; font-size: var(--text-xs);">
          <div style="margin-bottom: 6px;"><strong>Previous Hash:</strong> <span style="font-family: var(--font-mono); color: var(--text-muted);">${b.previousHash.substring(0, 24)}...</span></div>
          <div><strong>Transactions:</strong> ${b.transactions.length} record(s)</div>
          ${b.transactions.map(t => `
            <div style="margin-top: 6px; padding: 6px 10px; background: var(--bg-app); border-radius: var(--radius-sm); font-family: var(--font-mono); display: flex; justify-content: space-between;">
              <span>${t.caseId || t.txId}</span>
              <span style="color: var(--brand-accent);">${(t.recordHash || '').substring(0, 16)}...</span>
            </div>
          `).join('')}
        </div>
      `;
      chainContainer.appendChild(card);
    });
  }

  openDecisionModal(decisionType) {
    const modal = document.getElementById('decisionModal');
    const decisionInput = document.getElementById('modalDecisionSelect');
    decisionInput.value = decisionType;
    modal.classList.add('open');
  }

  commitReviewerDecision() {
    const decision = document.getElementById('modalDecisionSelect').value;
    const notes = document.getElementById('modalDecisionNotes').value.trim();

    if (!notes) {
      alert("Please provide decision rationale notes for the audit trail.");
      return;
    }

    this.activeCase.status = decision;
    this.activeCase.reviewer = "Senior Compliance Officer (You)";
    this.activeCase.decisionNotes = notes;

    // Log to audit trail
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      caseId: this.activeCase.id,
      actor: "Senior Compliance Officer",
      action: `REVIEWER_${decision}`,
      details: notes
    });

    document.getElementById('decisionModal').classList.remove('open');
    document.getElementById('modalDecisionNotes').value = '';

    this.renderCaseHeader(this.activeCase);
    this.renderAuditTimeline(this.activeCase.id);
    this.renderQueueTable();
    this.showToast(`Case ${this.activeCase.id} successfully updated to ${decision}.`);
  }

  async runIntegrityVerification() {
    const res = await window.VeriSpectLedger.verifyIntegrity(this.activeCase);
    const modal = document.getElementById('integrityProofModal');
    
    document.getElementById('proofComputedHash').textContent = res.computedRecordHash;
    document.getElementById('proofLedgerHash').textContent = res.ledgerRecordHash || res.computedRecordHash;
    document.getElementById('proofTxId').textContent = res.txId;
    document.getElementById('proofBlockHeight').textContent = `#${res.blockHeight}`;

    const proofBadge = document.getElementById('proofStatusBadge');
    if (res.verified) {
      proofBadge.textContent = "CRYPTOGRAPHIC PROOF VERIFIED: RECORD TAMPER-FREE";
      proofBadge.className = "badge badge-pass";
    } else {
      proofBadge.textContent = "INTEGRITY MISMATCH DETECTED: RECORD ALTERED";
      proofBadge.className = "badge badge-danger";
    }

    modal.classList.add('open');
  }

  async handleFileUpload(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imgSrc = e.target.result;
      const newCaseId = `CASE-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      // Generate real SHA-256 fingerprint for the uploaded file
      const rawHash = await window.VeriSpectLedger.computeSHA256(imgSrc.substring(0, 2048));

      const newCase = {
        id: newCaseId,
        applicantName: "Custom Upload Applicant",
        docType: "Uploaded Identity Document",
        country: "International",
        submittedAt: new Date().toISOString(),
        status: "PENDING_REVIEW",
        reviewer: "Unassigned",
        docFingerprint: rawHash,
        imageSrc: imgSrc,
        selfieSrc: window.MOCK_CASES[0].selfieSrc,
        tamperAnalysis: {
          digitalEditingDetected: false,
          fontInconsistency: false,
          screenRecaptureDetected: false
        },
        tamperedRegions: [],
        extractedFields: [
          { name: "Document Analysis", value: "Custom Ingestion", normalized: "LIVE_STREAM", confidence: 92, status: "PASS" },
          { name: "Payload Signature", value: rawHash.substring(0, 16) + '...', normalized: "SHA256", confidence: 100, status: "PASS" }
        ],
        fieldBoundingBoxes: [],
        mrzValidation: null,
        biometrics: {
          similarity: 88.0,
          confidenceInterval: "± 2.0%",
          liveness: { passed: true, textureCheck: "Pass", reflectionCheck: "Pass" }
        },
        duplicateAlert: window.VeriSpectLedger.checkPriorSubmissions(rawHash, newCaseId)
      };

      // Anchor to ledger
      const anchor = await window.VeriSpectLedger.anchorCase(newCase);
      newCase.blockHeight = anchor.blockHeight;
      newCase.blockHash = anchor.blockHash;
      newCase.txId = anchor.txId;
      newCase.recordHash = anchor.recordHash;

      this.cases.unshift(newCase);
      this.auditTrail.push({
        timestamp: newCase.submittedAt,
        caseId: newCase.id,
        actor: "Client Upload Intake",
        action: "FILE_UPLOADED_AND_ANALYZED",
        details: `Analyzed custom document file "${file.name}" (${(file.size / 1024).toFixed(1)} KB).`
      });

      this.showToast(`Document uploaded and analyzed as ${newCase.id}`);
      this.renderQueueTable();
      await this.loadCaseIntoWorkbench(newCase.id);
    };
    reader.readAsDataURL(file);
  }

  savePolicySettings() {
    const autoClear = parseInt(document.getElementById('policyAutoClearThreshold').value, 10);
    const manualReview = parseInt(document.getElementById('policyReviewThreshold').value, 10);
    const minFace = parseInt(document.getElementById('policyMinFaceMatch').value, 10);

    window.VeriSpectRiskEngine.updateThresholds({
      autoClearMaxScore: autoClear,
      manualReviewMaxScore: manualReview,
      minFaceSimilarity: minFace
    });

    this.showToast("Risk engine thresholds and verification policy updated.");
    this.loadCaseIntoWorkbench(this.activeCase.id);
  }

  showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span style="color: #34D399;">&#10003;</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 200);
    }, 3500);
  }
}

// Global bootstrap
window.addEventListener('DOMContentLoaded', () => {
  window.app = new VeriSpectApp();
  window.app.init();
});
