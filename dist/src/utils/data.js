"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGenTagID = void 0;
const handleGenTagID = (min = 100000, max = 999999) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
exports.handleGenTagID = handleGenTagID;
// Example usage:
