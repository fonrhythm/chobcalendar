const parts = (value) => String(value || '')
  .split('/')
  .map((part) => part.trim())
  .filter(Boolean);

const key = (value) => value.toLocaleLowerCase();

export function recordCompanies(record, catalog) {
  const ids = new Set(record.artist_ids || []);
  const names = new Map();
  for (const artist of catalog) {
    if (!ids.has(artist.id)) continue;
    for (const name of parts(artist.company)) {
      if (!names.has(key(name))) names.set(key(name), name);
    }
  }
  return [...names.values()];
}

export function companyOptions(records, catalog) {
  const names = new Map();
  for (const record of records) {
    for (const name of recordCompanies(record, catalog)) {
      if (!names.has(key(name))) names.set(key(name), name);
    }
  }
  return [...names.values()].sort((a, b) => a.localeCompare(b));
}

export function matchesCompany(record, catalog, selected) {
  if (!selected.length) return true;
  const choices = new Set(selected.map(key));
  return recordCompanies(record, catalog).some((name) => choices.has(key(name)));
}
