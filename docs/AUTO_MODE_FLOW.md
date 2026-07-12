# Auto Mode Flow

## Implemented

1. Paid entitlement and explicit automatic-grade-detection preference are checked.
2. Configured Canvas/Classroom sources are queried.
3. Only newly graded records within seven days are selected and deduplicated.
4. Import metadata and an automation job are persisted.
5. If the returned marked document is unavailable, status becomes `awaiting_returned_file`.
6. A grouped import notification can be persisted/delivered.

## Required before “fully automatic” is shown

Download an authorized returned document/rubric/comments; save the original; transition a durable job through importing → analyzing → ready/failed; run AI idempotently; persist findings; create specific notification/history events; and expose retry. External submission always waits for explicit final approval.
