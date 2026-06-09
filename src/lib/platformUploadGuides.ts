/** Step-by-step: how to export graded work from each LMS (for UploadGuidePanel). */

export type PlatformGuideId =
  | 'gradescope'
  | 'canvas'
  | 'google_classroom'
  | 'brightspace'
  | 'moodle'
  | 'blackboard'
  | 'turnitin'
  | 'schoology'
  | 'powerschool'
  | 'sakai'
  | 'paper';

export type PlatformUploadGuide = {
  id: PlatformGuideId;
  name: string;
  logo?: string;
  color?: string;
  /** Official login or home page — opens in a new tab */
  appUrl?: string;
  short: string;
  fileLabel: string;
  /** Where teacher marks & comments usually appear */
  whereToLook: string;
  steps: string[];
  mustInclude: string[];
  avoid: string;
  tip?: string;
};

/** Extra platforms shown on marketing tiles (Instructure family, etc.) */
export const PLATFORM_APP_LINKS: Record<string, string> = {
  canvas: 'https://canvas.instructure.com/login',
  instructure: 'https://www.instructure.com/',
  impact: 'https://www.instructure.com/products/impact/',
  mastery: 'https://www.instructure.com/products/mastery/',
  d2l: 'https://login.brightspace.com/',
  classroom: 'https://classroom.google.com/',
  gradescope: 'https://www.gradescope.com/login',
  google_classroom: 'https://classroom.google.com/',
  brightspace: 'https://login.brightspace.com/',
  moodle: 'https://moodle.com/login/',
  blackboard: 'https://www.blackboard.com/',
  turnitin: 'https://www.turnitin.com/login_page.asp',
  schoology: 'https://app.schoology.com/login',
  powerschool: 'https://login.powerschool.com/',
  sakai: 'https://www.sakailms.org/',
};

