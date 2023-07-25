module.exports = (humanInput, startTime) => {
  const now = new Date();
  let currentHours = now.getHours();
  let currentMinutes = now.getMinutes();

  // If a start time is provided, extract the hours and minutes from it
  if (startTime) {
    const startParts = startTime.split(':');
    currentHours = parseInt(startParts[0], 10);
    currentMinutes = parseInt(startParts[1], 10);
  }

  // Regular expressions to match the time units
  const regexMap = [
    { regex: /(\d+)\s+(minute|min)/i, multiplier: 60000 }, // Minutes to milliseconds
    { regex: /(\d+)\s+(hour|hr)/i, multiplier: 3600000 }, // Hours to milliseconds
    { regex: /(\d+)\s+(day)/i, multiplier: 86400000 }, // Days to milliseconds
    { regex: /(\d+)\s+(month)/i, multiplier: 2592000000 }, // Months to milliseconds (approximate)
    { regex: /(\d+)\s+(year|yr)/i, multiplier: 31536000000 }, // Years to milliseconds (approximate)
  ];

  // Additional logic to handle specific days of the week
  const daysOfWeek = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  for (const day of daysOfWeek) {
    if (humanInput.toLowerCase() === day) {
      const dayIndex = daysOfWeek.indexOf(day);
      return dayIndex * 86400000; // Convert days to milliseconds
    }
  }

  for (const { regex, multiplier } of regexMap) {
    const match = humanInput.match(regex);
    if (match) {
      const numericValue = parseInt(match[1], 10);
      return numericValue * multiplier;
    }
  }

  return null; // Return null if no match found
};
