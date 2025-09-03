import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  FileText, 
  Image, 
  File, 
  X,
  Eye,
  Download
} from 'lucide-react';
import { db, generateId, generateClientId, addToSyncQueue, AdmissionApplication, AdmissionDocument } from '@/lib/database';
import { useSyncQueue } from '@/hooks/useSyncQueue';
import { useLiveQuery } from 'dexie-react-hooks';

const personalInfoSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  address: z.object({
    street: z.string().min(5, 'Street address must be at least 5 characters'),
    city: z.string().min(2, 'City must be at least 2 characters'),
    state: z.string().min(2, 'State must be at least 2 characters'),
    zipCode: z.string().min(5, 'ZIP code must be at least 5 characters'),
    country: z.string().min(2, 'Country must be at least 2 characters'),
  }),
});

const contactInfoSchema = z.object({
  emergencyContact: z.object({
    name: z.string().min(2, 'Emergency contact name is required'),
    relationship: z.string().min(2, 'Relationship is required'),
    phone: z.string().min(10, 'Emergency contact phone is required'),
    email: z.string().email('Invalid email address').optional(),
  }),
  alternativePhone: z.string().optional(),
  alternativeEmail: z.string().email('Invalid email address').optional(),
});

const academicInfoSchema = z.object({
  previousSchool: z.string().min(2, 'Previous school name is required'),
  gradeLevel: z.string().min(1, 'Grade level is required'),
  gpa: z.number().min(0).max(4).optional(),
  achievements: z.array(z.string()).min(1, 'At least one achievement is required'),
  subjects: z.array(z.string()).min(1, 'At least one subject is required'),
  transcripts: z.array(z.string()).optional(),
});

const programSelectionSchema = z.object({
  intakeId: z.string().min(1, 'Intake selection is required'),
  programId: z.string().min(1, 'Program selection is required'),
});

type PersonalInfo = z.infer<typeof personalInfoSchema>;
type ContactInfo = z.infer<typeof contactInfoSchema>;
type AcademicInfo = z.infer<typeof academicInfoSchema>;
type ProgramSelection = z.infer<typeof programSelectionSchema>;

interface AdmissionWizardProps {
  onComplete: (application: AdmissionApplication) => void;
  onCancel: () => void;
}

