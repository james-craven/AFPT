# Marketing, Legal, and Launch Plan

This is a practical launch checklist, not legal advice. Final public release copy and policies should be reviewed before broad distribution.

## Positioning

- Primary promise: an offline-first AF-PRT/PFRA calculator built for quick use on a phone.
- Secondary promise: a pacing assistant for planned 2-mile goal times, with clear browser limitations.
- Trust message: no ads, no account, no tracking, and no official affiliation claimed.
- Audience: Airmen preparing for tests, PTLs doing quick checks, and anyone who needs standards access where internet is weak.

## User Education

- Add a short in-app "How to use" path before public launch:
  - Select sex/age/theme.
  - Pick each component and enter performance.
  - Use chart/reference buttons to verify standards.
  - Use pace plan for 2-mile run targets.
  - Enable pacer audio only after testing volume.
- Explain pacer audio plainly:
  - "Install to Home Screen and keep screen awake for the best cue behavior."
  - "Music ducking and locked-screen cues vary by device/browser, so test before running."
  - "Test cues before running."
- Create a 30-60 second screen recording showing:
  - Install for offline use.
  - Calculator inputs.
  - Chart reference modal.
  - Pace plan and audio cue setup.

## Distribution Checklist

- PWA/web:
  - Buy and configure the production domain.
  - Add production analytics only if privacy policy is updated first.
  - Remove or hide development build modal.
  - Verify install/offline/update flows on iPhone Safari, Android Chrome, and desktop Chrome.
  - Add footer/settings links for Privacy, Terms, Disclaimer, Support, and Source/Version.
- Native later, only if justified by user demand:
  - Apple requires a public privacy policy URL for App Store privacy details.
  - Google Play requires a Data Safety form and matching privacy policy, even if no data is collected.
  - Native app is the right path if users require guaranteed background/locked-screen audio and audio ducking.

## Required Public Documents

- Privacy Policy:
  - State that the app does not require an account.
  - State whether performance inputs/settings remain local on-device.
  - List local storage data: theme, pacer audio settings, and calculator preferences.
  - State whether analytics, donations, or third-party processors are used.
  - Provide contact email.
- Terms of Use:
  - Personal informational use.
  - No warranty.
  - User responsible for verifying official standards.
  - No promise of official score certification.
- Disclaimer:
  - Not an official Department of the Air Force or DoD product.
  - Standards can change; users should verify with current official guidance.
  - Fitness/pacer features are planning aids, not medical or safety advice.
- Support page:
  - Report a scoring issue.
  - Report a standards update.
  - Request accessibility help.

## Marketing Assets

- App tagline options:
  - "AF-PRT scoring, offline when you need it."
  - "PFRA scores, charts, and pace targets in your pocket."
  - "A field-ready Air Force fitness calculator."
- Landing page sections:
  - Calculator preview.
  - Offline/PWA install.
  - Current standards and references.
  - 2-mile pace plan.
  - No ads/no account.
  - Disclaimer and standards source.
- Launch channels:
  - Personal network and base-level word of mouth first.
  - Reddit/Facebook groups only after disclaimer and privacy docs are live.
  - Ask PTLs/UFPMs for feedback without implying official endorsement.

## Source Notes

- Apple App Store privacy details require a publicly accessible privacy policy URL.
- Google Play requires a Data Safety form and allows the form/privacy policy to say no user data is collected or shared when true.
- FTC mobile health app guidance recommends an accessible privacy policy that explains what information is collected, used, shared, and secured.
