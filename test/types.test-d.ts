import { describe, expectTypeOf, it } from 'vitest';
import { createI18n } from '../src/index.ts';
import type { DottedKeys, PluralKeys } from '../src/index.ts';
import { defaultLanguage, languages, type HouseRule } from './fixtures/dictionaries.ts';

const i18n = createI18n({ languages, defaultLanguage });

// These assertions are the real regression guard for this package. If the
// factory's generics ever go slack — `Domain` widening to `string`, `DottedKeys`
// collapsing to `string` — every runtime test still passes while the package
// loses the only feature it exists for. The `@ts-expect-error` lines fail the
// build at exactly that moment: they error if the expression stops erroring.

describe('language inference', () => {
    it('narrows the language union to the keys of the map', () => {
        expectTypeOf(i18n.defaultLanguage).toEqualTypeOf<'nl'>();
        expectTypeOf(i18n.getLangFromUrl).returns.toEqualTypeOf<'nl' | 'en' | 'pl'>();
    });

    it('rejects a language that is not in the map', () => {
        // @ts-expect-error — 'fr' is not a configured language
        i18n.useTranslations('fr', 'countdown');
    });
});

describe('domain inference', () => {
    it('narrows domains to the keys of the default language', () => {
        expectTypeOf(i18n.useTranslations)
            .parameter(1)
            .toEqualTypeOf<'countdown' | 'main' | 'terms'>();
    });

    it('rejects an unknown domain', () => {
        // @ts-expect-error — 'sponsors' is not a domain in the fixtures
        i18n.useTranslations('nl', 'sponsors');
    });
});

describe('key inference', () => {
    const t = i18n.useTranslations('nl', 'main');

    it('accepts nested dotted paths', () => {
        expectTypeOf(t('hero.heading')).toBeString();
        expectTypeOf(t('logo.alt')).toBeString();
    });

    it('rejects a key that does not exist', () => {
        // @ts-expect-error — no such key
        t('hero.nope');
    });

    it('rejects a branch, which is not a string leaf', () => {
        // @ts-expect-error — 'hero' is a branch, not a leaf
        t('hero');
    });

    it('rejects a key from a different domain without switching domain', () => {
        // @ts-expect-error — 'title' belongs to countdown, not main
        t('title');
    });

    it('re-narrows keys when the domain argument switches', () => {
        expectTypeOf(t('title', {}, 'countdown')).toBeString();
        // @ts-expect-error — 'hero.heading' is not a countdown key
        t('hero.heading', {}, 'countdown');
    });
});

describe('DottedKeys', () => {
    it('excludes arrays, which t() cannot return', () => {
        expectTypeOf<DottedKeys<(typeof languages)['nl']['terms']>>().toEqualTypeOf<'heading'>();
    });

    it('excludes plural nodes, which belong to t.plural', () => {
        expectTypeOf<DottedKeys<(typeof languages)['nl']['countdown']>>().toEqualTypeOf<'title'>();
    });

    it('does not mistake a branch containing "other" for a plural node', () => {
        type Branch = { readonly other: string; readonly title: string };
        expectTypeOf<DottedKeys<{ readonly nested: Branch }>>()
            .toEqualTypeOf<'nested.other' | 'nested.title'>();
    });
});

describe('PluralKeys', () => {
    const t = i18n.useTranslations('pl', 'countdown');

    it('is the complement of DottedKeys over object leaves', () => {
        expectTypeOf<PluralKeys<(typeof languages)['nl']['countdown']>>()
            .toEqualTypeOf<'days' | 'hours'>();
    });

    it('accepts a plural key', () => {
        expectTypeOf(t.plural('days', 3)).toBeString();
    });

    it('rejects a plain string key', () => {
        // @ts-expect-error — 'title' is a string leaf, not a plural node
        t.plural('title', 3);
    });

    it('requires a count', () => {
        // @ts-expect-error — count is not optional
        t.plural('days');
    });
});

describe('getTranslationData', () => {
    it('preserves structured types through the factory', () => {
        expectTypeOf(i18n.getTranslationData('en', 'terms').rules)
            .toEqualTypeOf<HouseRule[]>();
    });

    it('rejects an unknown domain', () => {
        // @ts-expect-error — not a domain
        i18n.getTranslationData('nl', 'nope');
    });
});

describe('context', () => {
    const t = i18n.useTranslations('nl', 'main');

    it('accepts both an object and a Map', () => {
        expectTypeOf(t('greeting', { name: 'Nick' })).toBeString();
        expectTypeOf(t('greeting', new Map([['name', 'Nick']]))).toBeString();
    });

    it('rejects a non-scalar context value', () => {
        // @ts-expect-error — only string | number are interpolatable
        t('greeting', { name: { first: 'Nick' } });
    });
});
