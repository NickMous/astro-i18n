/** A node inside a translation domain — a branch, or a leaf value. */
export type Dictionary = { readonly [key: string]: unknown };

/** One language: domain name -> dictionary. */
export type DomainMap = { readonly [domain: string]: Dictionary };

/** Every language, keyed by language code. */
export type LanguageMap = { readonly [language: string]: DomainMap };

export type ContextValue = string | number;

/**
 * Interpolation values. A plain object is the ergonomic form; `Map` is accepted
 * so call sites written against the original helper keep working unchanged.
 */
export type Context =
    | Map<string, ContextValue>
    | Readonly<Record<string, ContextValue>>;

export const PLURAL_CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other'] as const;

export type PluralCategory = (typeof PLURAL_CATEGORIES)[number];

/**
 * A plural node. `other` is required because every CLDR locale defines it, so it
 * is always a safe fallback when a more specific category is absent.
 */
export type PluralForms = Partial<Record<PluralCategory, string>> & { other: string };

/**
 * True when `T` is a plural node: it has `other` *and* no keys outside the CLDR
 * categories. The second half matters — without it, an ordinary branch that
 * happens to contain a key called `other` would be misread as a plural node.
 */
type IsPluralNode<T> = [Exclude<keyof T, PluralCategory>] extends [never]
    ? 'other' extends keyof T
        ? true
        : false
    : false;

/**
 * The union of dotted paths to plain-string leaves.
 * `{ a: { b: '' }, c: '' }` -> `'a.b' | 'c'`.
 *
 * Arrays (structured content, read via `getTranslationData`) and plural nodes
 * (read via `t.plural`) are excluded — neither can be returned by `t()`.
 */
export type DottedKeys<T> = T extends string
    ? never
    : {
        [K in Extract<keyof T, string>]: T[K] extends string
            ? K
            : T[K] extends readonly unknown[]
                ? never
                : IsPluralNode<T[K]> extends true
                    ? never
                    : `${K}.${DottedKeys<T[K]>}`;
    }[Extract<keyof T, string>];

/**
 * The union of dotted paths to plural nodes — the valid keys for `t.plural`.
 * Exactly the complement of {@link DottedKeys} over object leaves.
 */
export type PluralKeys<T> = T extends string
    ? never
    : {
        [K in Extract<keyof T, string>]: T[K] extends string
            ? never
            : T[K] extends readonly unknown[]
                ? never
                : IsPluralNode<T[K]> extends true
                    ? K
                    : `${K}.${PluralKeys<T[K]>}`;
    }[Extract<keyof T, string>];
