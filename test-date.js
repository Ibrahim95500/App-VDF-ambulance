const { format } = require('date-fns');

const today = new Date();
const dateStr = format(today, 'yyyy-MM-dd');
const startOfToday = new Date(`${dateStr}T00:00:00.000Z`);
const endOfToday = new Date(`${dateStr}T23:59:59.999Z`);

console.log("dateStr:", dateStr);
console.log("startOfToday:", startOfToday.toISOString());
console.log("endOfToday:", endOfToday.toISOString());
