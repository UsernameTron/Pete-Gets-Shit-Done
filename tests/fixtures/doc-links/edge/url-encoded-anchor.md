# URL Encoded Anchor

This link encodes a space in the anchor: [target](./target.md#some%20heading).
The target file used by the unit suite contains `## Some Heading`. After
`decodeURIComponent`, the anchor should resolve as `some-heading`.
