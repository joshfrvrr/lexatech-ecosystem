export type Account = {
  id: string;
  email: string;
  createdAt: string;
  organization: { id: string; name: string };
};

export type Obligation = {
  id: string;
  title: string;
  description: string | null;
  status: 'compliant' | 'at_risk' | 'non_compliant' | 'pending';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Dashboard = {
  score: number;
  total: number;
  compliant: number;
  atRisk: number;
  overdue: number;
  upcoming: number;
  obligations: Obligation[];
};

type ApiResult<T> = { success: true; data: T } | { success: false; error: string };

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  let result: ApiResult<T>;
  try {
    result = await response.json() as ApiResult<T>;
  } catch {
    throw new Error(response.status >= 500
      ? 'LexaTech cannot reach the API service. Refresh after starting the full app with npm run dev.'
      : 'We could not process that request. Please try again.');
  }
  if (!response.ok || !result.success) {
    throw new Error(result.success ? 'We could not complete that request.' : result.error || 'Please check your information and try again.');
  }
  return result.data;
}
