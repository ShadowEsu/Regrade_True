# Firebase isolation matrix

| Resource/action | Owner | Different user | Status |
| --- | --- | --- | --- |
| Profile read/update | Allow | Deny | Test authored; execution blocked by Java |
| Case create/read | Allow | Deny | Test authored; execution blocked by Java |
| Annotation create/update | Allow | Deny | Test authored; execution blocked by Java |
| Query another user's cases | Own records only | Must not leak | Test authored; execution blocked by Java |

Never loosen rules to make a client request work. Privileged writes require an authenticated server route and server-side authorization.
