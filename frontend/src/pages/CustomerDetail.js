import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerDetail();
  }, [id]);

  const fetchCustomerDetail = async () => {
    try {
      const response = await api.get(`/customers/${id}/detail`);
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Customer not found</div>;

  const { customer, orders, total_billed, total_received, outstanding, aging_buckets } = data;

  return (
    <div className="space-y-6" data-testid="customer-detail-page">
      <div className="flex items-center space-x-4">
        <Link to="/customers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-bold font-heading">{customer.name}</h1>
          <p className="text-muted-foreground mt-1">{customer.phone}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Billed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(total_billed)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(total_received)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-error">{formatCurrency(outstanding)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payment Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customer.payment_terms_days} days</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aging Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">0-7 days</div>
              <div className="text-lg font-bold">{formatCurrency(aging_buckets['0-7'])}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">8-15 days</div>
              <div className="text-lg font-bold">{formatCurrency(aging_buckets['8-15'])}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">16-30 days</div>
              <div className="text-lg font-bold">{formatCurrency(aging_buckets['16-30'])}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">30+ days</div>
              <div className="text-lg font-bold text-error">{formatCurrency(aging_buckets['30+'])}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {orders.map((order) => (
              <Link key={order.id} to={`/orders/${order.id}`}>
                <div className="flex justify-between items-center p-3 border rounded-sm hover:bg-muted/50 transition-colors">
                  <div>
                    <div className="font-medium">{order.order_number}</div>
                    <div className="text-sm text-muted-foreground">{order.origin} → {order.destination}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{order.status}</div>
                    <div className="text-sm text-muted-foreground">{formatDate(order.order_date)}</div>
                  </div>
                </div>
              </Link>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">No orders found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
