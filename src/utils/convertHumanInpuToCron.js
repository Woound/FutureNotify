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
    { regex: /(\d+)\s+(minute|min)/i, cronUnit: '*/$1 * * * *' }, // Minutes
    { regex: /(\d+)\s+(hour|hr)/i, cronUnit: '0 */$1 * * *' }, // Hours
    {
      regex: /(\d+)\s+(day)/i,
      cronUnit: `${currentMinutes} ${currentHours} */$1 * *`,
    }, // Days
    { regex: /(\d+)\s+(month)/i, cronUnit: '0 0 1 */$1 *' }, // Months
    { regex: /(\d+)\s+(year|yr)/i, cronUnit: '0 0 1 1 */$1' }, // Years
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
      return `${currentMinutes} ${currentHours} * * ${dayIndex}`;
    }
  }

  for (const { regex, cronUnit } of regexMap) {
    const match = humanInput.match(regex);
    if (match) {
      return cronUnit.replace('$1', match[1]);
    }
  }

  return null; // Return null if no match found
};
