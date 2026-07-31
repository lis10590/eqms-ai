//format date and time in dd/mm/yyyy hh:mm format
export const formatDateTime = (
  dateString?: string | null | undefined,
): string => {
  // If the date is null, undefined, or an empty string, immediately return "Just now"
  if (!dateString) return "Just now";

  const date = new Date(dateString);

  // If the string is invalid and can't be parsed into a date, return the original string just in case
  if (isNaN(date.getTime())) return dateString;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};
