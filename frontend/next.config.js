/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server actions are enabled by default in Next.js 14+
  
  /**
   * P2-A Technical Debt Fix: Webpack Configuration
   * 
   * Issue: Scripts directory changes not detected by hot reload
   * Root Cause: Next.js only watches src/ and pages/ by default
   * 
   * Fix: Configure webpack watchOptions for better hot reload
   */
  webpack: (config, { dev }) => {
    if (dev) {
      // Enable better watching for development
      config.watchOptions = {
        ...config.watchOptions,
        // Poll interval for file changes (helps with Docker/VM environments)
        poll: 1000,
        // Ignore node_modules to reduce CPU usage
        ignored: /node_modules/,
        // Aggregate file changes for stability
        aggregateTimeout: 300,
      }
    }
    
    return config
  },
  
  /**
   * Logging configuration for debugging
   */
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

module.exports = nextConfig
