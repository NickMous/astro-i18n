import type { Context, ContextValue } from './types.ts';

export function contextEntries(context: Context): [string, ContextValue][] {
    return context instanceof Map ? [...context.entries()] : Object.entries(context);
}

/**
 * Replaces `{name}` placeholders with context values.
 *
 * Uses split/join rather than a `RegExp` so placeholder names and replacement
 * values need no escaping — a value containing `$&` or `\` is inserted verbatim.
 */
export function interpolate(template: string, context: Context): string {
    let result = template;
    for (const [search, replace] of contextEntries(context)) {
        result = result.split(`{${search}}`).join(String(replace));
    }
    return result;
}
