const nextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  webpack: (config) => {
    config.module.rules.push({
      test: /node_modules.*thread-stream.*\.(test|spec|bench|README|LICENSE|\.zip|\.sh|\.yml|\.mjs)$/,
      use: 'ignore-loader',
    });
    
    config.module.rules.push({
      test: /\.(test|spec)\.(js|ts|tsx|jsx|mjs)$/,
      include: /node_modules/,
      use: 'ignore-loader',
    });
    
    return config;
  },
}

module.exports = nextConfig
