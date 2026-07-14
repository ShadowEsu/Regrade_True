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
  /** Connect button label; defaults to the generic connect action. */
  connectLabel?: string;
  /** Extra search terms beyond the display name. */
  keywords?: string[];
  /** Geographic market or audience. Searchable and visible on the result. */
  region?: string;
  /** Whether the vendor publishes an integration API usable by approved apps. */
  apiStatus?: 'live' | 'public_api' | 'partner_api' | 'file_import';
  /** Brand color used when a local logo asset is not available. */
  brandColor?: string;
  /** Short mark used as an accessible, offline-safe logo fallback. */
  brandMark?: string;
}

export type ConnectorReleaseStatus =
  | 'Live'
  | 'Needs live verification'
  | 'Manual import only'
  | 'School authorization required'
  | 'Vendor approval required'
  | 'Coming soon'
  | 'Unsupported';

/**
 * Product-release truth is deliberately separate from API availability.
 * A published API is not the same thing as a connector Regrade has verified
 * end to end with persisted production data.
 */
export function getConnectorReleaseStatus(meta: PlatformMeta): ConnectorReleaseStatus {
  if (meta.authMethod === 'manual_only' || meta.apiStatus === 'file_import') {
    return 'Manual import only';
  }
  if (meta.authMethod === 'oauth' || meta.authMethod === 'personal_access_token') {
    return 'Needs live verification';
  }
  if (meta.apiStatus === 'partner_api') return 'Vendor approval required';
  if (meta.authMethod === 'institution_gated') return 'School authorization required';
  return 'Unsupported';
}

/** Case-insensitive search over name, id, and keywords. */
export function filterPlatforms(query: string): PlatformMeta[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...PLATFORMS];
  return PLATFORMS.filter((p) =>
    [p.displayName, p.platformId, p.region ?? '', ...(p.keywords ?? [])].some((term) =>
      term.toLowerCase().includes(q)
    )
  );
}

/** Shown as examples above the search before the student types. */
export const POPULAR_PLATFORMS: readonly ConnectPlatformId[] = [
  'gradescope',
  'canvas',
  'google_classroom',
  'google_drive',
];

