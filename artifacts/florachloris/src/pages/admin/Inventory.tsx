import { useState, useRef } from "react";
import { useListInventory, useUpdateInventory, useUpdateProduct, type InventoryItem } from "@workspace/api-client-react";
import { Button, Card, Badge, Input } from "@/components/ui-components";
import { formatCurrency } from "@/lib/utils";
import { PackageX, Check, ImagePlus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import * as Dialog from "@radix-ui/react-dialog";

export default function Inventory() {
  const { data: inventory, isLoading, refetch } = useListInventory();

  if (isLoading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">Inventory Management</h1>
        <p className="text-muted-foreground mt-1">Monitor and update product stock levels and images</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-4 font-semibold text-sm text-foreground/70">Product</th>
                <th className="px-6 py-4 font-semibold text-sm text-foreground/70">Category</th>
                <th className="px-6 py-4 font-semibold text-sm text-foreground/70">Price</th>
                <th className="px-6 py-4 font-semibold text-sm text-foreground/70">Status</th>
                <th className="px-6 py-4 font-semibold text-sm text-foreground/70 w-48">Stock Qty</th>
                <th className="px-6 py-4 font-semibold text-sm text-foreground/70 text-center">Image</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inventory?.map((item) => (
                <InventoryRow key={item.productId} item={item} onUpdate={refetch} />
              ))}
              {inventory?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <PackageX className="mx-auto h-8 w-8 mb-3 opacity-30" />
                    No items in inventory
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function InventoryRow({ item, onUpdate }: { item: InventoryItem; onUpdate: () => void }) {
  const [qty, setQty] = useState(item.stockQuantity.toString());
  const [isEditing, setIsEditing] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const updateMutation = useUpdateInventory({
    mutation: {
      onSuccess: () => {
        setIsEditing(false);
        toast({ title: "Stock updated", description: `${item.productName} updated successfully.` });
        onUpdate();
      },
    },
  });

  const handleSave = () => {
    const num = parseInt(qty);
    if (isNaN(num) || num < 0) return;
    if (num === item.stockQuantity) {
      setIsEditing(false);
      return;
    }
    updateMutation.mutate({ productId: item.productId, data: { stockQuantity: num } });
  };

  const placeholderUrl = `${import.meta.env.BASE_URL}images/placeholder-bouquet.png`;

  return (
    <>
      <tr className="hover:bg-muted/20 transition-colors">
        <td className="px-6 py-4 font-medium">{item.productName}</td>
        <td className="px-6 py-4 text-sm text-muted-foreground">{item.categoryName || "-"}</td>
        <td className="px-6 py-4 text-sm">{formatCurrency(item.price)}</td>
        <td className="px-6 py-4">
          {item.stockQuantity <= 0 ? (
            <Badge variant="destructive">Out of Stock</Badge>
          ) : item.stockQuantity < 10 ? (
            <Badge variant="warning">Low Stock</Badge>
          ) : (
            <Badge variant="success">In Stock</Badge>
          )}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <input
                  type="number"
                  min="0"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-20 h-9 rounded-lg border-2 border-primary/40 px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
                <Button size="icon" className="h-9 w-9" onClick={handleSave} isLoading={updateMutation.isPending}>
                  <Check className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div
                className="flex items-center gap-3 cursor-pointer group px-3 py-1.5 rounded-lg hover:bg-muted"
                onClick={() => setIsEditing(true)}
              >
                <span className="font-semibold w-12">{item.stockQuantity}</span>
                <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
              </div>
            )}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center justify-center gap-2">
            <img
              src={(item as any).imageUrl || placeholderUrl}
              alt={item.productName}
              className="w-10 h-10 rounded-lg object-cover bg-muted border border-border"
              onError={(e) => { (e.target as HTMLImageElement).src = placeholderUrl; }}
            />
            <button
              onClick={() => setImageDialogOpen(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Change Image"
            >
              <ImagePlus className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>

      <ChangeImageDialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        productId={item.productId}
        productName={item.productName}
        currentImageUrl={(item as any).imageUrl || null}
        onSuccess={() => {
          setImageDialogOpen(false);
          onUpdate();
        }}
      />
    </>
  );
}

function ChangeImageDialog({
  open,
  onClose,
  productId,
  productName,
  currentImageUrl,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
  currentImageUrl: string | null;
  onSuccess: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const placeholderUrl = `${import.meta.env.BASE_URL}images/placeholder-bouquet.png`;

  const updateMutation = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        toast({ title: "Image updated", description: `${productName} image saved successfully.` });
        onSuccess();
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to update image.", variant: "destructive" });
      },
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!selectedFile || !previewUrl) return;
    updateMutation.mutate({
      id: productId,
      data: { imageUrl: previewUrl },
    });
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-3xl shadow-2xl w-[90vw] max-w-md z-[201] animate-in zoom-in-95">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="font-serif text-2xl font-bold">Change Image</Dialog.Title>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground mb-5 font-medium">{productName}</p>

          <div className="flex flex-col gap-5">
            <div>
              <label className="text-sm font-medium text-foreground/80 mb-2 block">Image:</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border file:border-border
                  file:text-sm file:font-medium
                  file:bg-muted file:text-foreground
                  hover:file:bg-muted/80
                  file:cursor-pointer cursor-pointer"
              />
            </div>

            {previewUrl && (
              <div className="relative inline-block">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-border shadow-sm"
                  onError={(e) => { (e.target as HTMLImageElement).src = placeholderUrl; }}
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5 shadow hover:bg-destructive/80 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleSave}
                isLoading={updateMutation.isPending}
                disabled={!selectedFile}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
