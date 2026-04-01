import { describe, it, expect } from 'vitest';
import { calcularIMC, parsePeso, parseAltura } from './imc';

describe('IMC Utilities - qa-automation-engineer', () => {
    describe('calcularIMC', () => {
        it('calculates normal BMI correctly', () => {
            expect(calcularIMC(70, 1.75)).toBe('22.9');
        });

        it('handles extreme limits (extreme obesity)', () => {
            expect(calcularIMC(300, 1.60)).toBe('117.2');
        });

        it('handles extreme limits (malnutrition)', () => {
            expect(calcularIMC(35, 1.80)).toBe('10.8');
        });

        it('returns null for zero or negative values', () => {
            expect(calcularIMC(70, 0)).toBeNull();
            expect(calcularIMC(0, 1.75)).toBeNull();
            expect(calcularIMC(-10, 1.75)).toBeNull();
        });

        it('returns null if arguments are missing/null', () => {
            expect(calcularIMC(null, 1.70)).toBeNull();
            expect(calcularIMC(70, null)).toBeNull();
            expect(calcularIMC(null, null)).toBeNull();
        });
    });

    describe('parsePeso', () => {
        it('parses comma and string values correctly', () => {
            expect(parsePeso('70,5 kg')).toBe(70.5);
            expect(parsePeso(' 80.2')).toBe(80.2);
            expect(parsePeso('')).toBeNull();
        });
    });

    describe('parseAltura', () => {
        it('converts cm to meters if above 3', () => {
            expect(parseAltura('175cm')).toBe(1.75);
            expect(parseAltura('1.75 m')).toBe(1.75);
            expect(parseAltura('1,80')).toBe(1.8);
        });
    });
});
