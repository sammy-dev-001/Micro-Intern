const { compareCSVs } = require('../services/csvDiff');
const { createNotification } = require('../services/notifications');
const { transitionProject } = require('../services/stateMachine');

class DiffWorker {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
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
      console.error('[DiffWorker] Error processing job:', err);
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setImmediate(() => this.processNext());
      }
    }
  }

  async runJob({ db, projectId, deliverableId, inputFileStoragePath, outputFileStoragePath }) {
    console.log(`[DiffWorker] Running CSV diff for project ${projectId}, deliverable ${deliverableId}`);

    const { passed, report } = await compareCSVs(inputFileStoragePath, outputFileStoragePath);

    const checkStatus = passed ? 'passed' : 'failed';
    const reportJson = JSON.stringify(report);

    await db.run(
      `UPDATE deliverables 
       SET automated_check_status = ?, automated_check_report = ?
       WHERE id = ?`,
      [checkStatus, reportJson, deliverableId]
    );

    // Transition project to 'in_review'
    await transitionProject(db, projectId, 'in_review');

    // Notify business
    const project = await db.get('SELECT business_id, title FROM projects WHERE id = ?', projectId);
    if (project) {
      await createNotification(db, {
        userId: project.business_id,
        type: 'deliverable_submitted',
        payload: {
          projectId,
          deliverableId,
          title: project.title,
          automatedCheckStatus: checkStatus,
          summary: report.summary
        }
      });
    }

    console.log(`[DiffWorker] Finished CSV diff for project ${projectId}: ${checkStatus}`);
  }
}

const diffWorker = new DiffWorker();

module.exports = {
  diffWorker
};
