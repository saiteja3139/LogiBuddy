import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function OrderDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      const response = await api.get(`/orders/${id}/detail`);
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Order not found</div>;

  const { order, trips, transported_qty_mt, pending_qty_mt } = data;

  return (
    <div className="space-y-6" data-testid="order-detail-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold font-heading">{order.order_number}</h1>
            <p className="text-muted-foreground mt-1">{order.origin} → {order.destination}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Qty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{order.total_qty_mt} MT</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Transported</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{transported_qty_mt} MT</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pending_qty_mt} MT</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{order.status}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-xs text-muted-foreground">Material</div>
              <div className="font-medium">{order.material || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Rate Type</div>
              <div className="font-medium">{order.rate_type}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Customer Rate</div>
              <div className="font-medium">{formatCurrency(order.customer_rate_value)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Order Date</div>
              <div className="font-medium">{formatDate(order.order_date)}</div>
            </div>
            {order.expected_end_date && (
              <div>
                <div className="text-xs text-muted-foreground">Expected End Date</div>
                <div className="font-medium">{formatDate(order.expected_end_date)}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Completion</span>
                  <span className="font-medium">{((transported_qty_mt / order.total_qty_mt) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-success h-2 rounded-full transition-all" 
                    style={{ width: `${(transported_qty_mt / order.total_qty_mt) * 100}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <div className="text-xs text-muted-foreground">Total Trips</div>
                  <div className="text-lg font-bold">{trips.length}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Delivered</div>
                  <div className="text-lg font-bold text-success">{trips.filter(t => t.status === 'DELIVERED').length}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Trips</CardTitle>
          <Link to="/trips">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Trip
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="bg-white border shadow-sm rounded-sm overflow-hidden">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Trip #</th>
                  <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Qty (MT)</th>
                  <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Bill Amount</th>
                  <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Payable</th>
                  <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Status</th>
                  <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {trips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-2 px-4 text-sm font-medium">{trip.trip_number}</td>
                    <td className="py-2 px-4 text-sm">{trip.qty_mt}</td>
                    <td className="py-2 px-4 text-sm">{formatCurrency(trip.customer_bill_amount)}</td>
                    <td className="py-2 px-4 text-sm">{formatCurrency(trip.payable_amount)}</td>
                    <td className="py-2 px-4 text-sm">
                      <span className={`px-2 py-1 rounded-sm text-xs font-medium ${
                        trip.status === 'DELIVERED' ? 'bg-success/10 text-success' :
                        trip.status === 'IN_TRANSIT' ? 'bg-info/10 text-info' :
                        trip.status === 'PLANNED' ? 'bg-warning/10 text-warning' :
                        'bg-error/10 text-error'
                      }`}>
                        {trip.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-sm">{formatDate(trip.trip_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {trips.length === 0 && <div className="text-center py-8 text-muted-foreground">No trips found</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
