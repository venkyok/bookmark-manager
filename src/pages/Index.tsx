
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Tag, Folder, LogOut } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const [bookmarks, setBookmarks] = useState([]);
  const [folders, setFolders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    folder_id: '',
    tags: ''
  });

  const fetchData = async () => {
    try {
      // Fetch folders
      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('*');

      if (foldersError) throw foldersError;
      setFolders(foldersData || []);

      // Fetch bookmarks with their folder info
      const { data: bookmarksData, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select(`
          *,
          folder:folders(*)
        `);

      if (bookmarksError) throw bookmarksError;
      setBookmarks(bookmarksData || []);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();

    // Set up realtime subscriptions
    const bookmarksSubscription = supabase
      .channel('bookmarks_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookmarks' }, fetchData)
      .subscribe();

    const foldersSubscription = supabase
      .channel('folders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'folders' }, fetchData)
      .subscribe();

    return () => {
      bookmarksSubscription.unsubscribe();
      foldersSubscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bookmarkData = {
        title: formData.title,
        url: formData.url,
        description: formData.description,
        folder_id: formData.folder_id || null,
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

      handleDialogClose();
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

  const handleEdit = (bookmark: any) => {
    setEditingBookmark(bookmark);
    setFormData({
      title: bookmark.title,
      url: bookmark.url,
      description: bookmark.description || '',
      folder_id: bookmark.folder_id || '',
      tags: ''  // We'll implement tags later
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingBookmark(null);
    setFormData({
      title: '',
      url: '',
      description: '',
      folder_id: '',
      tags: ''
    });
  };

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

  const filteredBookmarks = bookmarks.filter((bookmark: any) => {
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

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
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
                value={formData.folder_id}
                onChange={(e) => setFormData({ ...formData, folder_id: e.target.value })}
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
              <Button type="button" variant="outline" onClick={handleDialogClose}>
                Cancel
              </Button>
              <Button type="submit">
                {editingBookmark ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
                    {folder.name} ({bookmarks.filter((b: any) => b.folder_id === folder.id).length})
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
              <div className="space-y-4">
                {filteredBookmarks.map((bookmark: any) => (
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
                          onClick={() => handleEdit(bookmark)}
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
                {filteredBookmarks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No bookmarks found. Try adjusting your search or folder filter.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
