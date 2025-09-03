'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Users, 
  Target, 
  FileText, 
  Mic,
  Plus,
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  MapPin
} from 'lucide-react';
import { 
  InterviewSchedule, 
  InterviewRubric, 
  InterviewCandidate,
  generateId,
  generateToken 
} from '@/lib/database';
import { db } from '@/lib/database';
import { InterviewScheduleForm } from '@/components/interviews/InterviewScheduleForm';
import { RubricEditor } from '@/components/interviews/RubricEditor';
import { CandidateGrid } from '@/components/interviews/CandidateGrid';
import { ScoreEntryDialog } from '@/components/interviews/ScoreEntryDialog';
import { BulkActionsBar } from '@/components/interviews/BulkActionsBar';
import { OfflineBanner } from '@/components/admissions/OfflineBanner';
import { Badge } from '@/components/ui/badge';

export default function InterviewsPage() {
  const [currentView, setCurrentView] = useState<'list' | 'schedule' | 'rubric' | 'candidates'>('list');
  const [selectedSchedule, setSelectedSchedule] = useState<InterviewSchedule | null>(null);
  const [selectedRubric, setSelectedRubric] = useState<InterviewRubric | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<InterviewCandidate | null>(null);
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);

  // Fetch data
  const schedules = useLiveQuery(() => db.interviewSchedules.toArray());
  const rubrics = useLiveQuery(() => db.interviewRubrics.toArray());
  const candidates = useLiveQuery(() => 
    selectedSchedule ? db.interviewCandidates.where('scheduleId').equals(selectedSchedule.id!).toArray() : []
  );

  const handleCreateSchedule = () => {
    setCurrentView('schedule');
    setSelectedSchedule(null);
  };

  const handleEditSchedule = (schedule: InterviewSchedule) => {
    setSelectedSchedule(schedule);
    setCurrentView('schedule');
  };

  const handleViewSchedule = (schedule: InterviewSchedule) => {
    setSelectedSchedule(schedule);
    setCurrentView('candidates');
  };

  const handleCreateRubric = () => {
    setCurrentView('rubric');
    setSelectedRubric(null);
  };

  const handleEditRubric = (rubric: InterviewRubric) => {
    setSelectedRubric(rubric);
    setCurrentView('rubric');
  };

  const handleSaveSchedule = async (schedule: InterviewSchedule, candidateIds: string[]) => {
    try {
      // Save the schedule
      await db.interviewSchedules.add(schedule);

      // Create candidate records
      for (const applicationId of candidateIds) {
        const candidate: InterviewCandidate = {
          id: generateId(),
          scheduleId: schedule.id!,
          applicationId,
          token: schedule.type === 'written' ? generateToken() : undefined,
          attendance: 'scheduled',
          scores: [],
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          synced: false,
        };
        await db.interviewCandidates.add(candidate);
      }

      setCurrentView('list');
    } catch (error) {
      console.error('Failed to save schedule:', error);
      alert('Failed to save schedule. Please try again.');
    }
  };

  const handleSaveRubric = async (rubric: InterviewRubric) => {
    try {
      if (selectedRubric) {
        await db.interviewRubrics.update(selectedRubric.id!, rubric);
      } else {
        await db.interviewRubrics.add(rubric);
      }
      setCurrentView('list');
    } catch (error) {
      console.error('Failed to save rubric:', error);
      alert('Failed to save rubric. Please try again.');
    }
  };

  const handleViewCandidate = (candidate: InterviewCandidate) => {
    setSelectedCandidate(candidate);
    // You could implement a detailed view here
  };

  const handleEditCandidate = (candidate: InterviewCandidate) => {
    setSelectedCandidate(candidate);
    // You could implement editing here
  };

  const handleScoreCandidate = (candidate: InterviewCandidate) => {
    setSelectedCandidate(candidate);
    setIsScoreDialogOpen(true);
  };

  const handleScoreSave = (scores: unknown[]) => {
    // Scores are already saved in the dialog
    setIsScoreDialogOpen(false);
    setSelectedCandidate(null);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedSchedule(null);
    setSelectedRubric(null);
    setSelectedCandidate(null);
  };

  const renderListView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interview Management</h1>
          <p className="text-muted-foreground">
            Schedule interviews, manage rubrics, and evaluate candidates
          </p>
        </div>
      </div>

      <Tabs defaultValue="schedules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedules
          </TabsTrigger>
          <TabsTrigger value="rubrics" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Rubrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Interview Schedules</h2>
            <Button onClick={handleCreateSchedule}>
              <Plus className="h-4 w-4 mr-2" />
              New Schedule
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules?.map((schedule) => (
              <Card key={schedule.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {schedule.type === 'written' ? (
                        <FileText className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Mic className="h-5 w-5 text-green-600" />
                      )}
                      <Badge variant={schedule.status === 'completed' ? 'default' : 'outline'}>
                        {schedule.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{schedule.title}</CardTitle>
                  <CardDescription>
                    {schedule.date.toLocaleDateString()} • {schedule.startTime} - {schedule.endTime}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{schedule.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>Max: {schedule.maxCandidates}</span>
                    </div>
                    {schedule.panelMembers.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{schedule.panelMembers.length} panel members</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSchedule(schedule)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSchedule(schedule)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {schedules?.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules yet</h3>
                <p className="text-gray-500 mb-4">
                  Create your first interview schedule to get started
                </p>
                <Button onClick={handleCreateSchedule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Schedule
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rubrics" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Evaluation Rubrics</h2>
            <Button onClick={handleCreateRubric}>
              <Plus className="h-4 w-4 mr-2" />
              New Rubric
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rubrics?.map((rubric) => (
              <Card key={rubric.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{rubric.name}</CardTitle>
                  <CardDescription>
                    {rubric.criteria.length} criteria • {rubric.totalWeight}% total weight
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">{rubric.description}</p>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-gray-500" />
                      <span>Passing: {rubric.passingScore}%</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditRubric(rubric)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {rubrics?.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No rubrics yet</h3>
                <p className="text-gray-500 mb-4">
                  Create evaluation rubrics to standardize interview scoring
                </p>
                <Button onClick={handleCreateRubric}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rubric
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderScheduleView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBackToList}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {selectedSchedule ? 'Edit Schedule' : 'New Interview Schedule'}
          </h1>
          <p className="text-muted-foreground">
            {selectedSchedule 
              ? 'Update the interview schedule details'
              : 'Create a new interview schedule for written or oral assessments'
            }
          </p>
        </div>
      </div>

      <InterviewScheduleForm
        onSave={handleSaveSchedule}
        onCancel={handleBackToList}
      />
    </div>
  );

  const renderRubricView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBackToList}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {selectedRubric ? 'Edit Rubric' : 'New Evaluation Rubric'}
          </h1>
          <p className="text-muted-foreground">
            {selectedRubric 
              ? 'Update the evaluation criteria and scoring weights'
              : 'Define evaluation criteria and scoring weights for interviews'
            }
          </p>
        </div>
      </div>

      <RubricEditor
        rubric={selectedRubric}
        onSave={handleSaveRubric}
        onCancel={handleBackToList}
      />
    </div>
  );

  const renderCandidatesView = () => {
    if (!selectedSchedule) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {selectedSchedule.title} - Candidates
            </h1>
            <p className="text-muted-foreground">
              Manage candidates and enter scores for {selectedSchedule.type === 'written' ? 'written test' : 'oral interview'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CandidateGrid
              scheduleId={selectedSchedule.id!}
              onViewCandidate={handleViewCandidate}
              onEditCandidate={handleEditCandidate}
              onScoreCandidate={handleScoreCandidate}
            />
          </div>
          
          <div>
            <BulkActionsBar
              schedule={selectedSchedule}
              candidates={candidates || []}
              onRefresh={() => {
                // Force refresh of candidates
                window.location.reload();
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <OfflineBanner />
      
      {currentView === 'list' && renderListView()}
      {currentView === 'schedule' && renderScheduleView()}
      {currentView === 'rubric' && renderRubricView()}
      {currentView === 'candidates' && renderCandidatesView()}

      {/* Score Entry Dialog */}
      <ScoreEntryDialog
        candidate={selectedCandidate}
        rubric={selectedSchedule?.rubricId ? rubrics?.find(r => r.id === selectedSchedule.rubricId) || null : null}
        isOpen={isScoreDialogOpen}
        onClose={() => setIsScoreDialogOpen(false)}
        onSave={handleScoreSave}
      />
    </div>
  );
}
