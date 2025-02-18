
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Bookmark } from "@/hooks/useBookmarks";

interface FormData {
  title: string;
  url: string;
  description: string;
  folder_id: number | null;
  tags: string;
}

interface BookmarkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingBookmark: Bookmark | null;
  folders: any[];
}

export function BookmarkDialog({ isOpen, onClose, editingBookmark, folders }: BookmarkDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    title: editingBookmark?.title || '',
    url: editingBookmark?.url || '',
    description: editingBookmark?.description || '',
    folder_id: editingBookmark?.folder_id || null,
    tags: ''
  });

  useEffect(() => {
    if (editingBookmark) {
      setFormData({
        title: editingBookmark.title,
        url: editingBookmark.url,
        description: editingBookmark.description || '',
        folder_id: editingBookmark.folder_id,
        tags: ''
      });
    }
  }, [editingBookmark]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bookmarkData = {
        title: formData.title,
        url: formData.url,
        description: formData.description || null,
        folder_id: formData.folder_id,
      };

      if (editingBookmark) {
        const { error } = await supabase
          .from('bookmarks')
          .update(bookmarkData)
          .eq('id', editingBookmark.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert([bookmarkData]);
        if (error) throw error;
      }

      onClose();
      toast({
        title: editingBookmark ? "Bookmark updated" : "Bookmark added",
        description: "Your bookmark has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingBookmark ? 'Edit Bookmark' : 'Add New Bookmark'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter bookmark title"
            />
          </div>
          <div>
            <label className="text-sm font-medium">URL</label>
            <Input
              required
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="Enter URL"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Folder</label>
            <select
              className="w-full p-2 border rounded-md"
              value={formData.folder_id || ''}
              onChange={(e) => setFormData({ ...formData, folder_id: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">No folder</option>
              {folders.map((folder: any) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editingBookmark ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
