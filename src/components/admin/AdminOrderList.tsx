import { Badge } from "@/components/ui/badge";
import type { DbOrder } from "@/types/database";
import { formatCurrency } from "@/lib/currency";

const AdminOrderList = ({ orders }: { orders: DbOrder[] }) => (
  <>
    <h2 className="text-xl font-heading font-bold mb-4">Recent Orders</h2>
    
    {orders.length === 0 ? (
      <div className="text-center py-8 text-muted-foreground border border-border rounded-lg bg-card">
        <p>No orders yet.</p>
      </div>
    ) : (
      <div className="space-y-3">
        {orders.slice(0, 20).map(order => {
          const totalTickets = (order.order_items || []).reduce(
            (s: number, i: any) => s + (i.quantity || 0), 
            0
          );

          return (
            <div 
              key={order.id} 
              className="rounded-lg border border-border bg-card p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-sm">
                  {order.events?.title || 'Unknown Event'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Order {order.id.slice(0, 8)} · {totalTickets} ticket{totalTickets !== 1 ? 's' : ''} ·{" "}
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="text-right">
                <p className="font-heading font-bold text-primary">
                  {formatCurrency(order.total_amount)}
                </p>
                <Badge variant="secondary" className="text-xs capitalize mt-1">
                  {order.status}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </>
);

export default AdminOrderList;