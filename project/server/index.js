import express from 'express';
import http from 'http';
import { Socket } from 'node:net';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import morgan from 'morgan';
import { LRUCache } from 'lru-cache';
import { fetchAndSanitize, rewriteHTML, sanitizeHTML, isValidUrl, isPrivateIP } from './proxy-utils.js';
import { locations } from './locations.js';

const app = express();
const PORT = process.env.PORT || 3003;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration (allow any localhost port in development)
const isProduction = process.env.NODE_ENV === 'production';
const corsOptions = {
  origin: isProduction
    ? ['https://your-domain.com']
    : (origin, callback) => {
        // Allow requests from any localhost or 127.0.0.1 port in dev
        if (!origin) return callback(null, true);
        const allowed = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        return callback(allowed ? null : new Error('Not allowed by CORS'), allowed);
      },
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate limiting - Very permissive for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Limit each IP to 10000 requests per windowMs (very high for development)
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('combined'));
}

// LRU Cache for response caching
const cache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
});

// Health check endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Debug endpoint to test HTML content
app.get('/api/debug/test-html', async (req, res) => {
  try {
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Page</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: white; }
          .test { background: #f0f0f0; padding: 10px; border-radius: 5px; margin: 10px 0; }
          h1 { color: #333; }
        </style>
      </head>
      <body>
        <h1>✅ Test HTML Content Working!</h1>
        <div class="test">
          <p>This is a test to see if HTML content displays properly in the browser.</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
          </ul>
          <p><strong>If you can see this, the HTML rendering is working correctly!</strong></p>
        </div>
      </body>
      </html>
    `;

    res.json({
      html: testHtml,
      title: 'Test Page',
      snapshot: 'This is a test to see if HTML content displays properly...'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Realistic fake proxy ping simulation system
// Each region has its own base latency and variation patterns that behave like real proxies

const regionPingData = {
  'United States': { base: 45, variance: 15, lastPing: null, nextUpdate: 0 },
  'Germany': { base: 85, variance: 20, lastPing: null, nextUpdate: 0 },
  'India': { base: 120, variance: 25, lastPing: null, nextUpdate: 0 },
  'Singapore': { base: 95, variance: 18, lastPing: null, nextUpdate: 0 },
  'United Kingdom': { base: 75, variance: 22, lastPing: null, nextUpdate: 0 },
};

// Generate realistic ping with natural variation like real proxy servers
function generateRealisticPing(regionName) {
  const data = regionPingData[regionName];
  if (!data) return Math.floor(Math.random() * 100) + 50;

  // Add random variance to base ping to simulate real network conditions
  const variance = (Math.random() - 0.5) * 2 * data.variance;
  const ping = Math.max(10, Math.floor(data.base + variance));

  // Occasionally simulate network spikes (5% chance) like real proxies
  if (Math.random() < 0.05) {
    return Math.floor(ping * (1.5 + Math.random() * 0.8));
  }

  return ping;
}

// Initialize ping values immediately when server starts (like real proxy testing)
function initializePingValues() {
  console.log('[PING] Initializing proxy ping simulation...');

  for (const regionName in regionPingData) {
    const ping = generateRealisticPing(regionName);
    regionPingData[regionName].lastPing = ping;
    regionPingData[regionName].nextUpdate = Date.now() + (2000 + Math.random() * 6000);
    console.log(`[PING] ${regionName}: ${ping}ms (simulated)`);
  }

  console.log('[PING] All proxy locations initialized with realistic ping values');
}

// Get current ping for a region (updates at different intervals like real proxies)
function getCurrentPing(regionName) {
  const now = Date.now();
  const data = regionPingData[regionName];

  if (!data) return null;

  // Each region updates at different intervals (2-8 seconds) to simulate real proxy behavior
  if (now >= data.nextUpdate) {
    data.lastPing = generateRealisticPing(regionName);
    // Set next update time (staggered intervals like real proxy monitoring)
    const interval = 2000 + Math.random() * 6000; // 2-8 seconds
    data.nextUpdate = now + interval;
  }

  return data.lastPing;
}

// Location status endpoint with real-time individual ping updates
app.get('/api/locations/status', async (req, res) => {
  const locationStatus = locations.map((location) => {
    const ping = getCurrentPing(location.name);
    return {
      name: location.name,
      flag: location.flag,
      ping,
      status: location.status || 'unknown'
    };
  });
  res.json(locationStatus);
});

// Main proxy endpoint
app.post('/api/proxy/fetch', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { url, regionHint = 'United States' } = req.body;
    
    // Validation
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        error: 'Invalid URL provided',
        code: 'INVALID_URL'
      });
    }

    // Normalize and validate URL
    let normalizedUrl;
    try {
      normalizedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return res.status(400).json({
        error: 'Malformed URL',
        code: 'MALFORMED_URL'
      });
    }

    // Security checks
    if (!isValidUrl(normalizedUrl)) {
      return res.status(403).json({
        error: 'URL not allowed',
        code: 'FORBIDDEN_URL'
      });
    }

    if (isPrivateIP(normalizedUrl.hostname)) {
      return res.status(403).json({
        error: 'Access to private networks not allowed',
        code: 'PRIVATE_NETWORK'
      });
    }

    const finalUrl = normalizedUrl.toString();
    console.log(`[PROXY] Fetching: ${finalUrl} (Region: ${regionHint})`);

    // Check cache first
    const cacheKey = `${finalUrl}:${regionHint}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`[CACHE] Hit for: ${finalUrl}`);
      return res.json({
        ...cached,
        cached: true,
        processingTime: Date.now() - startTime
      });
    }

    // Fetch and process
    const result = await fetchAndSanitize(finalUrl, {
      regionHint,
      userAgent: req.headers['user-agent'] || 'ProxyBrowser/1.0',
      timeout: 30000,
    });

    // Rewrite HTML to route through proxy
    const rewrittenHTML = rewriteHTML(result.html, finalUrl);
    
    const response = {
      html: rewrittenHTML,
      title: result.title,
      url: finalUrl,
      snapshot: result.snapshot,
      processingTime: Date.now() - startTime,
      cached: false,
    };

    // Cache the response
    cache.set(cacheKey, response);

    console.log(`[PROXY] Success: ${finalUrl} (${Date.now() - startTime}ms)`);
    res.json(response);

  } catch (error) {
    console.error('[PROXY] Error:', error.message);
    
    // Try direct fetch as fallback
    try {
      console.log(`[PROXY] Trying direct fetch as fallback for: ${req.body.url}`);
      const directUrl = req.body.url.startsWith('http') ? req.body.url : `https://${req.body.url}`;
      
      const directResponse = await fetch(directUrl, {
        method: 'GET',
        headers: {
          'User-Agent': req.headers['user-agent'] || 'ProxyBrowser/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        redirect: 'follow',
      });

      if (!directResponse.ok) {
        throw new Error(`HTTP ${directResponse.status}: ${directResponse.statusText}`);
      }

      const contentType = directResponse.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        throw new Error(`Unsupported content type: ${contentType}`);
      }

      const html = await directResponse.text();
      
      // Extract title from HTML using simple regex (no JSDOM needed)
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : new URL(directUrl).hostname;

      // Simple HTML rewriting for DuckDuckGo integration
      const rewrittenHTML = rewriteHTML(html, directUrl);
      
      const response = {
        html: rewrittenHTML,
        title: title,
        url: directUrl,
        snapshot: '',
        processingTime: Date.now() - startTime,
        cached: false,
        fallback: true
      };

      console.log(`[PROXY] Direct fetch success: ${directUrl} (${Date.now() - startTime}ms)`);
      return res.json(response);
      
    } catch (directError) {
      console.error('[PROXY] Direct fetch also failed:', directError.message);
      
      const errorResponse = {
        error: 'Failed to fetch content',
        code: 'FETCH_ERROR',
        message: error.message,
        processingTime: Date.now() - startTime,
      };

      // Return appropriate status codes
      if (error.name === 'AbortError' || directError.name === 'AbortError') {
        res.status(408).json({ ...errorResponse, code: 'TIMEOUT' });
      } else if (error.code === 'ENOTFOUND' || directError.code === 'ENOTFOUND') {
        res.status(404).json({ ...errorResponse, code: 'NOT_FOUND' });
      } else {
        res.status(500).json(errorResponse);
      }
    }
  }
});

// Resource proxy endpoint for assets
app.get('/api/proxy/resource', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    const normalizedUrl = new URL(url);
    
    if (!isValidUrl(normalizedUrl) || isPrivateIP(normalizedUrl.hostname)) {
      return res.status(403).json({ error: 'URL not allowed' });
    }

    const response = await fetch(normalizedUrl.toString(), {
      headers: {
        'User-Agent': req.headers['user-agent'] || 'ProxyBrowser/1.0',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Resource fetch failed: ${response.status}` 
      });
    }

    // Set appropriate headers
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Stream the response
    response.body.pipe(res);

  } catch (error) {
    console.error('[RESOURCE] Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('[SERVER] Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/status`);
  console.log(`🔒 Security: Enhanced with helmet, rate limiting, and CORS`);
  console.log(`💾 Cache: LRU cache enabled with 5min TTL`);

  // Initialize fake ping values immediately when server starts
  console.log(`🌐 Initializing proxy ping simulation...`);
  initializePingValues();

  console.log(`✅ Fake proxy ping system initialized and running`);
});