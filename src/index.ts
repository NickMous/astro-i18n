export { createI18n } from './create-i18n.ts';
export type {
    CreateI18nConfig,
    MissingKeyInfo,
    MissingKeyPolicy,
    Translate,
} from './create-i18n.ts';

export { checkParity } from './parity.ts';
export type { ParityIssue } from './parity.ts';

export { interpolate } from './interpolate.ts';
export { isPluralForms, selectPluralForm } from './plural.ts';

export { KeyNotFoundError, NoKeyError, UnknownLanguageError } from './errors.ts';

export { PLURAL_CATEGORIES } from './types.ts';
export type {
    Context,
    ContextValue,
    Dictionary,
    DomainMap,
    DottedKeys,
    LanguageMap,
    PluralCategory,
    PluralForms,
    PluralKeys,
} from './types.ts';
