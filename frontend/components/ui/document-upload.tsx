'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Image, 
  X, 
  Eye, 
  Download,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface UploadedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'jpg' | 'png';
  size: number;
  data: File | Blob;
  preview?: string;
  uploadedAt: Date;
}

interface DocumentUploadProps {
  documents: UploadedDocument[];
  onDocumentsChange: (documents: UploadedDocument[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  title?: string;
  description?: string;
  disabled?: boolean;
}

export const DocumentUpload = ({
  documents,
  onDocumentsChange,
  maxFiles = 10,
  maxFileSize = 10, // 10MB default
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png'],
  title = 'Document Upload',
  description = 'Upload supporting documents (PDF, JPG, PNG)',
  disabled = false
}: DocumentUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    // Check file type
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!acceptedTypes.includes(fileExtension)) {
      return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`;
    }

    // Check if we've reached max files
    if (documents.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }

    return null;
  };

  const processFile = async (file: File): Promise<UploadedDocument> => {
    const validationError = validateFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    const document: UploadedDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 
            file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg') ? 'jpg' : 'png',
      size: file.size,
      data: file,
      uploadedAt: new Date()
    };

    // Generate preview for images
    if (document.type !== 'pdf') {
      document.preview = URL.createObjectURL(file);
    }

    return document;
  };

  const handleFiles = async (files: FileList) => {
    setError(null);
    const newDocuments: UploadedDocument[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const document = await processFile(file);
        newDocuments.push(document);
      }

      onDocumentsChange([...documents, ...newDocuments]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process files');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeDocument = (id: string) => {
    const document = documents.find(doc => doc.id === id);
    if (document?.preview) {
      URL.revokeObjectURL(document.preview);
    }
    onDocumentsChange(documents.filter(doc => doc.id !== id));
  };

  const openDocument = (document: UploadedDocument) => {
    if (document.type === 'pdf') {
      const url = URL.createObjectURL(document.data);
      window.open(url, '_blank');
    } else if (document.preview) {
      window.open(document.preview, '_blank');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'jpg':
      case 'png':
        return <Image className="h-8 w-8 text-blue-500" />;
      default:
        return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {title}
        </CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Upload className={`h-12 w-12 mx-auto mb-4 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          <p className="text-lg font-medium mb-2">
            {dragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {acceptedTypes.join(', ')} up to {maxFileSize}MB each
          </p>
          <p className="text-xs text-gray-400">
            {documents.length} of {maxFiles} files uploaded
          </p>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        {/* Uploaded Documents */}
        {documents.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Uploaded Documents ({documents.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {documents.map((document) => (
                <div key={document.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    {getFileIcon(document.type)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(document.id)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="font-medium text-sm truncate" title={document.name}>
                      {document.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(document.size)}
                    </p>
                    <Badge variant="outline" className="text-xs capitalize">
                      {document.type}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDocument(document)}
                      className="flex-1"
                      disabled={disabled}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = document.preview || URL.createObjectURL(document.data);
                        const link = window.document.createElement('a');
                        link.href = url;
                        link.download = document.name;
                        link.click();
                      }}
                      className="flex-1"
                      disabled={disabled}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
