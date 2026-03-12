'use strict';
/**
 * scripts/run-e2e-tests.js
 * End-to-end tests for all CRUD APIs.
 * Usage: node scripts/run-e2e-tests.js [port]
 */
require('dotenv').config();
const http = require('http');
const jwt  = require('jsonwebtoken');

const PORT       = process.argv[2] || process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'smartbank_fallback_secret';
const ts         = Date.now();

function gql(query, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
    const req  = http.request(
      {
        hostname: 'localhost', port: PORT, path: '/graphql', method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try { resolve(JSON.parse(d)); } catch (e) { reject(new Error('JSON: ' + d.slice(0, 80))); }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

let passed = 0, failed = 0;
function check(label, cond, extra) {
  if (cond) { console.log('  ✅', label, extra || ''); passed++; }
  else       { console.log('  ❌', label, extra || ''); failed++; }
}

async function run() {
  const email = 'e2e_' + ts + '@test.com';
  const adminToken = jwt.sign(
    { sub: 'admin-001', username: 'admin-001', email: 'admin@smartbankai.com', 'custom:role': 'ADMIN' },
    JWT_SECRET, { expiresIn: '1h' }
  );

  // ── AUTH ────────────────────────────────────────────────────────────────────
  console.log('\n── AUTH ────────────────────────────────────────────────────────');

  const reg = await gql(
    `mutation { registerUser(input:{ name:"E2E User", email:"${email}", password:"Password1!" }) ` +
    `{ token user { id userId name email role status } } }`
  );
  check('registerUser', !reg.errors && !!reg.data?.registerUser?.token, reg.errors?.[0]?.message || '');
  const { token, user } = reg.data.registerUser;
  check('  id field not null',     !!user.id);
  check('  userId field not null', !!user.userId);

  const login = await gql(`mutation { loginUser(email:"${email}", password:"Password1!") { token user { userId role status } } }`);
  check('loginUser',                !login.errors && !!login.data?.loginUser?.token, login.errors?.[0]?.message || '');
  const loginToken = login.data.loginUser.token;

  const badLogin = await gql(`mutation { loginUser(email:"${email}", password:"WrongPass1!") { token } }`);
  check('loginUser wrong password → INVALID_CREDENTIALS error', badLogin.errors?.length > 0);

  // ── USERS ───────────────────────────────────────────────────────────────────
  console.log('\n── USERS ───────────────────────────────────────────────────────');

  const gu = await gql(`query { getUser(userId:"${user.userId}") { id userId name email role status } }`, loginToken);
  check('getUser', !gu.errors, gu.errors?.[0]?.message || '');

  const uu = await gql(
    `mutation { updateUser(userId:"${user.userId}", input:{ name:"Updated Name", salary:80000 }) { id userId name salary } }`,
    loginToken
  );
  check('updateUser', !uu.errors && uu.data?.updateUser?.name === 'Updated Name', uu.errors?.[0]?.message || '');

  // ── LOANS ───────────────────────────────────────────────────────────────────
  console.log('\n── LOANS ───────────────────────────────────────────────────────');

  const al = await gql(
    `mutation { applyLoan(input:{ loanType:HOME, loanAmount:2000000, interestRate:8.5, tenure:240, bankName:"SBI" }) ` +
    `{ id loanId loanType loanAmount emi totalPayable totalInterest status bankName } }`,
    loginToken
  );
  check('applyLoan',          !al.errors && !!al.data?.applyLoan?.loanId, al.errors?.[0]?.message || '');
  check('  EMI calculated',   (al.data?.applyLoan?.emi || 0) > 0);
  check('  id field not null', !!al.data?.applyLoan?.id);
  const loanId = al.data?.applyLoan?.loanId;

  const ll = await gql(`query { listLoans(page:1, limit:5) { items{ loanId status emi } total page totalPages } }`, loginToken);
  check('listLoans', !ll.errors, ll.errors?.[0]?.message || '');

  const gl = await gql(`query { getLoan(loanId:"${loanId}") { id loanId status emi loanType } }`, loginToken);
  check('getLoan',   !gl.errors, gl.errors?.[0]?.message || '');

  const ul = await gql(
    `mutation { updateLoan(loanId:"${loanId}", input:{ notes:"updated notes" }) { id loanId notes status } }`,
    loginToken
  );
  check('updateLoan (PENDING)', !ul.errors, ul.errors?.[0]?.message || '');

  // ── INVESTMENTS ─────────────────────────────────────────────────────────────
  console.log('\n── INVESTMENTS ─────────────────────────────────────────────────');

  const ci = await gql(
    `mutation { createInvestment(input:{ investmentType:STOCK, amount:100000, expectedReturn:15, currentValue:110000 }) ` +
    `{ id investmentId investmentType amount currentValue gainLoss gainLossPercent status } }`,
    loginToken
  );
  check('createInvestment',   !ci.errors && !!ci.data?.createInvestment?.investmentId, ci.errors?.[0]?.message || '');
  check('  gainLoss = 10000', ci.data?.createInvestment?.gainLoss === 10000);
  check('  id field not null', !!ci.data?.createInvestment?.id);
  const invId = ci.data?.createInvestment?.investmentId;

  const li = await gql(`query { listInvestments { items{ id investmentId investmentType gainLoss } total } }`, loginToken);
  check('listInvestments', !li.errors, li.errors?.[0]?.message || '');

  const ps = await gql(
    `query { getPortfolioSummary(userId:"${user.userId}") { totalInvested totalCurrentValue gainLossPercent activeInvestments closedInvestments byType { investmentType count } } }`,
    loginToken
  );
  check('getPortfolioSummary', !ps.errors, ps.errors?.[0]?.message || '');
  check('  totalInvested = 100000', ps.data?.getPortfolioSummary?.totalInvested === 100000);

  const gi = await gql(`query { getInvestment(investmentId:"${invId}") { id investmentId status gainLoss } }`, loginToken);
  check('getInvestment', !gi.errors, gi.errors?.[0]?.message || '');

  const uii = await gql(
    `mutation { updateInvestment(investmentId:"${invId}", input:{ currentValue:115000 }) { id investmentId currentValue gainLoss } }`,
    loginToken
  );
  check('updateInvestment', !uii.errors, uii.errors?.[0]?.message || '');

  const clo = await gql(
    `mutation { closeInvestment(investmentId:"${invId}", finalValue:120000) { id investmentId status currentValue gainLoss } }`,
    loginToken
  );
  check('closeInvestment → CLOSED', !clo.errors && clo.data?.closeInvestment?.status === 'CLOSED', clo.errors?.[0]?.message || '');

  // ── ADMIN ───────────────────────────────────────────────────────────────────
  console.log('\n── ADMIN ───────────────────────────────────────────────────────');

  const as = await gql(`query { adminGetStats { totalUsers activeUsers totalLoans pendingLoans approvedLoans totalInvestments activeInvestments } }`, adminToken);
  check('adminGetStats',    !as.errors, as.errors?.[0]?.message || '');

  const alu = await gql(`query { adminListUsers(page:1, limit:5) { items{ id userId name email role status } total } }`, adminToken);
  check('adminListUsers',   !alu.errors, alu.errors?.[0]?.message || '');
  if (!alu.errors) check('  userId not null on all items', alu.data.adminListUsers.items.every((u) => !!u.userId));

  const agu = await gql(`query { adminGetUser(userId:"${user.userId}") { id userId name email role } }`, adminToken);
  check('adminGetUser',     !agu.errors, agu.errors?.[0]?.message || '');

  const auu = await gql(
    `mutation { adminUpdateUser(userId:"${user.userId}", input:{ isEmailVerified:true }) { id userId isEmailVerified } }`,
    adminToken
  );
  check('adminUpdateUser',  !auu.errors, auu.errors?.[0]?.message || '');

  const approve = await gql(`mutation { approveLoan(loanId:"${loanId}") { id loanId status } }`, adminToken);
  check('approveLoan → APPROVED', !approve.errors && approve.data?.approveLoan?.status === 'APPROVED', approve.errors?.[0]?.message || '');

  const disburse = await gql(`mutation { disburseLoan(loanId:"${loanId}") { id loanId status } }`, adminToken);
  check('disburseLoan → DISBURSED', !disburse.errors && disburse.data?.disburseLoan?.status === 'DISBURSED', disburse.errors?.[0]?.message || '');

  const closeloan = await gql(`mutation { closeLoan(loanId:"${loanId}") { id loanId status } }`, loginToken);
  check('closeLoan → CLOSED', !closeloan.errors && closeloan.data?.closeLoan?.status === 'CLOSED', closeloan.errors?.[0]?.message || '');

  const suspend = await gql(`mutation { adminSuspendUser(userId:"${user.userId}", reason:"test") { id userId status } }`, adminToken);
  check('adminSuspendUser → INACTIVE', !suspend.errors && suspend.data?.adminSuspendUser?.status === 'INACTIVE', suspend.errors?.[0]?.message || '');

  const reactivate = await gql(`mutation { adminReactivateUser(userId:"${user.userId}") { id userId status } }`, adminToken);
  check('adminReactivateUser → ACTIVE', !reactivate.errors && reactivate.data?.adminReactivateUser?.status === 'ACTIVE', reactivate.errors?.[0]?.message || '');

  const softdel = await gql(`mutation { softDeleteUser(userId:"${user.userId}") { id userId status } }`, loginToken);
  check('softDeleteUser → DELETED', !softdel.errors && softdel.data?.softDeleteUser?.status === 'DELETED', softdel.errors?.[0]?.message || '');

  const hardel = await gql(`mutation { adminDeleteUser(userId:"${user.userId}") { success message } }`, adminToken);
  check('adminDeleteUser → success', !hardel.errors && hardel.data?.adminDeleteUser?.success, hardel.errors?.[0]?.message || '');

  // ── SUMMARY ─────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(` Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log(` 🎉  ALL ${passed} TESTS PASSED — SmartBankAI backend fully operational!`);
  } else {
    console.log(` ⚠️  ${failed} test(s) need attention.`);
  }
  console.log('══════════════════════════════════════════════════════════════\n');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });
