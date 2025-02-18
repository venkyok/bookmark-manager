
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Bookmark } from "@/hooks/useBookmarks";

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onEdit: (bookmark: Bookmark) => void;
}

export function BookmarkList({ bookmarks, onEdit }: BookmarkListProps) {
  const { toast } = useToast();

  const handleDelete = async (bookmarkId: number) => {
    if (window.confirm('Are you sure you want to delete this bookmark?')) {
      try {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('id', bookmarkId);
        
        if (error) throw error;

        toast({
          title: "Bookmark deleted",
          description: "The bookmark has been removed successfully.",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      {bookmarks.map((bookmark: Bookmark) => (
        <Card key={bookmark.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{bookmark.title}</h3>
              <a 
                href={bookmark.url} 
                className="text-sm text-blue-500 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {bookmark.url}
              </a>
              <p className="text-sm text-gray-500 mt-1">{bookmark.description}</p>
              {bookmark.folder && (
                <div className="mt-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {bookmark.folder.name}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onEdit(bookmark)}
              >
                Edit
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-500 hover:text-red-700"
                onClick={() => handleDelete(bookmark.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
      {bookmarks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No bookmarks found. Try adjusting your search or folder filter.
        </div>
      )}
    </div>
  );
}
