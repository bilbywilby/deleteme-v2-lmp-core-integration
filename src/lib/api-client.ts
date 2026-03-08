import { ApiResponse } from "../../shared/types";
/**
 * Standard OBLIVION API client with enhanced error handling and response validation.
 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { 
    headers: { 'Content-Type': 'application/json' }, 
    ...init 
  });
  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch (err) {
    console.error(`[API ERROR] Malformed JSON at ${path}:`, err);
    throw new Error('Neural uplink returned invalid data format.');
  }
  if (!res.ok || !json.success) {
    const errorMsg = json.error || `Protocol error: ${res.status} ${res.statusText}`;
    throw new Error(errorMsg);
  }
  if (json.data === undefined) {
    throw new Error('Protocol payload empty: Expected data buffer missing.');
  }
  return json.data;
}