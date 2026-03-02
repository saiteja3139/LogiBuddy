import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Upload, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

export default function DocumentUpload({ docType, entityType, entityId, onSuccess }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    issue_date: '',
    expiry_date: '',
    notes: ''
  });
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Only JPG, PNG, WEBP, and PDF files are allowed');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a file');
      return;
    }

    if (!formData.title) {
      toast.error('Please enter a title');
      return;
    }

    setUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('doc_type', docType);
      uploadFormData.append('entity_type', entityType);
      uploadFormData.append('entity_id', entityId);
      uploadFormData.append('title', formData.title);
      if (formData.issue_date) uploadFormData.append('issue_date', formData.issue_date);
      if (formData.expiry_date) uploadFormData.append('expiry_date', formData.expiry_date);
      if (formData.notes) uploadFormData.append('notes', formData.notes);

      await api.post('/upload/document', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Document uploaded successfully');
      setDialogOpen(false);
      resetForm();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setFilePreview(null);
    setFormData({ title: '', issue_date: '', expiry_date: '', notes: '' });
  };

  const handleClose = (open) => {
    setDialogOpen(open);
    if (!open) resetForm();
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button data-testid="upload-document-btn">
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-sm p-8 text-center transition-colors ${
              dragActive ? 'border-secondary bg-secondary/5' : 'border-border'
            }`}
          >
            {!file ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Upload className="w-12 h-12 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Drag and drop your file here, or</p>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-sm text-secondary hover:underline">browse to upload</span>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={(e) => handleFileChange(e.target.files[0])}
                    />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, or PDF (max 10MB)</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  {filePreview ? (
                    <img src={filePreview} alt="Preview" className="max-h-32 rounded-sm" />
                  ) : (
                    <FileText className="w-16 h-16 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setFilePreview(null);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-full sm:col-span-2">
              <Label htmlFor="title">Document Title *</Label>
              <Input
                id="title"
                required
                placeholder="e.g., PAN Card, RC Book, Driving License"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="issue_date">Issue Date</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>
            <div className="col-span-full sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || !file}>
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
