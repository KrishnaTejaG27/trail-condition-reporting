import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, handleApiResponse } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface CreateReportData {
  conditionType: string;
  severityLevel: string;
  description?: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  affectedArea?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  trailId?: string;
}

export const useReports = (params?: any) => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ['reports', params],
    queryFn: async () => {
      const response = await api.reports.getAll(params);
      const data = await handleApiResponse(response);
      return data.data;
    },
    enabled: !!token,
  });
};

export const useReport = (id: string) => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ['report', id],
    queryFn: async () => {
      const response = await api.reports.getById(id);
      const data = await handleApiResponse(response);
      return data.data.report;
    },
    enabled: !!token && !!id,
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: async (reportData: CreateReportData) => {
      const response = await api.reports.create(reportData, token!);
      const data = await handleApiResponse(response);
      return data.data.report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useUpdateReport = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: async ({ id, reportData }: { id: string; reportData: Partial<CreateReportData> }) => {
      const response = await api.reports.update(id, reportData, token!);
      const data = await handleApiResponse(response);
      return data.data.report;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['report', id] });
    },
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.reports.delete(id, token!);
      await handleApiResponse(response);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};
