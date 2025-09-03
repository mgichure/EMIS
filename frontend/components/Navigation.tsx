'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Users, 
  Target,
  GraduationCap, 
  BookOpen, 
  Settings,
  Database,
  LogOut,
  User,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const Navigation = () => {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return null; // Don't show navigation for unauthenticated users
  }

  return (
    <nav className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              EMIS
            </Link>
            
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              </Link>
              
              <Link href="/dashboard">
                <Button variant="ghost" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              
              <Link href="/admissions">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Admissions
                </Button>
              </Link>
              
              <Link href="/interviews">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Interviews
                </Button>
              </Link>
              
              <Link href="/students">
                <Button variant="ghost" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Students
                </Button>
              </Link>
              
              <Link href="/courses">
                <Button variant="ghost" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Courses
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{user?.firstName} {user?.lastName}</span>
              <Badge variant="outline" className="text-xs capitalize">
                {user?.role}
              </Badge>
            </div>
            
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
            
            <Link href="/database">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Database
              </Button>
            </Link>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
