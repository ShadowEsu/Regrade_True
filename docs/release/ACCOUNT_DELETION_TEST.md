# Account deletion test

The UI exposes account deletion and the legal documentation describes the expected scope. A destructive production test was not run.

Staging acceptance: reauthenticate; cancel/handle subscription correctly; revoke connectors; delete Auth identity, Firestore profile/cases/annotations/notifications/family links, and Storage documents; prevent further access; preserve only legally required minimal audit data; provide retry/recovery when partial deletion fails. Verify with two users so another learner is never deleted.
