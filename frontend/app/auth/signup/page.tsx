'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignupForm } from '@/components/auth/SignupForm';
import { GraduationCap } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignupSuccess = (token: string, user: any) => {
    setIsLoading(true);
    
    // Redirect to dashboard or home page after successful signup
    setTimeout(() => {
      router.push('/');
    }, 1000);
  };

  const handleSignupError = (error: string) => {
    console.error('Signup error:', error);
    // Error is already handled in the form component
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">EMIS</h1>
          <p className="text-gray-600">Education Management Information System</p>
        </div>

        {/* Signup Form */}
        <SignupForm
          onSuccess={handleSignupSuccess}
          onError={handleSignupError}
        />

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Join thousands of educational institutions using EMIS
          </p>
        </div>
      </div>
    </div>
  );
}
