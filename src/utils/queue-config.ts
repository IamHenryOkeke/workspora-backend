export const queueConfig = {
  attempts: 3,
  backoff: { type: "exponential", delay: 5000 },
  delay: 10000,
};
