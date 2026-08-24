# Aisha cross-browser acceptance checks

1. Aisha is visible immediately when the interview room opens on Safari, Chrome, Edge, and Firefox layouts.
2. No `Start Aisha` button is required. The first greeting attempts to begin from the original Start Interview click/tap.
3. Intro pauses are 2 seconds.
4. MongoDB interview-catalog questions are fetched in parallel with the greeting, rotated against recent question IDs, and fall back safely if the catalog is unavailable.
5. The response timer starts only after Aisha finishes the current spoken question, or immediately in text-mode fallback when speech synthesis is unavailable/blocked.
6. Speech recognition starts only after the response clock starts. Browsers without speech recognition remain fully usable with typed answers.
7. Turning the camera on or off never cancels Aisha speech or resets interview sequencing.
8. Aisha's image uses bundled and public fallbacks, avoids `:has()` for core layout, and keeps the avatar host explicitly positioned.
9. Speaking state uses subtle head and mouth-region animation; reduced-motion users receive a static avatar.
10. Timeout chime/acknowledgement, evaluation, targeted follow-up, next question, and final results continue automatically.
11. Leaving the interview still shows the end-session confirmation.
12. Existing OAuth, billing, resume builder, marketing, and unrelated product flows are unchanged.
