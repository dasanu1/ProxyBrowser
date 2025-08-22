import { JSDOM } from 'jsdom';
import DOMPurify from 'isomorphic-dompurify';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Private IP ranges for SSRF protection
const PRIVATE_IP_RANGES = [
  /^127\./,           // 127.0.0.0/8 - Loopback
  /^10\./,            // 10.0.0.0/8 - Private
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0/12 - Private
  /^192\.168\./,      // 192.168.0.0/16 - Private
  /^169\.254\./,      // 169.254.0.0/16 - Link-local
  /^fe80:/i,          // fe80::/10 - IPv6 link-local
  /^::1$/,            // ::1 - IPv6 loopback
  /^localhost$/i,
];

// Blocked domains and patterns
const BLOCKED_DOMAINS = [
  'internal',
  'localhost',
  'local',
  '0.0.0.0',
];

// Allowed protocols
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * Check if URL is valid and safe to fetch
 */
export function isValidUrl(url) {
  try {
    const urlObj = typeof url === 'string' ? new URL(url) : url;
    
    // Check protocol
    if (!ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
      console.log(`[SECURITY] Blocked protocol: ${urlObj.protocol}`);
      return false;
    }

    // Check for blocked domains
    const hostname = urlObj.hostname.toLowerCase();
    for (const blocked of BLOCKED_DOMAINS) {
      if (hostname.includes(blocked)) {
        console.log(`[SECURITY] Blocked domain pattern: ${blocked} in ${hostname}`);
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Check if hostname resolves to a private IP
 */
export function isPrivateIP(hostname) {
  // Check if it's already an IP address
  const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  if (ipRegex.test(hostname)) {
    return PRIVATE_IP_RANGES.some(range => range.test(hostname));
  }

  // For domain names, we'd need DNS resolution
  // For security, block known private/local patterns
  const lowercaseHost = hostname.toLowerCase();
  return (
    lowercaseHost === 'localhost' ||
    lowercaseHost.endsWith('.local') ||
    lowercaseHost.endsWith('.internal')
  );
}

/**
 * Fetch URL and sanitize the response
 */
export async function fetchAndSanitize(url, options = {}) {
  const {
    regionHint = 'United States',
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    timeout = 30000,
  } = options;

  console.log(`[FETCH] Starting: ${url}`);

  try {
    // Try to fetch with timeout
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      signal: AbortSignal.timeout(timeout),
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    
    if (!contentType.includes('text/html')) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    const html = await response.text();
    console.log(`[FETCH] Received ${html.length} bytes`);

    // Parse and sanitize HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract title
    const title = document.title || new URL(url).hostname;

    // Create a snapshot (first 200 chars of text content)
    const textContent = document.body?.textContent || '';
    const snapshot = textContent.replace(/\s+/g, ' ').trim().slice(0, 200);

    // Sanitize HTML - remove dangerous elements
    const sanitizedHTML = sanitizeHTML(html, url);

    console.log(`[SANITIZE] Processed HTML, title: ${title}`);

    return {
      html: sanitizedHTML,
      title,
      snapshot: snapshot + (snapshot.length >= 200 ? '...' : ''),
      originalUrl: url,
    };
  } catch (error) {
    console.error(`[FETCH] Direct fetch failed for ${url}:`, error.message);
    
    // If direct fetch fails, try to fetch through a proxy
    // This is a fallback - in a real implementation, you'd want to use actual proxy servers
    throw new Error(`Failed to fetch content: ${error.message}`);
  }
}

/**
 * Sanitize HTML content
 */
function sanitizeHTML(html, baseUrl) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const window = dom.window;

  // Initialize DOMPurify with JSDOM
  const purify = DOMPurify(window);

  // Custom configuration for DOMPurify
  const sanitizeConfig = {
    // Allow these tags
    ALLOWED_TAGS: [
      'div', 'span', 'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'strong', 'b', 'em', 'i', 'u', 'small', 'big', 'sub', 'sup',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'img', 'figure', 'figcaption',
      'a', 'blockquote', 'pre', 'code',
      'form', 'input', 'button', 'select', 'option', 'textarea', 'label',
      'nav', 'header', 'footer', 'section', 'article', 'aside', 'main',
    ],
    
    // Allow these attributes
    ALLOWED_ATTR: [
      'class', 'id', 'style', 'href', 'src', 'alt', 'title',
      'width', 'height', 'colspan', 'rowspan',
      'type', 'name', 'value', 'placeholder', 'disabled', 'readonly',
    ],

    // Keep relative URLs
    KEEP_CONTENT: true,
    
    // Remove script tags and event handlers
    FORBID_TAGS: ['script', 'noscript', 'iframe', 'embed', 'object', 'applet'],
    FORBID_ATTR: ['on*', 'javascript:'],
  };

  // Remove all script tags and event handlers manually first
  const scripts = document.querySelectorAll('script, noscript');
  scripts.forEach(script => script.remove());

  // Remove event handlers from all elements
  const allElements = document.querySelectorAll('*');
  allElements.forEach(element => {
    // Remove all on* attributes
    for (let i = element.attributes.length - 1; i >= 0; i--) {
      const attr = element.attributes[i];
      if (attr.name.startsWith('on') || attr.value?.includes('javascript:')) {
        element.removeAttribute(attr.name);
      }
    }
  });

  // Sanitize with DOMPurify
  const sanitized = purify.sanitize(dom.serialize(), sanitizeConfig);

  console.log('[SANITIZE] Removed scripts and dangerous content');
  return sanitized;
}

/**
 * Rewrite HTML to route links through proxy
 */
export function rewriteHTML(html, originalUrl) {
  try {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const baseURL = new URL(originalUrl);

    // Rewrite all links to go through proxy
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
        try {
          const absoluteUrl = new URL(href, baseURL).toString();
          // Instead of rewriting to proxy, we'll leave them as-is
          // The frontend will handle proxy routing
          link.setAttribute('href', absoluteUrl);
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
        } catch {
          // Invalid URL, remove href
          link.removeAttribute('href');
        }
      }
    });

    // Fix image sources
    const images = document.querySelectorAll('img[src]');
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        try {
          const absoluteUrl = new URL(src, baseURL).toString();
          img.setAttribute('src', `/api/proxy/resource?url=${encodeURIComponent(absoluteUrl)}`);
        } catch {
          // Invalid URL, remove src
          img.removeAttribute('src');
        }
      }
    });

    // Fix CSS links
    const cssLinks = document.querySelectorAll('link[rel="stylesheet"][href]');
    cssLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('data:')) {
        try {
          const absoluteUrl = new URL(href, baseURL).toString();
          link.setAttribute('href', `/api/proxy/resource?url=${encodeURIComponent(absoluteUrl)}`);
        } catch {
          link.remove();
        }
      }
    });

    // Add base tag to handle relative URLs
    const head = document.head || document.querySelector('head');
    if (head && !document.querySelector('base')) {
      const baseTag = document.createElement('base');
      baseTag.href = baseURL.origin + baseURL.pathname;
      head.insertBefore(baseTag, head.firstChild);
    }

    // Add meta tags for security
    const metaViewport = document.createElement('meta');
    metaViewport.name = 'viewport';
    metaViewport.content = 'width=device-width, initial-scale=1';
    head?.appendChild(metaViewport);

    const metaCSP = document.createElement('meta');
    metaCSP.httpEquiv = 'Content-Security-Policy';
    metaCSP.content = "script-src 'none'; object-src 'none';";
    head?.appendChild(metaCSP);

    console.log('[REWRITE] Updated links and resources');
    return dom.serialize();

  } catch (error) {
    console.error('[REWRITE] Error:', error.message);
    return html; // Return original HTML if rewriting fails
  }
}

/**
 * Extract metadata from HTML
 */
export function extractMetadata(html) {
  try {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    return {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '',
      author: document.querySelector('meta[name="author"]')?.getAttribute('content') || '',
      ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
      ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
    };
  } catch {
    return {};
  }
}