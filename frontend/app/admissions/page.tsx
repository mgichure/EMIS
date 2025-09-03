'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  FileText, 
  BarChart3, 
  Settings,
  ArrowLeft,
  Plus,
  Eye,
  Edit
} from 'lucide-react';
import { AdmissionsList } from '@/components/admissions/AdmissionsList';
import { AdmissionWizard } from '@/components/admissions/AdmissionWizard';
import { OfflineBanner } from '@/components/admissions/OfflineBanner';
import { AdmissionFilters, AdmissionFilters as AdmissionFiltersType } from '@/components/admissions/AdmissionFilters';
import { AdmissionApplication, db } from '@/lib/database';
import { seedSampleData } from '@/lib/seed-data';
import { useLiveQuery } from 'dexie-react-hooks';

export default function AdmissionsPage() {
  const [currentView, setCurrentView] = useState<'list' | 'wizard' | 'view'>('list');
  const [selectedApplication, setSelectedApplication] = useState<AdmissionApplication | null>(null);
  const [filters, setFilters] = useState<AdmissionFiltersType>({
    search: '',
    status: '',
    intakeId: '',
    programId: '',
    dateFrom: '',
    dateTo: '',
  });

  // Seed sample data on component mount
  useEffect(() => {
    seedSampleData();
  }, []);

  // Fetch applications for total count
  const applications = useLiveQuery(() => db.applications.toArray());

  const handleCreateNew = () => {
    setCurrentView('wizard');
  };

  const handleViewApplication = (application: AdmissionApplication) => {
    setSelectedApplication(application);
    setCurrentView('view');
  };

  const handleEditApplication = (application: AdmissionApplication) => {
    setSelectedApplication(application);
    setCurrentView('wizard');
  };

  const handleWizardComplete = (application: AdmissionApplication) => {
    setSelectedApplication(application);
    setCurrentView('view');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedApplication(null);
  };

  const handleFiltersChange = (newFilters: AdmissionFiltersType) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      intakeId: '',
      programId: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const renderListView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admissions & Enrolment</h1>
          <p className="text-muted-foreground">
            Manage student admission applications and enrolment processes
          </p>
        </div>
      </div>

      <Tabs defaultValue="applications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-4">
          <AdmissionFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            totalResults={applications?.length || 0}
          />
          <AdmissionsList
            onViewApplication={handleViewApplication}
            onEditApplication={handleEditApplication}
            onCreateNew={handleCreateNew}
            filters={filters}
          />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>
                View and manage uploaded documents across all applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Document management features coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admissions Analytics</CardTitle>
              <CardDescription>
                View statistics and trends for admission applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Analytics dashboard coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admissions Settings</CardTitle>
              <CardDescription>
                Configure admission requirements and workflow settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Settings configuration coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderWizardView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBackToList}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {selectedApplication ? 'Edit Application' : 'New Application'}
          </h1>
          <p className="text-muted-foreground">
            {selectedApplication 
              ? 'Update the admission application details'
              : 'Complete the admission application form'
            }
          </p>
        </div>
      </div>

      <AdmissionWizard
        onComplete={handleWizardComplete}
        onCancel={handleBackToList}
      />
    </div>
  );

  const renderApplicationView = () => {
    if (!selectedApplication) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Application Details</h1>
            <p className="text-muted-foreground">
              View complete application information for {selectedApplication.personalInfo.firstName} {selectedApplication.personalInfo.lastName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">First Name</label>
                  <p className="text-lg">{selectedApplication.personalInfo.firstName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Name</label>
                  <p className="text-lg">{selectedApplication.personalInfo.lastName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg">{selectedApplication.personalInfo.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-lg">{selectedApplication.personalInfo.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                  <p className="text-lg">{selectedApplication.personalInfo.dateOfBirth}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Gender</label>
                  <p className="text-lg capitalize">{selectedApplication.personalInfo.gender}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-lg">
                  {selectedApplication.personalInfo.address.street}, {selectedApplication.personalInfo.address.city}, {selectedApplication.personalInfo.address.state} {selectedApplication.personalInfo.address.zipCode}, {selectedApplication.personalInfo.address.country}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Previous School</label>
                  <p className="text-lg">{selectedApplication.academicInfo.previousSchool}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Grade Level</label>
                  <p className="text-lg">Grade {selectedApplication.academicInfo.gradeLevel}</p>
                </div>
              </div>
              {selectedApplication.academicInfo.gpa && (
                <div>
                  <label className="text-sm font-medium text-gray-500">GPA</label>
                  <p className="text-lg">{selectedApplication.academicInfo.gpa}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Achievements</label>
                <p className="text-lg">{selectedApplication.academicInfo.achievements}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Subjects of Interest</label>
                <p className="text-lg">{selectedApplication.academicInfo.subjects}</p>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents ({selectedApplication.documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedApplication.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedApplication.documents.map((docId, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="font-medium">Document {index + 1}</p>
                          <p className="text-sm text-gray-500">PDF Document</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No documents uploaded</p>
              )}
            </CardContent>
          </Card>

          {/* Application Status */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-lg font-medium capitalize">
                    {selectedApplication.status.replace('_', ' ')}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-lg font-medium">
                    {selectedApplication.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="text-lg font-medium">
                    {selectedApplication.updatedAt.toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Sync Status</p>
                  <p className="text-lg font-medium">
                    {selectedApplication.synced ? 'Synced' : 'Pending'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={handleBackToList}>
            Close
          </Button>
          {selectedApplication.status === 'draft' && (
            <Button onClick={() => handleEditApplication(selectedApplication)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Application
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <OfflineBanner />
      
      {currentView === 'list' && renderListView()}
      {currentView === 'wizard' && renderWizardView()}
      {currentView === 'view' && renderApplicationView()}
    </div>
  );
}
