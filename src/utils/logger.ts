import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

console.log(
  `Logger initialized in ${isProduction ? "production" : "development"} mode`,
);

const logger = pino({
  level: isProduction ? "info" : "debug",

  transport: !isProduction
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,

  redact: {
    paths: [
      "password",
      "token",
      "accessToken",
      "refreshToken",
      "authorization",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[REDACTED]",
  },
});

export default logger;
