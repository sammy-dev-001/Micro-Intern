const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const puppeteer = require('puppeteer');
const { CERTIFICATES_DIR } = require('../middleware/upload');

class PdfWorker {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.templateContent = null;
  }

  getTemplate() {
    if (!this.templateContent) {
      const templatePath = path.resolve(__dirname, '../templates/certificate.html');
      this.templateContent = fs.readFileSync(templatePath, 'utf8');
    }
    return this.templateContent;
  }

  enqueue(job) {
    this.queue.push(job);
    this.processNext();
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const job = this.queue.shift();

    try {
      await this.runJob(job);
    } catch (err) {
      console.error('[PdfWorker] Error rendering certificate PDF:', err);
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setImmediate(() => this.processNext());
      }
    }
  }

  async runJob({ db, certificateId }) {
    console.log(`[PdfWorker] Generating PDF for certificate ID: ${certificateId}`);

    const cert = await db.get('SELECT * FROM certificates WHERE id = ?', certificateId);
    if (!cert) {
      console.error(`[PdfWorker] Certificate ${certificateId} not found`);
      return;
    }

    const snapshot = JSON.parse(cert.snapshot_json);
    const slug = cert.slug;
    const pdfFileName = `${slug}.pdf`;
    const outputPdfPath = path.join(CERTIFICATES_DIR, pdfFileName);

    // 1. Generate QR Code Data URI
    const verifyUrl = `https://microintern.ng/c/${slug}`;
    const qrDataUri = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 140,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    // 2. Format values
    const talent = snapshot.talent || {};
    const stats = snapshot.stats || {};
    const skills = snapshot.skills || [];
    const tasks = snapshot.completed_tasks || [];

    const talentSubtitle = [talent.course, talent.university].filter(Boolean).join(' • ') || 'Verified Candidate';
    const totalEarnedNaira = Math.round((stats.total_earned_kobo || 0) / 100).toLocaleString();
    const verifiedSkillsCount = skills.filter(s => s.source === 'verified').length;
    const avgRatingFormatted = stats.avg_rating ? `${stats.avg_rating} / 5.0` : 'Not Rated';

    // Build skills HTML
    const skillsHtml = skills.map(s => {
      const isVer = s.source === 'verified';
      return `<span class="skill-chip ${isVer ? 'verified' : ''}">
        ${isVer ? '<span class="check-icon">✓</span>' : ''} ${s.name} ${s.task_count ? `(${s.task_count})` : ''}
      </span>`;
    }).join(' ');

    // Build projects HTML (compact, max 10 rows)
    const displayTasks = tasks.slice(0, 10);
    let projectsHtml = displayTasks.map(t => {
      const typeLabel = (t.task_type || '').replace(/_/g, ' ');
      const clientInfo = t.mentor_name ? `${t.business_name} <br/><small style="color:#0284c7">Mentored by ${t.mentor_name}</small>` : t.business_name;
      const dateStr = t.completed_at ? new Date(t.completed_at).toLocaleDateString('en-GB') : 'Verified';
      const badgeClass = t.verification_method === 'automated_diff' ? 'badge-diff' : 'badge-manual';
      const badgeText = t.verification_method === 'automated_diff' ? 'Automated Diff' : 'Client Approved';

      return `<tr>
        <td><strong>${t.title}</strong></td>
        <td style="text-transform: capitalize;">${typeLabel}</td>
        <td>${clientInfo}</td>
        <td><span class="badge ${badgeClass}">${badgeText}</span></td>
        <td>${dateStr}</td>
      </tr>`;
    }).join('');

    if (tasks.length > 10) {
      projectsHtml += `<tr><td colspan="5" style="text-align:center; color:#64748b; font-style:italic;">... and ${tasks.length - 10} more verified tasks</td></tr>`;
    }

    if (tasks.length === 0) {
      projectsHtml = `<tr><td colspan="5" style="text-align:center; color:#64748b;">No completed tasks recorded.</td></tr>`;
    }

    // Replace template placeholders
    let html = this.getTemplate()
      .replace(/{{SLUG}}/g, slug)
      .replace(/{{ISSUED_AT}}/g, new Date(cert.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }))
      .replace(/{{TALENT_NAME}}/g, talent.name || 'MicroIntern Talent')
      .replace(/{{TALENT_SUBTITLE}}/g, talentSubtitle)
      .replace(/{{TASKS_COMPLETED_COUNT}}/g, String(stats.tasks_completed || 0))
      .replace(/{{TOTAL_EARNED_FORMATTED}}/g, `₦${totalEarnedNaira}`)
      .replace(/{{VERIFIED_SKILLS_COUNT}}/g, String(verifiedSkillsCount))
      .replace(/{{AVG_RATING_FORMATTED}}/g, avgRatingFormatted)
      .replace(/{{SKILLS_HTML}}/g, skillsHtml || '<span style="color:#64748b;">No skills declared</span>')
      .replace(/{{PROJECTS_TABLE_HTML}}/g, projectsHtml)
      .replace(/{{SNAPSHOT_HASH}}/g, cert.snapshot_hash)
      .replace(/{{QR_DATA_URI}}/g, qrDataUri);

    // Launch puppeteer in headless mode
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.pdf({
        path: outputPdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '12mm',
          right: '12mm',
          bottom: '12mm',
          left: '12mm'
        }
      });
    } finally {
      await browser.close();
    }

    // Update certificate record
    await db.run(`
      UPDATE certificates 
      SET pdf_path = ?, pdf_generated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [outputPdfPath, certificateId]);

    // Audit log
    await db.run(`
      INSERT INTO certificate_events (certificate_id, event, metadata_json)
      VALUES (?, 'pdf_generated', ?)
    `, [certificateId, JSON.stringify({ pdf_path: outputPdfPath })]);

    console.log(`[PdfWorker] Successfully created PDF at ${outputPdfPath}`);
  }
}

const pdfWorker = new PdfWorker();

module.exports = {
  pdfWorker
};
