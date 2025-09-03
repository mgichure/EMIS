'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { GraduationCap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSuccess = (token: string, user: any) => {
    setIsLoading(true);
    
    // Redirect to dashboard or home page after successful login
    setTimeout(() => {
      router.push('/');
    }, 1000);
  };

  const handleLoginError = (error: string) => {
    console.error('Login error:', error);
    // Error is already handled in the form component
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">EMIS</h1>
          <p className="text-gray-600">Education Management Information System</p>
        </div>

        {/* Login Form */}
        <LoginForm
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
        />

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Secure access to your educational institution&apos;s management system
          </p>
        </div>
      </div>
    </div>
  );
}
