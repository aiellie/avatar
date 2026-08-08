# avatar ![](https://avatar.aiellie.dev/ellie?size=20) ![](https://avatar.aiellie.dev/sophia?size=20) ![](https://avatar.aiellie.dev/aiellie?size=20) ![](https://avatar.aiellie.dev/party?size=20) ![](https://avatar.aiellie.dev/edge?size=20)

Generate beautiful gradient avatars for your application.

Based on [vercel/avatar](https://github.com/vercel/avatar), running at [avatar.aiellie.dev](https://avatar.aiellie.dev) — with a [shadcn/ui](https://ui.shadcn.com) playground on the home page for building avatar URLs interactively.

## Usage

Provide a username to generate an avatar. Each name will generate a unique `avatar`. Just replace `ellie` with an `username` or `email`:

```
https://avatar.aiellie.dev/ellie
```

You will receive a `png` image with a size of 120\*120px

![Avatar for ellie](https://avatar.aiellie.dev/ellie)

### Adjust Roundness

```
https://avatar.aiellie.dev/ellie?rounded=60
```

![Avatar for ellie](https://avatar.aiellie.dev/ellie?rounded=60)

### Custom Size

```
https://avatar.aiellie.dev/ellie?size=30
```

![Avatar for ellie](https://avatar.aiellie.dev/ellie?size=30)

### SVG

Add the extension `.svg`:

```
https://avatar.aiellie.dev/ellie.svg
```

### Add Initials

Add the `text` parameter (requires SVG):

```
https://avatar.aiellie.dev/ellie.svg?text=EA
```

![Avatar for ellie](https://avatar.aiellie.dev/ellie.svg?text=EA)

## Playground

The home page at [avatar.aiellie.dev](https://avatar.aiellie.dev) is a small playground built with [shadcn/ui](https://ui.shadcn.com): type a name, pick the format and size, drag the roundness slider, add initials, and copy the generated URL.

## Development

```bash
pnpm install
pnpm dev
```

The app rewrites every path to the avatar API (`/:name` → `/api/avatar/:name`), so the home page is served at `/` and everything else returns an image.
