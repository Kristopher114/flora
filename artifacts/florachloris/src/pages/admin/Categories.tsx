import { useState } from "react";
import { useListCategories, useCreateCategory } from "@workspace/api-client-react";
import { Card, Button, Input } from "@/components/ui-components";
import { toast } from "@/hooks/use-toast";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus } from "lucide-react";

export default function Categories() {
  const { data: categories, isLoading, refetch } = useListCategories();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");

  const createMutation = useCreateCategory({
    mutation: {
      onSuccess: () => {
        toast({ title: "Category added" });
        setIsAddOpen(false);
        setName("");
        setEmoji("");
        refetch();
      }
    }
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground mt-1">Organize your products into collections</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">Loading...</div>
        ) : categories?.map(cat => (
          <Card key={cat.id} className="p-6 flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 transition-transform">
            <span className="text-4xl">{cat.emoji || '🌸'}</span>
            <h3 className="font-serif font-bold text-lg">{cat.name}</h3>
            {cat.description && <p className="text-sm text-muted-foreground line-clamp-2">{cat.description}</p>}
          </Card>
        ))}
      </div>

      <Dialog.Root open={isAddOpen} onOpenChange={setIsAddOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-3xl shadow-2xl w-[90vw] max-w-md z-[201]">
            <Dialog.Title className="font-serif text-2xl font-bold mb-6">Add New Category</Dialog.Title>
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate({ data: { name, emoji: emoji || null } }); }} className="flex flex-col gap-4">
              <Input label="Category Name *" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bouquets" />
              <Input label="Emoji Icon" value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="💐" />
              <div className="flex gap-3 mt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" isLoading={createMutation.isPending}>Save</Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
