import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Post {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  likes_count: number;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
  };
}

export function SocialFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    loadPosts();
    loadUserLikes();

    const channel = supabase
      .channel('social_posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'social_posts'
        },
        () => {
          loadPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from('social_posts')
      .select(`
        *,
        profiles:user_id (username, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Erreur lors du chargement des posts:', error);
      return;
    }

    if (data) {
      console.log('Posts chargés:', data.length);
      setPosts(data);
    }
  };

  const loadUserLikes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id);

    if (data) {
      setLikedPosts(new Set(data.map(like => like.post_id)));
    }
  };

  const loadComments = async (postId: string) => {
    if (comments[postId]) return;

    const { data } = await supabase
      .from('post_comments')
      .select(`
        *,
        profiles:user_id (username)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (data) {
      setComments(prev => ({ ...prev, [postId]: data }));
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;

    const isLiked = likedPosts.has(postId);

    if (isLiked) {
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      setLikedPosts(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });

      setPosts(posts.map(p =>
        p.id === postId ? { ...p, likes_count: p.likes_count - 1 } : p
      ));
    } else {
      await supabase.from('post_likes').insert({
        post_id: postId,
        user_id: user.id,
      });

      setLikedPosts(prev => new Set(prev).add(postId));

      setPosts(posts.map(p =>
        p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p
      ));
    }
  };

  const addComment = async (postId: string) => {
    if (!user || !newComment[postId]?.trim()) return;

    const { data } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: newComment[postId].trim(),
      })
      .select(`
        *,
        profiles:user_id (username)
      `)
      .single();

    if (data) {
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data],
      }));
      setNewComment(prev => ({ ...prev, [postId]: '' }));
    }
  };

  const toggleComments = (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      loadComments(postId);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6">
      {posts.map(post => (
        <div key={post.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold">
              {post.profiles.username[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{post.profiles.username}</p>
              <p className="text-xs text-gray-500">{formatTimeAgo(post.created_at)}</p>
            </div>
          </div>

          {post.media_url && (
            <img
              src={post.media_url}
              alt=""
              className="w-full max-h-96 object-cover"
            />
          )}

          <div className="p-4">
            <p className="text-gray-800 mb-4 leading-relaxed whitespace-pre-line">{post.content}</p>

            <div className="flex items-center gap-6 mb-4">
              <button
                onClick={() => toggleLike(post.id)}
                className="flex items-center gap-2 group"
              >
                <Heart
                  className={`w-6 h-6 transition ${
                    likedPosts.has(post.id)
                      ? 'fill-red-500 text-red-500'
                      : 'text-gray-400 group-hover:text-red-500'
                  }`}
                />
                <span className="text-sm font-medium text-gray-700">
                  {post.likes_count}
                </span>
              </button>

              <button
                onClick={() => toggleComments(post.id)}
                className="flex items-center gap-2 group"
              >
                <MessageCircle className="w-6 h-6 text-gray-400 group-hover:text-emerald-500 transition" />
                <span className="text-sm font-medium text-gray-700">
                  {comments[post.id]?.length || 0}
                </span>
              </button>
            </div>

            {expandedPost === post.id && (
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <div className="space-y-3">
                  {comments[post.id]?.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {comment.profiles.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="font-semibold text-sm text-gray-800">
                            {comment.profiles.username}
                          </p>
                          <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-3">
                          {formatTimeAgo(comment.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment[post.id] || ''}
                    onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                    placeholder="Ajouter un commentaire..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                  <button
                    onClick={() => addComment(post.id)}
                    disabled={!newComment[post.id]?.trim()}
                    className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {posts.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Aucune publication pour le moment</p>
          <p className="text-sm mt-2">Partagez votre premier repas !</p>
        </div>
      )}
    </div>
  );
}
