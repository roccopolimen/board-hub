const { ObjectId } = require('mongodb');

//These functions are meant to be used in if statements, so that you can make your own throw statement.

//Returns true if passed a valid mongo ObjectId
//Param: An ObjectId as a string
function checkObjectId(OId){
    if(ObjectId.isValid(OId)){
        return((String)(new ObjectId(OId)) == OId)
    }
    return false;
    
}
//Retruns true if passed any string
function checkString(str){
    return (typeof(str) === 'string');
}

//Retruns true if passed any boolean
function checkBoolean(boolean){
    return (typeof(boolean) === 'boolean');
}

//Retruns true if passed a non empty string
function checkNonEmptyString(str){
    return (typeof(str) === 'string' && str.trim() !== '');
}

//Returns true if passed any number
function checkNumber(num){
    return (typeof(num) === 'number'); 
}

//Returns true if passed a positive number
function checkPositiveNumber(num){
    return (typeof(num) === 'number' && num > 0); 
}

//Returns true if passed a negative number
function checkNegativeNumber(num){
    return (typeof(num) === 'number' && num < 0); 
}

//Returns true if passed a number between [1,99]
function checkStoryPoint(sp){
    return (checkNumber(sp) && sp > 0 && sp < 100);
}

//REGEX is for the current email format RFC2822
//Returns true if passed a valid email
//Param: string
function checkEmail(email){
    return (typeof(email) === 'string' && /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/.test(email))
}

//REGEX tests against chars that we do not want to have in the name
//Returns true if passed a valid first name
//Param: string
function checkFirstName(firstName){
    return(typeof(firstName) === 'string' && (firstName.length > 1 && firstName.length < 27) && /^[^±!@£$%^&*_+§¡€#¢§¶•ªº«\\/<>?:;|=.,\d]{1,20}$/.test(firstName));
}

//REGEX tests against chars that we do not want to have in the name
//Returns true if passed a valid last name
//Param: string
function checkLastName(lastName){
    return(typeof(lastName) === 'string' && (lastName.length > 1 && lastName.length < 27) && /^[^±!@£$%^&*_+§¡€#¢§¶•ªº«\\/<>?:;|=.,\d]{1,20}$/.test(lastName));
}

//Returns true if passed a valid hex code 
//Param: string
function checkColor(colorCode){
    return (typeof(colorCode) === 'string' && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colorCode));
}

//Returns true if passed a valid array of objectid's
function checkArrayObjectId(boardArray){
    if(!Array.isArray(boardArray)){
        return false;
    }
    for(let x of boardArray){
        if(!checkObjectId(x)){
            return false;
        }
    }
    return true;
}

//Checks if input is a valid date in the form MM/DD/YYYY
//Param: string
function checkDate(dateStr){
    const parts = dateStr.split('/').map((n) => parseInt(n));
    parts[0] -= 1;
    const date = new Date(parts[2], parts[0], parts[1]);
    return date.getMonth() === parts[0] && date.getDate() === parts[1] && date.getFullYear() === parts[2];
}

//Checks if input is a valid millitary time (HH:MM)
//Param: string
function checkTime(timeStr){
    return (typeof(timeStr) === 'string' && /^([01]\d|2[0-3]):?([0-5]\d)$/.test(timeStr));
}

//Returns true if passed a valid due date object
//Param: object
function checkDueDate(obj){
    if(typeof(obj.date) !== 'string' || !checkDate(obj.date)){
        return false;
    }
    if(typeof(obj.done) !== 'boolean'){
        return false;
    }
    return true;
}

//Checks if input is a valid label
//Param: object
function checkLabel(label){
    if(!label._id || !checkObjectId(label._id)){
        return false;
    }
    if(!label.text || !checkNonEmptyString(label.text)){
        return false;
    }
    if(!label.color || !checkColor(label.color)){
        return false;
    }
    return true;
}

//Checks if input is a valid array of labels
//Param: Array
function checkArrayOfLabels(labelArr){
    if(!Array.isArray(labelArr)) return false;
    for(let label of labelArr){
        if(!checkLabel(label)){
            return false;
        }
    }
    return true
}