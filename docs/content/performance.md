# Runtime and performance
> Understand how the browser engine scans AtomAttr attributes, deduplicates rules, and reacts to DOM changes.

## Rule generation

The browser engine scans supported attributes and inserts generated rules into its stylesheet. It keeps a rule cache to avoid inserting an identical attribute/value rule more than once. A change to an attribute can add a new rule; previously generated rules are not automatically removed when attributes disappear.

The cache is currently session-local and stylesheet rule order follows discovery order. Do not rely on AtomAttr to implement Tailwind-style conflict sorting or CSS cascade layers.

## Dynamic DOM updates

Initial scanning processes the document tree. MutationObserver work groups changed elements and newly added subtrees into a scheduled batch; call `refreshAtomAttr(container)` after framework or third-party changes only when automatic observation is unavailable or immediate processing is required.

## Performance limits

The project does not yet publish measured startup, memory, CSS size, or 100-to-10,000 element benchmarks. Keep repeated generated values consistent, avoid unnecessary attribute churn, and benchmark in the browser and app shapes you ship.

