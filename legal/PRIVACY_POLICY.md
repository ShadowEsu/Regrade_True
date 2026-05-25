# Regrade — Privacy Policy

**Effective date:** May 14, 2026
**Last updated:** May 14, 2026

This Privacy Policy explains how Preston Jay Susanto ("we", "us", "Regrade")
collects, uses, shares, and protects information when you use the Regrade
mobile application and the Regrade web application (collectively, the
"Service"). By using the Service you agree to this Policy. If you do not
agree, do not use the Service.

> **Contact:** _<TODO: insert public support / privacy contact email here.
> This address appears in the App Store, Google Play, and inside the app.>_
> Mailing address available on written request.

---

## 1. Who we are and the role we play

Regrade is operated by Preston Jay Susanto, an individual developer. For the
purposes of the EU/UK General Data Protection Regulation, the California
Consumer Privacy Act, and similar laws, Preston Jay Susanto is the
**data controller** of personal information described in this Policy.

We process some information on behalf of you, the user, when you upload
graded coursework. In that limited capacity we act as a **processor** of
content that you provide.

## 2. Information we collect

We try to collect the minimum information needed to operate the Service.
The categories below describe everything we collect.

### 2.1 Information you provide

- **Account information.** When you sign in, we receive from Firebase
  Authentication: your email address; your display name (if any); your
  Google profile photo URL (if you sign in with Google); a Firebase user ID
  (UID); whether your email is verified.
- **Profile information.** Optional fields you enter inside the app, such
  as your name, your major, and (legacy users only) a self-reported student
  identifier. You can edit or remove these at any time inside the app.
- **Uploaded coursework.** PDF files, image files, screenshots, and any
  written notes that you choose to attach when starting a grade appeal.
  These may contain personal information about you, your instructor, your
  classmates, and your institution. **Do not upload material you do not
  have permission to share.**
- **Appeal drafts and case notes.** Text generated inside the Service
  during the appeal flow, including drafts you save.
- **Support correspondence.** If you email us, we receive your email
  address, the contents of your message, and any attachments.

### 2.2 Information collected automatically

