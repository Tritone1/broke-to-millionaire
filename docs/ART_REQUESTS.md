# Avatar art validation

The active avatar artwork now passes the automated alpha-edge checks. No hairstyle is hidden and no `needsArt` fallback is active.

## Automatically repaired source defects

The first `npm run check:layers` scan found these generated-layer defects:

- `avatar_portrait_hair_back_curly.png`: straight left edge at `(83,115)`, length `79`.
- `avatar_portrait_hair_front_curly.png`: straight left edge at `(83,115)`, length `79`.
- `avatar_portrait_hair_back_side-sweep.png`: straight left edge at `(69,132)`, length `90`.
- `avatar_portrait_hair_front_side-sweep.png`: straight left edge at `(69,132)`, length `90`.
- `avatar_portrait_hair_front_braids.png`: straight left edge at `(131,185)`, length `219`.
- `avatar_portrait_hair_front_braids.png`: straight right edge at `(381,185)`, length `219`.
- `avatar_full_hair_front_braids.png`: straight left edge at `(207,106)`, length `61`.
- `avatar_full_hair_front_braids.png`: straight right edge at `(305,77)`, length `91`.
- `avatar_portrait_hair_back_high-ponytail.png`: straight left edge at `(115,109)`, length `62`.
- `avatar_portrait_hair_back_high-ponytail.png`: straight bottom edge at `(329,423)`, length `32`.
- `avatar_portrait_hair_front_high-ponytail.png`: straight left edge at `(115,109)`, length `62`.

The generator now applies curved, feathered silhouette masks, organic braid paths, a curved ponytail fringe, and position-dependent bottom fades. A second repair pass removed the final ponytail boundary. The current scan checks 24 active full-canvas hair layers and reports zero violations.

## Replacement specification if a future layer cannot be repaired

- Transparent PNG on the complete `512 x 512` portrait canvas and `512 x 768` full-body canvas.
- Identical head center, head top, temples, ears, nape, and shoulder anchors to `src/data/avatarAnchorData.json`.
- Separate `hairBack` and `hairFront` files.
- No alpha touching any canvas border.
- No trimmed rectangular edges or unfeathered diagonal cuts.
- Long hair tips must continue behind the shoulders and outfit.
- Front hair must leave both eyes and eyebrows visible.
