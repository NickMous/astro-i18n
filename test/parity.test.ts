import { describe, expect, it } from 'vitest';
import { checkParity } from '../src/index.ts';
import { incompleteLanguages, languages } from './fixtures/dictionaries.ts';

describe('checkParity', () => {
    it('reports nothing when every language has the same keys', () => {
        expect(checkParity(languages, 'nl')).toEqual([]);
    });

    it('reports a key missing from a translation', () => {
        const [issue] = checkParity(incompleteLanguages, 'nl');
        expect(issue?.language).toBe('de');
        expect(issue?.missing).toContain('countdown.hours');
    });

    it('reports a key that exists only in a translation', () => {
        const [issue] = checkParity(incompleteLanguages, 'nl');
        expect(issue?.extra).toContain('main.farewell');
    });

    it('treats plural nodes as leaves, so category counts may differ', () => {
        // Dutch has one/other, Polish has one/few/many/other. That is correct,
        // not a parity failure, so the walk must stop at the plural node.
        const issues = checkParity({ nl: languages.nl, pl: languages.pl }, 'nl');
        expect(issues).toEqual([]);
    });

    it('treats arrays as leaves, so list lengths may differ', () => {
        const issues = checkParity(incompleteLanguages, 'nl');
        expect(issues[0]?.missing).not.toContain('terms.rules');
    });

    // This is the assertion a consuming project should copy into its own suite.
    it('is the shape of a real project guard', () => {
        expect(checkParity(languages, 'nl')).toEqual([]);
    });
});
