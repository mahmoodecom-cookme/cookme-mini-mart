import { test, expect } from 'bun:test';
import { stepFeature, featureOffset } from './feature-carousel';
test('Easy returns starts centered in the six-slide ring', () => { expect(featureOffset(1, 1)).toBe(0); });
test('left action brings the left card to center and wraps endlessly', () => { expect(stepFeature(1, -1)).toBe(0); expect(stepFeature(0, -1)).toBe(5); expect(featureOffset(1, 0)).toBe(1); });
test('right action brings the right card to center and wraps endlessly', () => { expect(stepFeature(1, 1)).toBe(2); expect(stepFeature(5, 1)).toBe(0); });
test('five slots always contain unique slides with one hidden behind', () => { for(let c=0;c<6;c++){const offsets=Array.from({length:6},(_,s)=>featureOffset(s,c));expect(new Set(offsets).size).toBe(6);expect(offsets.filter(o=>Math.abs(o)<=2).length).toBe(5);} });
