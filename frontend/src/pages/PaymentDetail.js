import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentDetail() {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [trips, setTrips] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    allocate_to_type: 'TRIP',
    allocate_to_id: '',
    allocated_amount: 0
  });

  useEffect(() => {
  const fetchPaymentDetailData = async () => {
    try {
      const [paymentRes, allocationsRes, tripsRes, ordersRes] = await Promise.all([
        api.get(`/payments/${id}`),
        api.get(`/payments/${id}/allocations`),
        api.get('/trips'),
        api.get('/orders')
      ]);

      setPayment(paymentRes.data);
      setAllocations(allocationsRes.data);
      setTrips(tripsRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      toast.error('Failed to load payment details');
      setPayment(null);
      setAllocations([]);
      setTrips([]);
      setOrders([]);
    }
  };

  if (id) {
    fetchPaymentDetailData();
  } else {
    setPayment(null);
    setAllocations([]);
    setTrips([]);
    setOrders([]);
  }
}, [id]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await api.post(`/payments/${id}/allocations`, formData);
    toast.success('Allocation added successfully');
    setDialogOpen(false);
    setFormData({ allocate_to_type: 'TRIP', allocate_to_id: '', allocated_amount: 0 });

    const [paymentRes, allocationsRes] = await Promise.all([
      api.get(`/payments/${id}`),
      api.get(`/payments/${id}/allocations`)
    ]);

    setPayment(paymentRes.data);
    setAllocations(allocationsRes.data);
  } catch (error) {
    toast.error(error.response?.data?.detail || 'Failed to add allocation');
  }
};

  const handleDeleteAllocation = async (allocationId) => {
  if (window.confirm('Are you sure you want to delete this allocation?')) {
    try {
      await api.delete(`/allocations/${allocationId}`);
      toast.success('Allocation deleted successfully');

      const [paymentRes, allocationsRes] = await Promise.all([
        api.get(`/payments/${id}`),
        api.get(`/payments/${id}/allocations`)
      ]);

      setPayment(paymentRes.data);
      setAllocations(allocationsRes.data);
    } catch (error) {
      toast.error('Failed to delete allocation');
    }
  }
};

  const getTripLabel = (tripId) => {
    const trip = trips.find(t => t.id === tripId);
    return trip ? `${trip.trip_number} - ${formatCurrency(trip.customer_bill_amount)}` : tripId;
  };

  const getOrderLabel = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    return order ? `${order.order_number}` : orderId;
  };

  if (!payment) return <div>Loading...</div>;

  const totalAllocated = allocations.reduce((sum, a) => sum + parseFloat(a.allocated_amount), 0);
  const unallocated = parseFloat(payment.amount) - totalAllocated;
  const targets = formData.allocate_to_type === 'TRIP' ? trips : orders;

  return (
    <div className="space-y-6" data-testid="payment-detail-page">
      <div className="flex items-center space-x-4">
        <Link to="/payments">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-bold font-heading">Payment Details</h1>
          <p className="text-muted-foreground mt-1">{formatDate(payment.payment_date)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(payment.amount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalAllocated)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Unallocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{formatCurrency(unallocated)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Direction</div>
            <div className="font-medium">{payment.payment_direction}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Party Type</div>
            <div className="font-medium">{payment.party_type}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Mode</div>
            <div className="font-medium">{payment.mode}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Reference</div>
            <div className="font-medium">{payment.reference || '-'}</div>
          </div>
          {payment.notes && (
            <div className="col-span-2">
              <div className="text-xs text-muted-foreground">Notes</div>
              <div className="font-medium">{payment.notes}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Allocations</CardTitle>
          {unallocated > 0 && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Allocate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Allocate Payment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Allocate To *</Label>
                    <Select required value={formData.allocate_to_type} onValueChange={(value) => setFormData({ ...formData, allocate_to_type: value, allocate_to_id: '' })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRIP">Trip</SelectItem>
                        <SelectItem value="ORDER">Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{formData.allocate_to_type === 'TRIP' ? 'Trip' : 'Order'} *</Label>
                    <Select required value={formData.allocate_to_id} onValueChange={(value) => setFormData({ ...formData, allocate_to_id: value })}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {targets.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {formData.allocate_to_type === 'TRIP' ? getTripLabel(t.id) : getOrderLabel(t.id)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount (₹) *</Label>
                    <Input required type="number" step="0.01" max={unallocated} value={formData.allocated_amount} onChange={(e) => setFormData({ ...formData, allocated_amount: parseFloat(e.target.value) || 0 })} />
                    <div className="text-xs text-muted-foreground mt-1">Max: {formatCurrency(unallocated)}</div>
                  </div>
                  <Button type="submit" className="w-full">Add Allocation</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {allocations.length > 0 ? (
            <div className="space-y-2">
              {allocations.map((allocation) => (
                <div key={allocation.id} className="flex justify-between items-center p-3 border rounded-sm">
                  <div>
                    <div className="font-medium">
                      {allocation.allocate_to_type === 'TRIP' ? 'Trip: ' : 'Order: '}
                      {allocation.allocate_to_type === 'TRIP' ? getTripLabel(allocation.allocate_to_id) : getOrderLabel(allocation.allocate_to_id)}
                    </div>
                    <div className="text-sm text-muted-foreground">{formatCurrency(allocation.allocated_amount)}</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteAllocation(allocation.id)}>
                    <Trash2 className="w-4 h-4 text-error" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">No allocations yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
