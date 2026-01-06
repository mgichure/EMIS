'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  GraduationCap,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Download,
  Eye,
  Plus
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, AdmissionApplication, Intake, Program, StudentProfile } from '@/lib/database';
import { DecisionDialog } from '@/components/admissions/DecisionDialog';
import { StudentConversionDialog } from '@/components/admissions/StudentConversionDialog';
import { DocumentUpload, UploadedDocument } from '@/components/ui/document-upload';
import { format } from 'date-fns';

export default function AdmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;
  
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [showConversionDialog, setShowConversionDialog] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);

  // Fetch application and related data
  const application = useLiveQuery(() => 
    applicationId ? db.applications.get(applicationId) : undefined
  );
  const intake = useLiveQuery(() => 
    application?.intakeId ? db.intakes.get(application.intakeId) : undefined
  );
  const program = useLiveQuery(() => 
    application?.programId ? db.programs.get(application.programId) : undefined
  );
  const documents = useLiveQuery(() => 
    applicationId ? db.documents.where('applicationId').equals(applicationId).toArray() : []
  );
  const studentProfile = useLiveQuery(() => 
    applicationId ? db.studentProfiles.where('admissionId').equals(applicationId).first() : undefined
  );

  const handleDecisionUpdate = async (decision: 'accepted' | 'rejected', notes: string) => {
    if (!application) return;

    try {
      const updatedApplication: AdmissionApplication = {
        ...application,
        status: decision,
        decisions: [
          ...(application.decisions || []),
          {
            id: `decision_${Date.now()}`,
            decision: decision,
            reason: notes || `Application ${decision}`,
            decisionBy: 'Current User', // TODO: Get from auth context
            decisionDate: new Date(),
            notes: notes
          }
        ],
        timeline: [
          ...(application.timeline || []),
          {
            id: `timeline_${Date.now()}`,
            action: `Status changed to ${decision}`,
            description: `Application ${decision} - ${notes || 'No notes provided'}`,
            timestamp: new Date(),
            userId: 'Current User', // TODO: Get from auth context
            metadata: { decision, previousStatus: application.status }
          }
        ],
        updatedAt: new Date()
      };

      await db.applications.put(updatedApplication);
      setShowDecisionDialog(false);
    } catch (error) {
      console.error('Failed to update application:', error);
    }
  };

  const handleStudentConversion = async (studentProfile: StudentProfile) => {
    try {
      // Create student profile
      const newStudentProfile = await db.studentProfiles.add(studentProfile);
      
      // Update application status
      if (application) {
        await db.applications.update(application.id!, {
          status: 'enrolled',
          timeline: [
            ...(application.timeline || []),
            {
              id: `timeline_${Date.now()}`,
              action: 'Converted to Student',
              description: `Application converted to student profile #${studentProfile.studentNumber}`,
              timestamp: new Date(),
              userId: 'Current User', // TODO: Get from auth context
              metadata: { studentProfileId: newStudentProfile }
            }
          ],
          updatedAt: new Date()
        });
      }

      setShowConversionDialog(false);
      // Redirect to student profile or show success message
    } catch (error) {
      console.error('Failed to create student profile:', error);
    }
  };

  const handleDocumentUpload = async (uploadedDocs: UploadedDocument[]) => {
    if (!application) return;

    try {
      // Convert UploadedDocument to AdmissionDocument
      const admissionDocs = uploadedDocs.map(doc => ({
        id: doc.id,
        applicationId: application.id!,
        name: doc.name,
        type: doc.type,
        size: doc.size,
        data: doc.data,
        uploadedAt: doc.uploadedAt,
        synced: false
      }));

      // Add documents to database
      for (const doc of admissionDocs) {
        await db.documents.add(doc);
      }

      // Update application documents array
      await db.applications.update(application.id!, {
        documents: [...(application.documents || []), ...admissionDocs.map(d => d.id)],
        timeline: [
          ...(application.timeline || []),
          {
            id: `timeline_${Date.now()}`,
            action: 'Documents Uploaded',
            description: `${uploadedDocs.length} document(s) uploaded`,
            timestamp: new Date(),
            userId: 'Current User', // TODO: Get from auth context
            metadata: { documentCount: uploadedDocs.length }
          }
        ],
        updatedAt: new Date()
      });

      setShowDocumentUpload(false);
    } catch (error) {
      console.error('Failed to upload documents:', error);
    }
  };

  if (!application) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p>Loading application...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'waitlisted': return 'bg-orange-100 text-orange-800';
      case 'enrolled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canMakeDecision = ['submitted', 'under_review'].includes(application.status);
  const canConvertToStudent = application.status === 'accepted' && !studentProfile;

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {application.personalInfo.firstName} {application.personalInfo.lastName}
            </h1>
            <p className="text-gray-600">Application ID: {application.id}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className={getStatusColor(application.status)}>
            {application.status.replace('_', ' ')}
          </Badge>
          
          {canMakeDecision && (
            <Button
              onClick={() => setShowDecisionDialog(true)}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Make Decision
            </Button>
          )}
          
          {canConvertToStudent && (
            <Button
              onClick={() => setShowConversionDialog(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Create Student
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => setShowDocumentUpload(true)}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Upload Docs
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                  <p className="font-medium">
                    {application.personalInfo.firstName} {application.personalInfo.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {application.personalInfo.email}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {application.personalInfo.phone}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Date of Birth</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(application.personalInfo.dateOfBirth), 'PPP')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Gender</Label>
                  <p className="font-medium capitalize">{application.personalInfo.gender}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-500">Address</Label>
                  <p className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {application.personalInfo.address.street}, {application.personalInfo.address.city}, {application.personalInfo.address.state} {application.personalInfo.address.zipCode}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Previous School</Label>
                  <p className="font-medium">{application.academicInfo.previousSchool}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Grade Level</Label>
                  <p className="font-medium">{application.academicInfo.gradeLevel}</p>
                </div>
                {application.academicInfo.gpa && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">GPA</Label>
                    <p className="font-medium">{application.academicInfo.gpa}</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-500">Subjects</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {application.academicInfo.subjects.map((subject, index) => (
                      <Badge key={index} variant="outline">{subject}</Badge>
                    ))}
                  </div>
                </div>
                {application.academicInfo.achievements.length > 0 && (
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">Achievements</Label>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {application.academicInfo.achievements.map((achievement, index) => (
                        <li key={index} className="text-sm">{achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents ({documents?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents && documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">{doc.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {doc.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">
                        {(doc.size / 1024 / 1024).toFixed(2)} MB • Uploaded {format(new Date(doc.uploadedAt), 'PP')}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No documents uploaded yet</p>
                  <Button
                    variant="outline"
                    onClick={() => setShowDocumentUpload(true)}
                    className="mt-2"
                  >
                    Upload Documents
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {application.timeline && application.timeline.length > 0 ? (
                  application.timeline
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((event) => (
                      <div key={event.id} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="font-medium">{event.action}</p>
                          <p className="text-sm text-gray-600">{event.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(event.timestamp), 'PPp')} by {event.userId}
                          </p>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No timeline events yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Application Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Application Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <Badge className={`mt-1 ${getStatusColor(application.status)}`}>
                  {application.status.replace('_', ' ')}
                </Badge>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Created</Label>
                <p className="text-sm">{format(new Date(application.createdAt), 'PP')}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                <p className="text-sm">{format(new Date(application.updatedAt), 'PP')}</p>
              </div>

              {intake && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Intake</Label>
                  <p className="text-sm font-medium">{intake.name}</p>
                  <p className="text-xs text-gray-500">{intake.academicYear}</p>
                </div>
              )}

              {program && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Program</Label>
                  <p className="text-sm font-medium">{program.name}</p>
                  <p className="text-xs text-gray-500">{program.code} • {program.level}</p>
                </div>
              )}

              {studentProfile && (
                <div className="pt-4 border-t">
                  <Label className="text-sm font-medium text-gray-500">Student Profile</Label>
                  <p className="text-sm font-medium text-green-600">
                    #{studentProfile.studentNumber}
                  </p>
                  <p className="text-xs text-gray-500">Enrolled on {format(new Date(studentProfile.academicInfo.enrollmentDate), 'PP')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Decisions */}
          {application.decisions && application.decisions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Decisions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {application.decisions.map((decision) => (
                    <div key={decision.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={
                          decision.decision === 'accepted' ? 'bg-green-100 text-green-800' :
                          decision.decision === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }>
                          {decision.decision}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(new Date(decision.decisionDate), 'PP')}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{decision.reason}</p>
                      {decision.notes && (
                        <p className="text-xs text-gray-600 mt-1">{decision.notes}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">By: {decision.decisionBy}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <DecisionDialog
        isOpen={showDecisionDialog}
        onClose={() => setShowDecisionDialog(false)}
        onDecision={handleDecisionUpdate}
        application={application}
      />

      <StudentConversionDialog
        application={application}
        isOpen={showConversionDialog}
        onClose={() => setShowConversionDialog(false)}
        onConvert={handleStudentConversion}
      />

      {showDocumentUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upload Documents</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDocumentUpload(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <DocumentUpload
              documents={[]}
              onDocumentsChange={handleDocumentUpload}
              title="Upload Supporting Documents"
              description="Upload documents for this application (PDF, JPG, PNG)"
            />
          </div>
        </div>
      )}
    </div>
  );
}
