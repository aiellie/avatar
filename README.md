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

Use `rounded=full` for a circle (or a pill, on a non-square shape) at any size:

```
https://avatar.aiellie.dev/ellie?rounded=full
```

![Avatar for ellie](https://avatar.aiellie.dev/ellie?rounded=full)

### Custom Size

```
https://avatar.aiellie.dev/ellie?size=30
```

![Avatar for ellie](https://avatar.aiellie.dev/ellie?size=30)

`size` sets the **longest edge**, so a name keeps the same visual weight whether it is square, wide, or tall. Each side is capped at 2048px.

### Aspect Ratio

Avatars are square by default. Add `ratio` for any other shape:

```
https://avatar.aiellie.dev/ellie?ratio=16:9
```

![Avatar for ellie](https://avatar.aiellie.dev/ellie?ratio=16:9)

Named presets are available too:

| Preset      | Ratio   | Notes                            |
| ----------- | ------- | -------------------------------- |
| `square`    | 1:1     | The default — also named `avatar` |
| `video`     | 16:9    | Also named `landscape`           |
| `portrait`  | 9:16    | Also named `story`               |
| `photo`     | 4:3     |                                  |
| `tall`      | 3:4     |                                  |
| `ultrawide` | 21:9    |                                  |
| `cover`     | 40:21   | `?ratio=cover&size=1200` → 1200×630, the Open Graph card size. Also named `og` / `social` |
| `banner`    | 3:1     |                                  |

```
https://avatar.aiellie.dev/ellie?ratio=banner&size=600&rounded=full
```

![Avatar for ellie](https://avatar.aiellie.dev/ellie?ratio=banner&size=600&rounded=full)

`ratio` accepts `W:H`, `W/H`, `WxH`, a bare decimal (`1.5`), or any preset name. An unparseable ratio falls back to square.

### Exact Dimensions

When you need specific pixels rather than a ratio, set `width` and `height` (or the `w` / `h` shorthands):

```
https://avatar.aiellie.dev/ellie?width=300&height=100
```

![Avatar for ellie](https://avatar.aiellie.dev/ellie?width=300&height=100)

Passing only one of them pairs with `ratio` to derive the other, so `?width=800&ratio=video` gives 800×450.

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

The home page at [avatar.aiellie.dev](https://avatar.aiellie.dev) is a small playground built with [shadcn/ui](https://ui.shadcn.com): type a name, pick the format, size and aspect ratio (including a custom `W:H`), drag the roundness slider, add initials, and copy the generated URL.

## Development

```bash
pnpm install
pnpm dev
```

The app rewrites every path to the avatar API (`/:name` → `/api/avatar/:name`), so the home page is served at `/` and everything else returns an image.
