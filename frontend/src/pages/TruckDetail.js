import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { formatDate } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import DocumentList from '../components/DocumentList';

export default function TruckDetail() {
  const { id } = useParams();
  const [truck, setTruck] = useState(null);
  const [transporter, setTransporter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchTruckDetail = async () => {
    try {
      setLoading(true);

      const truckResponse = await api.get(`/trucks/${id}`);
      setTruck(truckResponse.data);

      if (truckResponse.data.transporter_id) {
        const transporterResponse = await api.get(`/transporters/${truckResponse.data.transporter_id}`);
        setTransporter(transporterResponse.data);
      } else {
        setTransporter(null);
      }
    } catch (error) {
      toast.error('Failed to load truck details');
      setTruck(null);
      setTransporter(null);
    } finally {
      setLoading(false);
    }
  };

  if (id) {
    fetchTruckDetail();
  } else {
    setTruck(null);
    setTransporter(null);
    setLoading(false);
  }
}, [id]);

  if (loading) return <div>Loading...</div>;
  if (!truck) return <div>Truck not found</div>;

  return (
    <div className="space-y-6" data-testid="truck-detail-page">
      <div className="flex items-center space-x-4">
        <Link to="/trucks">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-bold font-heading">{truck.truck_number}</h1>
          <p className="text-muted-foreground mt-1">{truck.truck_type || 'Truck'}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Truck Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Transporter</div>
            <div className="font-medium">{transporter ? transporter.name : '-'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Truck Type</div>
            <div className="font-medium">{truck.truck_type || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Capacity</div>
            <div className="font-medium">{truck.capacity_mt ? `${truck.capacity_mt} MT` : '-'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">RC Expiry</div>
            <div className="font-medium">{truck.rc_expiry_date ? formatDate(truck.rc_expiry_date) : '-'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Insurance Expiry</div>
            <div className="font-medium">{truck.insurance_expiry_date ? formatDate(truck.insurance_expiry_date) : '-'}</div>
          </div>
        </CardContent>
      </Card>

      <DocumentList
        docType="VEHICLE"
        entityType="TRUCK"
        entityId={id}
        title="Vehicle Documents"
      />
    </div>
  );
}
