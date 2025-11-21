export function getEnv() {
  const { OPENAI_API_KEY,
    DATABASE_PATH,
    CORRECTIONS_LOG_PATH,
    UPLOADS_DIR,
    LOG_LEVEL,
    NODE_ENV,
  } = process.env;
  return {
    OPENAI_API_KEY,
    DATABASE_PATH,
    CORRECTIONS_LOG_PATH,
    UPLOADS_DIR,
    LOG_LEVEL,
    NODE_ENV,
  };
}

