import { VCardData } from "../types/qrTypes";

/**
 * Generates a vCard (Virtual Contact File) string from profile data
 * vCard format is widely supported by contact apps and QR code scanners
 */
export function generateVCard(profileData: VCardData): string {
  const lines: string[] = [];

  // vCard header
  lines.push("BEGIN:VCARD");
  lines.push("VERSION:3.0");

  // Full name (required)
  if (profileData.fullName) {
    lines.push(`FN:${escapeVCardValue(profileData.fullName)}`);
    // Split name for structured name
    const nameParts = profileData.fullName.split(" ");
    if (nameParts.length > 1) {
      lines.push(`N:${escapeVCardValue(nameParts.slice(1).join(" "))};${escapeVCardValue(nameParts[0])};;;`);
    } else {
      lines.push(`N:;${escapeVCardValue(profileData.fullName)};;;`);
    }
  }

  // Phone (required)
  if (profileData.phone) {
    lines.push(`TEL;TYPE=CELL:${escapeVCardValue(profileData.phone)}`);
  }

  // Email (required)
  if (profileData.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(profileData.email)}`);
  }

  // Organization/Company
  if (profileData.company) {
    lines.push(`ORG:${escapeVCardValue(profileData.company)}`);
  }

  // Job Title
  if (profileData.jobTitle) {
    lines.push(`TITLE:${escapeVCardValue(profileData.jobTitle)}`);
  }

  // Website
  if (profileData.website) {
    const url = profileData.website.startsWith("http") 
      ? profileData.website 
      : `https://${profileData.website}`;
    lines.push(`URL:${escapeVCardValue(url)}`);
  }

  // Profile Picture
  if (profileData.profilePicture) {
    lines.push(`PHOTO;TYPE=URL:${escapeVCardValue(profileData.profilePicture)}`);
  }

  // Bio/Note
  if (profileData.bio) {
    lines.push(`NOTE:${escapeVCardValue(profileData.bio)}`);
  }

  // Social Media Links (as custom fields)
  if (profileData.linkedin) {
    const linkedinUrl = profileData.linkedin.startsWith("http")
      ? profileData.linkedin
      : `https://linkedin.com/in/${profileData.linkedin}`;
    lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${escapeVCardValue(linkedinUrl)}`);
  }

  if (profileData.twitter) {
    const twitterHandle = profileData.twitter.startsWith("@")
      ? profileData.twitter.slice(1)
      : profileData.twitter;
    const twitterUrl = profileData.twitter.startsWith("http")
      ? profileData.twitter
      : `https://twitter.com/${twitterHandle}`;
    lines.push(`X-SOCIALPROFILE;TYPE=twitter:${escapeVCardValue(twitterUrl)}`);
  }

  if (profileData.instagram) {
    const instagramHandle = profileData.instagram.startsWith("@")
      ? profileData.instagram.slice(1)
      : profileData.instagram;
    const instagramUrl = profileData.instagram.startsWith("http")
      ? profileData.instagram
      : `https://instagram.com/${instagramHandle}`;
    lines.push(`X-SOCIALPROFILE;TYPE=instagram:${escapeVCardValue(instagramUrl)}`);
  }

  if (profileData.facebook) {
    const facebookUrl = profileData.facebook.startsWith("http")
      ? profileData.facebook
      : `https://facebook.com/${profileData.facebook}`;
    lines.push(`X-SOCIALPROFILE;TYPE=facebook:${escapeVCardValue(facebookUrl)}`);
  }

  // vCard footer
  lines.push("END:VCARD");

  return lines.join("\n");
}

/**
 * Escapes special characters in vCard values
 */
function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

