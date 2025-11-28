import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Meal {
  id: string;
  date: string;
  meal_type: string;
  description: string;
  photo_url: string | null;
  quality_score: number | null;
}

interface CalendarProps {
  onAddMeal: (date: string) => void;
  onSelectMeal: (meal: Meal) => void;
}

export function Calendar({ onAddMeal, onSelectMeal }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meals, setMeals] = useState<Meal[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadMeals();
    }
  }, [currentDate, user]);

  const loadMeals = async () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const { data } = await supabase
      .from('meals')
      .select('*')
      .gte('date', startOfMonth.toISOString().split('T')[0])
      .lte('date', endOfMonth.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (data) setMeals(data);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getMealsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return meals.filter(meal => meal.date === dateStr);
  };

  const getAverageQualityForDay = (dayMeals: Meal[]) => {
    const scores = dayMeals.filter(m => m.quality_score).map(m => m.quality_score!);
    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}

        {getDaysInMonth().map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dayMeals = getMealsForDay(day);
          const avgQuality = getAverageQualityForDay(dayMeals);
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = new Date().toDateString() === new Date(dateStr).toDateString();

          return (
            <div
              key={day}
              className={`aspect-square border rounded-lg p-2 hover:shadow-md transition cursor-pointer ${
                isToday ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium text-gray-700">{day}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddMeal(dateStr);
                    }}
                    className="opacity-0 hover:opacity-100 transition p-1 hover:bg-emerald-100 rounded"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" />
                  </button>
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  {dayMeals.slice(0, 3).map(meal => (
                    <button
                      key={meal.id}
                      onClick={() => onSelectMeal(meal)}
                      className="w-full text-left"
                    >
                      {meal.photo_url ? (
                        <img
                          src={meal.photo_url}
                          alt=""
                          className="w-full h-8 object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-8 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-500">{meal.meal_type}</span>
                        </div>
                      )}
                    </button>
                  ))}
                  {dayMeals.length > 3 && (
                    <span className="text-xs text-gray-500">+{dayMeals.length - 3}</span>
                  )}
                </div>

                {avgQuality && (
                  <div className="mt-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <div
                          key={star}
                          className={`w-2 h-2 rounded-full ${
                            star <= avgQuality ? 'bg-amber-400' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
