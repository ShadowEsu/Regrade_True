/**
 * All user-facing copy for the Connect feature.
 * Voice laws: no em or en dashes, short sentences, plain words, honest about
 * what the AI and the integrations can and cannot do. Never scold.
 */

export const CONNECT_STRINGS = {
  screenTitle: 'Connect your platforms',
  screenSubtitle:
    'Link the places your grades live, and Regrade can pull graded work for you. Uploading a photo or PDF always works too, for every platform.',
  manualUploadAction: 'Upload manually',
  manualAlwaysWorks: 'Manual upload always works for this platform.',
  connectAction: 'Connect',
  connectedBadge: 'Connected',
  simulatedBadge: 'Demo connection',
  disconnectAction: 'Disconnect',
  disconnectConfirm:
    'Disconnecting deletes the saved credential right away. You can reconnect any time, and manual upload keeps working.',
  connectedSectionTitle: 'Your connections',
  connectedSectionEmpty:
    'Nothing connected yet. That is completely fine, manual upload covers everything.',

  gradescopeUnavailable:
    "Automatic connection for Gradescope isn't available yet. Upload your graded copy instead, it works just as well.",
  appleFilesNote:
    'Apple Files is a document source, not a connected account. Pick files from iCloud Drive or your device when you upload.',
  institutionGated: 'Ask your school to enable Regrade',
  institutionGatedDetail:
    'This platform only opens its data to tools your school approves. Until then, upload your graded work manually, it takes about a minute.',
  setupOnTheWay:
    'Connection setup for this platform is on the way. Manual upload works today.',

  oauthGenericError: "Something glitched during sign in. Let's try that again.",
  oauthCancelled: 'No problem. Nothing was connected.',
  savedSecurely: 'Connected. Your credential is stored encrypted.',
  saveFailed:
    "We couldn't save this connection securely, so we didn't save it at all. Manual upload still works.",

  canvasDialogTitle: 'Connect Canvas',
  canvasIntro:
    'Canvas lets you create a personal access token in your own account. Regrade uses it to read your grades and feedback, nothing else.',
  canvasStep1: 'Open Canvas in your browser and sign in.',
  canvasStep2: 'Go to Account, then Settings.',
  canvasStep3: 'Scroll to Approved Integrations and choose New Access Token.',
  canvasStep4: 'Name it Regrade, leave the expiry blank or pick a date, then copy the token.',
  canvasUrlLabel: 'Your school Canvas address',
  canvasUrlPlaceholder: 'https://yourschool.instructure.com',
  canvasUrlInvalid:
    'That address does not look like a Canvas site. It should start with https and be your school domain.',
  canvasTokenLabel: 'Paste your access token',
  canvasTokenInvalid: 'That token looks too short. Copy the whole thing and try again.',
  canvasVerifying: 'Checking with Canvas',
  canvasVerifyFailed:
    "Canvas didn't accept that token. Tokens are long, so a missed character is common. Copy it fresh and try once more.",
  canvasSaveAction: 'Connect Canvas',
  canvasCancelAction: 'Not now',

  previewSimulatedNote:
    'Preview mode: this connection is simulated so you can see the flow. No real account was touched.',
} as const;

export type ConnectStringKey = keyof typeof CONNECT_STRINGS;
