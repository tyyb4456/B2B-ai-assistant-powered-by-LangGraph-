// src/utils/dateFormatters.js
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

export const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  
  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  
  if (isYesterday(date)) {
    return `Yesterday ${format(date, 'h:mm a')}`;
  }
  
  return format(date, 'MMM d, h:mm a');
};

export const formatRelativeTime = (timestamp) => {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
};