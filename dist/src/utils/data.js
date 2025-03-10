"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePercentage = exports.alphabeticCaps = exports.alphabetic = exports.handleTeamVoters = exports.removeAllSpaces = exports.handleDataType = exports.handleLevelLabel = exports.handleLevel = exports.handleGender = exports.handleSpecialChar = exports.handleGenTagID = void 0;
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
const handleLevelLabel = (level, type) => {
    const levelList = [
        { name: "TL", value: 1 },
        { name: "PC", value: 2 },
        { name: "BC", value: 3 },
    ];
    if (type === 1) {
        return levelList.find((l) => l.name === level).name;
    }
    return levelList.find((l) => l.name === level).value;
};
exports.handleLevelLabel = handleLevelLabel;
const handleDataType = (type, value) => {
    if (type === "number") {
        return parseInt(value, 10);
    }
    if (type === "string") {
        return value;
    }
    if (type === "boolean") {
        return value === "1";
    }
};
exports.handleDataType = handleDataType;
const removeAllSpaces = (str) => str.replace(/\s+/g, '');
exports.removeAllSpaces = removeAllSpaces;
const handleTeamVoters = (members) => {
};
exports.handleTeamVoters = handleTeamVoters;
exports.alphabetic = Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i));
exports.alphabeticCaps = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const calculatePercentage = (part, total) => {
    if (total === 0)
        return 0;
    const data = (part / total) * 100;
    return data.toFixed(2);
};
exports.calculatePercentage = calculatePercentage;
