import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X,
  Calculator,
  Target
} from 'lucide-react';
import { InterviewRubric, RubricCriteria, generateId } from '@/lib/database';

interface RubricEditorProps {
  rubric?: InterviewRubric;
  onSave: (rubric: InterviewRubric) => void;
  onCancel: () => void;
}

export const RubricEditor = ({ rubric, onSave, onCancel }: RubricEditorProps) => {
  const [name, setName] = useState(rubric?.name || '');
  const [description, setDescription] = useState(rubric?.description || '');
  const [passingScore, setPassingScore] = useState(rubric?.passingScore || 70);
  const [criteria, setCriteria] = useState<RubricCriteria[]>(rubric?.criteria || []);
  const [editingCriteria, setEditingCriteria] = useState<RubricCriteria | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const maxPossibleScore = criteria.reduce((sum, c) => sum + c.maxScore, 0);

  const addCriteria = () => {
    const newCriteria: RubricCriteria = {
      id: generateId(),
      name: '',
      description: '',
      maxScore: 10,
      weight: 1,
      category: 'General'
    };
    setCriteria([...criteria, newCriteria]);
    setEditingCriteria(newCriteria);
    setIsEditing(true);
  };

  const updateCriteria = (id: string, updates: Partial<RubricCriteria>) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCriteria = (id: string) => {
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const saveCriteria = () => {
    if (editingCriteria && editingCriteria.name.trim()) {
      updateCriteria(editingCriteria.id, editingCriteria);
      setEditingCriteria(null);
      setIsEditing(false);
    }
  };

  const cancelEdit = () => {
    setEditingCriteria(null);
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!name.trim() || criteria.length === 0) {
      alert('Please provide a name and at least one criteria');
      return;
    }

    if (totalWeight !== 100) {
      alert('Total weight must equal 100%');
      return;
    }

    const rubricData: InterviewRubric = {
      id: rubric?.id || generateId(),
      name: name.trim(),
      description: description.trim(),
      criteria,
      totalWeight,
      passingScore,
      createdAt: rubric?.createdAt || new Date(),
      updatedAt: new Date(),
      synced: false
    };

    onSave(rubricData);
  };

  const renderCriteriaForm = () => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">Add/Edit Criteria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="criteriaName">Criteria Name *</Label>
            <Input
              id="criteriaName"
              value={editingCriteria?.name || ''}
              onChange={(e) => setEditingCriteria(prev => prev ? { ...prev, name: e.target.value } : null)}
              placeholder="e.g., Communication Skills"
            />
          </div>
          <div>
            <Label htmlFor="criteriaCategory">Category</Label>
            <Input
              id="criteriaCategory"
              value={editingCriteria?.category || ''}
              onChange={(e) => setEditingCriteria(prev => prev ? { ...prev, category: e.target.value } : null)}
              placeholder="e.g., Technical, Soft Skills"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="criteriaDescription">Description</Label>
          <Textarea
            id="criteriaDescription"
            value={editingCriteria?.description || ''}
            onChange={(e) => setEditingCriteria(prev => prev ? { ...prev, description: e.target.value } : null)}
            placeholder="Describe what this criteria evaluates..."
            rows={2}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="maxScore">Maximum Score</Label>
            <Input
              id="maxScore"
              type="number"
              min="1"
              max="100"
              value={editingCriteria?.maxScore || 10}
              onChange={(e) => setEditingCriteria(prev => prev ? { ...prev, maxScore: parseInt(e.target.value) || 0 } : null)}
            />
          </div>
          <div>
            <Label htmlFor="weight">Weight (%)</Label>
            <Input
              id="weight"
              type="number"
              min="1"
              max="100"
              value={editingCriteria?.weight || 1}
              onChange={(e) => setEditingCriteria(prev => prev ? { ...prev, weight: parseInt(e.target.value) || 0 } : null)}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={saveCriteria} disabled={!editingCriteria?.name?.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Save Criteria
          </Button>
          <Button variant="outline" onClick={cancelEdit}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderCriteriaList = () => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Evaluation Criteria ({criteria.length})
        </CardTitle>
        <CardDescription>
          Total Weight: <Badge variant={totalWeight === 100 ? 'default' : 'destructive'}>{totalWeight}%</Badge>
          {totalWeight !== 100 && ' - Must equal 100%'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {criteria.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No criteria added yet</p>
        ) : (
          <div className="space-y-3">
            {criteria.map((criterion) => (
              <div key={criterion.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{criterion.name}</h4>
                    <Badge variant="outline">{criterion.category}</Badge>
                  </div>
                  {criterion.description && (
                    <p className="text-sm text-gray-600 mb-2">{criterion.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Max Score: {criterion.maxScore}</span>
                    <span>Weight: {criterion.weight}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCriteria(criterion);
                      setIsEditing(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteCriteria(criterion.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderSummary = () => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Rubric Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Total Criteria</Label>
            <p className="text-lg font-medium">{criteria.length}</p>
          </div>
          <div>
            <Label>Total Weight</Label>
            <p className={`text-lg font-medium ${totalWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
              {totalWeight}%
            </p>
          </div>
          <div>
            <Label>Maximum Possible Score</Label>
            <p className="text-lg font-medium">{maxPossibleScore}</p>
          </div>
          <div>
            <Label>Passing Score</Label>
            <p className="text-lg font-medium">{passingScore}</p>
          </div>
        </div>
        
        {totalWeight !== 100 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">
              ⚠️ Total weight must equal 100% for the rubric to be valid.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {rubric ? 'Edit Rubric' : 'Create New Rubric'}
          </h2>
          <p className="text-gray-600">
            Define evaluation criteria and scoring weights for interviews
          </p>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="rubricName">Rubric Name *</Label>
            <Input
              id="rubricName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Technical Interview Rubric"
            />
          </div>
          
          <div>
            <Label htmlFor="rubricDescription">Description</Label>
            <Textarea
              id="rubricDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose and scope of this rubric..."
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="passingScore">Passing Score</Label>
            <Input
              id="passingScore"
              type="number"
              min="0"
              max="100"
              value={passingScore}
              onChange={(e) => setPassingScore(parseInt(e.target.value) || 0)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Criteria Management */}
      {renderCriteriaList()}
      
      {isEditing && renderCriteriaForm()}
      
      {!isEditing && (
        <Button onClick={addCriteria} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Criteria
        </Button>
      )}

      {/* Summary */}
      {renderSummary()}

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={!name.trim() || criteria.length === 0 || totalWeight !== 100}
        >
          {rubric ? 'Update Rubric' : 'Create Rubric'}
        </Button>
      </div>
    </div>
  );
};
