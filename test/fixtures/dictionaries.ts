// Small stand-ins for a real project's locale files. Deliberately modelled on
// the awkward cases: nested branches, interpolation, structured arrays, and
// plural nodes in a language with three categories.

export interface HouseRule {
    title: string;
    paragraphs: string[];
}

const nl = {
    countdown: {
        title: 'Hoelang moeten we nog wachten?',
        days: { one: 'dag', other: 'dagen' },
        hours: { one: 'uur', other: 'uren' },
    },
    main: {
        hero: {
            heading: 'Oktoberfest {year}',
            subheading: 'Woerden',
        },
        logo: { alt: 'Logo' },
        greeting: 'Hallo {name}, welkom bij {event}',
    },
    terms: {
        heading: 'Huisregels',
        rules: [
            { title: 'Eigen risico', paragraphs: ['Betreden op eigen risico.'] },
        ] as HouseRule[],
    },
} as const satisfies Record<string, Record<string, unknown>>;

const en = {
    countdown: {
        title: 'How long do we have to wait?',
        days: { one: 'day', other: 'days' },
        hours: { one: 'hour', other: 'hours' },
    },
    main: {
        hero: {
            heading: 'Oktoberfest {year}',
            subheading: 'Woerden',
        },
        logo: { alt: 'Logo' },
        greeting: 'Hello {name}, welcome to {event}',
    },
    terms: {
        heading: 'House rules',
        rules: [
            { title: 'At your own risk', paragraphs: ['Entry is at your own risk.'] },
        ] as HouseRule[],
    },
} as const satisfies Record<string, Record<string, unknown>>;

// Polish has three cardinal categories (one / few / many), which is the case
// that catches an off-by-one a two-form language never would.
const pl = {
    countdown: {
        title: 'Ile jeszcze musimy czekać?',
        days: { one: 'dzień', few: 'dni', many: 'dni', other: 'dnia' },
        hours: { one: 'godzina', few: 'godziny', many: 'godzin', other: 'godziny' },
    },
    main: {
        hero: {
            heading: 'Oktoberfest {year}',
            subheading: 'Woerden',
        },
        logo: { alt: 'Logo' },
        greeting: 'Cześć {name}, witamy na {event}',
    },
    terms: {
        heading: 'Regulamin',
        rules: [
            { title: 'Na własne ryzyko', paragraphs: ['Wstęp na własne ryzyko.'] },
        ] as HouseRule[],
    },
} as const satisfies Record<string, Record<string, unknown>>;

export const languages = { nl, en, pl };
export const defaultLanguage = 'nl';

/** A language with a hole in it, for the parity suite. */
export const incompleteLanguages = {
    nl,
    de: {
        countdown: {
            title: 'Wie lange müssen wir warten?',
            days: { one: 'Tag', other: 'Tage' },
            // `countdown.hours` deliberately absent.
        },
        main: {
            hero: { heading: 'Oktoberfest {year}', subheading: 'Woerden' },
            logo: { alt: 'Logo' },
            greeting: 'Hallo {name}, willkommen bei {event}',
            // Not present in the base language.
            farewell: 'Tschüss',
        },
        terms: {
            heading: 'Hausordnung',
            rules: [] as HouseRule[],
        },
    },
};
