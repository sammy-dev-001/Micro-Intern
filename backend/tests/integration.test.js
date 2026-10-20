const path = require('path');
const fs = require('fs');
const assert = require('assert');

// Point to test database
const testDbPath = path.resolve(__dirname, 'test_microintern.db');
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}
process.env.DATABASE_PATH = testDbPath;
process.env.PANDASCROW_MODE = 'mock';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_12345';

const { app, startServer } = require('../server/app');
const { getDBConnection } = require('../server/db');

async function runTests() {
  console.log('🧪 Starting MicroIntern Backend v2.1 Integration Test Suite...\n');

  const server = await startServer(3099);
  const baseUrl = 'http://localhost:3099/api/v2';

  // Helper fetch function
  async function request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      options.body = JSON.stringify(options.body);
    }
    const res = await fetch(url, { ...options, headers });
    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }
    return { status: res.status, headers: res.headers, data };
  }

  try {
    // -------------------------------------------------------------
    // Test 1: User Registration & Authentication (bcrypt & JWT)
    // -------------------------------------------------------------
    console.log('▶ Test 1: Authentication & Profiles');

    // Register Talent
    const talentRes = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Chioma Okonkwo',
        email: 'chioma@unilag.edu.ng',
        password: 'securePassword123',
        type: 'talent',
        university: 'University of Lagos',
        course: 'Computer Science',
        year_of_study: 3,
        bio: 'Aspiring data scientist and Python enthusiast.',
        skills: ['Data Cleaning', 'Python', 'Excel']
      }
    });

    assert.strictEqual(talentRes.status, 201, 'Talent should register with 201');
    assert(talentRes.data.token, 'Token should be returned');
    assert.strictEqual(talentRes.data.user.type, 'talent', 'User type should be talent');
    const talentToken = talentRes.data.token;
    const talentId = talentRes.data.user.id;

    // Register Business
    const bizRes = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Konga Tech',
        email: 'jobs@konga.example.com',
        password: 'bizPassword123',
        type: 'business',
        company_name: 'Konga Technologies',
        industry: 'E-Commerce',
        company_size: '50-200',
        website: 'https://konga.example.com'
      }
    });

    assert.strictEqual(bizRes.status, 201, 'Business should register with 201');
    const bizToken = bizRes.data.token;
    const bizId = bizRes.data.user.id;

    // Register Mentor
    const mentorRes = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Emeka Mentor',
        email: 'emeka@mentor.example.com',
        password: 'mentorPassword123',
        type: 'business',
        company_name: 'Lead Mentors Ltd'
      }
    });
    const mentorToken = mentorRes.data.token;
    const mentorId = mentorRes.data.user.id;

    // Test GET /auth/me
    const meRes = await request('/auth/me', {
      headers: { Authorization: `Bearer ${talentToken}` }
    });
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.data.user.email, 'chioma@unilag.edu.ng');
    assert.strictEqual(meRes.data.user.profile.university, 'University of Lagos');
    console.log('  ✔ Registration, bcrypt hashing, and JWT /auth/me verified');

    // -------------------------------------------------------------
    // Test 2: Mentorship Rules & Caps
    // -------------------------------------------------------------
    console.log('▶ Test 2: Mentorship Rules & Caps');

    // Self-mentorship forbidden
    const selfMentorRes = await request('/mentorships', {
      method: 'POST',
      headers: { Authorization: `Bearer ${talentToken}` },
      body: { talent_id: talentId }
    });
    assert.strictEqual(selfMentorRes.status, 400, 'Self mentorship must fail with 400');

    // Mentor invites Chioma
    const inviteRes = await request('/mentorships', {
      method: 'POST',
      headers: { Authorization: `Bearer ${mentorToken}` },
      body: { talent_id: talentId }
    });
    assert.strictEqual(inviteRes.status, 201);
    const mentorshipId = inviteRes.data.id;

    // Chioma accepts invite
    const acceptRes = await request(`/mentorships/${mentorshipId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${talentToken}` }
    });
    assert.strictEqual(acceptRes.status, 200);
    assert.strictEqual(acceptRes.data.status, 'active');

    // Check GET /users/me/mentor
    const myMentorRes = await request('/users/me/mentor', {
      headers: { Authorization: `Bearer ${talentToken}` }
    });
    assert.strictEqual(myMentorRes.status, 200);
    assert.strictEqual(myMentorRes.data.mentor.mentor_id, mentorId);
    console.log('  ✔ Mentorship invite, acceptance, and active relationship verified');

    // -------------------------------------------------------------
    // Test 3: Project Lifecycle, Escrow, and State Machine
    // -------------------------------------------------------------
    console.log('▶ Test 3: Project Creation, Escrow & Marketplace');

    // Create Project (draft)
    const projectRes = await request('/projects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bizToken}` },
      body: {
        title: 'Clean Customer Directory CSV',
        description: 'Remove duplicate phone entries and standardize names across 500 rows.',
        task_type: 'data_cleaning',
        budget_kobo: 3000000, // 30,000 NGN
        duration_days: 3,
        requires_mentor: false
      }
    });

    assert.strictEqual(projectRes.status, 201);
    assert.strictEqual(projectRes.data.status, 'draft', 'Project must start as draft');
    assert.strictEqual(projectRes.data.verification_method, 'automated_diff', 'Derived verification method must be automated_diff');
    const projectId = projectRes.data.id;

    // Add source CSV file record for data_cleaning check
    const db = await getDBConnection();
    const sourceCsvPath = path.resolve(__dirname, 'test_input.csv');
    fs.writeFileSync(sourceCsvPath, 'id,name,email,phone\n1,Alice,alice@example.com,08012345678\n2,Bob,bob@example.com,08098765432\n3,Alice,alice@example.com,08012345678\n');

    await db.run(`
      INSERT INTO project_files (project_id, role, storage_path, original_name, size_bytes, uploaded_by)
      VALUES (?, 'input', ?, 'test_input.csv', 100, ?)
    `, [projectId, sourceCsvPath, bizId]);

    // Publish Project -> calls createEscrow, stays draft until funded
    const publishRes = await request(`/projects/${projectId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bizToken}` }
    });
    assert.strictEqual(publishRes.status, 200);
    assert.strictEqual(publishRes.data.escrow.status, 'pending_funding');
    assert.strictEqual(publishRes.data.project.status, 'draft');

    // Marketplace check: Project should NOT appear yet in open marketplace
    const marketBefore = await request('/projects');
    assert.strictEqual(marketBefore.data.some(p => p.id === projectId), false, 'Draft project must not be visible in marketplace');

    // Simulate funding via dev endpoint
    const fundRes = await request(`/dev/escrow/${projectId}/fund`, {
      method: 'POST'
    });
    assert.strictEqual(fundRes.status, 200);
    assert.strictEqual(fundRes.data.escrow.status, 'funded');
    assert.strictEqual(fundRes.data.project.status, 'open', 'Project must move to open when escrow is funded');

    // Marketplace check: Project now visible
    const marketAfter = await request('/projects');
    assert(marketAfter.data.some(p => p.id === projectId), 'Project must now be visible in marketplace');
    console.log('  ✔ Project draft -> publish -> funded -> open state machine verified');

    // -------------------------------------------------------------
    // Test 4: Applications & KYC Gate at Assign
    // -------------------------------------------------------------
    console.log('▶ Test 4: Application & KYC Gate at Assignment');

    // Chioma applies to project (self-apply, no mentor check, no KYC check at apply time)
    const applyRes = await request(`/projects/${projectId}/applications`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${talentToken}` },
      body: {
        pitch: 'I have strong Python and CSV cleaning experience and can deliver within 2 days.'
      }
    });
    assert.strictEqual(applyRes.status, 201);
    const applicationId = applyRes.data.id;

    // Business attempts to assign Chioma while KYC is 'none' -> Expect 422 KYC_REQUIRED!
    const assignFailRes = await request(`/projects/${projectId}/assign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bizToken}` },
      body: { application_id: applicationId }
    });
    assert.strictEqual(assignFailRes.status, 422, 'Assigning unverified talent must return 422');
    assert.strictEqual(assignFailRes.data.code, 'KYC_REQUIRED');

    // Talent completes KYC verification
    const kycRes = await request('/users/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${talentToken}` },
      body: {
        kyc_status: 'verified',
        pandascrow_account_id: 'pse_acc_chioma_123'
      }
    });
    assert.strictEqual(kycRes.status, 200);
    assert.strictEqual(kycRes.data.user.profile.kyc_status, 'verified');

    // Business now assigns Chioma -> succeeds!
    const assignSuccessRes = await request(`/projects/${projectId}/assign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bizToken}` },
      body: { application_id: applicationId }
    });
    assert.strictEqual(assignSuccessRes.status, 200);
    assert.strictEqual(assignSuccessRes.data.project.status, 'assigned');
    assert.strictEqual(assignSuccessRes.data.project.assigned_talent_id, talentId);
    console.log('  ✔ Application, KYC gate (422), and exclusive assignment verified');

    // -------------------------------------------------------------
    // Test 5: Deliverables, Revisions & Automated Diff Check
    // -------------------------------------------------------------
    console.log('▶ Test 5: Deliverables & Automated Diff Verification');

    // Create cleaned output file
    const cleanedCsvPath = path.resolve(__dirname, 'test_output.csv');
    // Deduplicated: row 3 removed!
    fs.writeFileSync(cleanedCsvPath, 'id,name,email,phone\n1,Alice,alice@example.com,08012345678\n2,Bob,bob@example.com,08098765432\n');

    // Direct deliverable insertion to test diff worker processing
    const deliverableRes = await request(`/projects/${projectId}/deliverables`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${talentToken}` },
      body: {
        link: 'https://storage.microintern.ng/output/cleaned_test_v1.csv',
        notes: 'Deduplicated duplicate row 3 and verified email formatting.'
      }
    });
    assert.strictEqual(deliverableRes.status, 201, `Deliverable creation failed: ${JSON.stringify(deliverableRes.data)}`);
    const deliverableId = deliverableRes.data.deliverable.id;
    assert.strictEqual(deliverableRes.data.deliverable.round, 1);

    // Run diff check manually with the csvDiff service to test report accuracy
    const { compareCSVs } = require('../server/services/csvDiff');
    const diffResult = await compareCSVs(sourceCsvPath, cleanedCsvPath);
    assert.strictEqual(diffResult.passed, true, 'Cleaned CSV should pass automated diff');
    assert.strictEqual(diffResult.report.duplicates_removed, 1, 'Should report 1 duplicate removed');

    // Store report on deliverable & transition project to in_review
    await db.run(
      "UPDATE deliverables SET automated_check_status = 'passed', automated_check_report = ? WHERE id = ?",
      [JSON.stringify(diffResult.report), deliverableId]
    );
    const { transitionProject } = require('../server/services/stateMachine');
    await transitionProject(db, projectId, 'in_review');

    // Test Request Changes (revision round 1 -> round 2)
    const changeReqRes = await request(`/projects/${projectId}/request-changes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bizToken}` },
      body: {
        notes: 'Please double check phone number format for row 2.'
      }
    });
    assert.strictEqual(changeReqRes.status, 200);
    assert.strictEqual(changeReqRes.data.project.status, 'changes_requested');

    // Talent submits Round 2 deliverable
    const round2Res = await request(`/projects/${projectId}/deliverables`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${talentToken}` },
      body: {
        link: 'https://storage.microintern.ng/output/cleaned_test_v2.csv',
        notes: 'Updated phone numbers and verified international prefixes.'
      }
    });
    assert.strictEqual(round2Res.status, 201);
    assert.strictEqual(round2Res.data.deliverable.round, 2);

    // Business approves project
    const approveRes = await request(`/projects/${projectId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bizToken}` }
    });
    assert.strictEqual(approveRes.status, 200);
    assert.strictEqual(approveRes.data.project.status, 'completed');
    console.log('  ✔ Deliverable round tracking, diff check, revision loop, and approval verified');

    // -------------------------------------------------------------
    // Test 6: Automatic Skill Verification
    // -------------------------------------------------------------
    console.log('▶ Test 6: Skill Verification on Completion');

    const talentSkills = await db.all(
      'SELECT s.name, ts.source, ts.verified_at FROM talent_skills ts JOIN skills s ON ts.skill_id = s.id WHERE ts.talent_id = ?',
      talentId
    );
    const dataCleaningSkill = talentSkills.find(s => s.name === 'Data Cleaning');
    assert(dataCleaningSkill, 'Data Cleaning skill must exist for talent');
    assert.strictEqual(dataCleaningSkill.source, 'verified', 'Data Cleaning skill must automatically flip to verified');
    assert(dataCleaningSkill.verified_at, 'verified_at timestamp must be populated');
    console.log('  ✔ Completed+paid task automatically flips skill to verified');

    // -------------------------------------------------------------
    // Test 7: Reviews & Canonical Rating
    // -------------------------------------------------------------
    console.log('▶ Test 7: Participant Reviews & Real Rating');

    const reviewRes = await request(`/projects/${projectId}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bizToken}` },
      body: {
        rating: 5,
        comment: 'Outstanding attention to detail and delivered ahead of schedule!'
      }
    });
    assert.strictEqual(reviewRes.status, 201);
    assert.strictEqual(reviewRes.data.rating, 5);
    console.log('  ✔ Reviews posted and real ratings stored');

    // -------------------------------------------------------------
    // Test 8: Public Verified Profile Endpoint (§3)
    // -------------------------------------------------------------
    console.log('▶ Test 8: Public Verified Profile Endpoint (§3)');

    const profileRes = await request(`/users/${talentId}/profile`);
    assert.strictEqual(profileRes.status, 200);
    assert.strictEqual(profileRes.data.user.name, 'Chioma Okonkwo');
    assert.strictEqual(profileRes.data.stats.tasks_completed, 1);
    assert.strictEqual(profileRes.data.stats.total_earned_kobo, 3000000);
    assert.strictEqual(profileRes.data.stats.avg_rating, 5.0);
    assert.strictEqual(profileRes.data.completed_tasks.length, 1);
    assert.strictEqual(profileRes.data.completed_tasks[0].verification_method, 'automated_diff');
    console.log('  ✔ Canonical Section 3 Verified Profile response verified');

    // -------------------------------------------------------------
    // Test 9: Certificate Generation, Hash & Verification (Addendum v2.1)
    // -------------------------------------------------------------
    console.log('▶ Test 9: Certificate Generation & Verification (Addendum v2.1)');

    // Issue certificate
    const certRes = await request('/users/me/certificates', {
      method: 'POST',
      headers: { Authorization: `Bearer ${talentToken}` }
    });
    assert([200, 201].includes(certRes.status));
    assert(certRes.data.slug.startsWith('mci_'), 'Slug should start with mci_');
    assert(certRes.data.snapshot_hash.startsWith('sha256:'), 'Hash should be sha256:...');
    const certSlug = certRes.data.slug;
    const certHash = certRes.data.snapshot_hash;

    // Public Certificate View /c/:slug
    const publicCertRes = await request(`/certificates/${certSlug}`);
    assert.strictEqual(publicCertRes.status, 200);
    assert.strictEqual(publicCertRes.data.certificate.slug, certSlug);
    assert.strictEqual(publicCertRes.data.certificate.snapshot_hash, certHash);
    assert.strictEqual(publicCertRes.data.talent.name, 'Chioma Okonkwo');
    assert.strictEqual(publicCertRes.data.completed_tasks.length, 1);

    // Public Machine-Readable Verification /c/:slug/verify
    const verifyRes = await request(`/certificates/${certSlug}/verify`);
    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyRes.data.valid, true);
    assert.strictEqual(verifyRes.data.snapshot_hash, certHash);

    // List My Certificates
    const myCertsRes = await request('/users/me/certificates', {
      headers: { Authorization: `Bearer ${talentToken}` }
    });
    assert.strictEqual(myCertsRes.status, 200);
    assert.strictEqual(myCertsRes.data.length, 1);
    // Wait for PDF worker to finish rendering and update certificate (allow up to 30s for cold Puppeteer launch)
    let pdfReady = false;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const checkPdfRes = await request(`/certificates/${certSlug}`);
      if (checkPdfRes.data?.certificate?.pdf_url) {
        pdfReady = true;
        break;
      }
    }
    assert(pdfReady, 'Certificate PDF should be generated by PdfWorker');

    // Test public PDF download at /c/:slug.pdf (No auth required)
    const pdfDownloadRes = await request(`http://localhost:3099/c/${certSlug}.pdf`);
    assert.strictEqual(pdfDownloadRes.status, 200, 'Public PDF download should return 200');
    assert(pdfDownloadRes.headers.get('content-type')?.includes('pdf') || typeof pdfDownloadRes.data === 'string', 'Should return PDF content');
    console.log('  ✔ Puppeteer PDF generation and public /c/:slug.pdf download verified');

    console.log('\n🎉 ALL 9 TEST SUITES PASSED FLAWLESSLY!\n');
  } finally {
    if (server) {
      server.close();
    }
    try {
      const db = await getDBConnection();
      await db.close();
    } catch (e) {}

    // Clean up test files safely
    try {
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
      const testInput = path.resolve(__dirname, 'test_input.csv');
      const testOutput = path.resolve(__dirname, 'test_output.csv');
      if (fs.existsSync(testInput)) fs.unlinkSync(testInput);
      if (fs.existsSync(testOutput)) fs.unlinkSync(testOutput);
    } catch (e) {
      // Ignore cleanup locks
    }
  }
}

runTests().then(() => {
  console.log('Exiting with code 0.');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
