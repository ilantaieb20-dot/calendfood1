import { X, Calendar, Clock, TrendingUp, Flame, Share2, Edit } from 'lucide-react';

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
  notes: string | null;
  created_at: string;
}

interface MealDetailsProps {
  meal: Meal;
  onClose: () => void;
  onEdit: (meal: Meal) => void;
  onShare: (meal: Meal) => void;
}

const mealTypeLabels: Record<string, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
};

export function MealDetails({ meal, onClose, onEdit, onShare }: MealDetailsProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Détails du repas</h2>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(meal)}
              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={() => onShare(meal)}
              className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {meal.photo_url && (
            <img
              src={meal.photo_url}
              alt={meal.description}
              className="w-full h-80 object-cover rounded-xl"
            />
          )}

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(meal.date)}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {formatTime(meal.created_at)}
            </div>
          </div>

          <div>
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
              {mealTypeLabels[meal.meal_type]}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">{meal.description}</p>
          </div>

          {meal.quality_score && (
            <div className="bg-amber-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-amber-700 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">Qualité nutritionnelle</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <div
                    key={star}
                    className={`w-6 h-6 rounded-full ${
                      star <= meal.quality_score! ? 'bg-amber-400' : 'bg-amber-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {meal.calories_estimate && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
              <div className="flex items-center gap-2 text-orange-700 mb-4">
                <Flame className="w-5 h-5" />
                <span className="font-semibold">Informations nutritionnelles</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Calories</p>
                  <p className="text-xl font-bold text-orange-600">
                    {meal.calories_estimate}
                    <span className="text-xs font-normal ml-1">kcal</span>
                  </p>
                </div>

                {meal.protein_grams !== null && (
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Protéines</p>
                    <p className="text-xl font-bold text-blue-600">
                      {meal.protein_grams}
                      <span className="text-xs font-normal ml-1">g</span>
                    </p>
                  </div>
                )}

                {meal.carbs_grams !== null && (
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Glucides</p>
                    <p className="text-xl font-bold text-green-600">
                      {meal.carbs_grams}
                      <span className="text-xs font-normal ml-1">g</span>
                    </p>
                  </div>
                )}

                {meal.fat_grams !== null && (
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Lipides</p>
                    <p className="text-xl font-bold text-amber-600">
                      {meal.fat_grams}
                      <span className="text-xs font-normal ml-1">g</span>
                    </p>
                  </div>
                )}
              </div>

              {(meal.protein_grams !== null || meal.carbs_grams !== null || meal.fat_grams !== null) && (
                <div className="mt-4">
                  <p className="text-xs text-gray-600 mb-2">Répartition des macros</p>
                  <div className="flex gap-1 h-3 rounded-full overflow-hidden">
                    {meal.protein_grams !== null && (
                      <div
                        className="bg-blue-500"
                        style={{ width: `${(meal.protein_grams * 4 / (meal.calories_estimate || 1)) * 100}%` }}
                      />
                    )}
                    {meal.carbs_grams !== null && (
                      <div
                        className="bg-green-500"
                        style={{ width: `${(meal.carbs_grams * 4 / (meal.calories_estimate || 1)) * 100}%` }}
                      />
                    )}
                    {meal.fat_grams !== null && (
                      <div
                        className="bg-amber-500"
                        style={{ width: `${(meal.fat_grams * 9 / (meal.calories_estimate || 1)) * 100}%` }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {meal.notes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Notes</h3>
              <p className="text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4">
                {meal.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
