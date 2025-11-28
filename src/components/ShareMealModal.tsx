import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Meal {
  id: string;
  description: string;
  photo_url: string | null;
}

interface ShareMealModalProps {
  meal: Meal;
  onClose: () => void;
  onShared: () => void;
}

export function ShareMealModal({ meal, onClose, onShared }: ShareMealModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState(meal.description);
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!user || !content.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('social_posts').insert({
        user_id: user.id,
        meal_id: meal.id,
        content: content.trim(),
        media_url: meal.photo_url,
        media_type: meal.photo_url ? 'photo' : null,
      });

      if (error) throw error;

      onShared();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Partager ce repas</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {meal.photo_url && (
            <img
              src={meal.photo_url}
              alt=""
              className="w-full h-48 object-cover rounded-lg"
            />
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            rows={4}
            placeholder="Partagez vos impressions..."
          />

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              onClick={handleShare}
              disabled={loading || !content.trim()}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              {loading ? 'Partage...' : 'Partager'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
