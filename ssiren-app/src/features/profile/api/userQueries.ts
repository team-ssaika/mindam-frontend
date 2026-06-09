import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMyProfile, updateMyProfile, type UserUpdateRequest } from './userApi';

export const userKeys = {
  me: ['users', 'me'] as const,
};

export function useMyProfile() {
  return useQuery({
    queryKey: userKeys.me,
    queryFn: fetchMyProfile,
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UserUpdateRequest) => updateMyProfile(body),
    onSuccess: (data) => {
      queryClient.setQueryData(userKeys.me, data);
    },
  });
}
