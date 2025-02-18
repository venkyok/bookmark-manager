
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Folder, LogOut } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useBookmarks, Bookmark } from '@/hooks/useBookmarks';
import { BookmarkDialog } from '@/components/BookmarkDialog';
import { BookmarkList } from '@/components/BookmarkList';

export default function Index() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<'all' | number>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { bookmarks, folders } = useBookmarks();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingBookmark(null);
  };

  const filteredBookmarks = bookmarks.filter((bookmark: Bookmark) => {
    const matchesSearch = bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || bookmark.folder_id === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Bookmarks</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
            <Plus size={20} />
            Add Bookmark
          </Button>
          <Button onClick={handleSignOut} variant="outline" className="flex items-center gap-2">
            <LogOut size={20} />
            Sign Out
          </Button>
        </div>
      </div>

      <BookmarkDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        editingBookmark={editingBookmark}
        folders={folders}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Folders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  variant={selectedFolder === 'all' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedFolder('all')}
                >
                  <Folder className="mr-2 h-4 w-4" />
                  All Bookmarks ({bookmarks.length})
                </Button>
                {folders.map((folder: any) => (
                  <Button
                    key={folder.id}
                    variant={selectedFolder === folder.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedFolder(folder.id)}
                  >
                    <Folder className="mr-2 h-4 w-4" />
                    {folder.name} ({bookmarks.filter((b: Bookmark) => b.folder_id === folder.id).length})
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bookmarks..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <BookmarkList 
                bookmarks={filteredBookmarks}
                onEdit={(bookmark) => {
                  setEditingBookmark(bookmark);
                  setIsDialogOpen(true);
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
