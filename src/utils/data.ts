export const handleGenTagID = (min = 100000, max = 999999)=> {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Example usage:
