module.exports = {
  ALLOWED_LINKS: ["Flipkart", "Amazon"],
  REQUIRED_KEYS: ["title", "pricing", "imageUrl", "webUrl", "availability"],
  MAX_TRACKINGS: 10,
  SKIP_MAX_TRACKING_USERS: ["mukulshakya"],
  URL_REGEX: {
    flipkart: /http(s)?:\/\/((w){3}|(dl))?[.]?flipkart.com\/[^\s]+/i,
    amazon: /http(s)?:\/\/((w){3}|(dl))?[.]?amazon.in\/[^\s]+/i,
  },
};
