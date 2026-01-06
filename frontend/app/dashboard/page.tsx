'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Target, 
  FileText, 
  GraduationCap, 
  Calendar,
  TrendingUp,
  Settings,
  User
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const getQuickActions = () => {
    const actions = [
      {
        title: 'Admissions',
        description: 'Manage student applications',
        icon: Users,
        href: '/admissions',
        color: 'bg-blue-100 text-blue-600',
      },
      {
        title: 'Interviews',
        description: 'Schedule and conduct interviews',
        icon: Target,
        href: '/interviews',
        color: 'bg-green-100 text-green-600',
      },
      {
        title: 'Students',
        description: 'View student records',
        icon: GraduationCap,
        href: '/students',
        color: 'bg-purple-100 text-purple-600',
      },
      {
        title: 'Courses',
        description: 'Manage course offerings',
        icon: FileText,
        href: '/courses',
        color: 'bg-orange-100 text-orange-600',
      },
    ];

    // Filter actions based on user role
    if (user.role === 'student') {
      return actions.filter(action => action.title === 'Courses');
    }

    return actions;
  };

  const getStats = () => {
    // These would come from your backend in a real application
    const stats = [
      {
        title: 'Total Students',
        value: '1,247',
        change: '+12%',
        changeType: 'positive',
        icon: GraduationCap,
      },
      {
        title: 'Active Applications',
        value: '89',
        change: '+5%',
        changeType: 'positive',
        icon: Users,
      },
      {
        title: 'Pending Interviews',
        value: '23',
        change: '-3%',
        changeType: 'negative',
        icon: Target,
      },
      {
        title: 'Courses Offered',
        value: '45',
        change: '+2%',
        changeType: 'positive',
        icon: FileText,
      },
    ];

    return stats;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user.firstName}! 👋
            </h1>
            <p className="text-blue-100">
              Here&apos;s what&apos;s happening with your {user.role === 'student' ? 'academic' : 'institution'} today.
            </p>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="text-sm">
              {user.role}
            </Badge>
            <p className="text-blue-100 text-sm mt-1">{user.organization}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStats().map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {getQuickActions().map((action, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href={action.href}>
                <CardHeader>
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Link>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New application submitted</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Interview scheduled</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Document uploaded</p>
                  <p className="text-xs text-gray-500">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Admissions Peak</p>
                <p className="text-xs text-blue-600">This month has seen a 15% increase in applications</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800">Interview Success</p>
                <p className="text-xs text-green-600">85% of candidates passed their interviews</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-sm font-medium text-orange-800">System Health</p>
                <p className="text-xs text-orange-600">All systems running smoothly</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="text-lg">{user.firstName} {user.lastName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-lg">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Role</p>
              <Badge variant="outline" className="text-sm capitalize">
                {user.role}
              </Badge>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
