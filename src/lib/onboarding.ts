import { createClient } from '@/lib/supabase/server';

/**
 * Server-only helper to run idempotent user onboarding via public.onboard_user() RPC.
 * Must be executed after user authentication check. Throws explicitly if onboarding fails.
 */
export async function ensureOnboardedUser(): Promise<void> {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error('Authentication required for user onboarding');
  }

  const { error: rpcError } = await supabase.rpc('onboard_user');

  if (rpcError) {
    throw new Error(`User onboarding failed: ${rpcError.message}`);
  }
}
