# The Future is Inclusion

A static website for The Future is Inclusion, a resource on inclusion and accessibility for people of all abilities. It is plain HTML, CSS, and JavaScript, with no build step and no framework. It is meant to be hosted on GitHub Pages.

## Run it locally

From this folder:

```bash
python3 -m http.server 8741
```

Open [http://127.0.0.1:8741](http://127.0.0.1:8741).

Use a local server. Opening the files directly (`file://`) still shows each page, and the navigation links still work, but the browser will not load `header.html`, `footer.html`, or `resources.json`. The pages keep a simpler header and footer for that case.

## Edit the resource library

All entries live in [`resources.json`](resources.json). The layout does not need to change when you add one.

Each entry looks like this:

```json
{
  "category": "business",
  "title": "A real title",
  "summary": "One or two sentences about what this is.",
  "placeholder": false,
  "source": "Name of the publisher",
  "url": "https://example.org/the-real-page"
}
```

- `category` must be one of the `id` values in `categories`. To add a category, add an object there with an `id` and a `label`. A category appears in the filter only when it has at least one resource. With fewer than two categories in use, the filter is hidden and search still works.
- `placeholder` should stay `true` until the entry is real. Placeholder entries are labeled on the page and should not be treated as recommendations.
- `url` should be an empty string until you have a real link. Use a real URL you have checked. Do not invent organizations or paste a guessed address.
- `source` is the publisher name shown above the title. Leave it empty if there is nothing to name.

Save the file and refresh the browser.

## Swap the logo

The header shows [`assets/logo.png`](assets/logo.png), the black panel of children, next to the site name in text. The home page shows the full lockup in [`assets/logo-hero.png`](assets/logo-hero.png). [`assets/logo.svg`](assets/logo.svg) displays the header file.

Also replace:

- [`favicon.ico`](favicon.ico), the browser tab icon
- [`assets/icon.png`](assets/icon.png), the 180px apple touch icon

If the new image has a very different shape, update the `width` and `height` attributes on the logo images in [`header.html`](header.html), the fallback header inside each page, and the home page. Those numbers should match the pixel size of the file so the layout does not jump.

The page background is the logo’s cream, `#f9f5e6`, so the cream in the artwork blends into the page. Do not commit the multi-megabyte master file.

## Retune the colors

Every color is a custom property at the top of [`style.css`](style.css), in the `:root` block. Change them there and the whole site follows.

The page, header, and form fields use `#f9f5e6`. Text, links, and buttons use `#111111`. Button labels use the cream. Muted text is `#4a453e`. Check contrast again if you change these: normal text needs 4.5:1, and input borders need 3:1 against the cream.

Headlines use Fraunces. Body text and navigation use Open Sans. Both are loaded from Google Fonts. The font link is in [`head.html`](head.html) and repeated in each page so the type still loads if `head.html` cannot be fetched.

## Set the contact form

The form does not send anywhere until you choose a service. The only setting is the `action` attribute on the form in [`contact.html`](contact.html):

```html
<form id="contact-form" method="post" action="" novalidate>
```

Leave `action` empty for now. Submitting a valid form shows a note that nothing was sent, plus a mailto link to hello@futureisinclusion.org.

When you have a Formspree form, set the action to that URL:

```html
<form id="contact-form" method="post" action="https://formspree.io/f/xxxxxxxx" novalidate>
```

A successful response shows a confirmation. A failed response explains that the message was not sent and offers the same email link. The message stays in the form either way, until it is actually accepted.

## GitHub Pages and a custom domain

1. Push this folder to a GitHub repository.
2. In the repository, open Settings, then Pages.
3. Under Build and deployment, choose Deploy from a branch. Choose the `main` branch and the root folder (`/`).
4. [`.nojekyll`](.nojekyll) is already here so GitHub Pages will not run the files through Jekyll.
5. [`CNAME`](CNAME) currently contains `futureisinclusion.org`. Change that line if the domain is different, and enter the same domain in the Pages custom domain field.
6. At the DNS host, follow [GitHub’s custom domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site). Apex domains use A records. A `www` host uses a CNAME record pointing at the GitHub Pages host.
7. Wait for DNS, then enable HTTPS when GitHub offers it.

Relative links are used throughout, so the site works at the root of a domain.

## Header, footer, and the fallback

[`header.html`](header.html) and [`footer.html`](footer.html) are loaded into every page with `fetch`. Edit those files, not the copies inside each page, when you change the shared navigation or footer.

Each page also contains a minimal header and footer. They stay in place if the fetch fails, including when someone opens a file directly. Those copies need the same links if you add a page.

Social profiles are intentionally left out. A comment in `footer.html` shows where to add them once the URLs are real.

## Accessibility

The pages use landmarks, a skip link, visible focus, labeled fields, and text that can grow and reflow. `prefers-reduced-motion` turns off smooth scrolling. Check contrast again if you change the color variables.
