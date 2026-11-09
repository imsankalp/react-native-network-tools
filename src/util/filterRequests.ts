type Filterable = { url: string; method: string; responseCode: number };

/** Matches URL, method or status code, case-insensitively. */
export function filterRequests<T extends Filterable>(
  requests: T[],
  query: string
): T[] {
  if (!query.trim()) return requests;
  const q = query.toLowerCase();
  return requests.filter(
    (r) =>
      r.url.toLowerCase().includes(q) ||
      r.method.toLowerCase().includes(q) ||
      String(r.responseCode).includes(q)
  );
}
