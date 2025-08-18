/**
 * Parse a date string in various formats and return a Date object
 * Supports multiple date formats including:
 * - ISO 8601: "2024-01-15", "2024-01-15T10:30:00Z"
 * - US format: "01/15/2024", "1/15/24"
 * - UK format: "15/01/2024", "15/1/24"
 * - Natural language: "tomorrow", "next week", "in 3 days"
 * - Relative dates: "today", "yesterday"
 * - Common formats: "Jan 15, 2024", "15 Jan 2024"
 */
export function parseDateString(dateString: string): Date | null {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  const trimmed = dateString.trim();
  if (!trimmed) {
    return null;
  }

  // Try ISO 8601 format first
  const isoDate = new Date(trimmed);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try common date formats
  const formats = [
    // MM/DD/YYYY or M/D/YY
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(trimmed),
    // DD/MM/YYYY or D/M/YY
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(trimmed),
    // YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed),
    // Month name formats: "Jan 15, 2024", "15 Jan 2024"
    /^(\w{3})\s+(\d{1,2}),?\s+(\d{4})$/.exec(trimmed),
    /^(\d{1,2})\s+(\w{3})\s+(\d{4})$/.exec(trimmed),
  ];

  for (const match of formats) {
    if (match) {
      let year: number, month: number, day: number;

      if (match[1].length === 4) {
        // YYYY-MM-DD format
        year = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        day = parseInt(match[3]);
      } else if (match[3].length === 4) {
        // MM/DD/YYYY or DD/MM/YYYY format
        const first = parseInt(match[1]);
        const second = parseInt(match[2]);
        year = parseInt(match[3]);
        
        // Try to determine if it's MM/DD or DD/MM
        if (first <= 12 && second <= 31) {
          // Could be either format, assume MM/DD for US format
          month = first - 1;
          day = second;
        } else if (second <= 12 && first <= 31) {
          // Likely DD/MM format
          month = second - 1;
          day = first;
        } else {
          continue; // Invalid format
        }
      } else {
        // 2-digit year format
        const first = parseInt(match[1]);
        const second = parseInt(match[2]);
        const year2 = parseInt(match[3]);
        
        // Assume 20xx for years < 50, 19xx for years >= 50
        year = year2 < 50 ? 2000 + year2 : 1900 + year2;
        
        if (first <= 12 && second <= 31) {
          month = first - 1;
          day = second;
        } else if (second <= 12 && first <= 31) {
          month = second - 1;
          day = first;
        } else {
          continue;
        }
      }

      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // Try month name formats
  const monthNames = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11
  };

  const monthMatch = /^(\w{3,})\s+(\d{1,2}),?\s+(\d{4})$/i.exec(trimmed);
  if (monthMatch) {
    const monthName = monthMatch[1].toLowerCase();
    const monthIndex = monthNames[monthName as keyof typeof monthNames];
    if (monthIndex !== undefined) {
      const day = parseInt(monthMatch[2]);
      const year = parseInt(monthMatch[3]);
      const date = new Date(year, monthIndex, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  const dayMonthMatch = /^(\d{1,2})\s+(\w{3,})\s+(\d{4})$/i.exec(trimmed);
  if (dayMonthMatch) {
    const monthName = dayMonthMatch[2].toLowerCase();
    const monthIndex = monthNames[monthName as keyof typeof monthNames];
    if (monthIndex !== undefined) {
      const day = parseInt(dayMonthMatch[1]);
      const year = parseInt(dayMonthMatch[3]);
      const date = new Date(year, monthIndex, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // Try relative dates
  const lowerTrimmed = trimmed.toLowerCase();
  const today = new Date();
  
  switch (lowerTrimmed) {
    case 'today':
      return today;
    case 'tomorrow': {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow;
    }
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return yesterday;
    }
    case 'next week': {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      return nextWeek;
    }
    case 'next month': {
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      return nextMonth;
    }
  }

  // Try "in X days/weeks/months" format
  const relativeMatch = /^in\s+(\d+)\s+(day|days|week|weeks|month|months)$/i.exec(lowerTrimmed);
  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1]);
    const unit = relativeMatch[2].toLowerCase();
    const result = new Date(today);
    
    switch (unit) {
      case 'day':
      case 'days':
        result.setDate(today.getDate() + amount);
        break;
      case 'week':
      case 'weeks':
        result.setDate(today.getDate() + (amount * 7));
        break;
      case 'month':
      case 'months':
        result.setMonth(today.getMonth() + amount);
        break;
    }
    
    return result;
  }

  return null;
} 