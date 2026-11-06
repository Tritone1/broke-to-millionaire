import { requireSupabaseClient } from './supabaseClient';

export type CloudSave<T extends object> = {
  revision: number;
  saveVersion: number;
  payload: T;
  checksum: string;
  updatedAt: string;
};

type CloudSaveRow = {
  revision: number;
  save_version: number;
  payload: object;
  checksum: string;
  updated_at: string;
};

function mapCloudSave<T extends object>(row: CloudSaveRow): CloudSave<T> {
  return {
    revision: row.revision,
    saveVersion: row.save_version,
    payload: row.payload as T,
    checksum: row.checksum,
    updatedAt: row.updated_at,
  };
}

export async function loadCloudSave<T extends object>(): Promise<CloudSave<T> | null> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('cloud_saves')
    .select('revision, save_version, payload, checksum, updated_at')
    .maybeSingle();
  if (error) throw error;
  return data ? mapCloudSave<T>(data as CloudSaveRow) : null;
}

export async function syncCloudSave<T extends object>(input: {
  expectedRevision: number;
  saveVersion: number;
  payload: T;
  checksum: string;
  deviceUpdatedAt?: string;
}): Promise<CloudSave<T>> {
  const client = requireSupabaseClient();
  const { data, error } = await client.rpc('sync_cloud_save', {
    p_expected_revision: input.expectedRevision,
    p_save_version: input.saveVersion,
    p_payload: input.payload,
    p_checksum: input.checksum,
    p_device_updated_at: input.deviceUpdatedAt ?? new Date().toISOString(),
  });
  if (error) throw error;

  const row = (data as CloudSaveRow[] | null)?.[0];
  if (!row) throw new Error('The server did not return the synchronized save.');
  return mapCloudSave<T>(row);
}
