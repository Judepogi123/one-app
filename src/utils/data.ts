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

export const handleLevelLabel = (level: string, type: number) =>{
  const levelList: any = [
    { name: "TL", value: 1 },
    { name: "PC", value: 2 },
    { name: "BC", value: 3 },
  ];
  if(type === 1){
    return  levelList.find((l: {name: string}) => l.name === level).name
  }
  return levelList.find((l: {name: string}) => l.name === level).value
}

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

  export const handleTeamVoters = (members: string)=>{

  }

  export const alphabetic = Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i));
  export const alphabeticCaps = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  export const calculatePercentage = (part: number, total: number) => {
    if (total === 0) return 0;
    const data = (part / total) * 100;
    return data.toFixed(2)
  };
  