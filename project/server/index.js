import express from 'express';
import http from 'http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import morgan from 'morgan';
import { LRUCache } from 'lru-cache';
import { fetchAndSanitize, rewriteHTML, isValidUrl, isPrivateIP } from './proxy-utils.js';
import { locations } from './locations.js';

const app = express();
const PORT = process.env.PORT || 3001;

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

// CORS configuration for development
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
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

// Function to test proxy connectivity and measure ping
async function testProxyPing(proxyUrl) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const timeout = 5000; // 5 second timeout
    
    try {
      // For HTTP proxies, we test by making a request through the proxy
      const options = {
        hostname: new URL(proxyUrl).hostname,
        port: new URL(proxyUrl).port || 80,
        path: 'http://www.google.com',
        method: 'GET',
        timeout: timeout,
        headers: {
          'Host': 'www.google.com'
        }
      };
      
      const req = http.get(options, (res) => {
        const responseTime = Date.now() - startTime;
        res.destroy(); // Don't need to read the response body
        resolve(responseTime);
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve(null); // Ping failed
      });
      
      req.on('error', (error) => {
        req.destroy();
        resolve(null); // Ping failed
      });
    } catch (error) {
      resolve(null); // Invalid URL or other error
    }
  });
}

// Location status endpoint
app.get('/api/locations/status', async (req, res) => {
  const locationStatus = await Promise.all(
    locations.map(async (location) => {
      const ping = await testProxyPing(location.proxyUrl);
      return {
        name: location.name,
        flag: location.flag,
        ping,
      };
    })
  );
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
      
      // Parse and extract title
      const dom = new JSDOM(html);
      const title = dom.window.document.title || new URL(directUrl).hostname;
      
      // Sanitize and rewrite
      const sanitizedHTML = sanitizeHTML(html, directUrl);
      const rewrittenHTML = rewriteHTML(sanitizedHTML, directUrl);
      
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
});