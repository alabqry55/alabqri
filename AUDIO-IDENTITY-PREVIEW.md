# ALABQRI Audio Identity — Reversible Preview

## Current status
- This work is isolated on branch `preview/alabqri-audio-identity`.
- The production `main` branch and the live Cloudflare Pages site have not been changed or deployed.
- `audio-identity-preview.html` is a standalone responsive preview only; it is not wired into the existing homepage.
- No voice recordings have been supplied or created yet. Playback remains unavailable until the approved MP3 files are added.

## Planned audio assets
- `audio/alabqri-welcome-male.mp3`
- `audio/alabqri-welcome-female.mp3`

Use recordings licensed for the center's commercial web use. Confirm the intended pronunciation of “ALABQRI” with the user before final recording. Optional English announcements should be a separate approved recording.

## Safe next steps
1. Review the standalone preview.
2. Approve the scripts and the pronunciation of ALABQRI.
3. Obtain the two final voice recordings and any licensed sound logo.
4. Test the supplied assets with the preview.
5. Only after approval, prepare a separate, minimal integration change against the fixed original homepage and review the diff before merging/deploying.

## Rollback
Because the change is on a dedicated branch, it can be discarded without reverting or rewriting the production branch. Do not merge this branch or deploy it to production until explicitly approved.