export const AdmissionWizard = ({ onComplete, onCancel }: AdmissionWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [academicInfo, setAcademicInfo] = useState<AcademicInfo | null>(null);
  const [programSelection, setProgramSelection] = useState<ProgramSelection | null>(null);
  const [documents, setDocuments] = useState<AdmissionDocument[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOnline } = useSyncQueue();

  // Fetch available intakes and programs
  const intakes = useLiveQuery(() => db.intakes.toArray());
  const programs = useLiveQuery(() => db.programs.toArray());

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const personalForm = useForm<PersonalInfo>({
    resolver: zodResolver(personalInfoSchema),
  });

  const contactForm = useForm<ContactInfo>({
    resolver: zodResolver(contactInfoSchema),
  });

  const academicForm = useForm<AcademicInfo>({
    resolver: zodResolver(academicInfoSchema),
  });

  const programSelectionForm = useForm<ProgramSelection>({
    resolver: zodResolver(programSelectionSchema),
  });

  const handlePersonalSubmit = (data: PersonalInfo) => {
    setPersonalInfo(data);
    setCurrentStep(2);
  };

  const handleContactSubmit = (data: ContactInfo) => {
    setContactInfo(data);
    setCurrentStep(3);
  };

  const handleAcademicSubmit = (data: AcademicInfo) => {
    setAcademicInfo(data);
    setCurrentStep(4);
  };

  const handleProgramSelectionSubmit = (data: ProgramSelection) => {
    setProgramSelection(data);
    setCurrentStep(5);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(async (file) => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} is not supported. Please upload PDF, JPG, or PNG files.`);
        return;
      }

      const document: AdmissionDocument = {
        id: generateId(),
        applicationId: '', // Will be set when application is created
        name: file.name,
        type: file.type === 'application/pdf' ? 'pdf' : file.type === 'image/jpeg' ? 'jpg' : 'png',
        size: file.size,
        data: file,
        uploadedAt: new Date(),
        synced: false,
      };

      setDocuments(prev => [...prev, document]);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const previewDocument = (document: AdmissionDocument) => {
    const url = URL.createObjectURL(document.data);
    window.open(url, '_blank');
  };

  const handleSubmit = async () => {
    if (!personalInfo || !contactInfo || !academicInfo || !programSelection) return;

    setIsSubmitting(true);
    try {
      const application: AdmissionApplication = {
        id: generateId(),
        clientId: generateClientId(),
        personalInfo,
        contactInfo,
        academicInfo,
        intakeId: programSelection.intakeId,
        programId: programSelection.programId,
        documents: documents.map(doc => doc.id!),
        status: 'draft',
        decisions: [],
        timeline: [{
          id: `timeline_${Date.now()}`,
          action: 'Application Created',
          description: 'Application draft created',
          timestamp: new Date(),
          userId: 'Current User', // TODO: Get from auth context
        }],
        syncStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        synced: false,
      };

      // Save to local database
      await db.applications.add(application);

      // Save documents
      for (const doc of documents) {
        await db.documents.add({
          ...doc,
          applicationId: application.id!,
        });
      }

      // Add to sync queue if online
      if (isOnline) {
        await addToSyncQueue({
          type: 'application',
          action: 'create',
          data: application,
          retryCount: 0,
          lastAttempt: new Date(),
        });
      }

      onComplete(application);
    } catch (error) {
      console.error('Failed to save application:', error);
      alert('Failed to save application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
        <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>Personal</span>
        <span>Contacts</span>
        <span>Academics</span>
        <span>Program</span>
        <span>Documents</span>
        <span>Review</span>
      </div>
    </div>
  );

  const renderPersonalStep = () => (
    <form onSubmit={personalForm.handleSubmit(handlePersonalSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            {...personalForm.register('firstName')}
            placeholder="Enter first name"
          />
          {personalForm.formState.errors.firstName && (
            <p className="text-sm text-red-600">{personalForm.formState.errors.firstName.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            {...personalForm.register('lastName')}
            placeholder="Enter last name"
          />
          {personalForm.formState.errors.lastName && (
            <p className="text-sm text-red-600">{personalForm.formState.errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...personalForm.register('email')}
            placeholder="Enter email address"
          />
          {personalForm.formState.errors.email && (
            <p className="text-sm text-red-600">{personalForm.formState.errors.email.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            {...personalForm.register('phone')}
            placeholder="Enter phone number"
          />
          {personalForm.formState.errors.phone && (
            <p className="text-sm text-red-600">{personalForm.formState.errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            {...personalForm.register('dateOfBirth')}
          />
          {personalForm.formState.errors.dateOfBirth && (
            <p className="text-sm text-red-600">{personalForm.formState.errors.dateOfBirth.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="gender">Gender *</Label>
          <Select onValueChange={(value) => personalForm.setValue('gender', value as 'male' | 'female' | 'other')}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {personalForm.formState.errors.gender && (
            <p className="text-sm text-red-600">{personalForm.formState.errors.gender.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <Label>Address</Label>
        <Input
          {...personalForm.register('address.street')}
          placeholder="Street address"
        />
        <div className="grid grid-cols-4 gap-4">
          <Input
            {...personalForm.register('address.city')}
            placeholder="City"
          />
          <Input
            {...personalForm.register('address.state')}
            placeholder="State"
          />
          <Input
            {...personalForm.register('address.zipCode')}
            placeholder="ZIP Code"
          />
          <Input
            {...personalForm.register('address.country')}
            placeholder="Country"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">Next: Academic Information</Button>
      </div>
    </form>
  );

  const renderContactStep = () => (
    <form onSubmit={contactForm.handleSubmit(handleContactSubmit)} className="space-y-4">
      <div>
        <Label className="text-lg font-semibold mb-4 block">Emergency Contact Information</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="emergencyName">Emergency Contact Name *</Label>
            <Input
              id="emergencyName"
              {...contactForm.register('emergencyContact.name')}
              placeholder="Enter emergency contact name"
            />
            {contactForm.formState.errors.emergencyContact?.name && (
              <p className="text-sm text-red-600">{contactForm.formState.errors.emergencyContact.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="emergencyRelationship">Relationship *</Label>
            <Select onValueChange={(value) => contactForm.setValue('emergencyContact.relationship', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="guardian">Guardian</SelectItem>
                <SelectItem value="spouse">Spouse</SelectItem>
                <SelectItem value="sibling">Sibling</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {contactForm.formState.errors.emergencyContact?.relationship && (
              <p className="text-sm text-red-600">{contactForm.formState.errors.emergencyContact.relationship.message}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
            <Input
              id="emergencyPhone"
              {...contactForm.register('emergencyContact.phone')}
              placeholder="Enter emergency contact phone"
            />
            {contactForm.formState.errors.emergencyContact?.phone && (
              <p className="text-sm text-red-600">{contactForm.formState.errors.emergencyContact.phone.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="emergencyEmail">Emergency Contact Email (Optional)</Label>
            <Input
              id="emergencyEmail"
              type="email"
              {...contactForm.register('emergencyContact.email')}
              placeholder="Enter emergency contact email"
            />
            {contactForm.formState.errors.emergencyContact?.email && (
              <p className="text-sm text-red-600">{contactForm.formState.errors.emergencyContact.email.message}</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <Label className="text-lg font-semibold mb-4 block">Alternative Contact Information</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="alternativePhone">Alternative Phone (Optional)</Label>
            <Input
              id="alternativePhone"
              {...contactForm.register('alternativePhone')}
              placeholder="Enter alternative phone number"
            />
          </div>
          <div>
            <Label htmlFor="alternativeEmail">Alternative Email (Optional)</Label>
            <Input
              id="alternativeEmail"
              type="email"
              {...contactForm.register('alternativeEmail')}
              placeholder="Enter alternative email address"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button type="submit">Next: Academic Information</Button>
      </div>
    </form>
  );

  const renderAcademicStep = () => (
    <form onSubmit={academicForm.handleSubmit(handleAcademicSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="previousSchool">Previous School *</Label>
          <Input
            id="previousSchool"
            {...academicForm.register('previousSchool')}
            placeholder="Enter previous school name"
          />
          {academicForm.formState.errors.previousSchool && (
            <p className="text-sm text-red-600">{academicForm.formState.errors.previousSchool.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="gradeLevel">Grade Level *</Label>
          <Select onValueChange={(value) => academicForm.setValue('gradeLevel', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select grade level" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => (
                <SelectItem key={grade} value={grade.toString()}>
                  Grade {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {academicForm.formState.errors.gradeLevel && (
            <p className="text-sm text-red-600">{academicForm.formState.errors.gradeLevel.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="gpa">GPA (Optional)</Label>
        <Input
          id="gpa"
          type="number"
          step="0.01"
          min="0"
          max="4"
          {...academicForm.register('gpa', { valueAsNumber: true })}
          placeholder="Enter GPA (0.0 - 4.0)"
        />
      </div>

      <div>
        <Label>Achievements *</Label>
        <Textarea
          {...academicForm.register('achievements')}
          placeholder="List your academic achievements, awards, and honors (one per line)"
          rows={3}
          onChange={(e) => {
            const lines = e.target.value.split('\n').filter(line => line.trim());
            academicForm.setValue('achievements', lines);
          }}
        />
        {academicForm.formState.errors.achievements && (
          <p className="text-sm text-red-600">{academicForm.formState.errors.achievements.message}</p>
        )}
      </div>

      <div>
        <Label>Subjects of Interest *</Label>
        <Textarea
          {...academicForm.register('subjects')}
          placeholder="List subjects you're interested in studying (one per line)"
          rows={3}
          onChange={(e) => {
            const lines = e.target.value.split('\n').filter(line => line.trim());
            academicForm.setValue('subjects', lines);
          }}
        />
        {academicForm.formState.errors.subjects && (
          <p className="text-sm text-red-600">{academicForm.formState.errors.subjects.message}</p>
        )}
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => setCurrentStep(3)}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button type="submit">Next: Program Selection</Button>
      </div>
    </form>
  );

  const renderProgramSelectionStep = () => (
    <form onSubmit={programSelectionForm.handleSubmit(handleProgramSelectionSubmit)} className="space-y-6">
      <div>
        <Label className="text-lg font-semibold mb-4 block">Select Intake</Label>
        <div className="space-y-4">
          {intakes && intakes.length > 0 ? (
            intakes.map((intake) => (
              <div key={intake.id} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id={`intake-${intake.id}`}
                    name="intakeId"
                    value={intake.id}
                    onChange={(e) => programSelectionForm.setValue('intakeId', e.target.value)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <Label htmlFor={`intake-${intake.id}`} className="text-lg font-medium cursor-pointer">
                      {intake.name}
                    </Label>
                    <p className="text-sm text-gray-600">{intake.academicYear}</p>
                    <p className="text-xs text-gray-500">
                      {intake.startDate && new Date(intake.startDate).toLocaleDateString()} - {intake.endDate && new Date(intake.endDate).toLocaleDateString()}
                    </p>
                    <Badge variant={intake.status === 'open' ? 'default' : 'secondary'} className="mt-1">
                      {intake.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No intakes available</p>
            </div>
          )}
        </div>
        {programSelectionForm.formState.errors.intakeId && (
          <p className="text-sm text-red-600">{programSelectionForm.formState.errors.intakeId.message}</p>
        )}
      </div>

      <div>
        <Label className="text-lg font-semibold mb-4 block">Select Program</Label>
        <div className="space-y-4">
          {programs && programs.length > 0 ? (
            programs.map((program) => (
              <div key={program.id} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id={`program-${program.id}`}
                    name="programId"
                    value={program.id}
                    onChange={(e) => programSelectionForm.setValue('programId', e.target.value)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <Label htmlFor={`program-${program.id}`} className="text-lg font-medium cursor-pointer">
                      {program.name}
                    </Label>
                    <p className="text-sm text-gray-600">{program.code} • {program.level}</p>
                    <p className="text-sm text-gray-500">{program.duration}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Tuition: ${program.feeStructure.tuition.toLocaleString()} | 
                      Registration: ${program.feeStructure.registration.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No programs available</p>
            </div>
          )}
        </div>
        {programSelectionForm.formState.errors.programId && (
          <p className="text-sm text-red-600">{programSelectionForm.formState.errors.programId.message}</p>
        )}
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => setCurrentStep(4)}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button type="submit">Next: Document Upload</Button>
      </div>
    </form>
  );

  const renderDocumentsStep = () => (
    <div className="space-y-4">
      <div>
        <Label>Upload Documents</Label>
        <p className="text-sm text-gray-600 mb-4">
          Upload required documents (PDF, JPG, PNG). Maximum file size: 10MB
        </p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop files here, or click to browse
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {documents.length > 0 && (
        <div>
          <Label>Uploaded Documents ({documents.length})</Label>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {doc.type === 'pdf' ? (
                    <FileText className="h-5 w-5 text-red-500" />
                  ) : (
                    <Image className="h-5 w-5 text-blue-500" />
                  )}
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-gray-500">
                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => previewDocument(doc)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeDocument(doc.id!)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => setCurrentStep(4)}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button onClick={() => setCurrentStep(6)} disabled={documents.length === 0}>
          Next: Review
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <p><span className="font-medium">Name:</span> {personalInfo?.firstName} {personalInfo?.lastName}</p>
          <p><span className="font-medium">Email:</span> {personalInfo?.email}</p>
          <p><span className="font-medium">Phone:</span> {personalInfo?.phone}</p>
          <p><span className="font-medium">Date of Birth:</span> {personalInfo?.dateOfBirth}</p>
          <p><span className="font-medium">Gender:</span> {personalInfo?.gender}</p>
          <p><span className="font-medium">Address:</span> {personalInfo?.address.street}, {personalInfo?.address.city}, {personalInfo?.address.state} {personalInfo?.address.zipCode}, {personalInfo?.address.country}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <p><span className="font-medium">Emergency Contact:</span> {contactInfo?.emergencyContact.name} ({contactInfo?.emergencyContact.relationship})</p>
          <p><span className="font-medium">Emergency Phone:</span> {contactInfo?.emergencyContact.phone}</p>
          {contactInfo?.emergencyContact.email && <p><span className="font-medium">Emergency Email:</span> {contactInfo.emergencyContact.email}</p>}
          {contactInfo?.alternativePhone && <p><span className="font-medium">Alternative Phone:</span> {contactInfo.alternativePhone}</p>}
          {contactInfo?.alternativeEmail && <p><span className="font-medium">Alternative Email:</span> {contactInfo.alternativeEmail}</p>}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Academic Information</h3>
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <p><span className="font-medium">Previous School:</span> {academicInfo?.previousSchool}</p>
          <p><span className="font-medium">Grade Level:</span> Grade {academicInfo?.gradeLevel}</p>
          {academicInfo?.gpa && <p><span className="font-medium">GPA:</span> {academicInfo.gpa}</p>}
          <p><span className="font-medium">Achievements:</span> {academicInfo?.achievements}</p>
          <p><span className="font-medium">Subjects:</span> {academicInfo?.subjects}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Program Selection</h3>
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          {intakes && intakes.find(i => i.id === programSelection?.intakeId) && (
            <p><span className="font-medium">Intake:</span> {intakes.find(i => i.id === programSelection?.intakeId)?.name} ({intakes.find(i => i.id === programSelection?.intakeId)?.academicYear})</p>
          )}
          {programs && programs.find(p => p.id === programSelection?.programId) && (
            <p><span className="font-medium">Program:</span> {programs.find(p => p.id === programSelection?.programId)?.name} ({programs.find(p => p.id === programSelection?.programId)?.code})</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Documents ({documents.length})</h3>
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg">
              {doc.type === 'pdf' ? (
                <FileText className="h-5 w-5 text-red-500" />
              ) : (
                <Image className="h-5 w-5 text-blue-500" />
              )}
              <span className="font-medium">{doc.name}</span>
              <Badge variant="secondary">{(doc.size / 1024 / 1024).toFixed(2)} MB</Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => setCurrentStep(5)}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Submit Application'}
        </Button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderPersonalStep();
      case 2:
        return renderContactStep();
      case 3:
        return renderAcademicStep();
      case 4:
        return renderProgramSelectionStep();
      case 5:
        return renderDocumentsStep();
      case 6:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Admission Application</CardTitle>
        <CardDescription>
          Complete your admission application. You can save as draft and submit later.
        </CardDescription>
        {renderStepIndicator()}
      </CardHeader>
      <CardContent>
        {renderCurrentStep()}
      </CardContent>
    </Card>
  );
};
