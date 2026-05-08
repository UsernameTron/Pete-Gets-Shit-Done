# Titled Link

A link with a title attribute: [target](./target_name.md "Target Title").
The validator must capture only the path `./target_name.md` and ignore the
quoted title — it must NOT treat `target_name.md "Target` as the ref.
