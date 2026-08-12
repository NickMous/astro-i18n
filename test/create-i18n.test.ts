import { describe, expect, it, vi } from 'vitest';
import { createI18n } from '../src/index.ts';
import { KeyNotFoundError, NoKeyError } from '../src/errors.ts';
import { defaultLanguage, languages } from './fixtures/dictionaries.ts';

const i18n = createI18n({ languages, defaultLanguage });

describe('lookup', () => {
    it('resolves a top-level key', () => {
        const t = i18n.useTranslations('nl', 'countdown');
        expect(t('title')).toBe('Hoelang moeten we nog wachten?');
    });

    it('resolves a nested dotted key', () => {
        const t = i18n.useTranslations('en', 'main');
        expect(t('hero.subheading')).toBe('Woerden');
    });

    it('resolves across domains via the third argument', () => {
        const t = i18n.useTranslations('nl', 'countdown');
        expect(t('logo.alt', {}, 'main')).toBe('Logo');
    });

    it('resolves across languages via the fourth argument', () => {
        const t = i18n.useTranslations('nl', 'countdown');
        expect(t('title', {}, 'countdown', 'en')).toBe('How long do we have to wait?');
    });

    it('rejects an empty key', () => {
        const t = i18n.useTranslations('nl', 'countdown');
        expect(() => t('' as never)).toThrow(NoKeyError);
    });

    it('does not return a branch as a string', () => {
        const t = i18n.useTranslations('nl', 'main');
        // `hero` is a branch, not a leaf — it must miss rather than stringify.
        expect(t('hero' as never)).toBe('hero');
    });
});

describe('interpolation', () => {
    it('accepts a plain object', () => {
        const t = i18n.useTranslations('en', 'main');
        expect(t('greeting', { name: 'Nick', event: 'Oktoberfest' }))
            .toBe('Hello Nick, welcome to Oktoberfest');
    });

    it('accepts a Map, for call sites written against the original helper', () => {
        const t = i18n.useTranslations('en', 'main');
        const context = new Map([['name', 'Nick'], ['event', 'Oktoberfest']]);
        expect(t('greeting', context)).toBe('Hello Nick, welcome to Oktoberfest');
    });

    it('inherits the context passed to useTranslations', () => {
        const t = i18n.useTranslations('nl', 'main', { year: 2026 });
        expect(t('hero.heading')).toBe('Oktoberfest 2026');
    });

    it('inserts values verbatim, without regex escaping surprises', () => {
        const t = i18n.useTranslations('en', 'main');
        expect(t('greeting', { name: '$&', event: 'a\\b' }))
            .toBe('Hello $&, welcome to a\\b');
    });

    it('leaves unmatched placeholders alone', () => {
        const t = i18n.useTranslations('en', 'main');
        expect(t('greeting', { name: 'Nick' })).toBe('Hello Nick, welcome to {event}');
    });
});

describe('missing key policy', () => {
    it('falls back to the default language by default', () => {
        const partial = { nl: languages.nl, fr: { countdown: {}, main: {}, terms: {} } };
        const fr = createI18n({ languages: partial, defaultLanguage: 'nl' });
        const t = fr.useTranslations('fr', 'countdown');
        expect(t('title' as never)).toBe('Hoelang moeten we nog wachten?');
    });

    it('returns the key when it is missing everywhere', () => {
        const t = i18n.useTranslations('nl', 'countdown');
        expect(t('nope.not.here' as never)).toBe('nope.not.here');
    });

    it('throws under the throw policy, without falling back', () => {
        const strict = createI18n({ languages, defaultLanguage, onMissing: 'throw' });
        const t = strict.useTranslations('en', 'countdown');
        expect(() => t('nope' as never)).toThrow(KeyNotFoundError);
    });

    it('returns the key under the key policy, without falling back', () => {
        const partial = { nl: languages.nl, fr: { countdown: {}, main: {}, terms: {} } };
        const echo = createI18n({ languages: partial, defaultLanguage: 'nl', onMissing: 'key' });
        const t = echo.useTranslations('fr', 'countdown');
        expect(t('title' as never)).toBe('title');
    });

    it('reports every miss to onMissingKey before applying the policy', () => {
        const onMissingKey = vi.fn();
        const observed = createI18n({ languages, defaultLanguage, onMissingKey });
        const t = observed.useTranslations('en', 'countdown');

        t('nope' as never);

        expect(onMissingKey).toHaveBeenCalledWith({
            key: 'nope',
            domain: 'countdown',
            language: 'en',
        });
    });
});

describe('getLangFromUrl', () => {
    it.each([
        ['https://example.com/en/program', 'en'],
        ['https://example.com/pl/', 'pl'],
        ['https://example.com/programma', 'nl'],
        ['https://example.com/', 'nl'],
        ['https://example.com/fr/program', 'nl'],
    ])('%s -> %s', (url, expected) => {
        expect(i18n.getLangFromUrl(new URL(url))).toBe(expected);
    });
});

describe('getTranslationData', () => {
    it('returns structured content that t() cannot express', () => {
        const rules = i18n.getTranslationData('en', 'terms').rules;
        expect(rules).toHaveLength(1);
        expect(rules[0]?.title).toBe('At your own risk');
    });

    it('falls back to the default language for an unknown language', () => {
        const rules = i18n.getTranslationData('fr' as never, 'terms').rules;
        expect(rules[0]?.title).toBe('Eigen risico');
    });
});
