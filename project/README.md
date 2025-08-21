# ProxyBrowser Platform

A futuristic proxy browser platform built with React, TypeScript, and Node.js. This application provides a secure, private browsing experience with a beautiful neumorphic UI design.

## 🚀 Features

- **Futuristic UI**: Black/white neumorphic design with smooth animations
- **Real Proxy Functionality**: Secure server-side proxy with HTML sanitization
- **Multi-tab Browser**: Full-featured browser window with tab management
- **Global Network**: Region selection for proxy routing
- **Security First**: SSRF protection, content sanitization, and CSP headers
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Zero Logs**: Privacy-focused with no data retention

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **React 18** with hooks and functional components
- **Framer Motion** for smooth animations and transitions
- **Tailwind CSS** for responsive styling
- **Lucide React** for consistent iconography

### Backend (Node.js + Express)
- **Express** server with security middleware
- **HTML Sanitization** using DOMPurify and JSDOM
- **Rate Limiting** and abuse protection
- **LRU Cache** for performance optimization
- **Security Headers** with Helmet.js

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Start Development Servers

**Terminal 1 - Backend Server:**
```bash
npm run server
```
The backend will start on `http://localhost:3001`

**Terminal 2 - Frontend Development:**
```bash
npm run dev
```
The frontend will start on `http://localhost:5173`

### 3. Access the Application

Open your browser and navigate to `http://localhost:5173`

## 🔧 Configuration

### Backend Configuration

The server can be configured through environment variables:

```bash
# .env file (optional)
PORT=3001
NODE_ENV=development
```

### Security Features

- **SSRF Protection**: Blocks requests to private IP ranges
- **Content Sanitization**: Removes all scripts and dangerous content
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Policy**: Configured for development origins
- **CSP Headers**: Prevents XSS attacks

### Cache Configuration

- **LRU Cache**: 500 items max, 5-minute TTL
- **Memory Usage**: Automatically managed
- **Cache Keys**: Based on URL and region hint

## 🎨 UI Components

### Core Components
- `Header` - Navigation with smooth scroll
- `SearchBar` - Region selector and search input
- `BrowserWindow` - Floating browser with tabs
- `EarthAnimation` - Rotating earth centerpiece
- `LanguageSelector` - Multi-language support
- `Toast` - Notification system

### Design System
- **Colors**: Monochromatic with primary accent (#00ff88)
- **Typography**: System fonts with proper hierarchy
- **Spacing**: 8px grid system
- **Animations**: Spring physics with Framer Motion
- **Breakpoints**: Mobile-first responsive design

## 🔒 Security Implementation

### Frontend Security
- Content Security Policy headers
- Iframe sandboxing for proxied content
- Input validation and sanitization
- XSS prevention

### Backend Security
```javascript
// SSRF Protection
function isValidUrl(url) {
  // Check protocols, domains, and IP ranges
}

// Content Sanitization  
function sanitizeHTML(html) {
  // Remove scripts, events, dangerous content
  // Rewrite URLs to route through proxy
}

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

## 📡 API Endpoints

### `POST /api/proxy/fetch`
Fetch and proxy a web page

**Request:**
```json
{
  "url": "https://example.com",
  "regionHint": "United States"
}
```

**Response:**
```json
{
  "html": "<sanitized html>",
  "title": "Page Title",
  "url": "https://example.com",
  "snapshot": "Page preview...",
  "processingTime": 1250,
  "cached": false
}
```

### `GET /api/proxy/resource?url=<encoded_url>`
Proxy static resources (images, CSS, etc.)

### `GET /api/status`
Health check and server statistics

## 🚀 Production Deployment

### Build the Frontend
```bash
npm run build
```

### Production Configuration
```javascript
// server/index.js
const isProduction = process.env.NODE_ENV === 'production';

// Update CORS origins
cors({
  origin: isProduction 
    ? ['https://your-domain.com'] 
    : ['http://localhost:5173']
});
```

### Environment Variables
```bash
NODE_ENV=production
PORT=3001
# Add production-specific config
```

## 🔮 Future Enhancements

### Production Features (TODO)
- [ ] **Real Proxy Providers**: Integrate Tor, SOCKS, rotating proxies
- [ ] **User Authentication**: Account system with preferences
- [ ] **Advanced Caching**: Redis cache with clustering
- [ ] **Analytics Dashboard**: Usage metrics (privacy-compliant)
- [ ] **Mobile Apps**: React Native implementation
- [ ] **Browser Extensions**: Chrome/Firefox extensions

### Security Enhancements
- [ ] **Certificate Pinning**: Enhanced HTTPS validation
- [ ] **Request Signing**: API request authentication
- [ ] **Audit Logging**: Security event monitoring
- [ ] **WAF Integration**: Web Application Firewall

### Performance Optimizations
- [ ] **CDN Integration**: Global content delivery
- [ ] **Load Balancing**: Multi-server deployment
- [ ] **Database Layer**: Persistent caching and session storage
- [ ] **WebSocket Support**: Real-time proxy status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This is an alpha version intended for educational and development purposes. For production use, additional security auditing and proxy provider integration is required.

---

**Made with ❤️ for privacy and security**