export const PLATFORM_UPLOAD_GUIDES: PlatformUploadGuide[] = [
  {
    id: 'gradescope',
    name: 'Gradescope',
    color: '#0095D9',
    appUrl: PLATFORM_APP_LINKS.gradescope,
    short: 'Graded Copy PDF',
    fileLabel: 'Download Graded Copy',
    whereToLook: 'Blue comment bubbles on your PDF + rubric panel on the right.',
    steps: [
      'Log in → open the course → open the graded assignment (score + questions visible).',
      'Scroll to the bottom of the submission view.',
      'Click Download Graded Copy — not Download Original. The graded PDF includes marks, rubric rows, and instructor bubbles.',
      'Save the file, then upload it here (or drag into the box below).',
    ],
    mustInclude: ['Per-question scores', 'Rubric checkboxes', 'Instructor comment bubbles'],
    avoid: 'Original ungraded submission or assignment list without opening feedback',
    tip: 'Gradescope help docs: the Graded Copy bundles feedback your instructor left on the PDF.',
  },
  {
    id: 'canvas',
    name: 'Canvas',
    logo: '/platforms/canvas.png',
    appUrl: PLATFORM_APP_LINKS.canvas,
    short: 'SpeedGrader export',
    fileLabel: 'Annotated PDF or SpeedGrader screenshot',
    whereToLook: 'SpeedGrader pins on your file + rubric grid on the right + assessment comment box.',
    steps: [
      'Grades → your course → open the assignment → click your submission.',
      'Open SpeedGrader (or View Feedback) so comment pins and the rubric panel are visible.',
      'If offered: download the annotated/marked PDF from the submission toolbar.',
      'If no download: use Print → Save as PDF or take a full-page screenshot that shows score, rubric, and every comment pin.',
    ],
    mustInclude: ['Assignment score', 'Rubric criteria rows', 'Comment pins or assessment notes'],
    avoid: 'Assignment page with feedback collapsed or grade column only',
    tip: 'Canvas Community: annotated submissions export from SpeedGrader when your school enables it.',
  },
  {
    id: 'google_classroom',
    name: 'Classroom',
    logo: '/platforms/google-classroom.png',
    appUrl: PLATFORM_APP_LINKS.google_classroom,
    short: 'Returned work',
    fileLabel: 'Commented Doc or PDF',
    whereToLook: 'Margin comment chips in the returned Doc/Slide + grade on the assignment card.',
    steps: [
      'Classwork → open the assignment → open your turned-in work marked Returned.',
      'Open the file in Google Drive — read margin comment chips and any rubric score shown.',
      'File → Download → PDF (.pdf), or screenshot the graded view with the score visible.',
      'Upload that PDF or photo here.',
    ],
    mustInclude: ['Teacher comment chips', 'Grade if shown', 'Returned document with marks'],
    avoid: 'Unreturned draft or class stream without opening your submission',
    tip: 'Google Classroom help: comments appear on returned Docs/Slides; export to PDF before uploading.',
  },
  {
    id: 'brightspace',
    name: 'D2L Brightspace',
    logo: '/platforms/d2l.png',
    appUrl: PLATFORM_APP_LINKS.brightspace,
    short: 'Evaluation / Feedback view',
    fileLabel: 'Feedback PDF or screenshot',
    whereToLook: 'Assignments → Feedback / Evaluation panel with rubric grid and instructor text.',
    steps: [
      'Assignments → open your submission → Feedback or Evaluation.',
      'Download any annotated file your instructor attached, or expand the rubric assessment grid.',
      'If feedback is only on screen: Print → PDF or screenshot the full feedback page.',
      'Make sure score, rubric levels, and written feedback are all in frame.',
    ],
    mustInclude: ['Score', 'Feedback text', 'Rubric assessment grid'],
    avoid: 'Submission list without opening the feedback view',
    tip: 'D2L Brightspace docs: Evaluation shows rubric levels and feedback on the same page.',
  },
  {
    id: 'moodle',
    name: 'Moodle',
    color: '#F98012',
    appUrl: PLATFORM_APP_LINKS.moodle,
    short: 'Feedback PDF',
    fileLabel: 'Annotated return file',
    whereToLook: 'Assignment → Feedback tab + advanced grading rubric table.',
    steps: [
      'Open the course → Assignment → your submission → Feedback.',
      'Download any annotated PDF your teacher returned in the feedback files area.',
      'If feedback is inline only: screenshot or Print → PDF the page showing grade + comments + rubric.',
      'Upload the PDF or clear photos of every marked page.',
    ],
    mustInclude: ['Grade', 'Feedback comments', 'Rubric table if shown'],
    avoid: 'Submission file with no feedback section opened',
    tip: 'Moodle docs: teachers attach marked PDFs in Feedback; rubric appears under Advanced grading.',
  },
  {
    id: 'blackboard',
    name: 'Blackboard',
    color: '#262626',
    appUrl: PLATFORM_APP_LINKS.blackboard,
    short: 'Graded attempt',
    fileLabel: 'Feedback view / annotated PDF',
    whereToLook: 'My Grades → attempt view with inline grading bubbles + rubric scorecard.',
    steps: [
      'My Grades (or Gradebook) → open the item → View attempt or View feedback.',
      'Download the returned annotated file if one is attached.',
      'If marks are inline on screen: Print → PDF or screenshot the grading view with points and comments.',
      'Include the rubric scorecard if your course uses one.',
    ],
    mustInclude: ['Points earned', 'Instructor comments', 'Rubric if visible'],
    avoid: 'Grade column only with no feedback detail expanded',
    tip: 'Blackboard Learn Ultra: inline grading bubbles and rubric appear in the submission viewer.',
  },
  {
    id: 'turnitin',
    name: 'Turnitin',
    color: '#0055A4',
    appUrl: PLATFORM_APP_LINKS.turnitin,
    short: 'Feedback Studio',
    fileLabel: 'Marked download / PDF',
    whereToLook: 'QuickMark symbols with pop-up text + rubric scorecard on the right.',
    steps: [
      'Open your submission in Turnitin Feedback Studio from the course link.',
      'Show QuickMarks and the rubric scorecard (hide similarity layer if you only need grade marks).',
      'Download or print the marked version with instructor comments if your school allows export.',
      'Upload that PDF or a screenshot showing marks and rubric scores — not similarity % alone.',
    ],
    mustInclude: ['QuickMark comments', 'Rubric scores', 'Summary instructor feedback'],
    avoid: 'Similarity report only with no instructor QuickMarks',
    tip: 'Turnitin instructor guides: QuickMarks and rubric scores are the appeal evidence, not the similarity score.',
  },
  {
    id: 'schoology',
    name: 'Schoology',
    color: '#47BBD1',
    appUrl: PLATFORM_APP_LINKS.schoology,
    short: 'Materials / Grades',
    fileLabel: 'Graded submission PDF',
    whereToLook: 'Assignment grade view with rubric checklist + teacher feedback text.',
    steps: [
      'Materials or Grades → open the assignment → your submission.',
      'Open the graded view so rubric checklist and teacher feedback text are visible.',
      'Download any returned file, or screenshot/Print → PDF the feedback screen.',
      'Upload PDF or photos with score and comments readable.',
    ],
    mustInclude: ['Rubric checklist marks', 'Teacher feedback text', 'Points earned'],
    avoid: 'Materials list without opening the graded submission',
    tip: 'PowerSchool Schoology: rubric and comments show in the assignment grading panel.',
  },
  {
    id: 'powerschool',
    name: 'PowerSchool',
    color: '#0066B3',
    appUrl: PLATFORM_APP_LINKS.powerschool,
    short: 'Unified Classroom / LMS',
    fileLabel: 'Graded assignment export',
    whereToLook: 'Schoology Learning or PowerSchool assignment feedback (many districts use Schoology under PowerSchool).',
    steps: [
      'Open your district portal → find the graded assignment (often Schoology Learning inside PowerSchool).',
      'Open the submission feedback view with score and teacher comments expanded.',
      'Save annotated attachments or Print → PDF the feedback page.',
      'If your school only shows a PDF grade report, upload that — Regrade reads scores and comments on the page.',
    ],
    mustInclude: ['Assignment score', 'Teacher feedback', 'Rubric rows if present'],
    avoid: 'Parent/student portal home screen without opening the graded item',
    tip: 'PowerSchool serves 55M+ students; many use Schoology Learning — same export steps apply.',
  },
  {
    id: 'sakai',
    name: 'Sakai',
    color: '#6B4C9A',
    appUrl: PLATFORM_APP_LINKS.sakai,
    short: 'Gradebook / Assignment',
    fileLabel: 'Feedback PDF or screenshot',
    whereToLook: 'Assignment submission feedback + gradebook comments.',
    steps: [
      'Open the course → Assignments → your submission → Feedback.',
      'Download instructor-returned files or open inline feedback comments.',
      'Gradebook → open the item to see score and instructor comments if not on the submission.',
      'Print → PDF or screenshot anything not downloadable, then upload here.',
    ],
    mustInclude: ['Score', 'Instructor feedback text', 'Rubric if course uses one'],
    avoid: 'Assignment list without opening feedback',
    tip: 'Sakai is open-source; your school may label tools differently — look for Feedback or Grade Report.',
  },
  {
    id: 'paper',
    name: 'Marked paper',
    color: '#1d1d1f',
    short: 'Photo or scan',
    fileLabel: 'Clear photos of marked pages',
    whereToLook: 'Teacher ink, circled scores, margin notes on every appealed page.',
    steps: [
      'Lay each marked page flat in good light — include every page with deductions.',
      'Capture the total score and per-question marks if written.',
      'Upload 1–3 sharp photos per page (or scan to PDF). Note unclear handwriting in optional notes below.',
    ],
    mustInclude: ['Teacher ink marks', 'Circled scores', 'Margin comments'],
    avoid: 'Blurry, cropped, or shadowed photos',
    tip: 'Works for any class — no LMS account linking needed.',
  },
];

export const PLATFORM_GUIDE_MAP = Object.fromEntries(
  PLATFORM_UPLOAD_GUIDES.map((g) => [g.id, g]),
) as Record<PlatformGuideId, PlatformUploadGuide>;
