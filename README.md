# Ceremony

AK9I's modular, Firebase-backed event presentation system.

## Three experiences

- **Audience Display**: `/display/?event=ak9i-graduation` — clean projector/TV output.
- **Event Director**: `/control/?event=ak9i-graduation` — live ceremony controls.
- **Event Editor**: `/editor/?event=ak9i-graduation` — setup, slides, graduates, awards, music, schedule, and clock/countdown layout.

The three URLs are designed to be opened on separate devices. Firebase Authentication provides Email/Password sign-in, and Firestore holds the shared event configuration plus one authoritative `runtime/state` document.

## Authoritative state and flicker fix

The Audience Display is a renderer, not a scheduler. It never changes event state when the countdown reaches zero and never advances the shared deck by itself. The Event Director is the sole runtime command authority: its scheduler transactionally claims time-based actions and its auto-advance logic transactionally advances pre-show/post-show slides. Slide transitions on the Display are sequence-guarded and superseded transition timers are cancelled before another transition starts. Clock/countdown text updates are isolated from slide DOM state.

The runtime carries `slideStartedAt`, allowing every device to calculate timing from the same authoritative timestamp rather than from independent elapsed timers.

## Firebase project

- Project ID: `ceremony-d1618`
- Project number: `359205123874`
- Required web app display name: `Ceremony`
- Authentication: Email/Password
- Database: Cloud Firestore

The public web client identifiers belong in `config/firebase-config.js` after the web app is registered.

### Firebase CLI bootstrap

Firebase's agent skills recommend using the latest CLI through `npx`:

```bash
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use ceremony-d1618
npx -y firebase-tools@latest firestore:databases:list --project ceremony-d1618
npx -y firebase-tools@latest apps:list --project ceremony-d1618
npx -y firebase-tools@latest apps:create WEB Ceremony --project ceremony-d1618
npx -y firebase-tools@latest apps:sdkconfig WEB <APP_ID> --project ceremony-d1618
npx -y firebase-tools@latest deploy --only auth,firestore:rules,firestore:indexes --project ceremony-d1618
```

`firebase.json` authorizes both `localhost` and `accelanalysis.github.io` for Auth and enables Email/Password.

## GitHub Pages

The included workflow publishes the repository root to Pages on each push to `main`.

Expected URLs after Pages is enabled:

- `https://accelanalysis.github.io/Ceremony/display/?event=ak9i-graduation`
- `https://accelanalysis.github.io/Ceremony/control/?event=ak9i-graduation`
- `https://accelanalysis.github.io/Ceremony/editor/?event=ak9i-graduation`

## First-run sequence

1. Open Event Editor and create/sign in to the Email/Password account that will run the event.
2. In **Setup / Data**, create the AK9I starter event. It seeds the 30-slide canine-action deck.
3. Sign in with the same Firebase account on the Event Director and Audience Display devices.
4. On the Audience Display, press **Arm event audio** once before scheduled music is expected to play.
5. Configure the ceremony start, countdown, schedule, graduates, awards, and tracks in Event Editor.
6. Keep Event Director open during the live event; it is the clock-aware command authority.

## Security rules

`firestore.rules` is a least-privilege prototype: event data is not public and is scoped to the authenticated event owner. The same owner account can be used across the separate event devices. Before broad multi-user use, expand this into explicit editor/director/display roles and re-audit.
