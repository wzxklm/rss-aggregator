import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  useFeeds,
  useCategories,
  useDeleteFeed,
  useUpdateFeed,
  useDeleteCategory,
  useUpdateCategory,
  useRefreshAllFeeds,
  useAddFeed,
  useCreateCategory,
} from "@/hooks/queries";
import { toast } from "sonner";
import type { Feed, Category } from "@/api/client";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { data: feeds = [] } = useFeeds();
  const { data: categories = [] } = useCategories();
  const refreshAll = useRefreshAllFeeds();
  const addFeed = useAddFeed();
  const createCategory = useCreateCategory();

  const [addFeedUrl, setAddFeedUrl] = useState("");
  const [addFeedCategory, setAddFeedCategory] = useState("");
  const [addCatName, setAddCatName] = useState("");

  async function handleAddFeed() {
    if (!addFeedUrl.trim()) return;
    try {
      await addFeed.mutateAsync({ url: addFeedUrl.trim(), categoryId: addFeedCategory || undefined });
      setAddFeedUrl("");
      setAddFeedCategory("");
      toast.success("Feed added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add feed");
    }
  }

  async function handleAddCategory() {
    if (!addCatName.trim()) return;
    try {
      await createCategory.mutateAsync(addCatName.trim());
      setAddCatName("");
      toast.success("Category created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create category");
    }
  }

  function handleRefreshAll() {
    refreshAll.mutate(undefined, {
      onSuccess: (data) => toast.success(`Refreshed all feeds (+${data.totalAdded} entries)`),
      onError: () => toast.error("Failed to refresh feeds"),
    });
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground text-sm">Manage feeds and categories</p>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m15 18-6-6 6-6"/></svg>
            Back
          </Button>
        </div>

        {/* Feed Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Feeds</CardTitle>
                <CardDescription>{feeds.length} feed{feeds.length !== 1 ? "s" : ""}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefreshAll} disabled={refreshAll.isPending}>
                {refreshAll.isPending ? "Refreshing..." : "Refresh All"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add feed form */}
            <div className="flex gap-2">
              <Input
                value={addFeedUrl}
                onChange={(e) => setAddFeedUrl(e.target.value)}
                placeholder="https://example.com/feed.xml"
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleAddFeed()}
              />
              <select
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                value={addFeedCategory}
                onChange={(e) => setAddFeedCategory(e.target.value)}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <Button onClick={handleAddFeed} disabled={addFeed.isPending} size="sm">
                Add
              </Button>
            </div>

            <Separator />

            {/* Feed list */}
            <div className="space-y-2">
              {feeds.map((feed) => (
                <FeedRow key={feed.id} feed={feed} categories={categories} />
              ))}
              {feeds.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No feeds yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Management */}
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>{categories.length} categor{categories.length !== 1 ? "ies" : "y"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add category form */}
            <div className="flex gap-2">
              <Input
                value={addCatName}
                onChange={(e) => setAddCatName(e.target.value)}
                placeholder="Category name"
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
              <Button onClick={handleAddCategory} disabled={createCategory.isPending} size="sm">
                Add
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              {categories.map((cat) => (
                <CategoryRow key={cat.id} category={cat} />
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No categories yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── FeedRow ─────────────────────────────────────────────────────────────────

function FeedRow({ feed, categories }: { feed: Feed; categories: Category[] }) {
  const deleteFeed = useDeleteFeed();
  const updateFeed = useUpdateFeed();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(feed.title ?? "");

  function handleDelete() {
    if (!confirm(`Delete "${feed.title ?? feed.url}"? All entries will be removed.`)) return;
    deleteFeed.mutate(feed.id, {
      onSuccess: () => toast.success("Feed deleted"),
      onError: () => toast.error("Failed to delete feed"),
    });
  }

  function handleSaveTitle() {
    if (editTitle.trim() && editTitle !== feed.title) {
      updateFeed.mutate({
        id: feed.id,
        data: { title: editTitle.trim() },
      }, {
        onSuccess: () => { setEditing(false); toast.success("Feed updated"); },
        onError: () => toast.error("Failed to update feed"),
      });
    } else {
      setEditing(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      {feed.imageUrl ? (
        <img src={feed.imageUrl} alt="" className="h-6 w-6 rounded shrink-0" />
      ) : (
        <div className="h-6 w-6 rounded bg-muted shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        {editing ? (
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
            className="h-7 text-sm"
            autoFocus
          />
        ) : (
          <>
            <p className="text-sm font-medium truncate">{feed.title ?? feed.url}</p>
            <p className="text-xs text-muted-foreground truncate">{feed.url}</p>
          </>
        )}
        {feed.errorMessage && (
          <p className="text-xs text-destructive mt-0.5">{feed.errorMessage}</p>
        )}
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditing(true)} title="Edit">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={handleDelete} title="Delete">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
      </Button>
    </div>
  );
}

// ── CategoryRow ─────────────────────────────────────────────────────────────

function CategoryRow({ category }: { category: Category }) {
  const deleteCategory = useDeleteCategory();
  const updateCategory = useUpdateCategory();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);

  function handleDelete() {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    deleteCategory.mutate(category.id, {
      onSuccess: () => toast.success("Category deleted"),
      onError: () => toast.error("Failed to delete category"),
    });
  }

  function handleSaveName() {
    if (editName.trim() && editName !== category.name) {
      updateCategory.mutate({
        id: category.id,
        data: { name: editName.trim() },
      }, {
        onSuccess: () => { setEditing(false); toast.success("Category updated"); },
        onError: () => toast.error("Failed to update category"),
      });
    } else {
      setEditing(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <div className="flex-1 min-w-0">
        {editing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            className="h-7 text-sm"
            autoFocus
          />
        ) : (
          <p className="text-sm font-medium">{category.name}</p>
        )}
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditing(true)} title="Edit">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={handleDelete} title="Delete">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
      </Button>
    </div>
  );
}
