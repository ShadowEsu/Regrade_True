# Contributing to Regrade

**© 2026 Preston Jay Susanto. All rights reserved.**

Regrade is **proprietary software**. This repository is not open source. Access is
granted only to people who have been explicitly authorized by the owner.

## Before you write any code

1. **Sign the paperwork first.** Every intern, contractor, volunteer, or
   collaborator must have a fully executed agreement **before** receiving repo
   access. At minimum:
   - Intern / volunteer or contractor agreement (scope, unpaid or paid terms,
     at-will, no employment relationship unless intended)
   - **CIIAA** (Confidential Information & Invention Assignment Agreement) —
     **required**
   - **NDA** — required
   - Non-solicit (optional but recommended)

   Store signed PDFs (DocuSign / HelloSign). **No signature → no GitHub access.**

2. **Use the company entity on signed agreements.** If Preston Jay Susanto forms
   an LLC or corporation, all new agreements should name that entity as the
   assignee. Update `LICENSE`, `src/version.ts` (`APP_LEGAL_OWNER`), and legal
   docs when the entity is formed.

3. **Least privilege.** Contributors receive the minimum access needed for their
   scoped task — not org owner, not production secrets, not billing admin on
   Firebase, domains, or app stores.

## By contributing, you agree

By opening a pull request, pushing a branch, or otherwise submitting code,
designs, documentation, prompts, bug reports, or other materials
("**Contribution**") to this repository or to Preston Jay Susanto in connection
with Regrade, you represent and agree that:

1. **Assignment.** To the maximum extent permitted by law, all Contributions are
   **work made for hire** for Preston Jay Susanto. To the extent any
   Contribution is not work made for hire, you **irrevocably assign** all right,
   title, and interest in that Contribution (including all intellectual property
   rights) to Preston Jay Susanto.

2. **Disclosure.** You will promptly disclose any invention, idea, or material
   you create that relates to Regrade or uses company resources, information, or
   access.

3. **No side use.** You will not fork Regrade, reuse its rubric-audit logic,
   prompts, designs, or other materials to build or assist a competing product
   without prior written permission.

4. **Authority.** You have the legal right to make the Contribution and to grant
   the rights above. Your Contribution does not violate any third party's rights
   or any agreement you have with anyone else.

5. **License to use.** You grant Preston Jay Susanto a perpetual, worldwide,
   royalty-free license to use, modify, sublicense, and distribute your
   Contribution as part of Regrade or any derivative work, without obligation or
   compensation to you, consistent with the signed CIIAA if one exists.

6. **Supplement, not substitute.** This file **reinforces** signed agreements.
   Where a signed CIIAA, NDA, or contractor agreement conflicts with this file,
   **the signed agreement controls**. This file does not replace legal counsel.

## How we work

| Rule | Detail |
|---|---|
| **Scope** | Tasks are scoped (e.g. one component, one bug). Full product architecture and customer materials are not shared unless necessary. |
| **Branches** | Work on feature branches. **No direct pushes to `main`.** |
| **Review** | Every change requires owner review and approval before merge. |
| **Secrets** | Never commit `.env`, API keys, Firebase Admin JSON, or production credentials. Use local or sandbox credentials only. |
| **Deploy** | Only the owner (or CI the owner controls) deploys to production (`regradeapp.tech`, Firebase Hosting, app stores). |
| **Offboarding** | On last day: revoke GitHub, Firebase, Slack, Figma, email forwards; rotate any secrets the contributor may have seen. |

## Unpaid interns and volunteers

U.S. law imposes strict requirements on unpaid internships. If someone is doing
real product engineering for Regrade, consult a startup attorney about whether
they should be paid, given equity, or structured differently. **This repository
cannot solve that — signed agreements and legal advice can.**

## Questions

Licensing, partnership, or contributor access: contact Preston Jay Susanto via
the channel listed in `README.md` and on https://regrade.app .

For binding terms, rely on **signed** intern / contractor packets prepared or
reviewed by qualified counsel — not this markdown file alone.
