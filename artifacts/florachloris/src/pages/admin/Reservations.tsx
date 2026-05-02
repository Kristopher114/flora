import { useListReservations, useUpdateReservationStatus } from "@workspace/api-client-react";
import { Card, Badge, Button } from "@/components/ui-components";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function Reservations() {
  const { data: reservations, isLoading, refetch } = useListReservations();
  
  const updateMutation = useUpdateReservationStatus({
    mutation: {
      onSuccess: () => {
        toast({ title: "Reservation updated" });
        refetch();
      }
    }
  });

  const handleUpdateStatus = (id: number, status: 'confirmed' | 'completed' | 'cancelled') => {
    updateMutation.mutate({ id, data: { status } });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">Reservations</h1>
        <p className="text-muted-foreground mt-1">Manage online pickup reservations</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-4 font-semibold text-sm">Res #</th>
                <th className="px-6 py-4 font-semibold text-sm">Customer</th>
                <th className="px-6 py-4 font-semibold text-sm">Pickup Date</th>
                <th className="px-6 py-4 font-semibold text-sm">Total</th>
                <th className="px-6 py-4 font-semibold text-sm">Payment</th>
                <th className="px-6 py-4 font-semibold text-sm">Status</th>
                <th className="px-6 py-4 font-semibold text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center">Loading...</td></tr>
              ) : reservations?.map(res => (
                <tr key={res.id} className="hover:bg-muted/10">
                  <td className="px-6 py-4 font-medium">{res.reservationNumber}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{res.customerName}</div>
                    <div className="text-xs text-muted-foreground">{res.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-primary">
                    {formatDate(res.pickupDate)}
                  </td>
                  <td className="px-6 py-4 font-semibold">{formatCurrency(res.total)}</td>
                  <td className="px-6 py-4">
                    {res.paymentMethod ? (
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${res.paymentMethod === 'gcash' ? 'bg-blue-50 text-blue-700 border border-blue-200' : res.paymentMethod === 'maya' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {res.paymentMethod === 'gcash' ? '📱 GCash' : res.paymentMethod === 'maya' ? '💚 Maya' : '💵 Cash'}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={res.status === 'completed' ? 'success' : res.status === 'confirmed' ? 'warning' : res.status === 'cancelled' ? 'destructive' : 'default'}>
                      {res.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {res.status === 'pending' && (
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(res.id, 'confirmed')}>Verify & Confirm</Button>
                      )}
                      {res.status === 'confirmed' && (
                        <Button size="sm" variant="outline" className="bg-primary text-white border-primary" onClick={() => handleUpdateStatus(res.id, 'completed')}>Picked Up</Button>
                      )}
                      {(res.status === 'pending' || res.status === 'confirmed') && (
                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleUpdateStatus(res.id, 'cancelled')}>Cancel</Button>
                      )}
                    </div>
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
