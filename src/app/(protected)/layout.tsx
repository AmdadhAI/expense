import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { ensureOnboardedUser } from '@/lib/onboarding';

export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  // If user is not authenticated, redirect cleanly to /login
  if (userError || !userData?.user) {
    redirect('/login');
  }

  // Execute transactional user onboarding for authenticated users
  try {
    await ensureOnboardedUser();
  } catch (error) {
    console.error('Protected layout onboarding verification error:', error);
  }

  return <AppShell>{children}</AppShell>;
}
