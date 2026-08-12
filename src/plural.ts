import { PLURAL_CATEGORIES, type PluralCategory, type PluralForms } from './types.ts';

const CATEGORIES = new Set<string>(PLURAL_CATEGORIES);

/**
 * Runtime counterpart of the type-level `IsPluralNode` check: an object whose
 * keys are all CLDR categories, with `other` present.
 */
export function isPluralForms(node: unknown): node is PluralForms {
    if (typeof node !== 'object' || node === null || Array.isArray(node)) return false;
    const keys = Object.keys(node);
    if (keys.length === 0) return false;
    if (!keys.every((key) => CATEGORIES.has(key))) return false;
    return typeof (node as Record<string, unknown>)['other'] === 'string';
}

// `Intl.PluralRules` construction is not free and locales repeat constantly
// across a render, so instances are memoised per locale+type.
const rulesCache = new Map<string, Intl.PluralRules>();

function getRules(locale: string, type: Intl.PluralRuleType): Intl.PluralRules {
    const cacheKey = `${locale}:${type}`;
    let rules = rulesCache.get(cacheKey);
    if (!rules) {
        rules = new Intl.PluralRules(locale, { type });
        rulesCache.set(cacheKey, rules);
    }
    return rules;
}

/**
 * Picks the right plural form for `count` in `locale`, falling back to `other`
 * when the dictionary omits the selected category.
 */
export function selectPluralForm(
    forms: PluralForms,
    count: number,
    locale: string,
    type: Intl.PluralRuleType = 'cardinal',
): string {
    const category = getRules(locale, type).select(count) as PluralCategory;
    return forms[category] ?? forms.other;
}
