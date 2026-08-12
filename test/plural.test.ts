import { describe, expect, it } from 'vitest';
import { createI18n, isPluralForms } from '../src/index.ts';
import { defaultLanguage, languages } from './fixtures/dictionaries.ts';

const i18n = createI18n({ languages, defaultLanguage });

describe('isPluralForms', () => {
    it('accepts a node whose keys are all CLDR categories', () => {
        expect(isPluralForms({ one: 'dag', other: 'dagen' })).toBe(true);
    });

    it('rejects a branch that merely contains an "other" key', () => {
        // The case that makes a keys-are-a-subset check necessary: without it,
        // this ordinary branch would be misread as a plural node.
        expect(isPluralForms({ other: 'Anders', title: 'Titel' })).toBe(false);
    });

    it('rejects nodes without "other"', () => {
        expect(isPluralForms({ one: 'dag' })).toBe(false);
    });

    it.each([['string', 'x'], ['null', null], ['array', []], ['empty', {}]])(
        'rejects %s',
        (_label, value) => {
            expect(isPluralForms(value)).toBe(false);
        },
    );
});

describe('two-form languages', () => {
    const t = i18n.useTranslations('nl', 'countdown');

    it.each([
        [0, 'dagen'],
        [1, 'dag'],
        [2, 'dagen'],
        [5, 'dagen'],
    ])('nl: %i -> %s', (count, expected) => {
        expect(t.plural('days', count)).toBe(expected);
    });
});

describe('three-form languages', () => {
    const t = i18n.useTranslations('pl', 'countdown');

    // Polish cardinals: 1 = one, 2-4 = few, 5+ = many.
    it.each([
        [1, 'dzień'],
        [2, 'dni'],
        [3, 'dni'],
        [4, 'dni'],
        [5, 'dni'],
        [22, 'dni'],
    ])('pl days: %i -> %s', (count, expected) => {
        expect(t.plural('days', count)).toBe(expected);
    });

    it.each([
        [1, 'godzina'],
        [3, 'godziny'],
        [5, 'godzin'],
        [11, 'godzin'],
    ])('pl hours: %i -> %s', (count, expected) => {
        expect(t.plural('hours', count)).toBe(expected);
    });

    it('distinguishes few from many, which a two-form language cannot', () => {
        expect(t.plural('hours', 3)).not.toBe(t.plural('hours', 5));
    });
});

describe('plural context', () => {
    it('makes {count} available without passing it twice', () => {
        const withCount = createI18n({
            languages: {
                nl: { countdown: { days: { one: '{count} dag', other: '{count} dagen' } } },
            },
            defaultLanguage: 'nl',
        });
        const t = withCount.useTranslations('nl', 'countdown');

        expect(t.plural('days', 1)).toBe('1 dag');
        expect(t.plural('days', 7)).toBe('7 dagen');
    });

    it('lets an explicit context override count', () => {
        const withCount = createI18n({
            languages: {
                nl: { countdown: { days: { one: '{count} dag', other: '{count} dagen' } } },
            },
            defaultLanguage: 'nl',
        });
        const t = withCount.useTranslations('nl', 'countdown');

        expect(t.plural('days', 7, { count: 'zeven' })).toBe('zeven dagen');
    });
});

describe('pluralLocales', () => {
    it('maps a language key onto a BCP-47 tag', () => {
        const i18nGb = createI18n({
            languages: {
                gb: { countdown: { days: { one: 'day', other: 'days' } } },
            },
            defaultLanguage: 'gb',
            pluralLocales: { gb: 'en-GB' },
        });
        const t = i18nGb.useTranslations('gb', 'countdown');

        expect(t.plural('days', 1)).toBe('day');
        expect(t.plural('days', 3)).toBe('days');
    });
});

describe('plural fallback', () => {
    it('falls back to "other" when the selected category is absent', () => {
        const sparse = createI18n({
            languages: {
                pl: { countdown: { days: { other: 'dni' } } },
            },
            defaultLanguage: 'pl',
        });
        const t = sparse.useTranslations('pl', 'countdown');

        expect(t.plural('days', 1)).toBe('dni');
        expect(t.plural('days', 3)).toBe('dni');
    });

    it('returns the key when the node is not a plural node', () => {
        const t = i18n.useTranslations('nl', 'countdown');
        expect(t.plural('title' as never, 3)).toBe('title');
    });
});
