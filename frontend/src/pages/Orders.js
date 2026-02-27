import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    origin: '',
    destination: '',
    material: '',
    total_qty_mt: 0,
    rate_type: 'PER_MT',
    customer_rate_value: 0,
    order_date: new Date().toISOString().split('T')[0],
    status: 'DRAFT'
  });

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to load customers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/orders', formData);
      toast.success('Order created successfully');
      setDialogOpen(false);
      setFormData({
        customer_id: '', origin: '', destination: '', material: '',
        total_qty_mt: 0, rate_type: 'PER_MT', customer_rate_value: 0,
        order_date: new Date().toISOString().split('T')[0], status: 'DRAFT'
      });
      fetchOrders();
    } catch (error) {
      toast.error('Failed to create order');
    }
  };

  return (
    <div className="space-y-6" data-testid="orders-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-heading">Orders</h1>
          <p className="text-muted-foreground mt-2">Manage customer orders</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-order-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Customer *</Label>
                  <Select required value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Origin</Label>
                  <Input value={formData.origin} onChange={(e) => setFormData({ ...formData, origin: e.target.value })} />
                </div>
                <div>
                  <Label>Destination</Label>
                  <Input value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} />
                </div>
                <div>
                  <Label>Material</Label>
                  <Input value={formData.material} onChange={(e) => setFormData({ ...formData, material: e.target.value })} />
                </div>
                <div>
                  <Label>Total Qty (MT) *</Label>
                  <Input required type="number" step="0.01" value={formData.total_qty_mt} onChange={(e) => setFormData({ ...formData, total_qty_mt: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Rate Type *</Label>
                  <Select value={formData.rate_type} onValueChange={(value) => setFormData({ ...formData, rate_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PER_MT">Per MT</SelectItem>
                      <SelectItem value="PER_TRIP">Per Trip</SelectItem>
                      <SelectItem value="LUMPSUM">Lump Sum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rate Value (₹) *</Label>
                  <Input required type="number" step="0.01" value={formData.customer_rate_value} onChange={(e) => setFormData({ ...formData, customer_rate_value: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Order Date *</Label>
                  <Input required type="date" value={formData.order_date} onChange={(e) => setFormData({ ...formData, order_date: e.target.value })} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full">Create Order</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border shadow-sm rounded-sm overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Order #</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Route</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Qty (MT)</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Status</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Date</th>
              <th className="py-2 px-4 text-right text-xs uppercase font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-muted/50 transition-colors" data-testid="order-row">
                <td className="py-2 px-4 text-sm font-medium">{order.order_number}</td>
                <td className="py-2 px-4 text-sm">{order.origin} → {order.destination}</td>
                <td className="py-2 px-4 text-sm">
                  <div>{order.transported_qty_mt || 0} / {order.total_qty_mt}</div>
                  <div className="text-xs text-muted-foreground">Pending: {order.pending_qty_mt || 0}</div>
                </td>
                <td className="py-2 px-4 text-sm">
                  <span className={`px-2 py-1 rounded-sm text-xs font-medium ${
                    order.status === 'ACTIVE' ? 'bg-success/10 text-success' :
                    order.status === 'COMPLETED' ? 'bg-info/10 text-info' :
                    order.status === 'DRAFT' ? 'bg-muted text-muted-foreground' :
                    'bg-error/10 text-error'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="py-2 px-4 text-sm">{formatDate(order.order_date)}</td>
                <td className="py-2 px-4 text-sm text-right">
                  <Link to={`/orders/${order.id}`}>
                    <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <div className="text-center py-8 text-muted-foreground">No orders found</div>}
      </div>
    </div>
  );
}
