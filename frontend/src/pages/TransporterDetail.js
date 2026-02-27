import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function TransporterDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransporterDetail();
  }, [id]);

  const fetchTransporterDetail = async () => {
    try {
      const response = await api.get(`/transporters/${id}/detail`);
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load transporter details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Transporter not found</div>;

  const { transporter, trucks, trips, total_payable, total_paid, outstanding } = data;

  return (
    <div className="space-y-6" data-testid="transporter-detail-page">
      <div className="flex items-center space-x-4">
        <Link to="/transporters">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-bold font-heading">{transporter.name}</h1>
          <p className="text-muted-foreground mt-1">{transporter.phone}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Payable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-error">{formatCurrency(total_payable)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(total_paid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{formatCurrency(outstanding)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Trucks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trucks.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-xs text-muted-foreground">Account Name</div>
              <div className="font-medium">{transporter.bank_account_name || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Account Number</div>
              <div className="font-medium">{transporter.bank_account_number || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">IFSC Code</div>
              <div className="font-medium">{transporter.ifsc || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Bank Name</div>
              <div className="font-medium">{transporter.bank_name || '-'}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>KYC Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">PAN: {transporter.kyc_pan_url || 'Not uploaded'}</div>
            <div className="text-sm text-muted-foreground">Aadhaar: {transporter.kyc_aadhaar_url || 'Not uploaded'}</div>
            <div className="text-sm text-muted-foreground">RC: {transporter.kyc_rc_url || 'Not uploaded'}</div>
            <div className="text-sm text-muted-foreground">Insurance: {transporter.kyc_insurance_url || 'Not uploaded'}</div>
            <div className="text-sm text-muted-foreground">Permit: {transporter.kyc_permit_url || 'Not uploaded'}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trucks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {trucks.map((truck) => (
              <div key={truck.id} className="flex justify-between items-center p-3 border rounded-sm">
                <div>
                  <div className="font-medium">{truck.truck_number}</div>
                  <div className="text-sm text-muted-foreground">{truck.truck_type} - {truck.capacity_mt} MT</div>
                </div>
              </div>
            ))}
            {trucks.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">No trucks registered</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Trips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {trips.slice(0, 5).map((trip) => (
              <div key={trip.id} className="flex justify-between items-center p-3 border rounded-sm">
                <div>
                  <div className="font-medium">{trip.trip_number}</div>
                  <div className="text-sm text-muted-foreground">{trip.qty_mt} MT</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(trip.payable_amount)}</div>
                  <div className="text-sm text-muted-foreground">{trip.status}</div>
                </div>
              </div>
            ))}
            {trips.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">No trips found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
