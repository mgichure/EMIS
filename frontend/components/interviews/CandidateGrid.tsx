import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuCheckboxItem, 
  DropdownMenuContent, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Filter, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  Mic,
  Copy,
  Eye,
  Edit
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  InterviewCandidate, 
  InterviewSchedule, 
  AdmissionApplication,
  InterviewRubric 
} from '@/lib/database';
import { db } from '@/lib/database';
import { formatDistanceToNow } from 'date-fns';

interface CandidateGridProps {
  scheduleId: string;
  onViewCandidate: (candidate: InterviewCandidate) => void;
  onEditCandidate: (candidate: InterviewCandidate) => void;
  onScoreCandidate: (candidate: InterviewCandidate) => void;
}

export const CandidateGrid = ({ 
  scheduleId, 
  onViewCandidate, 
  onEditCandidate, 
  onScoreCandidate 
}: CandidateGridProps) => {
  const [attendanceFilter, setAttendanceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data
  const schedule = useLiveQuery(() => db.interviewSchedules.get(scheduleId));
  const candidates = useLiveQuery(() => 
    db.interviewCandidates.where('scheduleId').equals(scheduleId).toArray()
  );
  const applications = useLiveQuery(() => db.applications.toArray());
  const rubric = useLiveQuery(() => 
    schedule?.rubricId ? db.interviewRubrics.get(schedule.rubricId) : null
  );

  const filteredCandidates = useMemo(() => {
    if (!candidates) return [];
    
    let filtered = candidates;
    
    // Attendance filter
    if (attendanceFilter !== 'all') {
      filtered = filtered.filter(candidate => candidate.attendance === attendanceFilter);
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(candidate => candidate.status === statusFilter);
    }
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(candidate => {
        const application = applications?.find(app => app.id === candidate.applicationId);
        if (!application) return false;
        
        return (
          application.personalInfo.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          application.personalInfo.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          application.personalInfo.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          candidate.token?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }
    
    return filtered;
  }, [candidates, applications, attendanceFilter, statusFilter, searchQuery]);

  const updateAttendance = async (candidateId: string, attendance: InterviewCandidate['attendance']) => {
    try {
      await db.interviewCandidates.update(candidateId, {
        attendance,
        checkInTime: attendance === 'present' ? new Date() : undefined,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to update attendance:', error);
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    // You could add a toast notification here
  };

  const calculateTotalScore = (candidate: InterviewCandidate) => {
    if (!rubric || candidate.scores.length === 0) return candidate.totalScore || 0;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    candidate.scores.forEach(score => {
      const criteria = rubric.criteria.find(c => c.id === score.criteriaId);
      if (criteria) {
        totalScore += (score.score / score.maxScore) * criteria.weight;
        totalWeight += criteria.weight;
      }
    });
    
    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'passed':
        return <Badge className="bg-green-100 text-green-800">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAttendanceBadge = (attendance: string) => {
    switch (attendance) {
      case 'scheduled':
        return <Badge variant="outline">Scheduled</Badge>;
      case 'present':
        return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'late':
        return <Badge className="bg-orange-100 text-orange-800">Late</Badge>;
      default:
        return <Badge variant="secondary">{attendance}</Badge>;
    }
  };

  if (!schedule) {
    return <div>Schedule not found</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {schedule.type === 'written' ? (
                <FileText className="h-5 w-5 text-blue-600" />
              ) : (
                <Mic className="h-5 w-5 text-green-600" />
              )}
              {schedule.title} - Candidates
            </CardTitle>
            <CardDescription>
              {schedule.type === 'written' ? 'Written Test' : 'Oral Interview'} • {schedule.date.toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={schedule.status === 'completed' ? 'default' : 'outline'}>
              {schedule.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Attendance</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="late">Late</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            placeholder="Search candidates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {candidates?.length || 0}
            </div>
            <div className="text-sm text-blue-600">Total Candidates</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {candidates?.filter(c => c.attendance === 'present').length || 0}
            </div>
            <div className="text-sm text-green-600">Present</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {candidates?.filter(c => c.attendance === 'absent').length || 0}
            </div>
            <div className="text-sm text-orange-600">Absent</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {candidates?.filter(c => c.status === 'completed').length || 0}
            </div>
            <div className="text-sm text-purple-600">Completed</div>
          </div>
        </div>

        {/* Candidates Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                {schedule.type === 'written' && <TableHead>Token</TableHead>}
                <TableHead>Attendance</TableHead>
                <TableHead>Check-in Time</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((candidate) => {
                  const application = applications?.find(app => app.id === candidate.applicationId);
                  if (!application) return null;

                  const totalScore = calculateTotalScore(candidate);

                  return (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {application.personalInfo.firstName} {application.personalInfo.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.personalInfo.email}
                          </div>
                        </div>
                      </TableCell>
                      
                      {schedule.type === 'written' && (
                        <TableCell>
                          {candidate.token ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                {candidate.token}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToken(candidate.token!)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-gray-400">No token</span>
                          )}
                        </TableCell>
                      )}
                      
                      <TableCell>
                        <Select
                          value={candidate.attendance}
                          onValueChange={(value) => updateAttendance(candidate.id!, value as InterviewCandidate['attendance'])}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Scheduled
                              </div>
                            </SelectItem>
                            <SelectItem value="present">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Present
                              </div>
                            </SelectItem>
                            <SelectItem value="absent">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4" />
                                Absent
                              </div>
                            </SelectItem>
                            <SelectItem value="late">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Late
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      
                      <TableCell>
                        {candidate.checkInTime ? (
                          <div className="text-sm">
                            {candidate.checkInTime.toLocaleTimeString()}
                            <div className="text-xs text-gray-500">
                              {formatDistanceToNow(candidate.checkInTime, { addSuffix: true })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {candidate.scores.length > 0 ? (
                          <div className="text-center">
                            <div className="font-medium">{totalScore}%</div>
                            <div className="text-xs text-gray-500">
                              {candidate.scores.length} criteria scored
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not scored</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(candidate.status)}
                      </TableCell>
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuCheckboxItem onClick={() => onViewCandidate(candidate)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem onClick={() => onEditCandidate(candidate)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem onClick={() => onScoreCandidate(candidate)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Enter Scores
                            </DropdownMenuCheckboxItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={schedule.type === 'written' ? 7 : 6} className="h-24 text-center">
                    No candidates found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
