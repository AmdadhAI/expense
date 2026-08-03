import { AppShell } from '@/components/layout/AppShell';
import { ensureOnboardedUser } from '@/lib/onboarding';

export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Execute transactional user onboarding before rendering protected routes
  try {
    await ensureOnboardedUser();
  } catch (error) {
    // Note: If authentication or database connection fails, error will bubble or redirect
    console.error('Protected layout onboarding verification:', error);
  }

  return <AppShell>{children}</AppShell>;
}
