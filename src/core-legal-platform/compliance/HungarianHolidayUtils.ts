/**
 * @file HungarianHolidayUtils.ts
 * @description Provides utility functions for handling Hungarian-specific date calculations.
 * This module includes logic to determine public holidays, including movable feasts like Easter,
 * and to calculate business days by skipping weekends and official holidays. It is designed to be
 * a self-contained unit for country-specific date logic.
 */
import { addDays, getYear, parseISO } from 'date-fns';

/**
 * Calculates the date of Easter Sunday for a given year using the Anonymous Gregorian algorithm.
 * @param year The year to calculate Easter for.
 * @returns The date of Easter Sunday.
 */
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

/**
 * Returns a list of all public holidays in Hungary for a given year.
 * @param year The year to get holidays for.
 * @returns An array of Dates representing the public holidays.
 */
function getHungarianPublicHolidays(year: number): Date[] {
  const easterSunday = getEasterSunday(year);
  
  return [
    new Date(year, 0, 1),   // New Year's Day
    new Date(year, 2, 15),  // 1848 Revolution Memorial Day
    addDays(easterSunday, -2), // Good Friday
    addDays(easterSunday, 1),  // Easter Monday
    new Date(year, 4, 1),   // Labour Day
    addDays(easterSunday, 50), // Pentecost Monday
    new Date(year, 7, 20),  // State Foundation Day
    new Date(year, 9, 23),  // 1956 Revolution Memorial Day
    new Date(year, 10, 1),  // All Saints' Day
    new Date(year, 11, 25), // Christmas Day
    new Date(year, 11, 26), // Second Day of Christmas
  ];
}

/**
 * Checks if a given date is a public holiday in Hungary.
 * @param date The date to check.
 * @returns True if the date is a public holiday, false otherwise.
 */
export function isHungarianPublicHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const holidays = getHungarianPublicHolidays(year);
  return holidays.some(holiday => holiday.getTime() === date.getTime());
}

/**
 * Adds business days to a date, skipping weekends and public holidays.
 * @param date The starting date.
 * @param days The number of business days to add.
 * @returns The new date.
 */
export function addBusinessDays(date: Date, days: number): Date {
    let result = new Date(date);
    let addedDays = 0;
    while (addedDays < days) {
        result = addDays(result, 1);
        const dayOfWeek = result.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHungarianPublicHoliday(result)) {
            addedDays++;
        }
    }
    return result;
} 