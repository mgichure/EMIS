import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  GraduationCap 
} from 'lucide-react';
import { AdmissionApplication } from '@/lib/database';

interface DecisionDialogProps {
  application: AdmissionApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onDecision: (decision: 'accepted' | 'rejected', notes: string) => void;
}

export const DecisionDialog = ({ 
  application, 
  isOpen, 
  onClose, 
  onDecision 
}: DecisionDialogProps) => {
  const [decision, setDecision] = useState<'accepted' | 'rejected' | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!decision || !application) return;
    
    setIsSubmitting(true);
    try {
      await onDecision(decision, notes);
      handleClose();
    } catch (error) {
      console.error('Failed to submit decision:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDecision(null);
    setNotes('');
    onClose();
  };

  if (!application) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Application</DialogTitle>
          <DialogDescription>
            Review and make a decision on this admission application
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Application Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-semibold">
                  {application.personalInfo.firstName} {application.personalInfo.lastName}
                </h3>
                <p className="text-sm text-gray-600">{application.personalInfo.email}</p>
              </div>
              <Badge 
                variant={application.status === 'submitted' ? 'default' : 'secondary'}
                className="ml-auto"
              >
                {application.status.replace('_', ' ')}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Previous School:</span>
                <p className="text-gray-600">{application.academicInfo.previousSchool}</p>
              </div>
              <div>
                <span className="font-medium">Grade Level:</span>
                <p className="text-gray-600">{application.academicInfo.gradeLevel}</p>
              </div>
              {application.academicInfo.gpa && (
                <div>
                  <span className="font-medium">GPA:</span>
                  <p className="text-gray-600">{application.academicInfo.gpa}</p>
                </div>
              )}
              <div>
                <span className="font-medium">Documents:</span>
                <p className="text-gray-600">{application.documents.length} uploaded</p>
              </div>
            </div>
          </div>

          {/* Decision Selection */}
          <div className="space-y-3">
            <Label>Decision</Label>
            <div className="flex gap-3">
              <Button
                variant={decision === 'accepted' ? 'default' : 'outline'}
                onClick={() => setDecision('accepted')}
                className="flex-1 h-12"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Accept
              </Button>
              <Button
                variant={decision === 'rejected' ? 'destructive' : 'outline'}
                onClick={() => setDecision('rejected')}
                className="flex-1 h-12"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Reject
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes">
              Notes {decision === 'rejected' && <span className="text-red-600">*</span>}
            </Label>
            <Textarea
              id="notes"
              placeholder={
                decision === 'accepted' 
                  ? 'Optional notes for the applicant...'
                  : 'Please provide a reason for rejection...'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              required={decision === 'rejected'}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!decision || (decision === 'rejected' && !notes.trim()) || isSubmitting}
            className={
              decision === 'accepted' 
                ? 'bg-green-600 hover:bg-green-700' 
                : decision === 'rejected' 
                ? 'bg-red-600 hover:bg-red-700'
                : ''
            }
          >
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                {decision === 'accepted' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept Application
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Application
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
