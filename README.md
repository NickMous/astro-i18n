# @nickmous/astro-i18n

Type-safe, namespaced i18n for Astro and any TypeScript project. Dotted keys, no codegen, no build step.

Translations live in ordinary `.ts` files, so they are type-checked, refactorable, and reviewable in a normal diff. Types are derived from your default language — there is no CLI, no watcher, and no generated file to keep in sync.

> Personal package. Published publicly for convenience; issues and feature requests are not monitored.

## Install

```sh
npm install @nickmous/astro-i18n
```

## Quick start

Translations are plain objects, grouped into **domains** (namespaces):

```ts
// src/i18n/nl.ts
export default {
    navigation: {
        home: 'Home',
        program: 'Programma',
    },
    countdown: {
        title: 'Hoelang moeten we nog wachten?',
        days: { one: 'dag', other: 'dagen' },
    },
};
```

Wire them up once per project:

```ts
// src/utils/i18n.ts
import { createI18n } from '@nickmous/astro-i18n';
import nl from '../i18n/nl.ts';
import en from '../i18n/en.ts';
import de from '../i18n/de.ts';

export const {
    getLangFromUrl,
    useTranslations,
    getTranslationData,
    languageKeys,
} = createI18n({
    languages: { nl, en, de },
    defaultLanguage: 'nl',
    languageNames: { nl: 'Nederlands', en: 'English', de: 'Deutsch' },
});
```

Then use it in a component:

```astro
---
import { getLangFromUrl, useTranslations } from '../utils/i18n.ts';

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang, 'navigation');
---
<a href="/">{t('home')}</a>
```

The default language defines the shape. `t('hom')` is a compile error; so is `t('title')` from the `navigation` domain.

## Interpolation

`{placeholder}` markers are replaced from a context object:

```ts
const t = useTranslations(lang, 'main', { year: 2026 });
t('hero.heading');                      // context from useTranslations
t('greeting', { name: 'Nick' });        // per-call context
t('greeting', new Map([['name', 'N']])); // Map also accepted
```

Values are inserted verbatim — no regex escaping surprises with `$&` or `\`.

## Plurals

A key whose value is an object of [CLDR categories](https://cldr.unicode.org/index/cldr-spec/plural-rules) is a plural node. `other` is required; the rest are optional:

```ts
// nl.ts
days: { one: 'dag', other: 'dagen' }

// pl.ts — Polish has three cardinal categories
days: { one: 'dzień', few: 'dni', many: 'dni', other: 'dnia' }
```

Read them with `t.plural`, which selects via `Intl.PluralRules` for the active language:

```ts
t.plural('days', 1);   // nl: 'dag'    pl: 'dzień'
t.plural('days', 3);   // nl: 'dagen'  pl: 'dni'
t.plural('days', 5);   // nl: 'dagen'  pl: 'dni'
```

`count` is added to the interpolation context automatically, so `'{count} dagen'` works without passing it twice.

Plural nodes are excluded from `t()`'s key union and string keys are excluded from `t.plural`'s — the two are type-level complements, so you cannot mix them up.

If a language code is not a valid BCP-47 tag, map it:

```ts
createI18n({ languages, defaultLanguage: 'gb', pluralLocales: { gb: 'en-GB' } });
```

## Structured content

`t()` only returns strings. For lists and objects, use `getTranslationData`, which keeps the full type:

```ts
const { rules } = getTranslationData(lang, 'terms');
rules.map((rule) => rule.title);
```

Array-valued keys are excluded from `t()`'s key union, so this is the only way to reach them.

## Missing keys

Set the policy at construction. Default is `fallback`:

| Policy | Behaviour |
| --- | --- |
| `fallback` | Retry in the default language, then return the key itself |
| `throw` | Raise `KeyNotFoundError` immediately, no fallback |
| `key` | Return the key itself, no fallback |

```ts
createI18n({
    languages,
    defaultLanguage: 'nl',
    onMissing: 'fallback',
    onMissingKey: ({ key, domain, language }) => {
        console.warn(`[i18n] missing ${language}/${domain}.${key}`);
    },
});
```

`onMissingKey` fires on every miss, before the policy is applied — useful for surfacing gaps in a build log without failing the build.

## Locale parity

The bug that actually bites a multi-locale project is a key added to the base language and forgotten in one translation. `checkParity` catches it:

```ts
import { checkParity } from '@nickmous/astro-i18n';
import { languages } from '../src/utils/i18n.ts';

it('has no missing translations', () => {
    expect(checkParity(languages, 'nl')).toEqual([]);
});
```

Arrays and plural nodes count as leaves, so list lengths and plural category counts may legitimately differ between languages without being reported.

## Routing

This package handles **string lookup only**. For URL routing, use Astro's built-in i18n:

```js
// astro.config.mjs
export default defineConfig({
    i18n: {
        defaultLocale: 'nl',
        locales: ['nl', 'en', 'de'],
        routing: { prefixDefaultLocale: false },
    },
});
```

`getLangFromUrl(Astro.url)` reads the first path segment and falls back to the default language, which matches `prefixDefaultLocale: false`.

## Loading locale files dynamically

`languages` is a plain object, so you can build it however you like — including a Vite glob. Keep one static import for the base language, because that is where the types come from:

```ts
import nl from '../i18n/nl.ts';

export const i18n = createI18n({
    languages: {
        nl,
        ...import.meta.glob('../i18n/*.ts', { eager: true, import: 'default' }),
    },
    defaultLanguage: 'nl',
});
```

Note that a glob returns `Record<string, unknown>`, so the globbed languages contribute no type information — only the statically imported base language does. That is the intended trade-off: one static import buys full key inference for every language.

## Bundle cost in Astro

In a prerendered Astro site, `t()` runs in component frontmatter at build time. Neither this package nor your translation data reaches the browser. Cost is zero bytes client-side unless you call it inside a client-side island.

## Development

```sh
npm run test        # runtime + type tests
npm run test:watch
npm run check       # tsc --noEmit
npm run build       # emit dist/
```

Type tests live in `test/*.test-d.ts` and run under `vitest --typecheck`. They are the primary regression guard: if the generics go slack, every runtime test still passes while the package silently loses its only real feature.

## Licence

MIT
