import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileText,
  Mic,
  Plus,
  Trash2,
  UserPlus
} from 'lucide-react';
import { 
  InterviewSchedule, 
  InterviewRubric, 
  AdmissionApplication,
  generateId,
  generateToken 
} from '@/lib/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';

const scheduleSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  type: z.enum(['written', 'oral']),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  location: z.string().min(3, 'Location must be at least 3 characters'),
  maxCandidates: z.number().min(1, 'Must have at least 1 candidate'),
  description: z.string().optional(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

interface InterviewScheduleFormProps {
  onSave: (schedule: InterviewSchedule, candidates: string[]) => void;
  onCancel: () => void;
}

export const InterviewScheduleForm = ({ onSave, onCancel }: InterviewScheduleFormProps) => {
  const [selectedRubric, setSelectedRubric] = useState<string>('');
  const [selectedPanelMembers, setSelectedPanelMembers] = useState<string[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [showCandidateSelector, setShowCandidateSelector] = useState(false);

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      title: '',
      type: 'oral',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      maxCandidates: 10,
      description: '',
    },
  });

  // Fetch available rubrics, panel members, and applications
  const rubrics = useLiveQuery(() => db.interviewRubrics.toArray());
  const panelMembers = useLiveQuery(() => db.interviewPanelMembers.toArray());
  const applications = useLiveQuery(() => 
    db.applications.where('status').anyOf(['submitted', 'under_review']).toArray()
  );

  const handleSubmit = (data: ScheduleFormData) => {
    if (selectedCandidates.length === 0) {
      alert('Please select at least one candidate');
      return;
    }

    if (data.type === 'oral' && selectedPanelMembers.length === 0) {
      alert('Please select at least one panel member for oral interviews');
      return;
    }

    const schedule: InterviewSchedule = {
      id: generateId(),
      title: data.title,
      type: data.type,
      date: new Date(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      maxCandidates: data.maxCandidates,
      panelMembers: selectedPanelMembers,
      rubricId: selectedRubric || undefined,
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
      synced: false,
    };

    onSave(schedule, selectedCandidates);
  };

  const addPanelMember = () => {
    const name = prompt('Enter panel member name:');
    const email = prompt('Enter panel member email:');
    const role = prompt('Enter panel member role:');
    const specialization = prompt('Enter specialization:');

    if (name && email && role) {
      const panelMember = {
        id: generateId(),
        name,
        email,
        role,
        specialization: specialization || '',
        availability: [],
        createdAt: new Date(),
        synced: false,
      };

      db.interviewPanelMembers.add(panelMember);
    }
  };

  const renderRubricSelector = () => (
    <div>
      <Label htmlFor="rubric">Evaluation Rubric</Label>
      <Select value={selectedRubric} onValueChange={setSelectedRubric}>
        <SelectTrigger>
          <SelectValue placeholder="Select a rubric (optional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">No rubric</SelectItem>
          {rubrics?.map((rubric) => (
            <SelectItem key={rubric.id} value={rubric.id!}>
              {rubric.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-gray-500 mt-1">
        Select a rubric to standardize scoring for this interview session
      </p>
    </div>
  );

  const renderPanelMemberSelector = () => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label>Panel Members</Label>
        <Button type="button" variant="outline" size="sm" onClick={addPanelMember}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>
      
      {panelMembers && panelMembers.length > 0 ? (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {panelMembers.map((member) => (
            <div key={member.id} className="flex items-center space-x-2">
              <Checkbox
                id={member.id}
                checked={selectedPanelMembers.includes(member.id!)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedPanelMembers([...selectedPanelMembers, member.id!]);
                  } else {
                    setSelectedPanelMembers(selectedPanelMembers.filter(id => id !== member.id));
                  }
                }}
              />
              <Label htmlFor={member.id} className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{member.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {member.role}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  {member.email} • {member.specialization}
                </div>
              </Label>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 py-2">
          No panel members available. Click &quot;Add Member&quot; to create one.
        </p>
      )}
    </div>
  );

  const renderCandidateSelector = () => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label>Selected Candidates ({selectedCandidates.length})</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => setShowCandidateSelector(!showCandidateSelector)}
        >
          {showCandidateSelector ? 'Hide' : 'Select Candidates'}
        </Button>
      </div>

      {selectedCandidates.length > 0 && (
        <div className="space-y-2 mb-4">
          {selectedCandidates.map((candidateId) => {
            const candidate = applications?.find(app => app.id === candidateId);
            if (!candidate) return null;

            return (
              <div key={candidateId} className="flex items-center justify-between p-2 border rounded-lg">
                <div>
                  <span className="font-medium">
                    {candidate.personalInfo.firstName} {candidate.personalInfo.lastName}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    {candidate.personalInfo.email}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCandidates(selectedCandidates.filter(id => id !== candidateId))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {showCandidateSelector && applications && (
        <Card className="max-h-60 overflow-y-auto">
          <CardContent className="p-4">
            <div className="space-y-2">
              {applications.map((application) => (
                <div key={application.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={application.id}
                    checked={selectedCandidates.includes(application.id!)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCandidates([...selectedCandidates, application.id!]);
                      } else {
                        setSelectedCandidates(selectedCandidates.filter(id => id !== application.id));
                      }
                    }}
                  />
                  <Label htmlFor={application.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {application.personalInfo.firstName} {application.personalInfo.lastName}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {application.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {application.personalInfo.email} • Grade {application.academicInfo.gradeLevel}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Schedule Interview Session</h2>
        <p className="text-gray-600">
          Create a new interview schedule for written or oral assessments
        </p>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Session Title *</Label>
                <Input
                  id="title"
                  {...form.register('title')}
                  placeholder="e.g., Technical Interview Round 1"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="type">Interview Type *</Label>
                <Select 
                  value={form.watch('type')} 
                  onValueChange={(value) => form.setValue('type', value as 'written' | 'oral')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="written">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Written Test
                      </div>
                    </SelectItem>
                    <SelectItem value="oral">
                      <div className="flex items-center gap-2">
                        <Mic className="h-4 w-4" />
                        Oral Interview
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  {...form.register('date')}
                />
                {form.formState.errors.date && (
                  <p className="text-sm text-red-600">{form.formState.errors.date.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  {...form.register('startTime')}
                />
                {form.formState.errors.startTime && (
                  <p className="text-sm text-red-600">{form.formState.errors.startTime.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  {...form.register('endTime')}
                />
                {form.formState.errors.endTime && (
                  <p className="text-sm text-red-600">{form.formState.errors.endTime.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  {...form.register('location')}
                  placeholder="e.g., Room 101, Building A"
                />
                {form.formState.errors.location && (
                  <p className="text-sm text-red-600">{form.formState.errors.location.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="maxCandidates">Maximum Candidates</Label>
                <Input
                  id="maxCandidates"
                  type="number"
                  min="1"
                  max="100"
                  {...form.register('maxCandidates', { valueAsNumber: true })}
                />
                {form.formState.errors.maxCandidates && (
                  <p className="text-sm text-red-600">{form.formState.errors.maxCandidates.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Additional details about the interview session..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Rubric Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Criteria</CardTitle>
            <CardDescription>
              Select a rubric to standardize scoring for this session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderRubricSelector()}
          </CardContent>
        </Card>

        {/* Panel Members (for oral interviews) */}
        {form.watch('type') === 'oral' && (
          <Card>
            <CardHeader>
              <CardTitle>Panel Members</CardTitle>
              <CardDescription>
                Select interview panel members for oral assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderPanelMemberSelector()}
            </CardContent>
          </Card>
        )}

        {/* Candidate Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Candidate Selection</CardTitle>
            <CardDescription>
              Select candidates to invite for this interview session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderCandidateSelector()}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={selectedCandidates.length === 0 || 
              (form.watch('type') === 'oral' && selectedPanelMembers.length === 0)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Interview
          </Button>
        </div>
      </form>
    </div>
  );
};
