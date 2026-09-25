# Firestore rules prototype review

The rules use default deny and scope every event path to the authenticated `ownerUid` on the parent event. All create/update paths call a collection-specific validator with strict allowed keys, types, length/range constraints, and URL constraints. Event ownership is immutable after creation. Runtime and schedule execution documents are also validated.

## Devil's-advocate checks

- Public list exploit: blocked; all event reads require owner authentication.
- Unauthorized read/write: blocked by parent-event owner check.
- Update bypass: blocked; create and update both call the same validator.
- Ownership hijacking on create: blocked; event ownerUid must equal request.auth.uid.
- Ownership hijacking on update: blocked by immutable ownerUid.
- Type juggling: blocked by explicit type checks.
- Resource exhaustion: bounded string fields and bounded map schemas; lists are not used in the current model.
- Required field omission: validators reference every required field.
- Privilege escalation: no client-writable role or isAdmin field exists.
- Schema pollution: all documents use keys().hasOnly(...).
- Invalid state values: enums constrain mode, mediaType, align, transition, effect, runtime command, and schedule kind.
- Negative/overflow values: numeric ranges are explicit.
- Mixed-content leak: no public profiles/users collection exists.
- Counter/action replay: schedule executions are immutable and created transactionally at a deterministic execution ID.
- Orphaned subcollection access: isOwner(eventId) depends on the parent event document, so an absent parent fails access.
- Query mismatch: app queries subcollections ordered only by `order`; authenticated owner has read access to those collections.
- Validator pattern: every create/update rule calls the matching validator.

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for a single-owner event model with authenticated access, strict schemas, immutable event ownership, and default-deny behavior. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.
