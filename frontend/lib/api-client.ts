import type { ConfigFormData, DeploymentData, GenerateResponse, DeployResponse } from './types';

// Use the existing Cloudflare Workers backend for API calls
const API_BASE_URL = 'https://sbconfig.mike-bca.workers.dev';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: string[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function generateConfig(data: ConfigFormData): Promise<GenerateResponse> {
  try {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value);
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to generate configuration',
        response.status,
        errorData.errors
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Network error occurred', 0);
  }
}

export async function deployToVPS(data: DeploymentData): Promise<DeployResponse> {
  try {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, typeof value === 'number' ? value.toString() : value);
      }
    });

    const response = await fetch(`${API_BASE_URL}/deploy`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to deploy to VPS',
        response.status
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Network error occurred', 0);
  }
}

export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new ApiError('Health check failed', response.status);
    }
    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Network error occurred', 0);
  }
}
