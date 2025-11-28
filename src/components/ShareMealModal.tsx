import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Meal {
  id: string;
  date: string;
  meal_type: string;
  description: string;
  photo_url: string | null;
  quality_score: number | null;
  calories_estimate: number | null;
  protein_grams: number | null;
  carbs_grams: number | null;
  fat_grams: number | null;
}

interface ShareMealModalProps {
  meal: Meal;
  onClose: () => void;
  onShared: () => void;
}

const mealTypeLabels: Record<string, string> = {
  breakfast: '🌅 Petit-déjeuner',
  lunch: '🍽️ Déjeuner',
  dinner: '🌙 Dîner',
  snack: '🍪 Collation',
};

export function ShareMealModal({ meal, onClose, onShared }: ShareMealModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let postContent = `${mealTypeLabels[meal.meal_type]}\n\n${meal.description}`;

      if (content.trim()) {
        postContent += `\n\n💬 ${content.trim()}`;
      }

      if (meal.quality_score) {
        const stars = '⭐'.repeat(meal.quality_score);
        postContent += `\n\n${stars} Qualité: ${meal.quality_score}/5`;
      }

      if (meal.calories_estimate || meal.protein_grams || meal.carbs_grams || meal.fat_grams) {
        const nutritionInfo = [];
        if (meal.calories_estimate) nutritionInfo.push(`${meal.calories_estimate} kcal`);
        if (meal.protein_grams) nutritionInfo.push(`P: ${meal.protein_grams}g`);
        if (meal.carbs_grams) nutritionInfo.push(`G: ${meal.carbs_grams}g`);
        if (meal.fat_grams) nutritionInfo.push(`L: ${meal.fat_grams}g`);
        postContent += `\n📊 ${nutritionInfo.join(' • ')}`;
      }

      const { error } = await supabase.from('social_posts').insert({
        user_id: user.id,
        meal_id: meal.id,
        content: postContent,
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-800">Partager ce repas</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-emerald-700">
                {mealTypeLabels[meal.meal_type]}
              </span>
              {meal.quality_score && (
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <div
                      key={star}
                      className={`w-3 h-3 rounded-full ${
                        star <= meal.quality_score! ? 'bg-amber-400' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {meal.photo_url && (
              <img
                src={meal.photo_url}
                alt=""
                className="w-full h-48 object-cover rounded-lg"
              />
            )}

            <p className="text-sm text-gray-700">{meal.description}</p>

            {(meal.calories_estimate || meal.protein_grams || meal.carbs_grams || meal.fat_grams) && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                {meal.calories_estimate && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                    {meal.calories_estimate} kcal
                  </span>
                )}
                {meal.protein_grams && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    P: {meal.protein_grams}g
                  </span>
                )}
                {meal.carbs_grams && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    G: {meal.carbs_grams}g
                  </span>
                )}
                {meal.fat_grams && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                    L: {meal.fat_grams}g
                  </span>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ajoutez un commentaire
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              rows={3}
              placeholder="Partagez vos impressions, votre ressenti..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              onClick={handleShare}
              disabled={loading}
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
