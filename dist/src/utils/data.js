"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatToLocalPHTime = exports.memberTags = exports.teamMembersCount = exports.calculatePercentage = exports.alphabeticCaps = exports.alphabetic = exports.handleTeamVoters = exports.removeAllSpaces = exports.handleDataType = exports.handleLevelLabel = exports.handleLevel = exports.handleGender = exports.handleSpecialChar = exports.handleGenTagID = void 0;
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
    var _a;
    const levelList = [
        { name: "TL", value: 1 },
        { name: "PC", value: 2 },
        { name: "BC", value: 3 },
    ];
    if (type === 1) {
        return levelList.find((l) => l.name === level).name;
    }
    return (_a = levelList.find((l) => l.name === level).value) !== null && _a !== void 0 ? _a : 1;
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
const teamMembersCount = (value) => {
    var _a, _b;
    const count = [
        { value: "all", count: "all" },
        { value: "noMembers", count: 0 },
        { value: "threeAndBelow", count: 3 },
        { value: "four", count: 4 },
        { value: "five", count: 5 },
        { value: "sixToNine", count: 6 },
        { value: "equalToMax", count: 10 },
        { value: "aboveMax", count: 11 },
    ];
    return (_b = (_a = count.find((item) => item.value === value)) === null || _a === void 0 ? void 0 : _a.count) !== null && _b !== void 0 ? _b : 0;
};
exports.teamMembersCount = teamMembersCount;
const memberTags = (value) => {
    // const count = [
    //   { value: "delisted", desc: "DL" },
    //   { value: "dead", desc: "D" },
    //   { value: 1, desc: "UD" },
    //   { value: 2, desc: "ND" },
    //   { value: 3, desc: "OP" },
    //   { value: "inc", desc: "INC" },
    //   { value: "or", desc: "OR" },
    // ];
    switch (value) {
        case 1:
            return "UD";
        case 2:
            return "ND";
        case 3:
            return "OP";
        default:
            return "";
    }
};
exports.memberTags = memberTags;
const formatToLocalPHTime = (utcString) => {
    return new Date(utcString).toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
    });
};
exports.formatToLocalPHTime = formatToLocalPHTime;
