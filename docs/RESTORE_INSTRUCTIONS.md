# Restore Instructions

The complete pre-redesign application is preserved in Git branch:

`backup/regrade-pre-mobile-redesign-20260712`

Backup commit: `ced9632` (`Backup pre-Regrade 2.0 mobile redesign`).

Current redesign work lives on:

`feature/regrade-2-mobile-redesign`

To inspect the old version without changing this working directory, create a worktree:

```bash
git worktree add ../Regrade_Pre_Mobile_Redesign backup/regrade-pre-mobile-redesign-20260712
```

To return this checkout to the backup branch after safely committing or stashing any newer work:

```bash
git switch backup/regrade-pre-mobile-redesign-20260712
```

Do not delete the backup branch until the mobile redesign has passed real-device and persisted-data QA.
