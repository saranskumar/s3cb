import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set) => ({
      currentView: 'Dashboard',
      setCurrentView: (view) => set({ currentView: view }),
      
      selectedSubjectId: null,
      setSelectedSubjectId: (id) => set({ selectedSubjectId: id, currentView: 'SubjectDetail' }),

      studyMode: false,
      setStudyMode: (mode) => set({ studyMode: mode }),

      selectedDate: null,
      setSelectedDate: (date) => set({ selectedDate: date }),

      hourlyReminders: false,
      setHourlyReminders: (active) => set({ hourlyReminders: active }),
      
      notes: {},
      saveNote: (id, text) => set((state) => ({ notes: { ...state.notes, [id]: text } })),
    }),
    {
      name: 's4-zustand-storage',
    }
  )
);
