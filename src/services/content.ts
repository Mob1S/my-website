export async function readContent<T>(name: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/admin/data/${name}.json`, { cache: 'no-store', signal });
  if (!response.ok) throw new Error(`内容加载失败 (${response.status})`);
  return response.json() as Promise<T>;
}
