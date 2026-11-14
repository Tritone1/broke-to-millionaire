# Character art resolution audit

The scene renderer already uses static bundled images, preloads the required layers, memoizes the complete character, and avoids rebuilding the character on each game tick. Android does not apply a lossy filter to these PNG layers.

The remaining softness at full-screen size comes from the source artwork:

- `head_atlas_v3_skin_0.png` through `head_atlas_v3_skin_5.png` are 2172 x 724 atlases. Each of the six ethnicity columns is only 362 x 362 pixels.
- `avatar_full_head_skin_0.png` through `avatar_full_head_skin_5.png` are 3072 x 1536 atlases, but each 512 x 768 cell is generated from those 362 x 362 face cells.
- `avatar_full_clothing.png` is 1024 x 768, giving each gender a 512 x 768 cell.
- On a high-density Android phone, the full-height character can occupy more physical pixels than a 512 x 768 cell, so the device must upscale it.

CSS, React Native resize modes, or sharpening cannot restore detail that is absent from these files. Replacing the affected sources is required for a genuinely sharper full-height character.

## Replacement specification

Provide the same artwork and alignment at these minimum source sizes:

- Each head/ethnicity/gender cell: at least 768 x 768 pixels, preferably 1024 x 1024.
- Each full-body clothing/gender cell: at least 1024 x 1536 pixels.
- Hair back and hair front: full transparent 1024 x 1536 canvases for scene art and 1024 x 1024 canvases for portraits.
- Preserve the current transparent padding, anchor positions, gender rows, ethnicity columns, skin palette, hairstyle identity, facial proportions, outfit, and layer order.
- Export lossless PNG or lossless WebP with no trimmed transparent bounds.

After those source files are supplied, run `npm run assets:build-avatar`, `npm run assets:check-avatar`, and `npm run check:layers`. The existing renderer API and game screens do not need to change.
