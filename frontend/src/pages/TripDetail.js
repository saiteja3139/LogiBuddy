import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import DocumentList from '../components/DocumentList';

export default function TripDetail() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [order, setOrder] = useState(null);
  const [transporter, setTransporter] = useState(null);
  const [truck, setTruck] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTripDetail();
  }, [id]);

  const fetchTripDetail = async () => {
    try {
      const tripResponse = await api.get(`/trips/${id}`);
      setTrip(tripResponse.data);
      
      if (tripResponse.data.order_id) {
        const orderResponse = await api.get(`/orders/${tripResponse.data.order_id}`);
        setOrder(orderResponse.data);
      }
      
      if (tripResponse.data.transporter_id) {
        const transporterResponse = await api.get(`/transporters/${tripResponse.data.transporter_id}`);
        setTransporter(transporterResponse.data);
      }
      
      if (tripResponse.data.truck_id) {
        const truckResponse = await api.get(`/trucks/${tripResponse.data.truck_id}`);
        setTruck(truckResponse.data);
      }
    } catch (error) {
      toast.error('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!trip) return <div>Trip not found</div>;

  const margin = parseFloat(trip.customer_bill_amount) - parseFloat(trip.payable_amount);
  const marginPercent = ((margin / parseFloat(trip.customer_bill_amount)) * 100).toFixed(2);

  return (
    <div className="space-y-4 md:space-y-6" data-testid="trip-detail-page">
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
        <Link to="/trips">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-bold font-heading">{trip.trip_number}</h1>
          <p className="text-muted-foreground mt-1">
            <span className={`px-2 py-1 rounded-sm text-xs font-medium ${
              trip.status === 'DELIVERED' ? 'bg-success/10 text-success' :
              trip.status === 'IN_TRANSIT' ? 'bg-info/10 text-info' :
              trip.status === 'PLANNED' ? 'bg-warning/10 text-warning' :
              'bg-error/10 text-error'
            }`}>
              {trip.status}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trip.qty_mt} MT</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Customer Bill</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(trip.customer_bill_amount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-error">{formatCurrency(trip.payable_amount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{formatCurrency(margin)}</div>
            <div className="text-xs text-muted-foreground">{marginPercent}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Trip Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Order</div>
              <div className="font-medium">
                {order ? (
                  <Link to={`/orders/${order.id}`} className="text-secondary hover:underline">
                    {order.order_number}
                  </Link>
                ) : '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Trip Date</div>
              <div className="font-medium">{formatDate(trip.trip_date)}</div>
            </div>
            {trip.delivered_date && (
              <div>
                <div className="text-xs text-muted-foreground">Delivered Date</div>
                <div className="font-medium">{formatDate(trip.delivered_date)}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle & Driver</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Transporter</div>
              <div className="font-medium">
                {transporter ? (
                  <Link to={`/transporters/${transporter.id}`} className="text-secondary hover:underline">
                    {transporter.name}
                  </Link>
                ) : '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Truck</div>
              <div className="font-medium">
                {truck ? (
                  <Link to={`/trucks/${truck.id}`} className="text-secondary hover:underline">
                    {truck.truck_number}
                  </Link>
                ) : '-'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DocumentList
        docType="TRIP"
        entityType="TRIP"
        entityId={id}
        title="Trip Documents (POD, LR, Photos)"
      />
    </div>
  );
}
