import {
  PLATFORM_UPLOAD_GUIDES,
  type PlatformGuideId,
} from './platformUploadGuides';
import type { UserProfile } from '../services/userService';

export function getPlatformGuideName(id: PlatformGuideId | undefined): string | null {
  if (!id) return null;
  return PLATFORM_UPLOAD_GUIDES.find((p) => p.id === id)?.name ?? null;
}

export function isValidPlatformGuideId(id: string | undefined): id is PlatformGuideId {
  if (!id) return false;
  return PLATFORM_UPLOAD_GUIDES.some((p) => p.id === id);
}

/** Context block prepended to appeal analysis so the AI knows who the student is. */
export function buildStudentProfileContext(
  profile: Partial<UserProfile> | null | undefined,
  appealPlatformId?: PlatformGuideId,
): string {
  if (!profile) return '';

  const lines: string[] = [];
  if (profile.name) lines.push(`Name: ${profile.name}`);
  if (profile.school) lines.push(`School: ${profile.school}`);
  if (profile.university) lines.push(`University: ${profile.university}`);
  if (profile.major) lines.push(`Major: ${profile.major}`);
  if (profile.gradeLevel) lines.push(`Year / grade: ${profile.gradeLevel}`);
  if (profile.gpa) lines.push(`GPA / grade average: ${profile.gpa}`);
  if (profile.appealGoal) lines.push(`What they want from appeals: ${profile.appealGoal}`);

  const platformName = getPlatformGuideName(appealPlatformId ?? profile.preferredPlatform);
  if (platformName) {
    const fromProfile =
      appealPlatformId && profile.preferredPlatform && appealPlatformId === profile.preferredPlatform;
    lines.push(
      `LMS for this appeal: ${platformName}${fromProfile ? ' (student default from profile)' : ' (chosen for this appeal)'}`,
    );
  }

  if (lines.length === 0) return '';
  return `--- Student profile ---\n${lines.join('\n')}`;
}
