const { ObjectId } = require('mongodb');
const XDate = require("xdate");


//These functions are meant to be used in if statements, so that you can make your own throw statement.

function checkObjectId(OId){
    if(ObjectId.isValid(OId)){
        if((String)(new ObjectId(OId)) == OId){
            return true;        
        }
        return false;
    }
    return false;
}
//checks if input is a string
function checkString(str){
    return (typeof(str) === 'string');
}

//checks if input is a number
function checkNumber(num){
    return (typeof(num) === 'number'); 
}

//REGEX is for the current email format RFC2822
function checkEmail(email){
    return (typeof(email) === 'string' && /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/.test(email))
}

//This will not work if spaces are at the end, however spaces should not be inbetween letters 
//just make sure to trim the end of the string before using this function 
function checkFirstName(firstName){
    return(typeof(firstName) === 'string' && /^[a-zA-Z]+$/.test(firstName));
}

//Checks if input is a valid last name
function checkLastName(lastName){
    return(typeof(lastName) === 'string' && /^[a-zA-Z'-]+$/.test(lastName));
}

//Checks if input is a valid hex color code
function checkColor(colorCode){
    return (typeof(colorCode) === 'string' && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colorCode));
}

//Checks if input is a valid array of objectid's
function checkArrayObjectId(boardArray){
    if(!Array.isArray(boardArray)){
        console.log('here')
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
function checkDate(dateStr){

    let date = new XDate(dateStr);
    if(!date.valid()){
        return false
    }   

    let myObj = {
        1: "31",
        2: "28",
        3: "31",
        4: "30",
        5: "31",
        6: "30",
        7: "31",
        8: "31",
        9: "30",
        10: "31",
        11: "30",
        12: "31" 
    };
    let dateSplit = dateStr.trim().split('/');
    
    let chk = parseInt(dateSplit[0]);
    
    if(chk === 2){
        if(parseInt(dateSplit[2]) % 4 === 0){
            if(29 < parseInt(dateSplit[1])){
                return false;;
            }
        }
        else{
            if(parseInt(myObj[chk]) < parseInt(dateSplit[1])) return false;
        }
    }
    else{
        if(parseInt(myObj[chk]) < parseInt(dateSplit[1])) {
            return false;
        }
    }

    return true;
}

//Checks if input is a valid due date object
function checkDueDate(obj){
    if(typeof(obj.date) !== 'string' || !checkDate(obj.date)){
        return false;
    }
    if(typeof(obj.done) !== 'boolean'){
        return false;
    }
    return true;
}
//console.log(checkDate('1/1/100'))


// let myObj = {
//     date: '2/29/2020', 
//     done: true
// }

// let x = new ObjectId();
// let y = new ObjectId();

// console.log(checkDueDate(myObj))
// // console.log(checkObjectId(4))
// // console.log(checkArrayObjectId([x,y]));
// // console.log(checkFirstName(undefined))
// // console.log(checkLastName('van-gough'))
// // console.log(checkEmail("john@gmail.com"))