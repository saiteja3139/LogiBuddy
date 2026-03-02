import { useState, useEffect } from 'react';
import { formatDate } from '../lib/utils';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { FileText, Image as ImageIcon, Eye, Download, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import DocumentUpload from './DocumentUpload';

export default function DocumentList({ docType, entityType, entityId, title = "Documents" }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [entityType, entityId]);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/documents', {
        params: {
          entity_type: entityType,
          entity_id: entityId,
          doc_type: docType
        }
      });
      setDocuments(response.data);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (documentId, fileName) => {
    try {
      const response = await api.get(`/documents/${documentId}/signed-url`);
      window.open(response.data.signed_url || response.data.file_url, '_blank');
    } catch (error) {
      toast.error('Failed to open document');
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      const response = await api.get(`/documents/${documentId}/signed-url`);
      const link = document.createElement('a');
      link.href = response.data.signed_url || response.data.file_url;
      link.download = fileName;
      link.click();
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const handleDelete = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await api.delete(`/documents/${documentId}`);
        toast.success('Document deleted successfully');
        fetchDocuments();
      } catch (error) {
        toast.error('Failed to delete document');
      }
    }
  };

  const getDocumentIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8 text-secondary" />;
    }
    return <FileText className="w-8 h-8 text-error" />;
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  if (loading) return <div>Loading documents...</div>;

  return (
    <Card data-testid="document-list">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <DocumentUpload
          docType={docType}
          entityType={entityType}
          entityId={entityId}
          onSuccess={fetchDocuments}
        />
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No documents uploaded yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="border rounded-sm p-4 hover:shadow-md transition-shadow"
                data-testid="document-card"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getDocumentIcon(doc.mime_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">{doc.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(doc.file_size / 1024).toFixed(0)} KB
                    </p>
                    
                    {doc.expiry_date && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">
                          Expiry: {formatDate(doc.expiry_date)}
                        </p>
                        {isExpired(doc.expiry_date) && (
                          <div className="flex items-center space-x-1 mt-1">
                            <AlertCircle className="w-3 h-3 text-error" />
                            <span className="text-xs text-error font-medium">Expired</span>
                          </div>
                        )}
                        {isExpiringSoon(doc.expiry_date) && !isExpired(doc.expiry_date) && (
                          <div className="flex items-center space-x-1 mt-1">
                            <AlertCircle className="w-3 h-3 text-warning" />
                            <span className="text-xs text-warning font-medium">Expiring Soon</span>
                          </div>
                        )}
                      </div>
                    )}

                    {doc.notes && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{doc.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-1 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(doc.id, doc.file_name)}
                    data-testid="view-document-btn"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc.id, doc.file_name)}
                    data-testid="download-document-btn"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    data-testid="delete-document-btn"
                  >
                    <Trash2 className="w-4 h-4 text-error" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