- **Device and usage telemetry.** Operating system, OS version, app
  version, language, time zone, approximate IP-based geolocation
  (country/region), crash reports, and basic event analytics (e.g. "appeal
  flow started", "upload succeeded"). We do **not** use third-party
  advertising SDKs and we do not assign an advertising identifier.
- **Security telemetry.** Request fingerprints, rate-limit counters, and
  anti-abuse signals (including content-safety scans on uploaded text)
  used to detect prompt-injection attempts, automated abuse, and content
  that could compromise the Service.

### 2.3 Information from third parties

- **Sign-in providers.** When you sign in with Google, Google sends us the
  basic profile fields listed in §2.1 under "Account information". We do
  not receive your Google password.

## 3. How we use information

We use the information described in §2 to:

- create, secure, and operate your account;
- analyze the graded coursework you upload and produce an appeal analysis
  and a draft appeal letter for you;
- save your appeal cases so you can revisit them later;
- detect, investigate, and prevent fraud, abuse, prompt injection,
  scraping, and security incidents;
- comply with legal obligations and respond to lawful requests;
- improve the Service (debug crashes, fix bugs, design better features).

We do **not** sell personal information. We do not "share" personal
information for cross-context behavioral advertising as those terms are
defined in the California Consumer Privacy Act. We do not run third-party
advertising in the app.

## 4. Legal bases (EU / UK users)

Where the General Data Protection Regulation applies, we rely on the
following legal bases:

- **Contract** — to provide the Service you signed up for (§3 bullet 1–3).
- **Legitimate interests** — to keep the Service secure, prevent abuse,
  and improve quality (§3 bullets 4 and 6). You can object at any time;
  see §10.
- **Legal obligation** — to comply with the law (§3 bullet 5).
- **Consent** — for any optional feature that asks for it explicitly. You
  can withdraw consent at any time.

## 5. AI processing of your uploads

To produce the analysis and draft appeal letter, your uploaded files,
extracted text, and any notes you add are sent over an encrypted connection
to a Regrade-operated backend, which then calls one or both of the
following third-party AI providers depending on the **AI Engine** you
select inside the app (Profile → AI Engine):

- **Google LLC — Gemini API.** Used in "Hybrid" and "Gemini only" modes.
  Google processes the content as a "Customer" of its API on our behalf
  under the Google Gen AI SDK terms.
- **Anthropic PBC — Claude API.** Used in "Hybrid" and "Claude only" modes.
  Anthropic processes the content as our service provider under the
  Anthropic API Services Terms and the standard Anthropic data-processing
  addendum.

When you first start an analysis, the app asks you to choose an engine and
records that choice as your explicit consent to send the upload to the
selected providers. You can change the engine at any time in
**Profile → AI Engine**.

- We instruct both providers not to use your content to train their
  general models. This relies on each provider honoring the published API
  terms in effect at the time of processing. As of the date of this
  Policy, Anthropic's default API retention is up to 30 days for trust
  and safety; Google retains API content per the Gemini API additional
  terms.
- We do not use your uploaded content to train any model of our own.
- Outputs returned by the AI providers are stored in your Regrade account
  so you can reopen the case later.
- Automated AI output can be wrong. The analysis is not legal advice and
  is not a guarantee that any appeal will succeed.

## 6. How we share information

We share information only with:

- **Google LLC (USA)** — Firebase Authentication, Firestore database,
  Firebase Hosting, and the Gemini API used in our AI pipeline. Google is
  contractually bound by its data protection terms.
- **Anthropic PBC (USA)** — the Claude API used in our AI pipeline when
  you have selected "Hybrid" or "Claude only" as your engine. Anthropic
  is contractually bound by its API Services Terms.
- **Our hosting provider for the Regrade API** — the Node.js backend
  runs on a commercial cloud provider (e.g. Render, Fly.io, Google Cloud
  Run). The provider sees encrypted traffic and limited operational
  metadata.
- **Professional advisors** — lawyers, accountants, and auditors, under a
  duty of confidentiality, when needed.
- **Authorities** — when we believe in good faith that disclosure is
  required by law, court order, or to protect rights, safety, or property.
- **Successors** — if the Service is acquired or merged, information may
  transfer to the successor entity, subject to this Policy.

## 7. International transfers

We are based in the United States and our processors operate primarily in
the United States. If you use the Service from outside the United States,
your information will be transferred to, stored, and processed in the
United States. Where required (e.g. EU/UK transfers), we rely on Standard
Contractual Clauses or other lawful mechanisms.

## 8. Retention

- **Account & profile** — kept until you delete your account.
- **Uploaded coursework, analyses, and drafts** — kept until you delete
  the case or delete your account.
- **Security and abuse logs** — up to 90 days, longer if needed for an
  investigation.
- **Support emails** — up to 24 months, longer if needed.

Backups roll off within 30 days of the live deletion.

## 9. Security

We use TLS in transit, Firebase Authentication for identity, Firestore
security rules to enforce per-user data isolation, server-side input
validation, content-safety scans, IP- and user-based rate limiting, and
Firebase App Check (where enabled) to discourage abuse. No security
program is perfect; if you believe you have found a vulnerability, contact
us at the email at the top of this Policy.

## 10. Your rights

Depending on where you live, you may have the right to:

- access the personal information we hold about you,
- correct inaccurate information,
- delete your account and your data,
- object to or restrict certain processing,
- export your data in a portable format,
- withdraw consent for processing that relied on consent,
- lodge a complaint with your local data-protection authority.

To exercise any of these, email the address at the top of this Policy
from the email on file for your account, or use the in-app "Delete
account" control inside Profile. We respond within 30 days (or sooner
where the law requires).

## 11. Children

Regrade is intended for users who are at least **13 years old** (16 in
the EEA/UK where local law requires). If you are below the applicable
age, do not use the Service. If we discover we have collected personal
information from a child below the applicable age without proper consent,
we will delete it.

## 12. California privacy notice (CCPA / CPRA)

In the last 12 months we collected the categories of information described
in §2 for the purposes described in §3. We disclose information to the
service providers listed in §6 for business purposes only. We do not sell
or share personal information as those terms are defined under the CCPA.
California residents have rights described in §10; exercising them will
not result in worse service.

## 13. Changes to this Policy

We will post any changes to this Policy at this URL and, for material
changes, notify users in-app or by email. The "Effective date" at the top
will be updated. Continued use of the Service after a change constitutes
acceptance of the updated Policy.

## 14. How to contact us

Email: _<TODO: insert public support / privacy contact email>_
Postal mail: available on request.
Controller of record: Preston Jay Susanto, USA.

— End of Privacy Policy —
