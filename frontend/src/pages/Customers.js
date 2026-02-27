import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    payment_terms_days: 0,
    notes: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (search) {
      const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.phone.includes(search)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [search, customers]);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
      setFilteredCustomers(response.data);
    } catch (error) {
      toast.error('Failed to load customers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
        toast.success('Customer updated successfully');
      } else {
        await api.post('/customers', formData);
        toast.success('Customer created successfully');
      }
      setDialogOpen(false);
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', email: '', address: '', gstin: '', payment_terms_days: 0, notes: '' });
      fetchCustomers();
    } catch (error) {
      toast.error(editingCustomer ? 'Failed to update customer' : 'Failed to create customer');
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await api.delete(`/customers/${id}`);
        toast.success('Customer deleted successfully');
        fetchCustomers();
      } catch (error) {
        toast.error('Failed to delete customer');
      }
    }
  };

  return (
    <div className="space-y-6" data-testid="customers-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground font-heading">Customers</h1>
          <p className="text-muted-foreground mt-2">Manage your customer database</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingCustomer(null);
            setFormData({ name: '', phone: '', email: '', address: '', gstin: '', payment_terms_days: 0, notes: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="add-customer-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    data-testid="customer-name-input"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    data-testid="customer-phone-input"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input
                    id="gstin"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="payment_terms">Payment Terms (Days)</Label>
                  <Input
                    id="payment_terms"
                    type="number"
                    value={formData.payment_terms_days}
                    onChange={(e) => setFormData({ ...formData, payment_terms_days: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" data-testid="customer-submit-btn" className="w-full">{editingCustomer ? 'Update Customer' : 'Create Customer'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by name or phone..."
            data-testid="search-customers-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white border border-border shadow-sm rounded-sm overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="py-2 px-4 text-left text-xs uppercase tracking-wider font-semibold text-muted-foreground">Name</th>
              <th className="py-2 px-4 text-left text-xs uppercase tracking-wider font-semibold text-muted-foreground">Phone</th>
              <th className="py-2 px-4 text-left text-xs uppercase tracking-wider font-semibold text-muted-foreground">Email</th>
              <th className="py-2 px-4 text-left text-xs uppercase tracking-wider font-semibold text-muted-foreground">GSTIN</th>
              <th className="py-2 px-4 text-left text-xs uppercase tracking-wider font-semibold text-muted-foreground">Payment Terms</th>
              <th className="py-2 px-4 text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-muted/50 transition-colors" data-testid="customer-row">
                <td className="py-2 px-4 text-sm whitespace-nowrap font-medium">{customer.name}</td>
                <td className="py-2 px-4 text-sm whitespace-nowrap">{customer.phone}</td>
                <td className="py-2 px-4 text-sm whitespace-nowrap">{customer.email || '-'}</td>
                <td className="py-2 px-4 text-sm whitespace-nowrap">{customer.gstin || '-'}</td>
                <td className="py-2 px-4 text-sm whitespace-nowrap">{customer.payment_terms_days} days</td>
                <td className="py-2 px-4 text-sm whitespace-nowrap text-right">
                  <Link to={`/customers/${customer.id}`}>
                    <Button variant="ghost" size="sm" data-testid="view-customer-btn">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCustomers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No customers found</div>
        )}
      </div>
    </div>
  );
}
