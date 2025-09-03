'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Database, 
  Wifi, 
  WifiOff,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Target
} from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="container mx-auto py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        {isAuthenticated ? (
          <>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Continue managing your educational institution with our comprehensive tools for admissions, 
              interviews, and data management.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Education Management Information System
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A comprehensive solution for managing educational institutions with advanced offline capabilities, 
              streamlined admissions, and real-time data synchronization.
            </p>
          </>
        )}
        <div className="flex items-center justify-center gap-4 mt-8">
          {isAuthenticated ? (
            <div className="flex gap-4">
              <Link href="/admissions">
                <Button size="lg" className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Get Started with Admissions
                </Button>
              </Link>
              <Link href="/interviews">
                <Button variant="outline" size="lg" className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Interview Management
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex gap-4">
              <Link href="/auth/login">
                <Button size="lg" className="flex items-center gap-2">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="outline" size="lg" className="flex items-center gap-2">
                  Create Account
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Admissions & Enrolment</CardTitle>
            <CardDescription>
              Streamlined application process with multi-step wizard and document management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Multi-step application wizard
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Document upload & preview
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Offline-first design
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Wifi className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Offline Capabilities</CardTitle>
            <CardDescription>
              Work seamlessly without internet connection with automatic sync when online
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Local data storage
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Automatic sync queue
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Conflict resolution
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle>Interview Management</CardTitle>
            <CardDescription>
              Comprehensive interview scheduling, scoring, and evaluation system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Written & oral interviews
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Weighted rubric scoring
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Bulk operations & CSV export
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Database className="h-6 w-6 text-indigo-600" />
            </div>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Robust database with real-time updates and comprehensive reporting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Real-time data sync
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Advanced filtering
          </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Export capabilities
          </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Admissions Module Highlight */}
      <Card className="mb-16">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
          <CardDescription>
            Experience the power of our Admissions & Enrolment module
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Create Applications</h3>
              <p className="text-sm text-gray-600">
                Multi-step wizard for collecting personal, academic, and document information
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <WifiOff className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Work Offline</h3>
              <p className="text-sm text-gray-600">
                Applications are saved locally and sync automatically when connection is restored
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Track Progress</h3>
              <p className="text-sm text-gray-600">
                Monitor application status, review decisions, and manage the entire process
              </p>
            </div>
          </div>
          
          <Link href="/admissions">
            <Button size="lg" className="flex items-center gap-2 mx-auto">
              <Users className="h-5 w-5" />
              Launch Admissions Module
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
            <div className="text-sm text-gray-600">Offline Capable</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
            <div className="text-sm text-gray-600">Data Access</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">Real-time</div>
            <div className="text-sm text-gray-600">Sync</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">Secure</div>
            <div className="text-sm text-gray-600">Data Storage</div>
          </CardContent>
        </Card>
        </div>
    </div>
  );
}
