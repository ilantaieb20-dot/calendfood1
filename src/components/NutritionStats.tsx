import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DailyStats {
  date: string;
  avgQuality: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealCount: number;
}

export function NutritionStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, period]);

  const loadStats = async () => {
    const daysAgo = period === 'week' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const { data } = await supabase
      .from('meals')
      .select('date, quality_score, calories_estimate, protein_grams, carbs_grams, fat_grams')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (data) {
      const grouped = data.reduce((acc, meal) => {
        if (!acc[meal.date]) {
          acc[meal.date] = { date: meal.date, qualities: [], calories: [], protein: [], carbs: [], fat: [], count: 0 };
        }
        if (meal.quality_score) acc[meal.date].qualities.push(meal.quality_score);
        if (meal.calories_estimate) acc[meal.date].calories.push(meal.calories_estimate);
        if (meal.protein_grams) acc[meal.date].protein.push(meal.protein_grams);
        if (meal.carbs_grams) acc[meal.date].carbs.push(meal.carbs_grams);
        if (meal.fat_grams) acc[meal.date].fat.push(meal.fat_grams);
        acc[meal.date].count++;
        return acc;
      }, {} as Record<string, any>);

      const dailyStats: DailyStats[] = Object.values(grouped).map((day: any) => ({
        date: day.date,
        avgQuality: day.qualities.length > 0
          ? day.qualities.reduce((a: number, b: number) => a + b, 0) / day.qualities.length
          : 0,
        totalCalories: day.calories.reduce((a: number, b: number) => a + b, 0),
        totalProtein: day.protein.reduce((a: number, b: number) => a + b, 0),
        totalCarbs: day.carbs.reduce((a: number, b: number) => a + b, 0),
        totalFat: day.fat.reduce((a: number, b: number) => a + b, 0),
        mealCount: day.count,
      }));

      setStats(dailyStats);
    }
  };

  const getOverallAvgQuality = () => {
    const qualities = stats.filter(s => s.avgQuality > 0).map(s => s.avgQuality);
    if (qualities.length === 0) return 0;
    return qualities.reduce((a, b) => a + b, 0) / qualities.length;
  };

  const getAvgCaloriesPerDay = () => {
    const caloriesData = stats.filter(s => s.totalCalories > 0);
    if (caloriesData.length === 0) return 0;
    return caloriesData.reduce((a, b) => a + b.totalCalories, 0) / caloriesData.length;
  };

  const getAvgMacrosPerDay = () => {
    const daysWithMacros = stats.filter(s => s.totalProtein > 0 || s.totalCarbs > 0 || s.totalFat > 0);
    if (daysWithMacros.length === 0) return { protein: 0, carbs: 0, fat: 0 };

    return {
      protein: Math.round(daysWithMacros.reduce((a, b) => a + b.totalProtein, 0) / daysWithMacros.length),
      carbs: Math.round(daysWithMacros.reduce((a, b) => a + b.totalCarbs, 0) / daysWithMacros.length),
      fat: Math.round(daysWithMacros.reduce((a, b) => a + b.totalFat, 0) / daysWithMacros.length),
    };
  };

  const getTotalMeals = () => {
    return stats.reduce((a, b) => a + b.mealCount, 0);
  };

  const getTrend = () => {
    if (stats.length < 2) return 'stable';
    const recentStats = stats.slice(0, Math.floor(stats.length / 2));
    const olderStats = stats.slice(Math.floor(stats.length / 2));

    const recentAvg = recentStats.reduce((a, b) => a + b.avgQuality, 0) / recentStats.length;
    const olderAvg = olderStats.reduce((a, b) => a + b.avgQuality, 0) / olderStats.length;

    if (recentAvg > olderAvg + 0.3) return 'up';
    if (recentAvg < olderAvg - 0.3) return 'down';
    return 'stable';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const overallQuality = getOverallAvgQuality();
  const avgCalories = getAvgCaloriesPerDay();
  const avgMacros = getAvgMacrosPerDay();
  const totalMeals = getTotalMeals();
  const trend = getTrend();

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <button
          onClick={() => setPeriod('week')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            period === 'week'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Cette semaine
        </button>
        <button
          onClick={() => setPeriod('month')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            period === 'month'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Ce mois
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 font-medium">Qualité moyenne</span>
            {trend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
            {trend === 'down' && <TrendingDown className="w-5 h-5 text-red-500" />}
            {trend === 'stable' && <Minus className="w-5 h-5 text-gray-400" />}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-emerald-600">
              {overallQuality.toFixed(1)}
            </span>
            <span className="text-gray-500">/5</span>
          </div>
          <div className="flex gap-1 mt-4">
            {[1, 2, 3, 4, 5].map(star => (
              <div
                key={star}
                className={`flex-1 h-2 rounded-full ${
                  star <= Math.round(overallQuality) ? 'bg-amber-400' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <span className="text-gray-600 font-medium">Repas enregistrés</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-emerald-600">{totalMeals}</span>
            <span className="text-gray-500">repas</span>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            {period === 'week' ? 'ces 7 derniers jours' : 'ces 30 derniers jours'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-orange-500" />
            <span className="text-gray-600 font-medium">Calories/jour</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-orange-500">
              {Math.round(avgCalories)}
            </span>
            <span className="text-gray-500">kcal</span>
          </div>
          <p className="text-sm text-gray-500 mt-4">Moyenne quotidienne</p>
        </div>
      </div>

      {(avgMacros.protein > 0 || avgMacros.carbs > 0 || avgMacros.fat > 0) && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Répartition moyenne des macros</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-blue-600">{avgMacros.protein}</span>
              </div>
              <p className="text-sm font-medium text-gray-700">Protéines (g)</p>
              <p className="text-xs text-gray-500 mt-1">par jour</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-green-600">{avgMacros.carbs}</span>
              </div>
              <p className="text-sm font-medium text-gray-700">Glucides (g)</p>
              <p className="text-xs text-gray-500 mt-1">par jour</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-amber-600">{avgMacros.fat}</span>
              </div>
              <p className="text-sm font-medium text-gray-700">Lipides (g)</p>
              <p className="text-xs text-gray-500 mt-1">par jour</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Historique</h3>
        <div className="space-y-4">
          {stats.map(day => (
            <div key={day.date} className="py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[60px]">
                    <p className="text-sm font-medium text-gray-600">{formatDate(day.date)}</p>
                    <p className="text-xs text-gray-500">{day.mealCount} repas</p>
                  </div>
                  {day.avgQuality > 0 && (
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <div
                          key={star}
                          className={`w-4 h-4 rounded-full ${
                            star <= Math.round(day.avgQuality) ? 'bg-amber-400' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {day.totalCalories > 0 && (
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{day.totalCalories} kcal</p>
                  </div>
                )}
              </div>
              {(day.totalProtein > 0 || day.totalCarbs > 0 || day.totalFat > 0) && (
                <div className="flex gap-4 ml-16 text-xs">
                  {day.totalProtein > 0 && (
                    <span className="text-blue-600">P: {day.totalProtein}g</span>
                  )}
                  {day.totalCarbs > 0 && (
                    <span className="text-green-600">G: {day.totalCarbs}g</span>
                  )}
                  {day.totalFat > 0 && (
                    <span className="text-amber-600">L: {day.totalFat}g</span>
                  )}
                </div>
              )}
            </div>
          ))}

          {stats.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Aucune donnée disponible</p>
              <p className="text-sm mt-2">Commencez à enregistrer vos repas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
