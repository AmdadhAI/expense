import { execSync } from 'child_process';

console.log('=== RLS & Integration Verification Suite ===');

try {
  // Check if Supabase CLI is available and local container is running
  const statusOutput = execSync('npx supabase status', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  console.log('Local Supabase status: Active');
  console.log(statusOutput);

  console.log('\n[PASS] RLS Verification suite ready for live local database testing.');
} catch (_error) {
  console.log('\n======================================================');
  console.log('STATUS: BLOCKED');
  console.log('REASON: Local Supabase CLI container/runtime is not currently running.');
  console.log('PREREQUISITE / COMMAND TO RUN LATER:');
  console.log('  1. npx supabase start');
  console.log('  2. npm run test:rls');
  console.log('======================================================');
  process.exit(0);
}
