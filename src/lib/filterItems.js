// In-memory filtering + sorting for the listings grid. Extracted from Home.jsx
// so it can be unit-tested in isolation. Mirrors the server logic in
// server/routes/items.js. Prices are NUMERIC strings; null = Negotiable.
//
// `filters` shape: { q, category, minPrice, maxPrice, sort } — all strings;
// q/category/minPrice/maxPrice default to '' (no filter), sort defaults to 'newest'.
export function applyFilters(items, { q = '', category = '', minPrice = '', maxPrice = '', sort = 'newest' } = {}) {
  let out = items;

  const term = q.trim().toLowerCase();
  if (term) out = out.filter((i) => i.title.toLowerCase().includes(term));
  if (category) out = out.filter((i) => i.category === category);

  const min = Number(minPrice);
  if (minPrice !== '' && Number.isFinite(min)) out = out.filter((i) => i.price != null && Number(i.price) >= min);
  const max = Number(maxPrice);
  if (maxPrice !== '' && Number.isFinite(max)) out = out.filter((i) => i.price != null && Number(i.price) <= max);

  const price = (i) => (i.price == null ? null : Number(i.price));
  const byDate = (a, b) => new Date(a.created_at) - new Date(b.created_at);
  const byPrice = (dir) => (a, b) => {
    const pa = price(a), pb = price(b);
    if (pa == null && pb == null) return 0;
    if (pa == null) return 1;   // Negotiable sorts last
    if (pb == null) return -1;
    return dir * (pa - pb);
  };
  out = [...out];
  if (sort === 'oldest') out.sort(byDate);
  else if (sort === 'price_asc') out.sort(byPrice(1));
  else if (sort === 'price_desc') out.sort(byPrice(-1));
  else out.sort((a, b) => byDate(b, a)); // newest (default)
  return out;
}
