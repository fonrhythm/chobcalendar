function eventDisplayName(event, catalog) {
  if (event.prefer_activity_name && (event.event_title || event.activity)?.trim()) return (event.event_title || event.activity).trim();
  if (!event.artist_ids?.length) return event.name;
  const byId = new Map(catalog.map((artist) => [artist.id, artist]));
  const selections = event.artist_selections || [];
  const selectedCollectives = selections
    .map((id) => byId.get(id))
    .filter((artist) => artist && (artist.member_ids?.length || artist.group_member_ids?.length));
  const pairs = catalog.filter(
    (artist) =>
      String(artist.id).startsWith('cp:') &&
      artist.member_ids?.length === 2 &&
      artist.member_ids.every((id) => event.artist_ids.includes(id)),
  );
  const chosen = [...selectedCollectives];
  const covered = new Set(chosen.flatMap((artist) => artist.member_ids || artist.group_member_ids || []));
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
    if (chosen.length !== needed) {
      chosen.length = 0;
      covered.clear();
    }
  }
  if (!selections.length && !chosen.length) {
    const exact = catalog.find((artist) => {
      const members = artist.member_ids || artist.group_member_ids || [];
      return members.length > 1 && members.length === event.artist_ids.length &&
        members.every((id) => event.artist_ids.includes(id));
    });
    if (exact) {
      chosen.push(exact);
      (exact.member_ids || exact.group_member_ids).forEach((id) => covered.add(id));
    }
  }
  if (!chosen.length) return event.name;
  const labels = [
    ...chosen.map((pair) => pair.name),
    ...selections
      .filter((id) => !chosen.some((artist) => artist.id === id))
      .map((id) => byId.get(id)?.name)
      .filter(Boolean),
    ...event.artist_ids
      .filter((id) => !covered.has(id) && !selections.includes(id))
      .map((id) => byId.get(id)?.name)
      .filter(Boolean),
  ];
  return [...new Set(labels)].join(' / ') || event.name;
}

module.exports={eventDisplayName};
