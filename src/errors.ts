export class NoKeyError extends Error {
    override name = 'NoKeyError';
}

export class KeyNotFoundError extends Error {
    override name = 'KeyNotFoundError';

    // Declared explicitly rather than as a constructor parameter property:
    // parameter properties are not erasable syntax, so they break `tsc`'s
    // `erasableSyntaxOnly` and Node's native type stripping.
    readonly details: { key: string; domain: string; language: string };

    constructor(message: string, details: { key: string; domain: string; language: string }) {
        super(message);
        this.details = details;
    }
}

export class UnknownLanguageError extends Error {
    override name = 'UnknownLanguageError';
}
