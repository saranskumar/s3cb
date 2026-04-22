
function testTiming(nowUtc, tzOffset) {
  const now = new Date(nowUtc);
  const userLocalTime = new Date(now.getTime() - tzOffset * 60000);
  const hours = userLocalTime.getUTCHours();
  const minutes = userLocalTime.getUTCMinutes();
  const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  console.log(`UTC: ${now.toISOString()}, Offset: ${tzOffset}, Local: ${timeStr}`);
}

// Current UTC (approx)
const now = new Date().toISOString();
testTiming(now, -330); // IST
testTiming(now, 300);  // EST
testTiming(now, 0);    // UTC
