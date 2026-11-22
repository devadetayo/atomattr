# Pro and community workflow setup

This repository currently builds a static Vite website. It has no application server, authentication service, database, payment integration, private object storage, submission endpoint, or moderator role system. The public pages must not represent a draft, payment, or review as completed.

## Free AtomAttr UI flow

`ui.html` is the AtomAttr UI landing page. `catalog.html` is the combined public gallery; `components.html` and `sections.html` are category routes; `item.html?slug=…` is a design detail page; and `playground.html` is the existing editor. The free catalog is public and does not require sign-in. Catalog records carry `access: 'free'`, creator, license, category, and published status. A missing license is displayed as `Not specified`; it must not be silently replaced with an assumed license.

The detail page's Open in Playground action uses the Playground's existing v2 share payload (`#code=` with language, HTML, and CSS fields). The Playground owns loading, editing, preview, and local saving. It does not require payment or Pro access. The gallery currently has project-authored components and sections only; there are no approved community designs or complete website templates published.

`contribute.html` validates and stores local drafts in the current browser and can download a JSON package. This is not an upload, submission, or pending review state. Do not expose a moderator approval UI or mark a design published based on client-side data. Real submission tracking and approval require authenticated server endpoints, private draft storage, and moderator authorization.

Public/free source is presented according to each record's displayed license metadata. Pro product records and files must remain separate: a public preview may be browsable, but Pro source and ZIP files require server-verified purchase entitlement and must not enter public catalog data or browser bundles.

## Pro marketplace

The premium catalog is intentionally empty. There are no verified products, product versions, prices, purchase records, or private ZIP files. The existing page does not collect payment.

Before a paid launch, approve an architecture and configure accounts for:

- Server-side checkout creation and payment verification through the provider's signed webhook or trusted API.
- Authenticated customer identity and order history.
- Product records with version, preview, requirements, price, and license metadata.
- Private object storage for source ZIPs, outside public static assets and the repository.
- An authenticated download endpoint that checks the verified order on every request and returns only the purchased version.
- Secret values held only in server-side environment configuration.

No real checkout or delivery route is implemented. A browser success page, screenshot, or hidden source is not a payment or source-protection mechanism.

## Community contributions

`contribute.html` can validate a proposed design package locally and download it as JSON. This draft remains in the contributor's browser until downloaded; the site does not upload it, queue it, or assign a review state.

Publishing community content safely still needs a server-side submission endpoint, private storage, moderation records, and moderator authentication. The backend must validate file types, sizes, metadata, and paths again on the server. Only authenticated moderators may approve or publish a submission. No client-side admin switch is safe for this purpose.

## Architecture decision needed

The smallest shared implementation would be a server-side application backed by a relational database, private object storage, and an authentication provider. It can own catalog records, submission states, purchases, payment webhook verification, and protected downloads. A payment provider is needed only for Pro sales; contributors should never gain moderator access through client-controlled metadata.

Provider selection, hosting cost, and operational ownership are product decisions. No provider account, paid service, credential, or deployment has been configured in this repository.
