const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();
  const { method, originalUrl, ip, headers } = req;
  const userAgent = headers['user-agent'] || 'Unknown';
  const requestId = Math.random().toString(36).substring(7);

  // Log incoming request with more details
  console.log(`\n🔵 [REQUEST ${requestId}] ${method} ${originalUrl}`);
  console.log(`   ├─ IP: ${ip}`);
  console.log(`   ├─ User-Agent: ${userAgent}`);
  console.log(`   ├─ Time: ${new Date().toISOString()}`);
  if (Object.keys(req.body || {}).length > 0) {
    console.log(`   ├─ Body: ${JSON.stringify(req.body, null, 2)}`);
  }
  if (Object.keys(req.query || {}).length > 0) {
    console.log(`   ├─ Query: ${JSON.stringify(req.query)}`);
  }

  // Store request ID for response logging
  req.requestId = requestId;

  // Override res.json to capture response data
  const originalJson = res.json;
  res.json = function(data) {
    res.responseData = data;
    return originalJson.call(this, data);
  };

  // Override res.send to capture response data
  const originalSend = res.send;
  res.send = function(data) {
    if (!res.responseData) {
      res.responseData = data;
    }
    return originalSend.call(this, data);
  };

  // Log response when it finishes
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    const { statusCode } = res;
    
    // Determine status color
    let statusIcon = '🟢'; // 2xx
    if (statusCode >= 400 && statusCode < 500) statusIcon = '🟡'; // 4xx
    if (statusCode >= 500) statusIcon = '🔴'; // 5xx
    if (statusCode >= 300 && statusCode < 400) statusIcon = '🔵'; // 3xx

    console.log(`${statusIcon} [RESPONSE ${requestId}] ${method} ${originalUrl} → ${statusCode} (${durationMs.toFixed(2)}ms)`);
    
    // Log response data for errors or if it's short enough
    if (res.responseData) {
      const responseStr = typeof res.responseData === 'string' ? 
        res.responseData : JSON.stringify(res.responseData);
      
      if (statusCode >= 400 || responseStr.length < 500) {
        console.log(`   └─ Response: ${responseStr}`);
      } else {
        console.log(`   └─ Response: [${responseStr.length} characters]`);
      }
    }
    console.log(''); // Empty line for readability
  });

  // Log errors
  res.on('error', (error) => {
    console.log(`🔴 [ERROR ${requestId}] ${method} ${originalUrl}`);
    console.log(`   └─ Error: ${error.message}`);
    console.log(`   └─ Stack: ${error.stack}`);
  });

  next();
};

module.exports = requestLogger;