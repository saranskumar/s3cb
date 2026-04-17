import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set) => ({
      currentView: 'Today',
      setCurrentView: (view) => set({ currentView: view }),
      
      activePlanId: null,
      setActivePlanId: (id) => set({ activePlanId: id }),
      
      selectedSubjectId: null,
      setSelectedSubjectId: (id) => set({ selectedSubjectId: id }),

      hourlyReminders: true,
      setHourlyReminders: (active) => set({ hourlyReminders: active }),
      
      streak: 0,
      setStreak: (s) => set({ streak: s }),
      
      notificationPermission: 'default',
      setNotificationPermission: (p) => set({ notificationPermission: p }),
    }),
    {
      name: 's4-zustand-storage',
    }
  )
);
