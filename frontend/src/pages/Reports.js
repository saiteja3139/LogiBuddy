import { useEffect, useState } from 'react';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export default function Reports() {
  const [customerReport, setCustomerReport] = useState([]);
  const [transporterReport, setTransporterReport] = useState([]);
  const [orderReport, setOrderReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [custRes, transRes, orderRes] = await Promise.all([
        api.get('/reports/customer-outstanding'),
        api.get('/reports/transporter-outstanding'),
        api.get('/reports/order-summary')
      ]);
      setCustomerReport(Array.isArray(custRes.data) ? custRes.data : []);
      setTransporterReport(Array.isArray(transRes.data) ? transRes.data : []);
      setOrderReport(Array.isArray(orderRes.data) ? orderRes.data : []);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  if (loading) return <div>Loading reports...</div>;

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div>
        <h1 className="text-4xl font-bold font-heading">Reports</h1>
        <p className="text-muted-foreground mt-2">Generate detailed business reports</p>
      </div>

      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers">Customer Outstanding</TabsTrigger>
          <TabsTrigger value="transporters">Transporter Outstanding</TabsTrigger>
          <TabsTrigger value="orders">Order Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Customer Outstanding & Aging Report</CardTitle>
              <Button size="sm" onClick={() => exportToCSV(customerReport, 'customer-outstanding')}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="bg-white border shadow-sm rounded-sm overflow-hidden">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Customer</th>
                      <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Phone</th>
                      <th className="py-2 px-4 text-right text-xs uppercase font-semibold text-muted-foreground">Total Billed</th>
                      <th className="py-2 px-4 text-right text-xs uppercase font-semibold text-muted-foreground">Total Received</th>
                      <th className="py-2 px-4 text-right text-xs uppercase font-semibold text-muted-foreground">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {customerReport.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/50 transition-colors">
                        <td className="py-2 px-4 text-sm font-medium">{row.customer_name}</td>
                        <td className="py-2 px-4 text-sm">{row.customer_phone}</td>
                        <td className="py-2 px-4 text-sm text-right">{formatCurrency(row.total_billed)}</td>
                        <td className="py-2 px-4 text-sm text-right text-success">{formatCurrency(row.total_received)}</td>
                        <td className="py-2 px-4 text-sm text-right font-medium text-error">{formatCurrency(row.outstanding)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {customerReport.length === 0 && <div className="text-center py-8 text-muted-foreground">No data available</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transporters" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transporter Outstanding Report</CardTitle>
              <Button size="sm" onClick={() => exportToCSV(transporterReport, 'transporter-outstanding')}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="bg-white border shadow-sm rounded-sm overflow-hidden">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Transporter</th>
                      <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Phone</th>
                      <th className="py-2 px-4 text-right text-xs uppercase font-semibold text-muted-foreground">Total Payable</th>
                      <th className="py-2 px-4 text-right text-xs uppercase font-semibold text-muted-foreground">Total Paid</th>
                      <th className="py-2 px-4 text-right text-xs uppercase font-semibold text-muted-foreground">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transporterReport.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/50 transition-colors">
                        <td className="py-2 px-4 text-sm font-medium">{row.transporter_name}</td>
                        <td className="py-2 px-4 text-sm">{row.transporter_phone}</td>
                        <td className="py-2 px-4 text-sm text-right text-error">{formatCurrency(row.total_payable)}</td>
                        <td className="py-2 px-4 text-sm text-right text-success">{formatCurrency(row.total_paid)}</td>
                        <td className="py-2 px-4 text-sm text-right font-medium text-warning">{formatCurrency(row.outstanding)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {transporterReport.length === 0 && <div className="text-center py-8 text-muted-foreground">No data available</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Order Summary & Margin Report</CardTitle>
              <Button size="sm" onClick={() => exportToCSV(orderReport, 'order-summary')}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="bg-white border shadow-sm rounded-sm overflow-hidden">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Order #</th>
                      <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Route</th>
                      <th className="py-2 px-4 text-right text-xs uppercase font-semibold text-muted-foreground">Qty (MT)</th>
                      <th className="py-2 px-4 text-right text-xs uppercase font-semibold text-muted-foreground">Billed</th>
                      <th className="py-2 px-4 text-right text-xs uppercase font-semibold text-muted-foreground">Payable</th>
                      <th className="py-2 px-4 text-right text-xs uppercase font-semibold text-muted-foreground">Margin</th>
                      <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orderReport.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/50 transition-colors">
                        <td className="py-2 px-4 text-sm font-medium">{row.order_number}</td>
                        <td className="py-2 px-4 text-sm">{row.origin} → {row.destination}</td>
                        <td className="py-2 px-4 text-sm text-right">
                          <div>{row.transported_qty_mt} / {row.total_qty_mt}</div>
                          <div className="text-xs text-muted-foreground">Pending: {row.pending_qty_mt}</div>
                        </td>
                        <td className="py-2 px-4 text-sm text-right">{formatCurrency(row.total_billed)}</td>
                        <td className="py-2 px-4 text-sm text-right">{formatCurrency(row.total_payable)}</td>
                        <td className="py-2 px-4 text-sm text-right font-medium text-success">{formatCurrency(row.margin)}</td>
                        <td className="py-2 px-4 text-sm">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {orderReport.length === 0 && <div className="text-center py-8 text-muted-foreground">No data available</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
