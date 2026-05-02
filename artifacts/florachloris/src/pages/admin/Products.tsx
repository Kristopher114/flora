import { useState, useRef, useCallback } from "react";
import {
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useListCategories,
  type Product,
} from "@workspace/api-client-react";
import { Button, Card, Badge } from "@/components/ui-components";
import { formatCurrency } from "@/lib/utils";
import {
  Plus, Edit2, Trash2, X, ImageIcon, Upload,
  CheckCircle2, AlertCircle, RefreshCw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import * as Dialog from "@radix-ui/react-dialog";

// ─── Supported formats ───────────────────────────────────────────────────────
const ALLOWED_MIME = ["image/webp", "image/png", "image/jpeg"] as const;
const ALLOWED_EXT  = ".webp, .png, .jpg, .jpeg";
type AllowedMime   = (typeof ALLOWED_MIME)[number];

// ─── Image helpers ───────────────────────────────────────────────────────────
const MAX_DIMENSION = 800;   // px — resize if wider/taller than this
const JPEG_QUALITY  = 0.82;
const WEBP_QUALITY  = 0.82;

function compressImage(file: File): Promise<{ dataUrl: string; width: number; height: number; sizeKB: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
        width  = Math.round(width  * scale);
        height = Math.round(height * scale);

        const canvas = document.createElement("canvas");
        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        const mime: AllowedMime = file.type as AllowedMime;
        const quality = mime === "image/jpeg" ? JPEG_QUALITY
                      : mime === "image/webp"  ? WEBP_QUALITY
                      : undefined;   // PNG is lossless

        const dataUrl = canvas.toDataURL(mime, quality);
        const sizeKB  = Math.round((dataUrl.length * 0.75) / 1024);
        resolve({ dataUrl, width, height, sizeKB });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

function validateMime(file: File): string | null {
  if (!ALLOWED_MIME.includes(file.type as AllowedMime)) {
    return `"${file.name}" is not supported. Please use ${ALLOWED_EXT}.`;
  }
  return null;
}

// ─── Backend MIME guard ──────────────────────────────────────────────────────
// Called server-side equivalent — checked on frontend too before the network call
function dataUrlMimeOk(dataUrl: string | null | undefined): boolean {
  if (!dataUrl) return true;
  if (dataUrl.startsWith("http://") || dataUrl.startsWith("https://")) return true;
  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,/);
  if (!match) return false;
  return ALLOWED_MIME.includes(match[1] as AllowedMime);
}

// ─── Image upload zone component ────────────────────────────────────────────
interface ImageInfo { dataUrl: string; width: number; height: number; sizeKB: number; name: string }

function ImageUploadZone({
  current,
  onChange,
  onClear,
}: {
  current: string | null;
  onChange: (info: ImageInfo) => void;
  onClear: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    const err = validateMime(file);
    if (err) { setError(err); return; }
    setProcessing(true);
    try {
      const result = await compressImage(file);
      onChange({ ...result, name: file.name });
    } catch {
      setError("Failed to process image. Please try another file.");
    } finally {
      setProcessing(false);
    }
  }, [onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const mimeLabel: Record<AllowedMime, string> = {
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WebP",
  };

  const currentMime = current?.match(/^data:(image\/[a-z+]+);base64,/)?.[1] ?? null;

  return (
    <div className="flex flex-col gap-2">
      {/* Drop zone */}
      <div
        onClick={() => !processing && fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={[
          "relative w-full rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden",
          "flex items-center justify-center",
          current ? "h-48" : "h-36",
          dragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 bg-muted/20",
          processing ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
      >
        {processing ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-7 w-7 animate-spin" />
            <span className="text-xs font-medium">Processing image…</span>
          </div>
        ) : current ? (
          <>
            <img src={current} alt="Product preview" className="w-full h-full object-contain" />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                <Upload className="h-4 w-4" /> Replace Image
              </span>
            </div>
            {/* Format badge */}
            {currentMime && mimeLabel[currentMime as AllowedMime] && (
              <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {mimeLabel[currentMime as AllowedMime]}
              </span>
            )}
            {/* Remove button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-2 right-2 h-7 w-7 bg-destructive text-white rounded-full flex items-center justify-center shadow hover:bg-destructive/90 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground py-4 px-3 text-center">
            <ImageIcon className="h-9 w-9 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-foreground/60">{dragging ? "Drop image here" : "Click or drag image here"}</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Supports: {ALLOWED_EXT}</p>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept={ALLOWED_MIME.join(",")}
        onChange={handleFileChange}
        className="hidden"
      />

      <p className="text-[11px] text-muted-foreground/60">
        Max display size: {MAX_DIMENSION}px. Larger images are automatically resized.
      </p>
    </div>
  );
}

// ─── Products page ───────────────────────────────────────────────────────────
export default function Products() {
  const { data: products, isLoading, refetch } = useListProducts();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const deleteMutation = useDeleteProduct({
    mutation: {
      onSuccess: () => { toast({ title: "Product Deleted" }); refetch(); },
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate({ id });
    }
  };

  const nextCode = `PRD-${String((products?.length ?? 0) + 1).padStart(3, "0")}`;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your catalog of flowers and gifts</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-4 font-semibold text-sm">Code</th>
                <th className="px-6 py-4 font-semibold text-sm">Product</th>
                <th className="px-6 py-4 font-semibold text-sm">Category</th>
                <th className="px-6 py-4 font-semibold text-sm">Cost</th>
                <th className="px-6 py-4 font-semibold text-sm">Selling Price</th>
                <th className="px-6 py-4 font-semibold text-sm">Status</th>
                <th className="px-6 py-4 font-semibold text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
                  </td>
                </tr>
              ) : (
                products?.map((p, i) => (
                  <tr key={p.id} className="hover:bg-muted/20">
                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                      PRD-{String(i + 1).padStart(3, "0")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.imageUrl || `${import.meta.env.BASE_URL}images/placeholder-bouquet.png`}
                          className="w-10 h-10 rounded-lg object-cover bg-muted"
                          alt=""
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `${import.meta.env.BASE_URL}images/placeholder-bouquet.png`;
                          }}
                        />
                        <div>
                          <p className="font-medium">{p.name}</p>
                          {p.unit && <p className="text-xs text-muted-foreground">per {p.unit}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{p.categoryName}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {p.purchaseCost != null ? formatCurrency(p.purchaseCost) : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{formatCurrency(p.price)}</td>
                    <td className="px-6 py-4">
                      <Badge variant={p.isAvailable ? "success" : "default"}>
                        {p.isAvailable ? "In POS" : "Hidden"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingProduct(p)}>
                          <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => handleDelete(p.id)}
                          isLoading={deleteMutation.isPending && deleteMutation.variables?.id === p.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ProductFormModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => { setIsAddOpen(false); refetch(); }}
        nextCode={nextCode}
      />

      {editingProduct && (
        <ProductFormModal
          product={editingProduct}
          open={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          onSuccess={() => { setEditingProduct(null); refetch(); }}
          nextCode={nextCode}
        />
      )}
    </div>
  );
}

// ─── Shared form helpers ─────────────────────────────────────────────────────
function SectionDivider({ title }: { title: string }) {
  return (
    <div className="mt-2 mb-1">
      <p className="font-semibold text-base text-foreground mb-2">{title}</p>
      <hr className="border-border" />
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground/80">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-white px-3 h-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors";

// ─── Product form modal ──────────────────────────────────────────────────────
function ProductFormModal({
  open, onClose, onSuccess, product, nextCode,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product;
  nextCode: string;
}) {
  const [name, setName]               = useState(product?.name || "");
  const [categoryId, setCategoryId]   = useState(product?.categoryId?.toString() || "");
  const [stockQuantity, setStockQty]  = useState(product?.stockQuantity?.toString() || "");
  const [description, setDescription] = useState(product?.description || "");
  const [purchaseCost, setPurchaseCost] = useState(product?.purchaseCost?.toString() || "");
  const [sellingPrice, setSellingPrice] = useState(product?.price?.toString() || "");
  const [showInPOS, setShowInPOS]     = useState(product?.isAvailable !== false);

  // Image state: null = no image (cleared), string = data URL or remote URL
  const [imageUrl, setImageUrl]       = useState<string | null>(product?.imageUrl || null);
  const [imageInfo, setImageInfo]     = useState<Omit<ImageInfo, "dataUrl"> | null>(null);

  const { data: categories } = useListCategories();

  const cost    = parseFloat(purchaseCost) || 0;
  const selling = parseFloat(sellingPrice) || 0;
  const margin  = selling - cost;
  const costPct = selling > 0 ? ((cost / selling) * 100).toFixed(0) : 0;

  const createMutation = useCreateProduct({
    mutation: {
      onSuccess: () => { toast({ title: "Product created successfully" }); onSuccess(); },
      onError: () => toast({ title: "Error", description: "Failed to create product.", variant: "destructive" }),
    },
  });
  const updateMutation = useUpdateProduct({
    mutation: {
      onSuccess: () => { toast({ title: "Product updated successfully" }); onSuccess(); },
      onError: () => toast({ title: "Error", description: "Failed to update product.", variant: "destructive" }),
    },
  });

  const handleImageChange = (info: ImageInfo) => {
    setImageUrl(info.dataUrl);
    setImageInfo({ name: info.name, width: info.width, height: info.height, sizeKB: info.sizeKB });
  };

  const handleImageClear = () => {
    setImageUrl(null);
    setImageInfo(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sellingPrice || !categoryId) {
      toast({ title: "Missing fields", description: "Item Name, Category, and Selling Price are required.", variant: "destructive" });
      return;
    }
    // Frontend MIME guard (belt-and-suspenders before sending to backend)
    if (!dataUrlMimeOk(imageUrl)) {
      toast({ title: "Invalid image format", description: `Only ${ALLOWED_EXT} are accepted.`, variant: "destructive" });
      return;
    }

    const payload = {
      name,
      price: parseFloat(sellingPrice),
      purchaseCost: purchaseCost ? parseFloat(purchaseCost) : null,
      categoryId: parseInt(categoryId),
      stockQuantity: parseInt(stockQuantity) || 0,
      description: description || null,
      imageUrl: imageUrl || null,
      isAvailable: showInPOS,
    };

    if (product) {
      updateMutation.mutate({ id: product.id, data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const itemCode  = product ? `PRD-${String(product.id).padStart(3, "0")}` : nextCode;

  return (
    <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[200] animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-[90vw] max-w-lg z-[201] animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">

          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-6 pb-4">
            <div>
              <Dialog.Title className="text-xl font-bold text-foreground">
                {product ? "Edit Product" : "Add Product"}
              </Dialog.Title>
              <p className="text-sm text-muted-foreground mt-0.5">
                {product ? "Update product details and image" : "Create a new product"}
              </p>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors mt-0.5">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 pb-6 flex flex-col gap-5">

            {/* ── Item Details ── */}
            <div className="border border-border rounded-xl p-4 flex flex-col gap-4">
              <SectionDivider title="Item Details" />

              <FormField label="Item Code">
                <input value={itemCode} readOnly className={`${inputCls} bg-muted/50 text-muted-foreground cursor-not-allowed`} />
              </FormField>

              <FormField label="Item Name">
                <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
              </FormField>

              <FormField label="Category">
                <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
                  <option value="" disabled>Select Category</option>
                  {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FormField>

              <FormField label="Stock">
                <input type="number" min="0" value={stockQuantity} onChange={(e) => setStockQty(e.target.value)} className={inputCls} />
              </FormField>

              <FormField label="Description">
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter product description…" rows={3}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y transition-colors"
                />
              </FormField>

              {/* ── Product Image ── */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground/80">Product Image</label>

                <ImageUploadZone
                  current={imageUrl}
                  onChange={handleImageChange}
                  onClear={handleImageClear}
                />

                {/* Image metadata strip */}
                {imageInfo && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    <span className="font-medium text-foreground/70 truncate">{imageInfo.name}</span>
                    <span className="shrink-0">{imageInfo.width} × {imageInfo.height}px</span>
                    <span className="shrink-0">{imageInfo.sizeKB} KB</span>
                  </div>
                )}

                {/* Editing: note about keeping old image */}
                {product?.imageUrl && imageUrl === product.imageUrl && (
                  <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Keeping existing image — upload a new one to replace it
                  </p>
                )}
              </div>
            </div>

            {/* ── Cost Details ── */}
            <div className="border border-border rounded-xl p-4 flex flex-col gap-4">
              <SectionDivider title="Cost Details" />

              <FormField label="Purchase Cost (₱)">
                <input type="number" step="0.01" min="0" value={purchaseCost} onChange={(e) => setPurchaseCost(e.target.value)} className={inputCls} />
              </FormField>

              <FormField label="Selling Price (₱)">
                <input type="number" step="0.01" min="0" required value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} className={inputCls} />
              </FormField>

              <div className="bg-muted/40 rounded-lg border border-border divide-y divide-border text-sm">
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-foreground/70">Cost</span>
                  <span className="font-medium">₱ {cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-foreground/70">Margin</span>
                  <span className={`font-medium ${margin < 0 ? "text-destructive" : ""}`}>₱ {margin.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-foreground/70">Product Cost Percentage</span>
                  <span className="font-medium">{costPct}%</span>
                </div>
              </div>
            </div>

            {/* ── POS Visibility ── */}
            <div className="border border-border rounded-xl p-4 flex flex-col gap-3">
              <SectionDivider title="Add Item to POS" />
              <p className="text-sm text-muted-foreground">Do you want this item to show up in POS?</p>
              <button
                type="button" onClick={() => setShowInPOS((v) => !v)}
                className="flex items-center gap-3 w-fit"
              >
                <div className={`relative w-11 h-6 rounded-full transition-colors ${showInPOS ? "bg-green-500" : "bg-muted-foreground/30"}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${showInPOS ? "translate-x-5" : ""}`} />
                </div>
                <span className={`text-sm font-semibold ${showInPOS ? "text-green-600" : "text-muted-foreground"}`}>
                  {showInPOS ? "Enabled" : "Disabled"}
                </span>
              </button>
            </div>

            <Button type="submit" className="w-full h-11 text-base font-semibold rounded-xl" isLoading={isLoading}>
              {product ? "Save Changes" : "Add Product"}
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
