"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractYear = extractYear;
const moment_1 = __importDefault(require("moment"));
function extractYear(dateString) {
    // Convert dateString to a string if it's not already
    const dateStr = String(dateString);
    // Regular expression to match four-digit years
    const yearRegex = /\b(19|20)\d{2}\b/;
    // Try to extract the year using regex
    const yearMatch = dateStr.match(yearRegex);
    if (yearMatch) {
        return calculateAge(parseInt(yearMatch[0], 10));
    }
    // List of common date formats to try parsing
    const dateFormats = [
        'MMM D, YYYY', // Aug 9, 2024
        'D MMM, YYYY', // 9 Aug, 2024
        'MM/DD/YYYY', // 08/09/2024
        'DD/MM/YYYY', // 09/08/2024
        'YYYY/MM/DD', // 2024/08/09
        'YYYY-MM-DD', // 2024-08-09
        'D/M/YYYY', // 8/9/2024
        'YYYY', // 2024
    ];
    // Try to parse the date using each format
    for (const format of dateFormats) {
        const date = (0, moment_1.default)(dateStr, format, true);
        if (date.isValid()) {
            return calculateAge(date.year());
        }
    }
    // If all parsing attempts fail, return null
    return null;
}
function calculateAge(birthYear) {
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
}
