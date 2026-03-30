export const parseLocalDateValue = (value) => {
  if (value instanceof Date) {
    return new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
      value.getHours(),
      value.getMinutes(),
      value.getSeconds(),
      value.getMilliseconds()
    );
  }

  if (typeof value === 'string') {
    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
    }

    const localDateTimeMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (localDateTimeMatch) {
      const [, year, month, day, hours, minutes] = localDateTimeMatch;
      return new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), 0, 0);
    }
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

export const formatLocalDate = (value) => {
  const date = parseLocalDateValue(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatLocalDateLabel = (value, options = { day: '2-digit', month: '2-digit', year: 'numeric' }) =>
  parseLocalDateValue(value).toLocaleDateString('pt-BR', options);
