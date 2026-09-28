export function eventDisplayName(event, catalog) {
  if (event.kind !== 'event' || !event.artist_ids?.length) return event.name;
  const byId = new Map(catalog.map((artist) => [artist.id, artist]));
  const selections = event.artist_selections || [];
  const selectedPairs = selections
    .filter((id) => String(id).startsWith('cp:'))
    .map((id) => byId.get(id))
    .filter(Boolean);
  const pairs = catalog.filter(
    (artist) =>
      String(artist.id).startsWith('cp:') &&
      artist.member_ids?.length === 2 &&
      artist.member_ids.every((id) => event.artist_ids.includes(id)),
  );
  const chosen = [...selectedPairs];
  const covered = new Set(chosen.flatMap((pair) => pair.member_ids || []));
  // Older events store CP membership but omit artist_selections. The count
  // records how many people/CPs were selected, so only collapse that many pairs.
  if (!selections.length && Number.isFinite(event.artist_count)) {
    const needed = event.artist_ids.length - event.artist_count;
    for (const pair of pairs) {
      if (chosen.length >= needed) break;
      if (pair.member_ids.some((id) => covered.has(id))) continue;
      chosen.push(pair);
      pair.member_ids.forEach((id) => covered.add(id));
    }
    if (chosen.length !== needed) return event.name;
  }
  if (!chosen.length) return event.name;
  const labels = [
    ...chosen.map((pair) => pair.name),
    ...selections
      .filter((id) => !String(id).startsWith('cp:'))
      .map((id) => byId.get(id)?.name)
      .filter(Boolean),
    ...event.artist_ids
      .filter((id) => !covered.has(id) && !selections.includes(id))
      .map((id) => byId.get(id)?.name)
      .filter(Boolean),
  ];
  return [...new Set(labels)].join(' / ') || event.name;
}
