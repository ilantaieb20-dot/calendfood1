import { useState, useRef } from 'react';
import { X, Camera, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MealFormProps {
  date: string;
  onClose: () => void;
  onSave: () => void;
}

export function MealForm({ date, onClose, onSave }: MealFormProps) {
  const { user } = useAuth();
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [qualityScore, setQualityScore] = useState<number>(3);
  const [caloriesEstimate, setCaloriesEstimate] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeNutrition = () => {
    const keywords = description.toLowerCase();
    let score = 3;
    let calories = 500;

    if (keywords.includes('légumes') || keywords.includes('fruits') || keywords.includes('salade')) {
      score += 1;
      calories -= 100;
    }
    if (keywords.includes('frit') || keywords.includes('burger') || keywords.includes('pizza')) {
      score -= 1;
      calories += 200;
    }
    if (keywords.includes('poisson') || keywords.includes('poulet')) {
      score += 0.5;
    }
    if (keywords.includes('sucre') || keywords.includes('gâteau') || keywords.includes('bonbon')) {
      score -= 0.5;
      calories += 150;
    }

    if (mealType === 'breakfast') calories = Math.round(calories * 0.7);
    if (mealType === 'snack') calories = Math.round(calories * 0.4);

    setQualityScore(Math.max(1, Math.min(5, Math.round(score))));
    setCaloriesEstimate(String(Math.max(100, Math.min(1500, calories))));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('meals').insert({
        user_id: user.id,
        date,
        meal_type: mealType,
        description,
        photo_url: photoUrl || null,
        quality_score: qualityScore,
        calories_estimate: caloriesEstimate ? parseInt(caloriesEstimate) : null,
        notes: notes || null,
      });

      if (error) throw error;

      onSave();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Ajouter un repas</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de repas
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'breakfast', label: 'Petit-déj' },
                { value: 'lunch', label: 'Déjeuner' },
                { value: 'dinner', label: 'Dîner' },
                { value: 'snack', label: 'Collation' }
              ].map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setMealType(type.value as any)}
                  className={`py-2 px-4 rounded-lg font-medium transition ${
                    mealType === type.value
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo du repas
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-emerald-500 transition"
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <Camera className="w-12 h-12" />
                  <span>Cliquez pour ajouter une photo</span>
                </div>
              )}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={analyzeNutrition}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              rows={3}
              placeholder="Ex: Salade de quinoa avec légumes grillés..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Décrivez votre repas pour obtenir une estimation automatique
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qualité nutritionnelle
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(score => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setQualityScore(score)}
                    className={`w-10 h-10 rounded-full transition ${
                      qualityScore >= score
                        ? 'bg-amber-400 hover:bg-amber-500'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calories estimées
              </label>
              <input
                type="number"
                value={caloriesEstimate}
                onChange={(e) => setCaloriesEstimate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                placeholder="500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes supplémentaires
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              rows={2}
              placeholder="Ressenti, contexte, ingrédients spécifiques..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
