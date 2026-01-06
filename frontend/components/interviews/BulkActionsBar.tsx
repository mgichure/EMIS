import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Users, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Send,
  Eye
} from 'lucide-react';
import { InterviewCandidate, InterviewSchedule, AdmissionApplication, generateToken } from '@/lib/database';
import { db } from '@/lib/database';
import { useLiveQuery } from 'dexie-react-hooks';

interface BulkActionsBarProps {
  schedule: InterviewSchedule;
  candidates: InterviewCandidate[];
  onRefresh: () => void;
}

export const BulkActionsBar = ({ schedule, candidates, onRefresh }: BulkActionsBarProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applications = useLiveQuery(() => db.applications.toArray());

  const exportToCSV = async () => {
    if (!applications) return;
    
    setIsExporting(true);
    try {
      const csvData = candidates.map(candidate => {
        const application = applications.find(app => app.id === candidate.applicationId);
        if (!application) return null;

        return {
          'Candidate ID': candidate.id,
          'First Name': application.personalInfo.firstName,
          'Last Name': application.personalInfo.lastName,
          'Email': application.personalInfo.email,
          'Token': candidate.token || '',
          'Attendance': candidate.attendance,
          'Check-in Time': candidate.checkInTime?.toISOString() || '',
          'Total Score': candidate.totalScore || 0,
          'Weighted Score': candidate.weightedScore || 0,
          'Status': candidate.status,
          'Notes': candidate.notes || '',
        };
      }).filter((row): row is NonNullable<typeof row> => row !== null);

      if (csvData.length === 0) {
        alert('No data to export');
        return;
      }

      const headers = Object.keys(csvData[0]) as Array<keyof typeof csvData[0]>;
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview-results-${schedule.title}-${schedule.date.toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const importFromCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      let updatedCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        try {
          const candidateId = row['Candidate ID'];
          if (!candidateId) continue;

          const updates: Partial<InterviewCandidate> = {};
          
          if (row['Attendance']) {
            updates.attendance = row['Attendance'] as InterviewCandidate['attendance'];
          }
          
          if (row['Total Score']) {
            updates.totalScore = parseInt(row['Total Score']) || 0;
          }
          
          if (row['Status']) {
            updates.status = row['Status'] as InterviewCandidate['status'];
          }
          
          if (row['Notes']) {
            updates.notes = row['Notes'];
          }

          if (Object.keys(updates).length > 0) {
            updates.updatedAt = new Date();
            await db.interviewCandidates.update(candidateId, updates);
            updatedCount++;
          }
        } catch (error) {
          console.error(`Failed to update candidate ${row['Candidate ID']}:`, error);
          errorCount++;
        }
      }

      alert(`Import completed: ${updatedCount} updated, ${errorCount} errors`);
      onRefresh();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check the CSV format and try again.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const generateTokensForWritten = async () => {
    if (schedule.type !== 'written') {
      alert('Tokens are only needed for written tests');
      return;
    }

    try {
      let updatedCount = 0;
      
      for (const candidate of candidates) {
        if (!candidate.token) {
          await db.interviewCandidates.update(candidate.id!, {
            token: generateToken(),
            updatedAt: new Date(),
          });
          updatedCount++;
        }
      }

      alert(`Generated ${updatedCount} new tokens`);
      onRefresh();
    } catch (error) {
      console.error('Failed to generate tokens:', error);
      alert('Failed to generate tokens. Please try again.');
    }
  };

  const bulkUpdateStatus = async (status: InterviewCandidate['status']) => {
    if (selectedCandidates.length === 0) {
      alert('Please select candidates first');
      return;
    }

    try {
      let updatedCount = 0;
      
      for (const candidateId of selectedCandidates) {
        await db.interviewCandidates.update(candidateId, {
          status,
          updatedAt: new Date(),
        });
        updatedCount++;
      }

      alert(`Updated ${updatedCount} candidates to ${status}`);
      setSelectedCandidates([]);
      onRefresh();
    } catch (error) {
      console.error('Failed to update candidates:', error);
      alert('Failed to update candidates. Please try again.');
    }
  };

  const sendRecommendations = async () => {
    try {
      let updatedCount = 0;
      
      for (const candidate of candidates) {
        if (candidate.status === 'completed' && candidate.totalScore) {
          const application = applications?.find(app => app.id === candidate.applicationId);
          if (application) {
            // Update application status based on interview results
            let newStatus: string;
            if (candidate.totalScore >= 80) {
              newStatus = 'accepted';
            } else if (candidate.totalScore >= 60) {
              newStatus = 'under_review';
            } else {
              newStatus = 'rejected';
            }

            await db.applications.update(candidate.applicationId, {
              status: newStatus as any,
              updatedAt: new Date(),
            });
            updatedCount++;
          }
        }
      }

      alert(`Sent recommendations for ${updatedCount} candidates`);
      onRefresh();
    } catch (error) {
      console.error('Failed to send recommendations:', error);
      alert('Failed to send recommendations. Please try again.');
    }
  };

  const getStatistics = () => {
    const total = candidates.length;
    const present = candidates.filter(c => c.attendance === 'present').length;
    const completed = candidates.filter(c => c.status === 'completed').length;
    const passed = candidates.filter(c => c.status === 'passed').length;
    const withTokens = candidates.filter(c => c.token).length;

    return { total, present, completed, passed, withTokens };
  };

  const stats = getStatistics();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bulk Actions & Statistics
        </CardTitle>
        <CardDescription>
          Manage multiple candidates and view session statistics
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-5 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-600">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <div className="text-sm text-green-600">Present</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.completed}</div>
            <div className="text-sm text-purple-600">Completed</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.passed}</div>
            <div className="text-sm text-yellow-600">Passed</div>
          </div>
          {schedule.type === 'written' && (
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{stats.withTokens}</div>
              <div className="text-sm text-indigo-600">With Tokens</div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Bulk Operations</h3>
          
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={isExporting || candidates.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export to CSV'}
            </Button>

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? 'Importing...' : 'Import from CSV'}
            </Button>

            {schedule.type === 'written' && (
              <Button
                variant="outline"
                onClick={generateTokensForWritten}
                disabled={stats.withTokens === stats.total}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Generate Missing Tokens
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => bulkUpdateStatus('completed')}
              disabled={selectedCandidates.length === 0}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Completed
            </Button>

            <Button
              variant="outline"
              onClick={() => bulkUpdateStatus('passed')}
              disabled={selectedCandidates.length === 0}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Passed
            </Button>

            <Button
              variant="outline"
              onClick={() => bulkUpdateStatus('failed')}
              disabled={selectedCandidates.length === 0}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Mark as Failed
            </Button>

            <Button
              variant="outline"
              onClick={sendRecommendations}
              disabled={candidates.filter(c => c.status === 'completed').length === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Recommendations
            </Button>

            <Button
              variant="outline"
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Hidden file input for CSV import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={importFromCSV}
            className="hidden"
          />
        </div>

        {/* Selection Info */}
        {selectedCandidates.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-blue-800">
                {selectedCandidates.length} candidate(s) selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCandidates([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Instructions:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Export to CSV:</strong> Download interview results for external analysis</li>
            <li>• <strong>Import from CSV:</strong> Update candidate scores and statuses from external sources</li>
            <li>• <strong>Generate Tokens:</strong> Create unique identifiers for written test candidates</li>
            <li>• <strong>Bulk Updates:</strong> Select candidates and update their status in bulk</li>
            <li>• <strong>Send Recommendations:</strong> Automatically update admission statuses based on interview results</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
