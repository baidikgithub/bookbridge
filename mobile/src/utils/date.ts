export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// True for a real calendar date written YYYY-MM-DD that is today or earlier.
export const isPastDate = (v: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) {
    return false;
  }
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]) && v <= today();
};

// "2026-11" -> "Nov"
export const monthLabel = (key: string) => new Date(`${key}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'short' });

// "2026-11-02" -> "2 Nov"
export const shortDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
