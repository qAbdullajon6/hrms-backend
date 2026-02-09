/**
 * Returns URL to use for avatar. If avatarUrl is already absolute (http/https), return as-is; otherwise prepend baseUrl.
 * @param {string} baseUrl - Base URL (e.g. from req or config)
 * @param {string|null|undefined} avatarUrl - Stored value (relative path or full URL)
 * @returns {string|null}
 */
function resolveAvatarUrl(baseUrl, avatarUrl) {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) return avatarUrl;
  return baseUrl ? `${baseUrl.replace(/\/$/, "")}${avatarUrl.startsWith("/") ? "" : "/"}${avatarUrl}` : avatarUrl;
}

module.exports = { resolveAvatarUrl };
