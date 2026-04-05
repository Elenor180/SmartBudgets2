import type { AdvisorResponse, WorkspaceState } from '@/domain/models';
import { getSupabaseClient } from '@/integrations/supabase/client';

const fallbackResponse: AdvisorResponse = {
  headline: 'Advisor unavailable',
  message:
    'The economist service could not produce a response right now. Please try again in a moment.',
  insights: [],
  notices: [],
  actions: [],
};

export const requestAdvisorResponse = async ({
  mode,
  prompt,
  workspace,
}: {
  mode: 'briefing' | 'chat';
  prompt: string;
  workspace: WorkspaceState;
}): Promise<AdvisorResponse> => {
  const { data, error } = await getSupabaseClient().functions.invoke(
    'ai-advisor',
    {
      body: {
        mode,
        prompt,
        workspace,
      },
    },
  );

  if (error) {
    throw error;
  }

  if (!data || typeof data !== 'object') {
    return fallbackResponse;
  }

  return {
    ...fallbackResponse,
    ...(data as Partial<AdvisorResponse>),
    insights: Array.isArray((data as AdvisorResponse).insights)
      ? (data as AdvisorResponse).insights
      : [],
    notices: Array.isArray((data as AdvisorResponse).notices)
      ? (data as AdvisorResponse).notices
      : [],
    actions: Array.isArray((data as AdvisorResponse).actions)
      ? (data as AdvisorResponse).actions
      : [],
  };
};
