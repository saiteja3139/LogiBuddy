import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Transporters() {
  const [transporters, setTransporters] = useState([]);
  const [filteredTransporters, setFilteredTransporters] = useState([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransporter, setEditingTransporter] = useState(null);
  const [formData, setFormData] = useState({
    name: '', phone: '', address: '', gstin: '', pan: '',
    bank_account_name: '', bank_account_number: '', ifsc: '', bank_name: ''
  });

  useEffect(() => {
    fetchTransporters();
  }, []);

  useEffect(() => {
    if (search) {
      const filtered = transporters.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase()) || t.phone.includes(search)
      );
      setFilteredTransporters(filtered);
    } else {
      setFilteredTransporters(transporters);
    }
  }, [search, transporters]);

  const fetchTransporters = async () => {
    try {
      const response = await api.get('/transporters');
      setTransporters(response.data);
      setFilteredTransporters(response.data);
    } catch (error) {
      toast.error('Failed to load transporters');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTransporter) {
        await api.put(`/transporters/${editingTransporter.id}`, formData);
        toast.success('Transporter updated successfully');
      } else {
        await api.post('/transporters', formData);
        toast.success('Transporter created successfully');
      }
      setDialogOpen(false);
      setEditingTransporter(null);
      setFormData({ name: '', phone: '', address: '', gstin: '', pan: '', bank_account_name: '', bank_account_number: '', ifsc: '', bank_name: '' });
      fetchTransporters();
    } catch (error) {
      toast.error(editingTransporter ? 'Failed to update transporter' : 'Failed to create transporter');
    }
  };

  const handleEdit = (transporter) => {
    setEditingTransporter(transporter);
    setFormData(transporter);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transporter?')) {
      try {
        await api.delete(`/transporters/${id}`);
        toast.success('Transporter deleted successfully');
        fetchTransporters();
      } catch (error) {
        toast.error('Failed to delete transporter');
      }
    }
  };

  return (
    <div className="space-y-6" data-testid="transporters-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-heading">Transporters</h1>
          <p className="text-muted-foreground mt-2">Manage your transporter network</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingTransporter(null);
            setFormData({ name: '', phone: '', address: '', gstin: '', pan: '', bank_account_name: '', bank_account_number: '', ifsc: '', bank_name: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="add-transporter-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Transporter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTransporter ? 'Edit Transporter' : 'Add New Transporter'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
                <div>
                  <Label>GSTIN</Label>
                  <Input value={formData.gstin} onChange={(e) => setFormData({ ...formData, gstin: e.target.value })} />
                </div>
                <div>
                  <Label>PAN</Label>
                  <Input value={formData.pan} onChange={(e) => setFormData({ ...formData, pan: e.target.value })} />
                </div>
                <div>
                  <Label>Bank Account Name</Label>
                  <Input value={formData.bank_account_name} onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })} />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input value={formData.bank_account_number} onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })} />
                </div>
                <div>
                  <Label>IFSC</Label>
                  <Input value={formData.ifsc} onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })} />
                </div>
                <div>
                  <Label>Bank Name</Label>
                  <Input value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} />
                </div>
              </div>
              <Button type="submit" className="w-full">Create Transporter</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="bg-white border shadow-sm rounded-sm overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Name</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Phone</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">PAN</th>
              <th className="py-2 px-4 text-right text-xs uppercase font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredTransporters.map((t) => (
              <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                <td className="py-2 px-4 text-sm font-medium">{t.name}</td>
                <td className="py-2 px-4 text-sm">{t.phone}</td>
                <td className="py-2 px-4 text-sm">{t.pan || '-'}</td>
                <td className="py-2 px-4 text-sm text-right">
                  <Link to={`/transporters/${t.id}`}>
                    <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTransporters.length === 0 && <div className="text-center py-8 text-muted-foreground">No transporters found</div>}
      </div>
    </div>
  );
}
