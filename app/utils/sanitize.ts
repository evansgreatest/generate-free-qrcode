import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [], // No HTML tags allowed by default
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true, // Keep text content but strip tags
  });
}

/**
 * Sanitize text content (removes HTML tags)
 */
export function sanitizeText(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }
  
  // Remove HTML tags
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize URL to prevent XSS and malicious redirects
 */
export function sanitizeURL(url: string): string | null {
  if (typeof url !== 'string' || !url.trim()) {
    return null;
  }
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
  
    return parsed.toString();
  } catch {
    // If URL parsing fails, try to construct a safe URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        return new URL(url).toString();
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') {
    return null;
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmed = email.trim().toLowerCase();
  
  if (!emailRegex.test(trimmed)) {
    return null;
  }
  
  // Additional length check
  if (trimmed.length > 255) {
    return null;
  }
  
  return trimmed;
}

/**
 * Sanitize phone number (basic validation)
 */
export function sanitizePhone(phone: string): string | null {
  if (typeof phone !== 'string') {
    return null;
  }
  
  // Remove common phone number characters, keep only digits and +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Basic validation: should start with + and have reasonable length
  if (!cleaned.startsWith('+') || cleaned.length < 8 || cleaned.length > 20) {
    return null;
  }
  
  return cleaned;
}

/**
 * Sanitize profile data object
 */
export function sanitizeProfileData(data: {
  fullName?: string;
  phone?: string;
  email?: string;
  company?: string;
  jobTitle?: string;
  website?: string;
  bio?: string;
  profilePicture?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
}): typeof data {
  const sanitized: typeof data = {};
  
  if (data.fullName) {
    sanitized.fullName = sanitizeText(data.fullName).slice(0, 100);
  }
  
  if (data.phone) {
    sanitized.phone = sanitizePhone(data.phone) || undefined;
  }
  
  if (data.email) {
    sanitized.email = sanitizeEmail(data.email) || undefined;
  }
  
  if (data.company) {
    sanitized.company = sanitizeText(data.company).slice(0, 100);
  }
  
  if (data.jobTitle) {
    sanitized.jobTitle = sanitizeText(data.jobTitle).slice(0, 100);
  }
  
  if (data.website) {
    sanitized.website = sanitizeURL(data.website) || undefined;
  }
  
  if (data.bio) {
    sanitized.bio = sanitizeText(data.bio).slice(0, 1000);
  }
  
  if (data.profilePicture) {
    sanitized.profilePicture = sanitizeURL(data.profilePicture) || undefined;
  }
  
  if (data.linkedin) {
    sanitized.linkedin = sanitizeURL(data.linkedin) || sanitizeText(data.linkedin).slice(0, 200);
  }
  
  if (data.twitter) {
    sanitized.twitter = sanitizeURL(data.twitter) || sanitizeText(data.twitter).slice(0, 200);
  }
  
  if (data.instagram) {
    sanitized.instagram = sanitizeURL(data.instagram) || sanitizeText(data.instagram).slice(0, 200);
  }
  
  if (data.facebook) {
    sanitized.facebook = sanitizeURL(data.facebook) || sanitizeText(data.facebook).slice(0, 200);
  }
  
  return sanitized;
}

