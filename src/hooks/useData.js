import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAppData, postAction } from '../lib/api';

export function useAppData() {
  return useQuery({
    queryKey: ['appData'],
    queryFn: fetchAppData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useDataMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload) => postAction(payload),
    onSuccess: () => {
      // Invalidate and refetch immediately when a mutation succeeds
      queryClient.invalidateQueries({ queryKey: ['appData'] });
    },
  });
}
