import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calculator, 
  Target, 
  CheckCircle, 
  XCircle,
  Save,
  TrendingUp
} from 'lucide-react';
import { 
  InterviewCandidate, 
  InterviewRubric, 
  InterviewScore, 
  RubricCriteria,
  generateId 
} from '@/lib/database';
import { db } from '@/lib/database';

interface ScoreEntryDialogProps {
  candidate: InterviewCandidate | null;
  rubric: InterviewRubric | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (scores: InterviewScore[]) => void;
}

export const ScoreEntryDialog = ({ 
  candidate, 
  rubric, 
  isOpen, 
  onClose, 
  onSave 
}: ScoreEntryDialogProps) => {
  const [scores, setScores] = useState<InterviewScore[]>([]);
  const [evaluatorId, setEvaluatorId] = useState('panel_member_1'); // In real app, get from auth
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (candidate && rubric) {
      // Initialize scores for each criteria
      const initialScores: InterviewScore[] = rubric.criteria.map(criteria => {
        const existingScore = candidate.scores.find(s => s.criteriaId === criteria.id);
        return existingScore || {
          id: generateId(),
          criteriaId: criteria.id,
          score: 0,
          maxScore: criteria.maxScore,
          weight: criteria.weight,
          notes: '',
          evaluatorId: evaluatorId,
          timestamp: new Date(),
        };
      });
      setScores(initialScores);
    }
  }, [candidate, rubric, evaluatorId]);

  const updateScore = (criteriaId: string, score: number) => {
    setScores(prev => prev.map(s => 
      s.criteriaId === criteriaId ? { ...s, score: Math.max(0, Math.min(s.maxScore, score)) } : s
    ));
  };

  const updateNotes = (criteriaId: string, notes: string) => {
    setScores(prev => prev.map(s => 
      s.criteriaId === criteriaId ? { ...s, notes } : s
    ));
  };

  const calculateTotalScore = () => {
    if (!rubric) return 0;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    scores.forEach(score => {
      const criteria = rubric.criteria.find(c => c.id === score.criteriaId);
      if (criteria) {
        totalScore += (score.score / score.maxScore) * criteria.weight;
        totalWeight += criteria.weight;
      }
    });
    
    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
  };

  const calculateWeightedScore = (score: InterviewScore) => {
    const criteria = rubric?.criteria.find(c => c.id === score.criteriaId);
    if (!criteria) return 0;
    
    return Math.round((score.score / score.maxScore) * criteria.weight);
  };

  const getScoreColor = (score: InterviewScore) => {
    const percentage = (score.score / score.maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSave = async () => {
    if (!candidate || !rubric) return;
    
    setIsSubmitting(true);
    try {
      // Update candidate with new scores
      const totalScore = calculateTotalScore();
      const weightedScore = scores.reduce((sum, s) => sum + calculateWeightedScore(s), 0);
      
      await db.interviewCandidates.update(candidate.id!, {
        scores,
        totalScore,
        weightedScore,
        status: 'completed',
        updatedAt: new Date(),
      });
      
      onSave(scores);
      onClose();
    } catch (error) {
      console.error('Failed to save scores:', error);
      alert('Failed to save scores. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setScores([]);
    onClose();
  };

  if (!candidate || !rubric) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Score Entry - {candidate.id}
          </DialogTitle>
          <DialogDescription>
            Enter scores for each evaluation criteria based on the rubric
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rubric Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {rubric.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Criteria:</span>
                  <p className="text-gray-600">{rubric.criteria.length}</p>
                </div>
                <div>
                  <span className="font-medium">Total Weight:</span>
                  <p className="text-gray-600">{rubric.totalWeight}%</p>
                </div>
                <div>
                  <span className="font-medium">Passing Score:</span>
                  <p className="text-gray-600">{rubric.passingScore}%</p>
                </div>
              </div>
              {rubric.description && (
                <p className="text-gray-600 mt-2">{rubric.description}</p>
              )}
            </CardContent>
          </Card>

          {/* Score Entry Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Evaluation Criteria</h3>
            
            {scores.map((score) => {
              const criteria = rubric.criteria.find(c => c.id === score.criteriaId);
              if (!criteria) return null;

              return (
                <Card key={score.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{criteria.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{criteria.category}</Badge>
                          <Badge variant="secondary">Weight: {criteria.weight}%</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                          {score.score}/{score.maxScore}
                        </div>
                        <div className="text-sm text-gray-500">
                          {Math.round((score.score / score.maxScore) * 100)}%
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {criteria.description && (
                      <p className="text-gray-600 text-sm">{criteria.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`score-${score.id}`}>Score</Label>
                        <Input
                          id={`score-${score.id}`}
                          type="number"
                          min="0"
                          max={score.maxScore}
                          value={score.score}
                          onChange={(e) => updateScore(criteria.id, parseInt(e.target.value) || 0)}
                          className="text-center"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Max: {score.maxScore}
                        </p>
                      </div>
                      
                      <div>
                        <Label>Weighted Score</Label>
                        <div className="text-center p-2 bg-gray-50 rounded border">
                          <div className="text-lg font-semibold">
                            {calculateWeightedScore(score)}
                          </div>
                          <div className="text-xs text-gray-500">
                            out of {criteria.weight}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`notes-${score.id}`}>Notes (Optional)</Label>
                      <Textarea
                        id={`notes-${score.id}`}
                        value={score.notes || ''}
                        onChange={(e) => updateNotes(criteria.id, e.target.value)}
                        placeholder="Add notes about this score..."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Score Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Score Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {scores.filter(s => s.score > 0).length}
                  </div>
                  <div className="text-sm text-blue-600">Criteria Scored</div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {calculateTotalScore()}%
                  </div>
                  <div className="text-sm text-green-600">Total Score</div>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  calculateTotalScore() >= (rubric.passingScore || 70) 
                    ? 'bg-green-50' 
                    : 'bg-red-50'
                }`}>
                  <div className={`text-2xl font-bold ${
                    calculateTotalScore() >= (rubric.passingScore || 70) 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {calculateTotalScore() >= (rubric.passingScore || 70) ? (
                      <CheckCircle className="h-8 w-8 mx-auto" />
                    ) : (
                      <XCircle className="h-8 w-8 mx-auto" />
                    )}
                  </div>
                  <div className={`text-sm ${
                    calculateTotalScore() >= (rubric.passingScore || 70) 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {calculateTotalScore() >= (rubric.passingScore || 70) ? 'Passed' : 'Failed'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting || scores.some(s => s.score === 0)}
          >
            {isSubmitting ? (
              'Saving...'
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Scores
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
