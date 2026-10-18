# Editing the documentation

The files in `docs/content/` are the editable sources for the docs website. Each page is independent Markdown, named after its URL: `syntax.md` builds `docs/syntax.html`, and `docs.md` builds the overview at `docs.html`.

## Page format

The first heading sets the title, the blockquote sets the description, and each `##` heading creates a section, table of contents entry, and anchor. Paragraphs support inline code, links, **bold**, and *emphasis*. Code fences become syntax-highlighted examples.

    # Page title
    > One sentence summary shown under the page title and in search results.

    ## Section heading
    Explain one topic here.

    ```html
    <div p="4">Code example</div>
    ```

Edit a source and run `npm run build:docs` to regenerate the matching HTML pages. `npm run build` runs this docs build before building the site.

The build script owns shared navigation, metadata, pagination, and generated attribute reference tables. Edit a page's Markdown for its authored title, intro, prose, sections, and examples.
