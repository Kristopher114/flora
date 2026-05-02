import { useState } from "react";
import { useListOrders, useUpdateOrderStatus, type Order } from "@workspace/api-client-react";
import { Card, Badge, Button } from "@/components/ui-components";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Check, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Orders() {
  const { data: orders, isLoading, refetch } = useListOrders();
  
  const updateMutation = useUpdateOrderStatus({
    mutation: {
      onSuccess: () => {
        toast({ title: "Order status updated" });
        refetch();
      }
    }
  });

  const handleUpdateStatus = (id: number, status: 'completed' | 'cancelled') => {
    updateMutation.mutate({ id, data: { status } });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">Orders</h1>
        <p className="text-muted-foreground mt-1">Manage POS and online orders</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-4 font-semibold text-sm">Order #</th>
                <th className="px-6 py-4 font-semibold text-sm">Date</th>
                <th className="px-6 py-4 font-semibold text-sm">Customer</th>
                <th className="px-6 py-4 font-semibold text-sm">Total</th>
                <th className="px-6 py-4 font-semibold text-sm">Status</th>
                <th className="px-6 py-4 font-semibold text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center">Loading...</td></tr>
              ) : orders?.map(order => (
                <tr key={order.id} className="hover:bg-muted/10">
                  <td className="px-6 py-4 font-medium">{order.orderNumber}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(order.createdAt)}</td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-sm">{order.customerName || 'Walk-in'}</span>
                    <Badge variant="default" className="ml-2 bg-muted text-muted-foreground border-transparent">{order.type}</Badge>
                  </td>
                  <td className="px-6 py-4 font-semibold">{formatCurrency(order.total)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'destructive' : 'warning'}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {order.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 px-3 text-xs bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                          onClick={() => handleUpdateStatus(order.id, 'completed')}
                        >
                          Complete
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
