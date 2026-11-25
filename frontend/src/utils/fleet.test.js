import { fleetFits } from './fleet';

test('klasyczna flota mieści się na planszy', () => {
  expect(fleetFits({ 4: 1, 3: 2, 2: 2, 1: 4 })).toBe(true);
});

test('za duża albo pusta flota się nie mieści', () => {
  expect(fleetFits({ 4: 5, 3: 5, 2: 5, 1: 5 })).toBe(false);
  expect(fleetFits({ 4: 5, 3: 5, 2: 5 })).toBe(false);
  expect(fleetFits({ 4: 0, 3: 0, 2: 0, 1: 0 })).toBe(false);
});
