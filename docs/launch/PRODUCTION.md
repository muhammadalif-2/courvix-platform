# COURVIX launch film — production package

The newest brief specifies an approximately 85-second commercial, separate from the longer product walkthrough and the 4:5 teaser. Target: 3840×2160, 16:9, 30 fps; English narration, original score and effects; actual Courvix orange/logo/Inter identity. Closing: **COURVIX — Less Administration. More Game.** CTA: **Discover COURVIX**.

`storyboard.json` is the timed edit decision list, narration, emotional arc, screen assignments, camera direction and sound design. The script and proof assets export to `/workspace/outputs/courvix/launch-production/`. Any look-development render with blank/branded screens is a production proof, not the completed commercial.

## Required real screen assets

These are absent from the workspace. Browser control tools are unavailable. Do not fake a screenshot, fabricate UI, or imply that the illustrative panels in the existing walkthrough are app recordings. Use actual demo records and exclude credentials/customer information. Supply clean PNG captures or lossless/clear recordings, with original viewport proportions:

| File                           | Actual view                                        | Suggested viewport                   |
| ------------------------------ | -------------------------------------------------- | ------------------------------------ |
| `desktop-club-control.png`     | Club control room as Owner/Admin                   | 1920×1080 or larger                  |
| `desktop-member-360.png`       | Member selected with connected records             | 1920×1080 or larger                  |
| `desktop-schedule.png`         | Club schedule                                      | 1920×1080 or larger                  |
| `desktop-payment-review.png`   | Invoice submission/review with manual verification | 1920×1080 or larger                  |
| `desktop-training-control.png` | Personal Training control room                     | 1920×1080 or larger                  |
| `desktop-network.png`          | Real Network/branches view                         | 1920×1080 or larger                  |
| `tablet-attendance.png`        | Attendance or coach view at tablet width           | 1280×900 or 1024×768                 |
| `tablet-training-bookings.png` | PT appointments/classes at tablet width            | 1280×900 or 1024×768                 |
| `mobile-member.png`            | Member's own view at mobile width                  | 390×844 or larger proportional image |
| `mobile-training-client.png`   | Client's own PT view at mobile width               | 390×844 or larger proportional image |

Different filenames are acceptable; map them in the storyboard. Do not stretch a desktop image into the phone screen. The app has responsive source styles, but actual mobile/tablet playback and interaction are not verified by source inspection alone.

## Feature verification map

| Shown benefit                               | Existing implementation                                                    | Claim boundary                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Connected staff overview                    | `app/control-room.tsx`, `lib/control-room.ts`                              | Role-scoped stored records, not live device/sensor telemetry     |
| Profiles, teams, training and attendance    | `app/workspace-client.tsx`                                                 | Existing club records only                                       |
| Dues, review and reminders                  | `app/api/payments/route.ts`, `app/api/reminders/route.ts`, reminder policy | Manual verification; sender/schedule must be configured          |
| PT offers, appointments and session credits | `app/personal-training.tsx`, `lib/personal-training.ts`                    | Existing visit/pack and purchased booking terms                  |
| Branch oversight                            | Workspace/Network components and existing organization scope               | Existing workspace summaries; no unverified predictive analytics |
| Desktop/tablet/mobile presentation          | Existing responsive CSS and real viewport captures                         | Website experience; no native-app or offline claim               |

## Release condition

The final 85-second commercial is not complete until the actual screenshots/recordings are mapped into devices and checked at native size. Footage must be licensed for this commercial use and inspected for unrelated visible logos. Do not publish a proof with placeholder screens as the final launch film. The longer narrated walkthrough and 4:5 teaser remain separate deliverables.

## Reproduce the production assets

Use the media virtual environment and models documented in `../MEDIA-KIT.md`:

```bash
work/media-venv/bin/python scripts/prepare-launch.py
work/media-venv/bin/python scripts/launch-audio.py
blender -b -t 2 -P scripts/launch-devices.py
```

Blender 4.3 is used for the unbranded procedural device rig. Cycles CPU, 16 samples, native 3840×2160 proof; denoising is disabled because this environment's build lacks OpenImageDenoise. Screens use UV letterboxing rather than stretching. The `.blend` packs its textures and includes a 301-frame hero camera animation rig at 30 fps. The single proof frame is a look-development image, not an 85-second video.

`footage-sources.json` records the two acquired Pexels sources, creators, download URLs, checksums and source formats. These are authentic sport/trainer shots under the linked Pexels license; no endorsement is implied. Raw source footage stays outside the website deployment in `work/launch-v1/footage/`. Final framing must also account for orientation metadata and visible equipment marks.

`COURVIX-launch-opening-CONCEPT-4K.mp4` is a separate 17-second opening look/edit proof using the acquired sports footage and the first section of the 85-second mix. It is not the completed film and does not fill missing product screens with fabricated UI. Reproduce with `work/media-venv/bin/python scripts/launch-opening.py` after fetching the sources in `footage-sources.json`.
