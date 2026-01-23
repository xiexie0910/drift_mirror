'use client';

/**
 * DriftMirror Progress Diary
 * ============================================================
 * 
 * Daily journaling feature with:
 * - Entry creation with mood, wins, challenges
 * - Streak tracking
 * - 90-day habit formation research messaging
 * - Quarterly reviews
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api, DiaryEntry, DiaryListResponse, QuarterlyReview, Resolution } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, BookOpen, Flame, CalendarDays, Trophy, TrendingUp } from 'lucide-react';

// ============================================================
// 90-Day Habit Research Note
// ============================================================

const HABIT_RESEARCH_NOTE = `Research shows that 90 days is the threshold for forming lasting habits. 
Your diary entries contribute to your quarterly review, helping you track patterns and celebrate growth.`;

// ============================================================
// Mood Options
// ============================================================

const MOOD_OPTIONS = [
  { emoji: '😊', label: 'Great', value: 'great' },
  { emoji: '🙂', label: 'Good', value: 'good' },
  { emoji: '😐', label: 'Okay', value: 'okay' },
  { emoji: '😔', label: 'Tough', value: 'tough' },
  { emoji: '😤', label: 'Frustrated', value: 'frustrated' },
];

// ============================================================
// Types
// ============================================================

interface DiaryFormData {
  content: string;
  mood: string;
  wins: string;
  challenges: string;
}

// ============================================================
// Diary Page Component
// ============================================================

export default function DiaryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resolutionId = searchParams.get('resolution');

  // State
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [diaryData, setDiaryData] = useState<DiaryListResponse | null>(null);
  const [quarterlyReviews, setQuarterlyReviews] = useState<QuarterlyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'entries' | 'reviews'>('entries');

  // Form state
  const [form, setForm] = useState<DiaryFormData>({
    content: '',
    mood: '',
    wins: '',
    challenges: '',
  });

  // ============================================================
  // Data Fetching
  // ============================================================

  const fetchData = useCallback(async () => {
    if (!resolutionId) return;

    setLoading(true);
    setError(null);

    try {
      const [resolutionData, entries, reviews] = await Promise.all([
        api.getResolution(parseInt(resolutionId)),
        api.getDiaryEntries(parseInt(resolutionId)),
        api.getQuarterlyReviews(parseInt(resolutionId)),
      ]);

      setResolution(resolutionData);
      setDiaryData(entries);
      setQuarterlyReviews(reviews);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load diary');
    } finally {
      setLoading(false);
    }
  }, [resolutionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================
  // Form Handlers
  // ============================================================

  const resetForm = () => {
    setForm({ content: '', mood: '', wins: '', challenges: '' });
    setEditingEntry(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionId || !form.content.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      if (editingEntry) {
        await api.updateDiaryEntry(editingEntry.id, {
          content: form.content,
          mood: form.mood || undefined,
          wins: form.wins || undefined,
          challenges: form.challenges || undefined,
        });
      } else {
        await api.createDiaryEntry({
          resolution_id: parseInt(resolutionId),
          content: form.content,
          mood: form.mood || undefined,
          wins: form.wins || undefined,
          challenges: form.challenges || undefined,
        });
      }

      resetForm();
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setForm({
      content: entry.content,
      mood: entry.mood || '',
      wins: entry.wins || '',
      challenges: entry.challenges || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (entryId: number) => {
    if (!confirm('Delete this diary entry?')) return;

    try {
      await api.deleteDiaryEntry(entryId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
    }
  };

  const handleGenerateReview = async () => {
    if (!resolutionId) return;

    setSubmitting(true);
    try {
      await api.generateQuarterlyReview(parseInt(resolutionId));
      await fetchData();
      setActiveTab('reviews');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate review');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // Render: No Resolution Selected
  // ============================================================

  if (!resolutionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card variant="glass-strong" className="rounded-2xl p-10 text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="glass-subtle p-4 rounded-2xl">
              <BookOpen className="w-8 h-8 text-neutral-400" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-neutral-800 mb-2">Progress Diary</h1>
          <p className="text-neutral-500 mb-6">
            Select a goal from your dashboard to view or write diary entries.
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // ============================================================
  // Render: Loading
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-subtle p-6 rounded-2xl animate-pulse-soft">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <p className="text-neutral-500 text-sm">Loading diary...</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Render: Main Content
  // ============================================================

  return (
    <div className="min-h-screen pb-32 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        
        {/* Back Navigation */}
        <nav className="animate-fade-in-up">
          <button
            onClick={() => router.push(`/dashboard/${resolutionId}`)}
            className="flex items-center gap-2 text-neutral-500 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Goal</span>
          </button>
        </nav>

        {/* Header */}
        <header className="glass-strong rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-start gap-4">
            <div className="glass-subtle p-3 rounded-xl glow-teal shrink-0">
              <BookOpen className="w-6 h-6 text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-teal-600 uppercase tracking-wider font-medium mb-1">Progress Diary</p>
              <h1 className="text-2xl font-semibold text-neutral-800">
                {resolution?.title}
              </h1>
            </div>
          </div>
        </header>

        {/* Error Display */}
        {error && (
          <div className="glass-subtle rounded-2xl p-4 border border-rose-200 bg-rose-50/50 animate-fade-in-up">
            <p className="text-rose-600 text-sm">{error}</p>
          </div>
        )}

        {/* 90-Day Research Note */}
        <div className="glass-strong rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg shrink-0">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-amber-600 uppercase tracking-wider font-medium mb-2">
                90-Day Habit Science
              </p>
              <p className="text-neutral-600 text-sm leading-relaxed">
                {HABIT_RESEARCH_NOTE}
              </p>
              {diaryData && (
                <p className="text-teal-600 font-medium mt-3 text-sm">
                  {diaryData.review_note}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        {diaryData && (
          <div className="grid grid-cols-3 gap-3 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="glass-subtle rounded-xl p-4 text-center">
              <div className="flex justify-center mb-2">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-neutral-800">{diaryData.current_streak}</div>
              <div className="text-neutral-500 text-xs">Day Streak</div>
            </div>
            <div className="glass-subtle rounded-xl p-4 text-center">
              <div className="flex justify-center mb-2">
                <BookOpen className="w-5 h-5 text-teal-500" />
              </div>
              <div className="text-2xl font-bold text-neutral-800">{diaryData.total}</div>
              <div className="text-neutral-500 text-xs">Entries</div>
            </div>
            <div className="glass-subtle rounded-xl p-4 text-center">
              <div className="flex justify-center mb-2">
                <CalendarDays className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-neutral-800">{diaryData.days_until_review}</div>
              <div className="text-neutral-500 text-xs">To Review</div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => setActiveTab('entries')}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'entries'
                ? 'glass-strong text-teal-600 glow-teal'
                : 'glass-subtle text-neutral-500 hover:text-neutral-700'
            }`}
          >
            📝 Entries
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'reviews'
                ? 'glass-strong text-teal-600 glow-teal'
                : 'glass-subtle text-neutral-500 hover:text-neutral-700'
            }`}
          >
            📊 Reviews ({quarterlyReviews.length})
          </button>
        </div>

        {/* Entries Tab */}
        {activeTab === 'entries' && (
          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            {/* New Entry Button */}
            {!showForm && (
              <Button onClick={() => setShowForm(true)} size="lg" className="w-full gap-2">
                ✍️ Write Today&apos;s Entry
              </Button>
            )}

            {/* Entry Form */}
            {showForm && (
              <div className="glass-strong rounded-2xl p-6">
                <h3 className="font-semibold text-neutral-800 mb-4">
                  {editingEntry ? 'Edit Entry' : "Today's Entry"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Mood Selector */}
                  <div>
                    <label className="text-sm text-neutral-600 block mb-2">
                      How are you feeling?
                    </label>
                    <div className="flex gap-2">
                      {MOOD_OPTIONS.map((mood) => (
                        <button
                          key={mood.value}
                          type="button"
                          onClick={() => setForm({ ...form, mood: mood.value })}
                          className={`p-3 rounded-xl transition-all ${
                            form.mood === mood.value
                              ? 'glass-strong ring-2 ring-teal-500 glow-teal'
                              : 'glass-subtle hover:scale-105'
                          }`}
                          title={mood.label}
                        >
                          <span className="text-2xl">{mood.emoji}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Main Content */}
                  <div>
                    <label className="text-sm text-neutral-600 block mb-2">
                      What happened today? <span className="text-neutral-400">(required)</span>
                    </label>
                    <textarea
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      placeholder="Write about your progress, thoughts, or experiences..."
                      className="w-full h-32 bg-white/50 border border-white/60 rounded-xl p-3 text-neutral-800 placeholder:text-neutral-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                      required
                    />
                  </div>

                  {/* Wins */}
                  <div>
                    <label className="text-sm text-neutral-600 block mb-2">
                      🏆 Wins <span className="text-neutral-400">(optional)</span>
                    </label>
                    <Input
                      value={form.wins}
                      onChange={(e) => setForm({ ...form, wins: e.target.value })}
                      placeholder="What went well today?"
                    />
                  </div>

                  {/* Challenges */}
                  <div>
                    <label className="text-sm text-neutral-600 block mb-2">
                      🧗 Challenges <span className="text-neutral-400">(optional)</span>
                    </label>
                    <Input
                      value={form.challenges}
                      onChange={(e) => setForm({ ...form, challenges: e.target.value })}
                      placeholder="What was difficult?"
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={submitting || !form.content.trim()} className="flex-1">
                      {submitting ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Entry'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Entry List */}
            {diaryData?.entries.length === 0 ? (
              <div className="glass-subtle rounded-2xl p-8 text-center">
                <p className="text-neutral-500">No diary entries yet.</p>
                <p className="text-sm text-neutral-400 mt-1">Start writing to track your journey!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {diaryData?.entries.map((entry) => (
                  <div 
                    key={entry.id} 
                    className="glass-subtle rounded-xl p-4 hover:scale-[1.01] transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500 text-sm">
                          {new Date(entry.entry_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        {entry.mood && (
                          <span className="text-lg">
                            {MOOD_OPTIONS.find((m) => m.value === entry.mood)?.emoji}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-neutral-700 whitespace-pre-wrap">{entry.content}</p>
                    
                    {(entry.wins || entry.challenges) && (
                      <div className="mt-3 pt-3 border-t border-white/40 grid grid-cols-2 gap-4">
                        {entry.wins && (
                          <div>
                            <span className="text-xs text-neutral-400">🏆 Wins</span>
                            <p className="text-teal-600 text-sm">{entry.wins}</p>
                          </div>
                        )}
                        {entry.challenges && (
                          <div>
                            <span className="text-xs text-neutral-400">🧗 Challenges</span>
                            <p className="text-amber-600 text-sm">{entry.challenges}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            {/* Generate Review Button */}
            {diaryData && diaryData.days_until_review <= 0 && (
              <Button onClick={handleGenerateReview} disabled={submitting} size="lg" className="w-full gap-2">
                {submitting ? 'Generating...' : '🎉 Generate 90-Day Review'}
              </Button>
            )}

            {quarterlyReviews.length === 0 ? (
              <div className="glass-subtle rounded-2xl p-8 text-center">
                <div className="flex justify-center mb-4">
                  <Trophy className="w-8 h-8 text-neutral-300" />
                </div>
                <p className="text-neutral-500 mb-2">No quarterly reviews yet.</p>
                <p className="text-neutral-400 text-sm">
                  Reviews are generated after 90 days of tracking. Keep up the great work!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {quarterlyReviews.map((review) => (
                  <QuarterlyReviewCard key={review.id} review={review} onUpdate={fetchData} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Quarterly Review Card Component
// ============================================================

function QuarterlyReviewCard({
  review,
  onUpdate,
}: {
  review: QuarterlyReview;
  onUpdate: () => void;
}) {
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState(review.user_reflection || '');
  const [saving, setSaving] = useState(false);

  const handleSaveReflection = async () => {
    setSaving(true);
    try {
      await api.addReviewReflection(review.id, reflection);
      setShowReflection(false);
      onUpdate();
    } catch (err) {
      console.error('Failed to save reflection:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-strong rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <Trophy className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-neutral-800">Quarter {review.quarter_number} Review</h3>
          <p className="text-xs text-neutral-500">
            {new Date(review.start_date).toLocaleDateString()} - {new Date(review.end_date).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="glass-subtle rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-neutral-800">{review.total_checkins}</div>
          <div className="text-[10px] text-neutral-500">Check-ins</div>
        </div>
        <div className="glass-subtle rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-teal-600">
            {Math.round(review.completion_rate * 100)}%
          </div>
          <div className="text-[10px] text-neutral-500">Completion</div>
        </div>
        <div className="glass-subtle rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-amber-600">
            {review.average_friction.toFixed(1)}
          </div>
          <div className="text-[10px] text-neutral-500">Avg Friction</div>
        </div>
        <div className="glass-subtle rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-purple-600">{review.diary_entries_count}</div>
          <div className="text-[10px] text-neutral-500">Entries</div>
        </div>
      </div>

      {/* Key Wins */}
      {review.key_wins.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">🏆 Key Wins</h4>
          <ul className="space-y-1">
            {review.key_wins.map((win, i) => (
              <li key={i} className="text-teal-600 text-sm flex items-start gap-2">
                <span>•</span>
                <span>{win}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Patterns */}
      {review.patterns_observed.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">🔍 Patterns</h4>
          <ul className="space-y-1">
            {review.patterns_observed.map((pattern, i) => (
              <li key={i} className="text-purple-600 text-sm flex items-start gap-2">
                <span>•</span>
                <span>{pattern}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Growth Areas */}
      {review.growth_areas.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">🌱 Growth Areas</h4>
          <ul className="space-y-1">
            {review.growth_areas.map((area, i) => (
              <li key={i} className="text-amber-600 text-sm flex items-start gap-2">
                <span>•</span>
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* User Reflection */}
      <div className="pt-3 border-t border-white/40">
        {review.user_reflection ? (
          <div>
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">💭 Your Reflection</h4>
            <p className="text-neutral-700 glass-subtle rounded-lg p-3 italic text-sm">
              &ldquo;{review.user_reflection}&rdquo;
            </p>
            <button
              onClick={() => setShowReflection(true)}
              className="text-xs text-neutral-400 hover:text-teal-600 mt-2 transition-colors"
            >
              Edit reflection
            </button>
          </div>
        ) : showReflection ? (
          <div className="space-y-2">
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="How do you feel about this quarter? What did you learn?"
              className="w-full h-20 bg-white/50 border border-white/60 rounded-xl p-3 text-neutral-700 placeholder:text-neutral-400 text-sm resize-none"
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveReflection} disabled={saving} size="sm">
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowReflection(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowReflection(true)}
            className="w-full py-2 border border-dashed border-neutral-300 rounded-lg text-neutral-400 hover:text-teal-600 hover:border-teal-300 transition-colors text-sm"
          >
            💭 Add your personal reflection
          </button>
        )}
      </div>
    </div>
  );
}
