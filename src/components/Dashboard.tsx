import { useState, useEffect } from 'react';
import { TrendingUp, Calendar as CalendarIcon, Users, LogOut, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar } from './Calendar';
import { MealForm } from './MealForm';
import { MealDetails } from './MealDetails';
import { SocialFeed } from './SocialFeed';
import { ShareMealModal } from './ShareMealModal';
import { NutritionStats } from './NutritionStats';

type View = 'calendar' | 'social' | 'stats';

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

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('calendar');
  const [showMealForm, setShowMealForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [mealToShare, setMealToShare] = useState<Meal | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [username, setUsername] = useState('');

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    if (data) setUsername(data.username);
  };

  const handleAddMeal = (date: string) => {
    setSelectedDate(date);
    setSelectedMeal(null);
    setShowMealForm(true);
  };

  const handleEditMeal = (meal: Meal) => {
    setSelectedMeal(meal);
    setSelectedDate(meal.date);
    setShowMealForm(true);
  };

  const handleSaveMeal = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleShareMeal = (meal: Meal) => {
    setMealToShare(meal);
    setSelectedMeal(null);
  };

  const handleShared = () => {
    setRefreshKey(prev => prev + 1);
    setCurrentView('social');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800">NutriTrack</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Bonjour, {username}</span>
              <button
                onClick={() => signOut()}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setCurrentView('calendar')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition whitespace-nowrap ${
              currentView === 'calendar'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <CalendarIcon className="w-5 h-5" />
            Calendrier
          </button>

          <button
            onClick={() => setCurrentView('social')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition whitespace-nowrap ${
              currentView === 'social'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5" />
            Communauté
          </button>

          <button
            onClick={() => setCurrentView('stats')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition whitespace-nowrap ${
              currentView === 'stats'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Statistiques
          </button>
        </div>

        <div>
          {currentView === 'calendar' && (
            <Calendar
              key={refreshKey}
              onAddMeal={handleAddMeal}
              onSelectMeal={setSelectedMeal}
            />
          )}

          {currentView === 'social' && <SocialFeed key={`social-${refreshKey}`} />}

          {currentView === 'stats' && <NutritionStats />}
        </div>
      </div>

      {showMealForm && (
        <MealForm
          date={selectedDate}
          meal={selectedMeal || undefined}
          onClose={() => {
            setShowMealForm(false);
            setSelectedMeal(null);
          }}
          onSave={handleSaveMeal}
        />
      )}

      {selectedMeal && !showMealForm && (
        <MealDetails
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onEdit={handleEditMeal}
          onShare={handleShareMeal}
        />
      )}

      {mealToShare && (
        <ShareMealModal
          meal={mealToShare}
          onClose={() => setMealToShare(null)}
          onShared={handleShared}
        />
      )}
    </div>
  );
}
