// src/app/login/page.tsx
'use client';

import { Suspense } from 'react';
import LoginPage from '@/components/LoginPage';

function LoginPageContent() {
  return <LoginPage />;
}

export default function Login() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}