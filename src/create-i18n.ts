import { KeyNotFoundError, NoKeyError } from './errors.ts';
import { contextEntries, interpolate } from './interpolate.ts';
import { isPluralForms, selectPluralForm } from './plural.ts';
import type {
    Context,
    ContextValue,
    DomainMap,
    DottedKeys,
    LanguageMap,
    PluralForms,
    PluralKeys,
} from './types.ts';

/**
 * What happens when a key resolves to nothing.
 *
 * - `fallback` — retry in the default language, then return the key itself.
 * - `throw`    — raise `KeyNotFoundError` immediately, without falling back.
 * - `key`      — return the key itself, without falling back.
 */
export type MissingKeyPolicy = 'fallback' | 'throw' | 'key';

export interface MissingKeyInfo {
    key: string;
    domain: string;
    language: string;
}

export interface CreateI18nConfig<
    L extends LanguageMap,
    Base extends Extract<keyof L, string>,
> {
    /** Every language, keyed by language code. */
    languages: L;
    /** The language whose shape defines the valid domains and keys. */
    defaultLanguage: Base;
    /** Each language's endonym, for a language switcher. */
    languageNames?: Readonly<Record<Extract<keyof L, string>, string>>;
    /** @default 'fallback' */
    onMissing?: MissingKeyPolicy;
    /**
     * BCP-47 tag per language for `Intl.PluralRules`, when the language key is
     * not itself a valid tag (e.g. `{ gb: 'en-GB' }`).
     */
    pluralLocales?: Partial<Readonly<Record<Extract<keyof L, string>, string>>>;
    /** Called for every miss, before the policy is applied. Useful for logging. */
    onMissingKey?: (info: MissingKeyInfo) => void;
}

export interface Translate<
    L extends LanguageMap,
    Base extends Extract<keyof L, string>,
    D extends Extract<keyof L[Base], string>,
> {
    /** Resolves a plain-string key. */
    <D2 extends Extract<keyof L[Base], string> = D>(
        key: DottedKeys<L[Base][D2]>,
        context?: Context,
        domain?: D2,
        language?: Extract<keyof L, string>,
    ): string;

    /**
     * Resolves a plural node, picking the CLDR category for `count` in the
     * active language. `count` is added to the interpolation context, so
     * `{count}` works without passing it twice.
     */
    plural<D2 extends Extract<keyof L[Base], string> = D>(
        key: PluralKeys<L[Base][D2]>,
        count: number,
        context?: Context,
        domain?: D2,
        language?: Extract<keyof L, string>,
    ): string;
}

function resolveNode(root: DomainMap | undefined, domain: string, parts: string[]): unknown {
    if (root === undefined) return undefined;

    let node: unknown = root[domain];
    for (const part of parts) {
        if (typeof node !== 'object' || node === null || !(part in node)) return undefined;
        node = (node as Record<string, unknown>)[part];
    }
    return node;
}

export function createI18n<
    L extends LanguageMap,
    Base extends Extract<keyof L, string>,
>(config: CreateI18nConfig<L, Base>) {
    type Language = Extract<keyof L, string>;
    type Domain = Extract<keyof L[Base], string>;

    const {
        languages,
        defaultLanguage,
        languageNames,
        onMissing = 'fallback',
        pluralLocales,
        onMissingKey,
    } = config;

    const languageKeys = Object.keys(languages) as Language[];

    /**
     * Walks to a key, applying the miss policy. Returns `null` when the caller
     * should fall back to echoing the key.
     */
    function lookup(
        language: Language,
        domain: string,
        key: string,
        expect: (node: unknown) => boolean,
    ): unknown {
        const parts = key.split('.');
        if (parts.length === 1 && parts[0] === '') {
            throw new NoKeyError('Empty key provided');
        }

        let node = resolveNode(languages[language], domain, parts);
        if (expect(node)) return node;

        onMissingKey?.({ key, domain, language });

        if (onMissing === 'throw') {
            throw new KeyNotFoundError(
                `Translation key not found: ${domain}.${key} (${language})`,
                { key, domain, language },
            );
        }

        if (onMissing === 'fallback' && language !== defaultLanguage) {
            node = resolveNode(languages[defaultLanguage], domain, parts);
            if (expect(node)) return node;
        }

        return null;
    }

    function getLangFromUrl(url: URL): Language {
        const [, segment] = url.pathname.split('/');
        if (segment !== undefined && segment in languages) return segment as Language;
        return defaultLanguage;
    }

    function useTranslations<D extends Domain>(
        lang: Language,
        domain: D,
        context: Context = {},
    ): Translate<L, Base, D> {
        const parentLanguage = lang;
        const parentDomain = domain;
        const parentContext = context;

        const translate = (
            key: string,
            ctx: Context = parentContext,
            dom: string = parentDomain,
            language: Language = parentLanguage,
        ): string => {
            const node = lookup(language, dom, key, (value) => typeof value === 'string');
            if (node === null) return key;
            return interpolate(node as string, ctx);
        };

        translate.plural = (
            key: string,
            count: number,
            ctx: Context = parentContext,
            dom: string = parentDomain,
            language: Language = parentLanguage,
        ): string => {
            const node = lookup(language, dom, key, isPluralForms);
            if (node === null) return key;

            const locale = pluralLocales?.[language] ?? language;
            const form = selectPluralForm(node as PluralForms, count, locale);

            // `count` is merged in so `{count}` resolves without the caller
            // having to pass it a second time; an explicit context wins.
            const merged = new Map<string, ContextValue>([['count', count]]);
            for (const [k, v] of contextEntries(ctx)) merged.set(k, v);

            return interpolate(form, merged);
        };

        return translate as Translate<L, Base, D>;
    }

    /**
     * A domain's raw, typed data — including structured values (arrays of
     * objects) that `t()` cannot return. Typed against the default language,
     * which assumes the locales are parallel; `checkParity` verifies that.
     */
    function getTranslationData<D extends Domain>(lang: Language, domain: D): L[Base][D] {
        const forLanguage = languages[lang]?.[domain];
        if (forLanguage !== undefined) return forLanguage as L[Base][D];
        return languages[defaultLanguage]?.[domain] as L[Base][D];
    }

    return {
        languages,
        languageKeys,
        defaultLanguage,
        languageNames,
        getLangFromUrl,
        useTranslations,
        getTranslationData,
    };
}