export const PLATFORM_LIBRARY: readonly PlatformMeta[] = [
  {
    platformId: 'gradescope',
    displayName: 'Gradescope',
    logo: '/platforms/gradescope.png',
    keywords: ['turnitin', 'exam', 'autograder'],
    authMethod: 'manual_only',
    region: 'Global', apiStatus: 'file_import',
    guideId: 'gradescope',
    blurb: CONNECT_STRINGS.gradescopeUnavailable,
    unavailableLabel: CONNECT_STRINGS.manualUploadAction,
  },
  {
    platformId: 'canvas',
    displayName: 'Canvas',
    keywords: ['instructure', 'speedgrader'],
    authMethod: 'personal_access_token',
    region: 'Global', apiStatus: 'live',
    logo: '/platforms/canvas-new.png',
    guideId: 'canvas',
    blurb:
      'Generate a personal access token in your own Canvas settings and Regrade reads your grades and feedback for you.',
  },
  {
    platformId: 'google_classroom',
    displayName: 'Google Classroom',
    keywords: ['google', 'gc'],
    authMethod: 'oauth',
    region: 'Global', apiStatus: 'live',
    logo: '/platforms/google-classroom.png',
    guideId: 'google_classroom',
    blurb: CONNECT_STRINGS.googlePortalBlurb,
    connectLabel: CONNECT_STRINGS.signInWithGoogle,
  },
  {
    platformId: 'google_drive',
    displayName: 'Google Drive',
    logo: '/platforms/google-drive.svg',
    keywords: ['google', 'gdrive', 'docs'],
    authMethod: 'oauth',
    region: 'Global', apiStatus: 'live',
    blurb: CONNECT_STRINGS.googlePortalBlurb,
    connectLabel: CONNECT_STRINGS.signInWithGoogle,
  },
  {
    platformId: 'onedrive',
    displayName: 'OneDrive',
    logo: '/platforms/onedrive.png',
    keywords: ['microsoft', 'office', 'sharepoint'],
    authMethod: 'oauth',
    region: 'Global', apiStatus: 'live',
    blurb: 'Read-only access to files you choose. Also the home for work you save from other platforms.',
  },
  {
    platformId: 'dropbox',
    displayName: 'Dropbox',
    logo: '/platforms/dropbox.svg',
    keywords: ['files', 'storage'],
    authMethod: 'oauth',
    region: 'Global', apiStatus: 'live',
    blurb: 'Read-only access to files you choose. Also the home for work you save from other platforms.',
  },
  {
    platformId: 'apple_files',
    displayName: 'Apple Files',
    logo: '/platforms/apple-files.png',
    keywords: ['icloud', 'ios', 'iphone', 'ipad'],
    authMethod: 'manual_only',
    region: 'Apple devices', apiStatus: 'file_import',
    blurb: CONNECT_STRINGS.appleFilesNote,
    unavailableLabel: CONNECT_STRINGS.manualUploadAction,
  },
  {
    platformId: 'blackboard',
    displayName: 'Blackboard',
    logo: '/platforms/blackboard.png',
    keywords: ['bb', 'learn', 'anthology'],
    authMethod: 'institution_gated',
    region: 'Global', apiStatus: 'public_api',
    guideId: 'blackboard',
    blurb: CONNECT_STRINGS.institutionGatedDetail,
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'moodle',
    displayName: 'Moodle',
    logo: '/platforms/moodle.png',
    keywords: ['lms', 'open source'],
    authMethod: 'institution_gated',
    region: 'Global', apiStatus: 'public_api',
    guideId: 'moodle',
    blurb: CONNECT_STRINGS.institutionGatedDetail,
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'brightspace',
    displayName: 'Brightspace (D2L)',
    keywords: ['d2l', 'desire2learn'],
    authMethod: 'institution_gated',
    region: 'Canada and global', apiStatus: 'public_api',
    logo: '/platforms/d2l.png',
    guideId: 'brightspace',
    blurb: CONNECT_STRINGS.institutionGatedDetail,
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'schoology',
    displayName: 'Schoology',
    logo: '/platforms/schoology.png',
    keywords: ['powerschool', 'k12'],
    authMethod: 'institution_gated',
    region: 'United States and global', apiStatus: 'partner_api',
    guideId: 'schoology',
    blurb: CONNECT_STRINGS.institutionGatedDetail,
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'powerschool',
    displayName: 'PowerSchool',
    logo: '/platforms/powerschool.png',
    keywords: ['gradebook', 'k12', 'sis'],
    authMethod: 'institution_gated',
    region: 'United States and global', apiStatus: 'partner_api',
    guideId: 'powerschool',
    blurb: CONNECT_STRINGS.institutionGatedDetail,
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'turnitin',
    displayName: 'Turnitin',
    logo: '/platforms/turnitin.png',
    keywords: ['plagiarism', 'feedback studio'],
    authMethod: 'institution_gated',
    region: 'Global', apiStatus: 'partner_api',
    guideId: 'turnitin',
    blurb: CONNECT_STRINGS.institutionGatedDetail,
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'teams_assignments',
    displayName: 'Microsoft Teams Assignments',
    logo: '/platforms/teams.png',
    keywords: ['microsoft', 'teams', 'edu', 'assignments'],
    authMethod: 'institution_gated',
    region: 'Global', apiStatus: 'public_api',
    blurb: CONNECT_STRINGS.institutionGatedDetail,
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'sakai', displayName: 'Sakai', authMethod: 'institution_gated',
    keywords: ['lms', 'university', 'lti', 'open source'], region: 'Global', apiStatus: 'public_api',
    brandColor: '#2B4D6F', brandMark: 'S',
    blurb: 'Sakai supports approved integrations through web services and LTI. Your university must register Regrade first.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'itslearning', displayName: 'itslearning', authMethod: 'institution_gated',
    keywords: ['lms', 'europe', 'norway', 'uk', 'oauth'], region: 'Europe and global', apiStatus: 'public_api',
    brandColor: '#6A2C91', brandMark: 'it',
    blurb: 'itslearning publishes an OAuth 2 API for assignments, courses and tasks. A site administrator must approve the app.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'managebac', displayName: 'ManageBac+', authMethod: 'institution_gated',
    keywords: ['ib', 'international baccalaureate', 'faria', 'international school'], region: 'International schools', apiStatus: 'public_api',
    brandColor: '#0D6E6E', brandMark: 'MB',
    blurb: 'ManageBac+ has a public API with read-only permissions. A school administrator creates and controls the API token.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'open_edx', displayName: 'Open edX', authMethod: 'institution_gated',
    keywords: ['edx', 'mooc', 'lms', 'university', 'oauth'], region: 'Global', apiStatus: 'public_api',
    brandColor: '#182B49', brandMark: 'edX',
    blurb: 'Open edX exposes OAuth and grade APIs, but each university or course operator controls application access.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'fedena', displayName: 'Fedena', authMethod: 'institution_gated',
    keywords: ['india', 'erp', 'sis', 'exam score', 'gradebook'], region: 'India and global', apiStatus: 'public_api',
    brandColor: '#E74C3C', brandMark: 'F',
    blurb: 'Fedena publishes APIs for exam groups and exam scores. The school must issue an API token for its own Fedena site.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'teachmint', displayName: 'Teachmint', authMethod: 'institution_gated',
    keywords: ['india', 'erp', 'classroom', 'school'], region: 'India', apiStatus: 'partner_api',
    brandColor: '#2563EB', brandMark: 'T',
    blurb: 'Teachmint provides authenticated partner APIs. Grade access depends on the school ERP plan and approved credentials.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'dingtalk', displayName: 'DingTalk', authMethod: 'institution_gated',
    keywords: ['china', 'alibaba', '钉钉', 'education', 'school'], region: 'China', apiStatus: 'partner_api',
    brandColor: '#1677FF', brandMark: 'D',
    blurb: 'DingTalk offers education APIs and organization authorization. A school administrator must approve Regrade.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'lark', displayName: 'Feishu / Lark', authMethod: 'institution_gated',
    keywords: ['china', 'feishu', '飞书', 'larksuite', 'documents'], region: 'China and Asia Pacific', apiStatus: 'public_api',
    brandColor: '#3370FF', brandMark: 'L',
    blurb: 'Feishu and Lark publish user OAuth and document APIs. School workspace approval and scoped access are required.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'wecom', displayName: 'WeCom', authMethod: 'institution_gated',
    keywords: ['china', 'wechat work', '企业微信', 'tencent'], region: 'China', apiStatus: 'partner_api',
    brandColor: '#2A7DE1', brandMark: 'W',
    blurb: 'WeCom supports approved third-party applications. Education records vary by the school app installed in its workspace.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'toddle', displayName: 'Toddle', authMethod: 'institution_gated',
    keywords: ['ib', 'international school', 'pyp', 'myp'], region: 'International schools', apiStatus: 'partner_api',
    brandColor: '#7C3AED', brandMark: 'T',
    blurb: 'Toddle integrations are arranged with the school. Regrade can still read exported reports and marked files today.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'edunext', displayName: 'Edunext', authMethod: 'institution_gated',
    keywords: ['india', 'erp', 'school', 'parent portal'], region: 'India', apiStatus: 'partner_api',
    brandColor: '#F97316', brandMark: 'E',
    blurb: 'Edunext is school-managed. A direct connection requires a participating school and approved integration access.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'vidyalaya', displayName: 'Vidyalaya', authMethod: 'institution_gated',
    keywords: ['india', 'erp', 'school management', 'marks'], region: 'India', apiStatus: 'partner_api',
    brandColor: '#15803D', brandMark: 'V',
    blurb: 'Vidyalaya integrations are provisioned by schools. Upload a report or marked exam while your school enables access.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'classter', displayName: 'Classter', authMethod: 'institution_gated',
    keywords: ['sis', 'europe', 'student information system', 'gradebook'], region: 'Europe and global', apiStatus: 'public_api',
    brandColor: '#0096D6', brandMark: 'C',
    blurb: 'Classter supports API integrations for institutions. Your school controls the tenant credentials and permissions.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'infinite_campus', displayName: 'Infinite Campus', authMethod: 'institution_gated',
    keywords: ['sis', 'k12', 'district', 'gradebook', 'usa'], region: 'United States', apiStatus: 'partner_api',
    brandColor: '#005596', brandMark: 'IC',
    blurb: 'Infinite Campus data access is district controlled. Regrade needs an approved district integration.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'skyward', displayName: 'Skyward', authMethod: 'institution_gated',
    keywords: ['sis', 'k12', 'family access', 'gradebook', 'usa'], region: 'United States', apiStatus: 'partner_api',
    brandColor: '#0073AA', brandMark: 'S',
    blurb: 'Skyward connections require district authorization. Family Access screenshots and exported reports work now.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'alma', displayName: 'Alma SIS', authMethod: 'institution_gated',
    keywords: ['sis', 'k12', 'gradebook'], region: 'United States and global', apiStatus: 'partner_api',
    brandColor: '#0E7490', brandMark: 'A',
    blurb: 'Alma offers institutional integrations. A school administrator must authorize access to student records.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'veracross', displayName: 'Veracross', authMethod: 'institution_gated',
    keywords: ['sis', 'private school', 'international school', 'gradebook'], region: 'Independent schools', apiStatus: 'partner_api',
    brandColor: '#1B365D', brandMark: 'V',
    blurb: 'Veracross integrations are school approved and tenant specific. Students can use manual import immediately.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'facts', displayName: 'FACTS SIS', authMethod: 'institution_gated',
    keywords: ['renweb', 'sis', 'private school', 'gradebook'], region: 'United States', apiStatus: 'partner_api',
    brandColor: '#005EB8', brandMark: 'F',
    blurb: 'FACTS data connections are controlled by each school. Regrade requires approved institutional access.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'clever', displayName: 'Clever', authMethod: 'institution_gated',
    keywords: ['sso', 'k12', 'district', 'oneroster'], region: 'United States', apiStatus: 'public_api',
    brandColor: '#4274F6', brandMark: 'C',
    blurb: 'Clever can authorize approved district applications. It supplies roster identity, while grades still come from the linked LMS.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'classlink', displayName: 'ClassLink', authMethod: 'institution_gated',
    keywords: ['sso', 'k12', 'district', 'oneroster'], region: 'United States and global', apiStatus: 'public_api',
    brandColor: '#ED1C24', brandMark: 'CL',
    blurb: 'ClassLink supports approved apps and OneRoster data. A district administrator must enable Regrade.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'google_workspace', displayName: 'Google Workspace for Education', authMethod: 'institution_gated',
    keywords: ['google admin', 'workspace', 'school drive', 'docs'], region: 'Global', apiStatus: 'public_api',
    brandColor: '#4285F4', brandMark: 'G',
    blurb: 'Workspace administrators can approve broader school integrations. Individual Drive and Classroom connections remain available above.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'sharepoint', displayName: 'SharePoint', authMethod: 'institution_gated',
    keywords: ['microsoft', 'office 365', 'school files'], region: 'Global', apiStatus: 'public_api',
    brandColor: '#038387', brandMark: 'S',
    blurb: 'School SharePoint sites use Microsoft Graph and tenant consent. Personal OneDrive connection remains available above.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'box', displayName: 'Box', authMethod: 'institution_gated',
    keywords: ['files', 'cloud storage', 'university'], region: 'Global', apiStatus: 'public_api',
    brandColor: '#0061D5', brandMark: 'box',
    blurb: 'Box supports OAuth, but education enterprise tenants may require administrator approval before Regrade can read selected files.',
    unavailableLabel: CONNECT_STRINGS.institutionGated,
  },
  {
    platformId: 'email_import', displayName: 'Email attachment', authMethod: 'manual_only',
    keywords: ['gmail', 'outlook', 'mail', 'attachment', 'pdf'], region: 'Global', apiStatus: 'file_import',
    brandColor: '#64748B', brandMark: '@',
    blurb: 'Download the teacher email attachment, then upload it to Regrade. Your inbox never needs to be connected.',
    unavailableLabel: CONNECT_STRINGS.manualUploadAction,
  },
] as const;

/** Backward-compatible name used by connector construction. */
export const PLATFORMS = PLATFORM_LIBRARY;

export function getPlatformMeta(id: ConnectPlatformId): PlatformMeta {
  const meta = PLATFORMS.find((p) => p.platformId === id);
  if (!meta) throw new Error(`Unknown platform: ${id}`);
  return meta;
}
