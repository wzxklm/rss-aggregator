import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useFeeds, useCategories, useAddFeed, useCreateCategory } from "@/hooks/queries";
import { toast } from "sonner";
import type { Feed, Category } from "@/api/client";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: feeds = [] } = useFeeds();
  const { data: categories = [] } = useCategories();
  const addFeed = useAddFeed();
  const createCategory = useCreateCategory();

  const [feedDialogOpen, setFeedDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedCategory, setNewFeedCategory] = useState("");
  const [newCatName, setNewCatName] = useState("");

  function isActive(path: string) {
    return location.pathname === path;
  }

  async function handleAddFeed() {
    if (!newFeedUrl.trim()) return;
    try {
      await addFeed.mutateAsync({ url: newFeedUrl.trim(), categoryId: newFeedCategory || undefined });
      setNewFeedUrl("");
      setNewFeedCategory("");
      setFeedDialogOpen(false);
      toast.success("Feed added successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add feed");
    }
  }

  async function handleCreateCategory() {
    if (!newCatName.trim()) return;
    try {
      await createCategory.mutateAsync(newCatName.trim());
      setNewCatName("");
      setCatDialogOpen(false);
      toast.success("Category created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create category");
    }
  }

  return (
    <aside className={`flex flex-col min-h-0 border-r bg-sidebar ${className ?? ""}`}>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {/* Nav items */}
          <button
            onClick={() => navigate("/")}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent ${isActive("/") ? "bg-sidebar-accent font-medium" : ""}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>
            <span className="flex-1 text-left">All Entries</span>
          </button>
          <button
            onClick={() => navigate("/starred")}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent ${isActive("/starred") ? "bg-sidebar-accent font-medium" : ""}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span className="flex-1 text-left">Starred</span>
          </button>

          <div className="pt-3">
            <div className="flex items-center justify-between px-3 pb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase">Categories</span>
              <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
                <DialogTrigger
                  className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-sidebar-accent"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Category</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Category name"
                        onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
                      />
                    </div>
                    <Button onClick={handleCreateCategory} disabled={createCategory.isPending} className="w-full">
                      {createCategory.isPending ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {categories.map((category) => (
              <CategoryGroup key={category.id} category={category} feeds={feeds} navigate={navigate} isActive={isActive} />
            ))}
          </div>

          {/* Feeds */}
          {feeds.length > 0 && (
            <div className="pt-2">
              <div className="px-3 pb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase">Feeds</span>
              </div>
              {feeds.map((feed) => (
                <FeedItem key={feed.id} feed={feed} navigate={navigate} isActive={isActive(`/feed/${feed.id}`)} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Add feed button */}
      <div className="border-t p-3">
        <Dialog open={feedDialogOpen} onOpenChange={setFeedDialogOpen}>
          <DialogTrigger
            className="inline-flex w-full h-8 items-center justify-center gap-2 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Add Feed
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Feed</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>RSS URL</Label>
                <Input
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  placeholder="https://example.com/feed.xml"
                  onKeyDown={(e) => e.key === "Enter" && handleAddFeed()}
                />
              </div>
              <div className="space-y-2">
                <Label>Category (optional)</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={newFeedCategory}
                  onChange={(e) => setNewFeedCategory(e.target.value)}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <Button onClick={handleAddFeed} disabled={addFeed.isPending} className="w-full">
                {addFeed.isPending ? "Adding..." : "Add Feed"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </aside>
  );
}

function CategoryGroup({
  category,
  feeds,
  navigate,
  isActive,
}: {
  category: Category;
  feeds: Feed[];
  navigate: (path: string) => void;
  isActive: (path: string) => boolean;
}) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent ${isActive(`/category/${category.id}`) ? "bg-sidebar-accent font-medium" : ""}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "rotate-90" : ""}`}><polyline points="9 18 15 12 9 6"/></svg>
        <span className="flex-1 text-left" onClick={(e) => { e.stopPropagation(); navigate(`/category/${category.id}`); }}>
          {category.name}
        </span>
        {category.feedCount != null && category.feedCount > 0 && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0">{category.feedCount}</Badge>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-4">
          {/* Feeds in this category would be shown here once we have feed-category data */}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function FeedItem({
  feed,
  navigate,
  isActive,
}: {
  feed: Feed;
  navigate: (path: string) => void;
  isActive: boolean;
}) {
  return (
    <button
      onClick={() => navigate(`/feed/${feed.id}`)}
      className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-sidebar-accent ${isActive ? "bg-sidebar-accent font-medium" : ""}`}
    >
      {feed.imageUrl ? (
        <img src={feed.imageUrl} alt="" className="h-4 w-4 rounded" />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>
      )}
      <span className="flex-1 text-left truncate">{feed.title ?? feed.url}</span>
      {feed.errorMessage && (
        <Tooltip>
          <TooltipTrigger className="shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </TooltipTrigger>
          <TooltipContent>{feed.errorMessage}</TooltipContent>
        </Tooltip>
      )}
    </button>
  );
}
