/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  BookOpen, 
  CheckSquare, 
  Image as ImageIcon, 
  X, 
  Trash2, 
  Crown, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfToday, addDays, subDays, isSameDay, parseISO } from 'date-fns';
import { cn } from './lib/utils';
import { BigGoal, SubTask, DiaryEntry, Photo } from './types';

// --- Components ---

const AdBanner = ({ isSubscribed }: { isSubscribed: boolean }) => {
  if (isSubscribed) return null;
  return (
    <div className="w-full bg-zinc-100 border-y border-zinc-200 py-4 px-6 flex items-center justify-between overflow-hidden relative">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-zinc-300 rounded flex items-center justify-center text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
          AD
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-800">Upgrade to Premium</p>
          <p className="text-xs text-zinc-500">Remove ads and support development!</p>
        </div>
      </div>
      <div className="text-[10px] text-zinc-400 absolute top-1 right-2">Sponsored</div>
    </div>
  );
};

const SubscriptionModal = ({ isOpen, onClose, onSubscribe }: { isOpen: boolean, onClose: () => void, onSubscribe: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-zinc-100"
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <Crown className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-zinc-900 mb-2">Chronicle Premium</h2>
            <p className="text-zinc-500 text-center mb-8">
              Unlock the full potential of your productivity and memories.
            </p>
            
            <ul className="space-y-4 mb-8">
              {[
                "Ad-free experience",
                "Unlimited photo storage",
                "Advanced journaling features",
                "Cloud sync (Coming soon)",
                "Support independent creators"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-zinc-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button 
              onClick={onSubscribe}
              className="w-full py-4 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-colors mb-3"
            >
              Subscribe for $4.99/mo
            </button>
            <button 
              onClick={onClose}
              className="w-full py-2 text-zinc-400 text-sm hover:text-zinc-600 transition-colors"
            >
              Maybe later
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const PhotoGrid = ({ photos, onRemove }: { photos: Photo[], onRemove?: (id: string) => void }) => {
  if (photos.length === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-2 mt-3">
      {photos.map((photo) => (
        <div key={photo.id} className="relative aspect-square group">
          <img 
            src={photo.url} 
            alt="Memory" 
            className="w-full h-full object-cover rounded-lg border border-zinc-100"
            referrerPolicy="no-referrer"
          />
          {onRemove && (
            <button 
              onClick={() => onRemove(photo.id)}
              className="absolute -top-1 -right-1 bg-white shadow-md rounded-full p-1 text-zinc-400 hover:text-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'diary'>('tasks');
  const [goals, setGoals] = useState<BigGoal[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  
  // Input states
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [diaryContent, setDiaryContent] = useState('');
  const [tempPhotos, setTempPhotos] = useState<Photo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subtask input states (per goal)
  const [subTaskInputs, setSubTaskInputs] = useState<Record<string, string>>({});
  const [subTaskPhotos, setSubTaskPhotos] = useState<Record<string, Photo[]>>({});
  const subTaskFileInputRef = useRef<HTMLInputElement>(null);
  const [activeGoalIdForPhoto, setActiveGoalIdForPhoto] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    const savedGoals = localStorage.getItem('chronicle_goals');
    const savedDiary = localStorage.getItem('chronicle_diary');
    const savedSub = localStorage.getItem('chronicle_sub');

    if (savedGoals) setGoals(JSON.parse(savedGoals));
    if (savedDiary) setDiaryEntries(JSON.parse(savedDiary));
    if (savedSub) setIsSubscribed(JSON.parse(savedSub));
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem('chronicle_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('chronicle_diary', JSON.stringify(diaryEntries));
  }, [diaryEntries]);

  useEffect(() => {
    localStorage.setItem('chronicle_sub', JSON.stringify(isSubscribed));
  }, [isSubscribed]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'goal' | 'subtask', goalId?: string) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhoto: Photo = {
          id: Math.random().toString(36).substr(2, 9),
          url: reader.result as string,
          timestamp: Date.now()
        };
        if (target === 'goal') {
          setTempPhotos(prev => [...prev, newPhoto]);
        } else if (goalId) {
          setSubTaskPhotos(prev => ({
            ...prev,
            [goalId]: [...(prev[goalId] || []), newPhoto]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const addGoal = () => {
    if (!newGoalTitle.trim()) return;
    const newGoal: BigGoal = {
      id: Math.random().toString(36).substr(2, 9),
      title: newGoalTitle,
      completed: false,
      photos: tempPhotos,
      subTasks: [],
      createdAt: Date.now()
    };
    setGoals(prev => [newGoal, ...prev]);
    setNewGoalTitle('');
    setTempPhotos([]);
  };

  const addSubTask = (goalId: string) => {
    const title = subTaskInputs[goalId];
    if (!title?.trim()) return;

    const newSubTask: SubTask = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      completed: false,
      photos: subTaskPhotos[goalId] || [],
      createdAt: Date.now()
    };

    setGoals(prev => prev.map(g => 
      g.id === goalId ? { ...g, subTasks: [...g.subTasks, newSubTask] } : g
    ));

    setSubTaskInputs(prev => ({ ...prev, [goalId]: '' }));
    setSubTaskPhotos(prev => ({ ...prev, [goalId]: [] }));
  };

  const toggleGoal = (id: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const toggleSubTask = (goalId: string, subTaskId: string) => {
    setGoals(prev => prev.map(g => 
      g.id === goalId ? {
        ...g,
        subTasks: g.subTasks.map(st => st.id === subTaskId ? { ...st, completed: !st.completed } : st)
      } : g
    ));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const deleteSubTask = (goalId: string, subTaskId: string) => {
    setGoals(prev => prev.map(g => 
      g.id === goalId ? {
        ...g,
        subTasks: g.subTasks.filter(st => st.id !== subTaskId)
      } : g
    ));
  };

  const saveDiaryEntry = () => {
    if (!diaryContent.trim() && tempPhotos.length === 0) return;
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existingIndex = diaryEntries.findIndex(e => e.date === dateStr);
    
    const newEntry: DiaryEntry = {
      id: existingIndex >= 0 ? diaryEntries[existingIndex].id : Math.random().toString(36).substr(2, 9),
      content: diaryContent,
      photos: tempPhotos,
      date: dateStr,
      createdAt: Date.now()
    };

    if (existingIndex >= 0) {
      const updated = [...diaryEntries];
      updated[existingIndex] = newEntry;
      setDiaryEntries(updated);
    } else {
      setDiaryEntries(prev => [newEntry, ...prev]);
    }
    
    setDiaryContent('');
    setTempPhotos([]);
  };

  const currentDiaryEntry = diaryEntries.find(e => e.date === format(selectedDate, 'yyyy-MM-dd'));

  useEffect(() => {
    if (currentDiaryEntry) {
      setDiaryContent(currentDiaryEntry.content);
      setTempPhotos(currentDiaryEntry.photos);
    } else {
      setDiaryContent('');
      setTempPhotos([]);
    }
  }, [selectedDate, diaryEntries]);

  const handleSubscribe = () => {
    setIsSubscribed(true);
    setShowSubModal(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-200">
      <SubscriptionModal 
        isOpen={showSubModal} 
        onClose={() => setShowSubModal(false)} 
        onSubscribe={handleSubscribe} 
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Chronicle</h1>
        </div>
        <div className="flex items-center gap-4">
          {!isSubscribed && (
            <button 
              onClick={() => setShowSubModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-100 hover:bg-amber-100 transition-colors"
            >
              <Crown className="w-3 h-3" />
              Go Premium
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-zinc-200 overflow-hidden border border-zinc-300">
            <img src="https://picsum.photos/seed/user/100/100" alt="Profile" referrerPolicy="no-referrer" />
          </div>
        </div>
      </header>

      <AdBanner isSubscribed={isSubscribed} />

      <main className="max-w-2xl mx-auto p-6 pb-32">
        {/* Tab Navigation */}
        <div className="flex p-1 bg-zinc-200 rounded-xl mb-8">
          <button 
            onClick={() => setActiveTab('tasks')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'tasks' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            <CheckSquare className="w-4 h-4" />
            Tasks
          </button>
          <button 
            onClick={() => setActiveTab('diary')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'diary' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            <BookOpen className="w-4 h-4" />
            Diary
          </button>
        </div>

        {activeTab === 'tasks' ? (
          <div className="space-y-6">
            {/* Goal Input */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-1">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">New Big Goal</span>
                </div>
                
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="What's your major milestone?"
                    className="flex-1 bg-transparent outline-none text-zinc-800 placeholder:text-zinc-400 font-semibold"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-lg transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={addGoal}
                    className="p-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, 'goal')}
              />

              <PhotoGrid 
                photos={tempPhotos} 
                onRemove={(id) => setTempPhotos(prev => prev.filter(p => p.id !== id))} 
              />
            </div>

            {/* Goal List */}
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {goals.map((goal) => (
                  <motion.div 
                    key={goal.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group bg-white rounded-3xl p-6 shadow-sm border border-zinc-200 flex flex-col gap-4"
                  >
                    {/* Goal Header */}
                    <div className="flex items-start gap-4">
                      <button 
                        onClick={() => toggleGoal(goal.id)}
                        className={cn(
                          "mt-1 transition-colors",
                          goal.completed ? "text-emerald-500" : "text-zinc-300 hover:text-zinc-400"
                        )}
                      >
                        {goal.completed ? <CheckCircle2 className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
                      </button>
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase tracking-wider">
                            Goal
                          </span>
                          <span className="text-[10px] text-zinc-400 font-medium">
                            {goal.subTasks.length} {goal.subTasks.length === 1 ? 'task' : 'tasks'}
                          </span>
                        </div>
                        <span className={cn(
                          "text-xl font-bold text-zinc-900 transition-all",
                          goal.completed && "text-zinc-400 line-through"
                        )}>
                          {goal.title}
                        </span>
                      </div>
                      <button 
                        onClick={() => deleteGoal(goal.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-zinc-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <PhotoGrid photos={goal.photos} />

                    {/* SubTasks List */}
                    <div className="space-y-2 pl-11">
                      {goal.subTasks.map((st) => (
                        <div key={st.id} className="group/st flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => toggleSubTask(goal.id, st.id)}
                              className={cn(
                                "transition-colors",
                                st.completed ? "text-emerald-500" : "text-zinc-300 hover:text-zinc-400"
                              )}
                            >
                              {st.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                            </button>
                            <span className={cn(
                              "flex-1 text-sm text-zinc-700 transition-all",
                              st.completed && "text-zinc-400 line-through"
                            )}>
                              {st.title}
                            </span>
                            <button 
                              onClick={() => deleteSubTask(goal.id, st.id)}
                              className="opacity-0 group-hover/st:opacity-100 p-1 text-zinc-200 hover:text-red-400 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="pl-8">
                            <PhotoGrid photos={st.photos} />
                          </div>
                        </div>
                      ))}

                      {/* SubTask Input */}
                      <div className="mt-4 pt-4 border-t border-zinc-50">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Add a small task..."
                            className="flex-1 bg-zinc-50 rounded-lg px-3 py-1.5 text-sm outline-none text-zinc-700 placeholder:text-zinc-400"
                            value={subTaskInputs[goal.id] || ''}
                            onChange={(e) => setSubTaskInputs(prev => ({ ...prev, [goal.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && addSubTask(goal.id)}
                          />
                          <button 
                            onClick={() => {
                              setActiveGoalIdForPhoto(goal.id);
                              subTaskFileInputRef.current?.click();
                            }}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              (subTaskPhotos[goal.id]?.length || 0) > 0 ? "text-emerald-500 bg-emerald-50" : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
                            )}
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => addSubTask(goal.id)}
                            className="p-1.5 bg-zinc-100 text-zinc-600 rounded-lg hover:bg-zinc-200 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        {subTaskPhotos[goal.id] && subTaskPhotos[goal.id].length > 0 && (
                          <div className="mt-2">
                            <PhotoGrid 
                              photos={subTaskPhotos[goal.id]} 
                              onRemove={(id) => setSubTaskPhotos(prev => ({
                                ...prev,
                                [goal.id]: prev[goal.id].filter(p => p.id !== id)
                              }))} 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <input 
                type="file" 
                ref={subTaskFileInputRef} 
                className="hidden" 
                multiple 
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, 'subtask', activeGoalIdForPhoto || undefined)}
              />
              
              {goals.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-6 h-6 text-zinc-300" />
                  </div>
                  <p className="text-zinc-400 text-sm">No goals yet. Start by defining a big goal.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Date Selector */}
            <div className="flex items-center justify-between bg-white rounded-2xl p-3 shadow-sm border border-zinc-200">
              <button 
                onClick={() => setSelectedDate(prev => subDays(prev, 1))}
                className="p-2 hover:bg-zinc-50 rounded-xl text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                  {format(selectedDate, 'EEEE')}
                </span>
                <span className="text-sm font-bold text-zinc-800">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </span>
              </div>
              <button 
                onClick={() => setSelectedDate(prev => addDays(prev, 1))}
                className="p-2 hover:bg-zinc-50 rounded-xl text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Diary Input */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200 min-h-[400px] flex flex-col">
              <textarea 
                placeholder="How was your day?"
                className="flex-1 w-full bg-transparent outline-none resize-none text-zinc-800 placeholder:text-zinc-300 leading-relaxed text-lg"
                value={diaryContent}
                onChange={(e) => setDiaryContent(e.target.value)}
              />
              
              <PhotoGrid 
                photos={tempPhotos} 
                onRemove={(id) => setTempPhotos(prev => prev.filter(p => p.id !== id))} 
              />

              <div className="flex items-center justify-between mt-6 pt-6 border-t border-zinc-100">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors"
                >
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Add Photos</span>
                </button>
                <button 
                  onClick={saveDiaryEntry}
                  className="px-6 py-2 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Save Entry
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer / Bottom Nav for Mobile Feel */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-zinc-200 p-4 text-center text-[10px] text-zinc-400 uppercase tracking-widest">
        Chronicle &copy; 2024 &bull; Built for Memories
      </footer>
    </div>
  );
}
