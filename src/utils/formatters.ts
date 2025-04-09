/**
 * Форматує дату у зручний для відображення формат
 */
export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit'
  };
  
  return new Date(date).toLocaleString('uk-UA', options);
}
