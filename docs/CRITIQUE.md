# Critique protocol

Every reviewable change in this repo ships as a pull request that a critique
agent reviews in **two cycles**. The PR description is the contract; this file
is the checklist the agent works from.

## Cycle 1 - behaviour and truth

Run the app, not just the diff.

1. `npm ci && npm run typecheck && npm run build`
2. `npx playwright install chromium && npm run test:e2e`
3. Walk the flow end to end in a browser: welcome, tour, every question, each
   outfit, the result, the download, the reset view. Compare what you see
   against the screenshots and claims in the PR.
4. Check the claims. If the PR says "garments fit any body", change sex,
   height, weight, build and frame to their extremes and verify. If it says
   "camera is free", drag, zoom, pan, double-click.
5. Report: any visual artifact, dead end, console error, or misleading claim is
   a change request. Do not approve on trust.

## Cycle 2 - standards and taste

After cycle 1 issues are addressed, review the same PR again for the qualities
that outlive the change.

- **Consistency**: does new code follow the patterns in `src/lib/human/rig.ts`
  and the component conventions in `src/components`?
- **Calm interaction**: does anything add motion, noise, or a new decision the
  visitor did not ask for? The product's promise is a soothing flow.
- **Performance**: morph and shell work belongs on parameter changes, not on
  every frame. Check the render loop before approving idle animations or
  per-frame updates.
- **Accessibility**: keyboard reachability for the flow, sensible roles and
  labels, no colour-only signals.
- **Licensing**: new assets must carry provenance in the PR and in
  `LICENSE`/README. CC0, MIT or equivalent only.

Approve only when both cycles pass. When a cycle fails, the agent leaves a
numbered list of concrete, reproducible change requests on the PR - not vague
asks - and re-reviews after they land.
