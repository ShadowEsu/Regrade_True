import type { AuthMethod, ConnectPlatformId } from './types';
import { CONNECT_STRINGS } from './strings';
import type { PlatformGuideId } from '../../lib/platformUploadGuides';

/**
 * Declarative platform table, in product priority order.
 * authMethod reflects what each platform genuinely offers a student today:
 * - Gradescope has no public student-facing API, so it is manual_only.
 * - Canvas exposes personal access tokens from the student's own settings.
 * - Google Classroom, Drive, OneDrive and Dropbox have real consumer OAuth.
 * - Apple Files is the iOS file picker, a document source, not an account.
 * - The rest are institution or district controlled and stay unavailable
 *   until a school partnership exists.
 */
export interface PlatformMeta {
  platformId: ConnectPlatformId;
  displayName: string;
  authMethod: AuthMethod;
  logo?: string;
  /** Matching manual-upload guide in src/lib/platformUploadGuides.ts. */
  guideId?: PlatformGuideId;
  /** One honest sentence under the card title. */
  blurb: string;
  /** Shown instead of a connect button when the flow cannot complete. */
  unavailableLabel?: string;
}

export const PLATFORMS: readonly PlatformMeta[] = [
  {
    platformId: 'gradescope',
    displayName: 'Gradescope',
    authMethod: 'manual_only',
    guideId: 'gradescope',
    blurb: CONNECT_STRINGS.gradescopeUnavailable,
    unavailableLabel: CONNECT_STRINGS.manualUploadAction,
  },
  {
    platformId: 'canvas',
    displayName: 'Canvas',
    authMethod: 'personal_access_token',
    logo: '/platforms/canvas.png',
    guideId: 'canvas',
    blurb:
      'Generate a personal access token in your own Canvas settings and Regrade reads your grades and feedback for you.',
  },
  {
    platformId: 'google_classroom',
    displayName: 'Google Classroom',
    authMethod: 'oauth',
    logo: '/platforms/google-classroom.png',
    guideId: 'google_classroom',
    blurb: 'Sign in with Google and grant read-only access to your Classroom work.',
  },
  {
    platformId: 'google_drive',
    displayName: 'Google Drive',
    authMethod: 'oauth',
    blurb: 'Read-only access to files you choose. Also the home for work you save from other platforms.',
  },
  {
    platformId: 'onedrive',
    displayName: 'OneDrive',
    authMethod: 'oauth',
    blurb: 'Read-only access to files you choose. Also the home for work you save from other platforms.',
  },
  {
    platformId: 'dropbox',
    displayName: 'Dropbox',
    authMethod: 'oauth',
    blurb: 'Read-only access to files you choose. Also the home for work you save from other platforms.',
  },
  {
    platformId: 'apple_files',
    displayName: 'Apple Files',
    authMethod: 'manual_only',
    blurb: CONNECT_STRINGS.appleFilesNote,
    unavailableLabel: CONNECT_STRINGS.manualUploadAction,
  },
  {
    platformId: 'blackboard',
    displayName: 'Blackboard',
    authMethod: 'institution_gated',
    guideId: 'blackboard',
    blurb: CONNECT_STRINGS.institutionGatedDetail,
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'moodle',
    displayName: 'Moodle',
    authMethod: 'institution_gated',
    guideId: 'moodle',
    blurb: CONNECT_STRINGS.institutionGatedDetail,
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'brightspace',
    displayName: 'Brightspace (D2L)',
    authMethod: 'institution_gated',
    logo: '/platforms/d2l.png',
    guideId: 'brightspace',
    blurb: CONNECT_STRINGS.institutionGatedDetail,
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'schoology',
    displayName: 'Schoology',
    authMethod: 'institution_gated',
    guideId: 'schoology',
    blurb: CONNECT_STRINGS.institutionGatedDetail,
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'powerschool',
    displayName: 'PowerSchool',
    authMethod: 'institution_gated',
    guideId: 'powerschool',
    blurb: CONNECT_STRINGS.institutionGatedDetail,
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'turnitin',
    displayName: 'Turnitin',
    authMethod: 'institution_gated',
    guideId: 'turnitin',
    blurb: CONNECT_STRINGS.institutionGatedDetail,
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'teams_assignments',
    displayName: 'Microsoft Teams Assignments',
    authMethod: 'institution_gated',
    blurb: CONNECT_STRINGS.institutionGatedDetail,
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
] as const;

export function getPlatformMeta(id: ConnectPlatformId): PlatformMeta {
  const meta = PLATFORMS.find((p) => p.platformId === id);
  if (!meta) throw new Error(`Unknown platform: ${id}`);
  return meta;
}
