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

### Style

Avatars are drawn as a two-tone gradient by default. Pass `style=glass` for a
frosted look instead — one flat hue from a 35-colour ramp, with two soft,
heavily blurred shapes screened over it:

```
https://avatar.aiellie.dev/ellie?style=glass&rounded=24
```

![Avatar for ellie](https://avatar.aiellie.dev/ellie?style=glass&rounded=24)

| `style`    | Look                                             |
| ---------- | ------------------------------------------------ |
| `gradient` | Two colours blended corner to corner. Default    |
| `glass`    | Blurred shapes on a flat hue. Also `frosted`     |

`glass` is a port of [DiceBear](https://www.dicebear.com)'s Glass style: the
same 35-hue palette, the same eight glyphs (the letters of the word
"gradient"), and the same seeded selection. It picks its colour on its own
hash, so a name lands on unrelated hues in the two styles.

Anything unrecognised falls back to `gradient`, and icons and initials draw over
both.

### SVG

Add the extension `.svg`:

```
https://avatar.aiellie.dev/ellie.svg
```

### Add Initials

Add the `text` parameter:

```
https://avatar.aiellie.dev/ellie.svg?text=EA
```

![Avatar for ellie](https://avatar.aiellie.dev/ellie.svg?text=EA)

Both formats draw them, but not in the same typeface: the SVG asks for
`sans-serif` and lets the viewer resolve it, while the PNG can only use the font
embedded in the rasteriser. Expect the same letters in a different face.

### Add an Icon

Instead of initials, drop any of the 6,122 free [HugeIcons](https://hugeicons.com) on top of the artwork with `icon`:

```
https://avatar.aiellie.dev/ellie?icon=rocket-01
```

![Avatar for ellie](https://avatar.aiellie.dev/ellie?icon=rocket-01)

Icons work in either format, at any size or ratio:

```
https://avatar.aiellie.dev/ellie?icon=github&ratio=banner&size=600&rounded=24
```

![Avatar for ellie](https://avatar.aiellie.dev/ellie?icon=github&ratio=banner&size=600&rounded=24)

Names are the kebab-case form of the HugeIcons name — `home-01`, `user-circle`, `rocket-01`. The spellings you might paste in from their site or the React package (`Home01Icon`, `home 01`, `home_01`) are all folded to the same icon. An unknown name is ignored rather than erroring, and `icon` wins if `text` is also set. Browse the full set in the playground.

## Playground

The home page at [avatar.aiellie.dev](https://avatar.aiellie.dev) is a small playground built with [shadcn/ui](https://ui.shadcn.com): type a name, pick the style, format, size and aspect ratio (including a custom `W:H`), drag the roundness slider, search the icon set, add initials, and copy the generated URL.

## Development

```bash
pnpm install
pnpm dev
```

The app rewrites every path to the avatar API (`/:name` → `/api/avatar/:name`), so the home page is served at `/` and everything else returns an image.

### Icons

`@hugeicons/core-free-icons` is a dev dependency of ~83MB that exports each icon several times over — far too much to bundle into an edge function or ship to a browser. `pnpm dev` and `pnpm build` therefore run `scripts/generate-hugeicons.mjs` first, which distils it into `public/hugeicons`: an index of names plus 32 shards of geometry, together about 5MB of static JSON that is generated, git-ignored, and served from the CDN.

Both consumers page it in rather than loading it whole. The avatar route fetches the one shard holding the requested icon and keeps it in module scope; the picker fetches the index up front and pulls shards as rows scroll into view. Shard URLs carry the package version and are served `immutable`, so bumping the dependency invalidates them on its own. Run `pnpm generate:icons` to rebuild by hand.

Two traps worth knowing if you touch the rendering, both from Satori, which rasterises the PNG output. It walks the element tree without invoking function components or fragments — hand it either and it returns a blank image with no error, which is why `iconGlyph` is a plain function the route *calls* rather than a component it mounts. And it rejects SVG `<text>` nodes outright ("please convert them to `<path>`"), so the two formats draw initials differently: the SVG puts a `<text>` node inside the artwork, while the PNG stacks a CSS-laid-out flex box over it.
