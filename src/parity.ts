import { isPluralForms } from './plural.ts';
import type { LanguageMap } from './types.ts';

export interface ParityIssue {
    language: string;
    /** Paths present in the base language but absent here. */
    missing: string[];
    /** Paths present here but absent from the base language. */
    extra: string[];
}

/**
 * Collects every leaf path in a language, as `domain.a.b`. Arrays and plural
 * nodes count as leaves — their internals are allowed to differ, since plural
 * categories legitimately vary by language.
 */
function collectPaths(domains: Record<string, unknown>): Set<string> {
    const paths = new Set<string>();

    const walk = (node: unknown, prefix: string): void => {
        if (typeof node !== 'object' || node === null || Array.isArray(node) || isPluralForms(node)) {
            paths.add(prefix);
            return;
        }
        for (const [key, value] of Object.entries(node)) {
            walk(value, prefix === '' ? key : `${prefix}.${key}`);
        }
    };

    walk(domains, '');
    return paths;
}

/**
 * Compares every language's key set against the base language.
 *
 * This is the bug that actually bites a multi-locale project: a key gets added
 * to the base language and one translation is forgotten. Assert on an empty
 * result in a test.
 */
export function checkParity<L extends LanguageMap>(
    languages: L,
    base: Extract<keyof L, string>,
): ParityIssue[] {
    const basePaths = collectPaths(languages[base] ?? {});
    const issues: ParityIssue[] = [];

    for (const language of Object.keys(languages)) {
        if (language === base) continue;

        const paths = collectPaths(languages[language] ?? {});
        const missing = [...basePaths].filter((path) => !paths.has(path)).sort();
        const extra = [...paths].filter((path) => !basePaths.has(path)).sort();

        if (missing.length > 0 || extra.length > 0) {
            issues.push({ language, missing, extra });
        }
    }

    return issues;
}
