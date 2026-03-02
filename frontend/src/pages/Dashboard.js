import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { IndianRupee, TrendingUp, TrendingDown, Package, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [expiringDocs, setExpiringDocs] = useState({ expiring_soon: [], expired: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
    fetchExpiringDocuments();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/dashboard');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiringDocuments = async () => {
    try {
      const response = await api.get('/documents/expiring/soon?days=30');
      setExpiringDocs(response.data);
    } catch (error) {
      console.error('Failed to load expiring documents');
    }
  };

  if (loading) {
    return <div data-testid="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 md:space-y-8" data-testid="dashboard">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground font-heading">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Your logistics overview at a glance</p>
      </div>

      {/* Metrics Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Outstanding Receivables */}
        <Card className="hover:shadow-md transition-all duration-200" data-testid="receivables-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Receivables
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground font-heading">
              {formatCurrency(stats?.total_outstanding_receivables || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Outstanding from customers</p>
          </CardContent>
        </Card>

        {/* Outstanding Payables */}
        <Card className="hover:shadow-md transition-all duration-200" data-testid="payables-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payables
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-error" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground font-heading">
              {formatCurrency(stats?.total_outstanding_payables || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Due to transporters</p>
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card className="hover:shadow-md transition-all duration-200" data-testid="pending-orders-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Orders
            </CardTitle>
            <Package className="h-4 w-4 text-accent" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground font-heading">
              {stats?.pending_orders_count || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Orders with pending qty</p>
          </CardContent>
        </Card>

        {/* Overdue Customers */}
        <Card className="hover:shadow-md transition-all duration-200" data-testid="overdue-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Overdue
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground font-heading">
              {stats?.overdue_customers_count || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Customers with overdue payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Documents Alert */}
      {(expiringDocs.expiring_soon.length > 0 || expiringDocs.expired.length > 0) && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="text-warning flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Document Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {expiringDocs.expired.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-error mb-2">Expired Documents ({expiringDocs.expired.length})</h3>
                <div className="space-y-2">
                  {expiringDocs.expired.slice(0, 3).map(doc => (
                    <div key={doc.id} className="text-sm flex justify-between items-center p-2 bg-error/5 rounded-sm">
                      <span>{doc.title} - {doc.entity_type}</span>
                      <span className="text-xs text-error">{formatDate(doc.expiry_date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {expiringDocs.expiring_soon.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-warning mb-2">Expiring Soon ({expiringDocs.expiring_soon.length})</h3>
                <div className="space-y-2">
                  {expiringDocs.expiring_soon.slice(0, 3).map(doc => (
                    <div key={doc.id} className="text-sm flex justify-between items-center p-2 bg-warning/5 rounded-sm">
                      <span>{doc.title} - {doc.entity_type}</span>
                      <span className="text-xs text-warning">{formatDate(doc.expiry_date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/orders">
          <Card className="cursor-pointer hover:shadow-md hover:border-secondary/20 transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">View Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Manage and track all your orders</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/payments">
          <Card className="cursor-pointer hover:shadow-md hover:border-secondary/20 transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Manage Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Track receivables and payables</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/reports">
          <Card className="cursor-pointer hover:shadow-md hover:border-secondary/20 transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">View Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Generate detailed reports</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
