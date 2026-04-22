const GOOGLE_CALENDAR_BASE_URL = 'https://www.google.com/calendar/render?action=TEMPLATE';

function formatGoogleCalendarUtc(dateLike) {
  const date = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function buildGoogleCalendarDeeplink({
  title,
  details,
  startIso,
  endIso,
  location,
}) {
  const start = formatGoogleCalendarUtc(startIso);
  if (!start) return '';

  const endDate = endIso ? new Date(endIso) : new Date(new Date(startIso).getTime() + 60 * 60 * 1000);
  const end = formatGoogleCalendarUtc(endDate);
  if (!end) return '';

  const text = encodeURIComponent(title || 'Meeting');
  const detailsValue = encodeURIComponent(details || '');
  const locationValue = encodeURIComponent(location || '');

  return `${GOOGLE_CALENDAR_BASE_URL}&text=${text}&dates=${start}%2F${end}&details=${detailsValue}&location=${locationValue}`;
}

export { buildGoogleCalendarDeeplink, formatGoogleCalendarUtc };
