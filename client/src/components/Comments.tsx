import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, Loader2, Pencil, Trash2, X, Check } from 'lucide-react';
import { api, handleApiResponse } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
}

interface CommentsProps {
  reportId: string;
  commentCount: number;
}

export function Comments({ reportId, commentCount }: CommentsProps) {
  const { token, user } = useAuthStore();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [reportId]);

  const fetchComments = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await api.reports.getComments(reportId, token);
      const data = await handleApiResponse(response);
      setComments(data.data?.comments || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !token) return;

    setSubmitting(true);
    try {
      const response = await api.reports.addComment(reportId, newComment.trim(), token);
      await handleApiResponse(response);
      setNewComment('');
      fetchComments();
      toast({
        title: "Comment Added",
        description: "Your comment has been posted successfully!",
      });
    } catch (error) {
      console.error('Comment error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim() || !token) return;

    try {
      const response = await api.reports.updateComment(reportId, commentId, editContent.trim(), token);
      await handleApiResponse(response);
      setEditingId(null);
      setEditContent('');
      fetchComments();
      toast({
        title: "Comment Updated",
        description: "Your comment has been updated successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update comment.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!token) return;

    setDeletingId(commentId);
    try {
      const response = await api.reports.deleteComment(reportId, commentId, token);
      await handleApiResponse(response);
      fetchComments();
      toast({
        title: "Comment Deleted",
        description: "Your comment has been deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete comment.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const isCommentOwner = (comment: Comment) => comment.user?.id === user?.id;

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm text-foreground">
        <MessageSquare className="h-4 w-4" />
        Comments ({comments.length || commentCount})
      </h4>

      {loading ? (
        <p className="text-xs text-muted-foreground py-2">Loading...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2 italic">No comments yet.</p>
      ) : (
        <div className="space-y-2 max-h-32 overflow-y-auto mb-3">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-muted/50 p-2 rounded border">
              {editingId === comment.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditContent(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={cancelEdit}
                      className="h-6 px-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(comment.id)}
                      disabled={!editContent.trim()}
                      className="h-6 px-2"
                    >
                      <Check className="h-3 w-3 text-green-600" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm">{comment.content}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-muted-foreground">
                      {comment.user?.firstName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground/60">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                      {isCommentOwner(comment) && token && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEdit(comment)}
                            className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(comment.id)}
                            disabled={deletingId === comment.id}
                            className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete"
                          >
                            {deletingId === comment.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {token && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Add comment..."
            value={newComment}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewComment(e.target.value)}
            className="flex-1 px-3 py-2 border rounded text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button type="submit" size="sm" disabled={submitting || !newComment.trim()} className="px-3 py-1 h-8">
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
