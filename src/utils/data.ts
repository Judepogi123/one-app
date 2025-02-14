export const handleGenTagID = (min = 100000, max = 999999)=> {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Example usage:
export const handleSpecialChar = (char: string, value: string)=>{
    const temp = value.split("")
    if(temp.at(-1)=== char){
        return temp.slice(0,-1).join("")
    }
    return value
}

export const handleGender = (value: string | undefined)=>{
    if(value === "M" && value !== undefined){
        return "Male"
    }
    if(value === "F" && value !== undefined){
        return "Female"
    }
    return "Unknown"
}

export const handleLevel = (value: number) => {
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

  export const handleDataType = (type: string, value: string)=>{
    
    if(type === "number"){
      return parseInt(value, 10)
    }
    if(type === "string"){
      return value
    }
    if(type === "boolean"){
      return value === "1"
    }
  }

  export const removeAllSpaces = (str: string) => str.replace(/\s+/g, '');