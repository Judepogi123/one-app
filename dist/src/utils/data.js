"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLevel = exports.handleGender = exports.handleSpecialChar = exports.handleGenTagID = void 0;
const handleGenTagID = (min = 100000, max = 999999) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
exports.handleGenTagID = handleGenTagID;
// Example usage:
const handleSpecialChar = (char, value) => {
    const temp = value.split("");
    if (temp.at(-1) === char) {
        return temp.slice(0, -1).join("");
    }
    return value;
};
exports.handleSpecialChar = handleSpecialChar;
const handleGender = (value) => {
    if (value === "M" && value !== undefined) {
        return "Male";
    }
    if (value === "F" && value !== undefined) {
        return "Female";
    }
    return "Unknown";
};
exports.handleGender = handleGender;
const handleLevel = (value) => {
    switch (value) {
        case 0:
            return "Voter";
        case 1:
            return "TL";
        case 2:
            return "PC";
        case 3:
            return "BC";
        default:
            return "Voter";
    }
};
exports.handleLevel = handleLevel;
