'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
      }

      const session = data?.session;

      if (!session) {
        // User logged-in nahi hai → login page pe bhej do
        const redirect = pathname || '/';
        router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
        return;
      }

      // Session mil gaya → dashboard render karne do
      setChecking(false);
    }

    checkSession();
  }, [router, pathname]);

  // Jab tak session check ho raha hai, ek simple loading state dikhao
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Checking login...
      </div>
    );
  }

  // Authenticated content
  return <>{children}</>;
}
