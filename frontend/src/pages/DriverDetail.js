import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { formatDate } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import DocumentList from '../components/DocumentList';

export default function DriverDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchDriverDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/drivers/${id}/detail`);
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load driver details');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (id) {
    fetchDriverDetail();
  } else {
    setData(null);
    setLoading(false);
  }
}, [id]);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Driver not found</div>;

  const { driver } = data;

  const isLicenseExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isLicenseExpiring = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntil = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntil <= 30 && daysUntil >= 0;
  };

  return (
    <div className="space-y-6" data-testid="driver-detail-page">
      <div className="flex items-center space-x-4">
        <Link to="/drivers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-bold font-heading">{driver.name}</h1>
          <p className="text-muted-foreground mt-1">{driver.phone}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Driver Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">License Number</div>
            <div className="font-medium">{driver.license_number || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">License Expiry</div>
            <div className="font-medium">
              {driver.license_expiry_date ? formatDate(driver.license_expiry_date) : '-'}
              {isLicenseExpired(driver.license_expiry_date) && (
                <div className="flex items-center space-x-1 mt-1">
                  <AlertCircle className="w-3 h-3 text-error" />
                  <span className="text-xs text-error">Expired</span>
                </div>
              )}
              {isLicenseExpiring(driver.license_expiry_date) && !isLicenseExpired(driver.license_expiry_date) && (
                <div className="flex items-center space-x-1 mt-1">
                  <AlertCircle className="w-3 h-3 text-warning" />
                  <span className="text-xs text-warning">Expiring Soon</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Address</div>
            <div className="font-medium">{driver.address || '-'}</div>
          </div>
          {driver.notes && (
            <div className="col-span-2 md:col-span-3">
              <div className="text-xs text-muted-foreground">Notes</div>
              <div className="font-medium">{driver.notes}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <DocumentList
        docType="DRIVER"
        entityType="DRIVER"
        entityId={id}
        title="Driver Documents"
      />
    </div>
  );
}
