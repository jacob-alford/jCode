const Discord = require('discord.js');
const jBot = new Discord.Client();
const crypto = require('crypto');
var mysql = require('mysql');

// ][--- Configuration ---][
// Command Qualifiers
const helpChar = "?";
const pmChar = "_";
let firstTime = true;

// MySQL
let poolSQL = mysql.createPool({
  host: "--MySQL Host--",
  user: "--MySQL Username--",
  password: "--MySQL Password--",
  database:'--MySQL Database--',
  charset:'utf8mb4'
});
// Useful to minimize calls to the MySQL server
let userCache = {};

// Functions
/*

  --- Example discord message call:
    arb(() => math.random())


*/
const arb = callback => {
  return callback();
}
const d6 = (num = 1) => {
  if(num <= 50){
    let outStr = "";
    let counter = 0;
    for(let i=0;i<num;i++){
      let thisVal = rInt(1,6);
      counter += thisVal;
      outStr += `__Roll ${i+1}__: ${thisVal}\n`;
    }
    return `${outStr}**Total**: ${counter}`;
  }else{
    return "My limit for rolling dice is 50 :-(";
  }
}
const d20 = (num = 1) => {
  if(num <= 50){
    let outStr = "";
    let counter = 0;
    for(let i=0;i<num;i++){
      let thisVal = rInt(1,20);
      counter += thisVal;
      outStr += `__Roll ${i+1}__: ${thisVal}\n`;
    }
    return `${outStr}**Total**: ${counter}`;
  }else{
    return "My limit for rolling dice is 50 :-(";
  }
}
const help = () => {
  let cats = {};
  let sortedArr = Object.keys(index).sort();
  for(let cmd of sortedArr){
    if(cats[index[cmd].category] ===  undefined){
      cats[index[cmd].category] = [];
      cats[index[cmd].category].push(cmd);
    }else cats[index[cmd].category].push(cmd);
  }
  let outStr = `__jCode command categories:__\n`;
  let sortedCats = Object.keys(cats).sort();
  for(let i=0;i<sortedCats.length;i++){
    outStr+= `**${i+1}:** ${sortedCats[i]}\n`;
  }
  outStr += `Use the \`cmdList(#)\` function to view a list of commands in that category.`;
  return outStr;
}
const cmdList = num => {
  let cats = {};
  let sortedArr = Object.keys(index).sort();
  for(let cmd of sortedArr){
    if(cats[index[cmd].category] ===  undefined){
      cats[index[cmd].category] = [];
      cats[index[cmd].category].push(cmd);
    }else cats[index[cmd].category].push(cmd);
  }
  let sortedCats = Object.keys(cats).sort();
  num -= 1;
  if(sortedCats[num] !== undefined){
    let choosenCategory = sortedCats[num];
    let outStr = `Here is a list of *${sortedCats[num]}* commands.\n`;
    for(let i=0;i<sortedArr.length;i++){
      if(index[sortedArr[i]].category == choosenCategory){
        outStr += `[${index[sortedArr[i]].permLvl}] \`${sortedArr[i]}(`;
        if(index[sortedArr[i]].args.length>0) outStr += `${index[sortedArr[i]].args[0].name}`;
        for(let j=1;j<index[sortedArr[i]].args.length;j++){
          outStr += `, ${index[sortedArr[i]].args[j].name}`;
        }
        outStr += `)\` ${index[sortedArr[i]].desc}\n`;
      }
    }
    return outStr;
  }else{
    return `Category not found :-( Use \`help()\` for a list of command categories.  Use the number to the left.`;
  }
}
const helpOld = () => {
  let cats = {};
  let sortedArr = Object.keys(index).sort();
  for(let cmd of sortedArr){
    if(cats[index[cmd].category] ===  undefined){
      cats[index[cmd].category] = [];
      cats[index[cmd].category].push(cmd);
    }else cats[index[cmd].category].push(cmd);
  }
  let outStr = "The following is a list of my commands; though there are secret commands too.\n";
  outStr += "To view help for a specific command, add a '?' to the beginning like \`?help()\`.\n";
  outStr += "To have the output sent as a direct message (rather than in the channel), add an '_' to the beginning like \`_help()\`.\n";
  let sortedCats = Object.keys(cats).sort();
  let stringList = [];
  stringList.push(outStr);
  for(let cat of sortedCats){
    outStr = "";
    outStr += `\n__${cat}__\n`;
    for(let cmd in cats[cat]){
      outStr += `[${index[cats[cat][cmd]].permLvl}] \`${cats[cat][cmd]}(`;
      if(index[cats[cat][cmd]].args.length>0) outStr += `${index[cats[cat][cmd]].args[0].name}`;
      for(let i=1;i<index[cats[cat][cmd]].args.length;i++){
        outStr += `, ${index[cats[cat][cmd]].args[i].name}`;
      }
      outStr += `)\` ${index[cats[cat][cmd]].desc}\n`;
    }
    stringList.push(outStr + `\n`);
  }
  return stringList;
}
const setName = (name,activity) => {
  let currentStatus = {
  		's':"STREAMING",
  		'p': "PLAYING",
  		'l': "LISTENING",
  		'w': "WATCHING"
	}
  if(activity.length == 1){
    if(currentStatus[activity] !== undefined){
      jBot.user.setActivity(name,{type:currentStatus[activity]});
      return "Status updated successfully!";
    }else{
      return "The specified activity isn't recognized :-( give me 's' for 'Streaming,' 'p' for 'Playing,' 'l' for 'Listening,' or 'w' for 'Watching'";
    }
  }else{
    if(activity == "STREAMING" || activity == "PLAYING" || activity == "LISTENING" || activity == "WATCHING"){
      jBot.user.setActivity(name,{type:activity});
      return "Status updated successfully!";
    }else{
      return "The specified activity isn't recognized :-( give me 's' for 'Streaming,' 'p' for 'Playing,' 'l' for 'Listening,' or 'w' for 'Watching'";
    }
  }
}
const changePerms = (msg,username,id,newPerm) => {
  if(newPerm <= 8){
    if(userCache[`${username}#${id}`] !== undefined){
      poolSQL.getConnection((err, connection) => {
        if (err) console.error(err);
        let query = `UPDATE \`discord_users\` SET \`int_perms\` = '${newPerm}' WHERE \`disc_username\` = '${username}' AND \`disc_id\` = '${id}'`;
        connection.query(query, function (error, result, fields) {
          if (error){
            console.error(error);
            send("There was a problem connecting to the database!",msg);
          }
          userCache[`${username}#${id}`].intPermLevel = newPerm;
          send("Permissions updated successfully!",msg);
          connection.release();
        });
      });
      return `Changing ${username}'s permissions to ${newPerm}...`;
    }else{
      return "That username/id combination isn't recognized.";
    }
  }else{
    return "Unable to set the permissions to anything greater than 8.";
  }
}
const perms = (msg,username = msg.author.username,id=msg.author.discriminator) => {
  if(userCache[`${username}#${id}`] !== undefined){
    return `__${username}__ *(${id})* has permissions level **${userCache[`${username}#${id}`].intPermLevel}**`;
  }else{
    return `${username} not found.`;
  }
}
const addImp = (msg,cmdName,text) => {
  poolSQL.getConnection((err, connection) => {
    if (err) console.error(err);
    let query = `INSERT INTO \`imp_commands\`(\`name\`, \`value\`, \`author\`) VALUES ('${cmdName}','${text}','${msg.author.username}')`;
    connection.query(query, function (error, result, fields) {
      if (error){
        console.error(error);
        send("Unable to add command!  There was an error in the database!",msg);
      }
      send(`Command added successfully!`,msg);
      connection.release();
    });
  });
  return `Adding Command '${cmdName}'...`;
}
const simpInterest = (principle,APR,duration) => `A $${commas(principle)} loan, at ${(APR/100).toFixed(4)}% interest for ${duration} years:\n**Total Balance:** __$${commas(principle*(1+(APR/12)*duration))}__\n**Total Accumulated Interest:** __$${commas(principle*(1+(APR/12)*duration)-principle)}__`;
const compInterest = (principle,APR,duration,compFreq) => `A $${commas(principle)} compound interest balance, at ${APR}% interest for ${duration} years, compounded ${compFreq} times per year:\n**Total Balance:** __$${commas((principle*Math.pow(1+(APR/100)/compFreq,compFreq*duration)).toFixed(2))}__\n**Total Accumulated Interest:** __$${commas((principle*Math.pow(1+(APR/100)/compFreq,compFreq*duration)-principle).toFixed(2))}__`;
const roll = (sides, num = 1) => {
  if(num <= 50){
    let total = 0;
    let str = "";
    for(let i=0;i<num;i++){
      let value = rInt(1,sides);
      str += `__Roll__ ${i+1}: ${value}\n`;
      total += value;
    }
    str += `**Total**: ${total}`;
    return str;
  }else{
    return "I can only roll a max of 50 dice :-(";
  }
}
const rBytes = (msg,num=1) => {
  crypto.randomBytes(num, (err,buf) => {
    if(err) console.error(err);
    try{
      send(buf.toString('hex'),msg);
    }catch(error){
      console.error(error);
    }
  });
  return "Generating bytes...";
}
const define = word => `https://www.merriam-webster.com/dictionary/${word}`;
const time = () => {
  let d = new Date();
  let output = `
    **UTC**: ${d.toUTCString()}\n
    **Eastern**: ${d.toLocaleTimeString('en-US',{timeZone:"America/New_York"})}\n
    **Central**: ${d.toLocaleTimeString('en-US',{timeZone:"America/Chicago"})}\n
    **Mountain**: ${d.toLocaleTimeString('en-US',{timeZone:"America/Denver"})}\n
    **Pacific**: ${d.toLocaleTimeString('en-US',{timeZone:"America/Los_Angeles"})}`;
    return output;
}
const mean = (...args) => args.reduce((a,c) => a += c)/args.length;
const sum = (...args) => args.reduce((a,c) => a += c);
const product = (...args) => args.reduce((a,c) => a *= c);
const factorial = n => {
  if(n <= 170){
    let total = 1;
    for(let i=n;i>0;i--){
      total *= i;
    }
    return total;
  }else{
      return `The largest number I can calculate the factorial of is 170 :-(`;
  }
}
const choose = (n,k) => {
  if(n <= 85 && k <= 85){
    return factorial(n)/(factorial(k)*factorial(n-k));
  }else{
    return `Unable to calculate combinatorics for values greater than 170 :-(`;
  }
}
const pow = (a,b) => Math.pow(a,b);
const sqrt = num => Math.sqrt(num);
const sin = num => Math.sin(num);
const cos = num => Math.cos(num);
const tan = num => Math.tan(num);
const asin = num => Math.asin(num);
const acos = num => Math.acos(num);
const atan = num => Math.atan(num);
const pi = () => Math.PI;
const exp = num => Math.exp(num);
const ln = num => Math.log(num);
const rUniInt = (msg,min,max) => {
  if(min >= max || max-min<2 || min <= 0 ) return `A few requirements: 'min' must be less than 'max,' their difference must be at least two, and 'min' must not be negative or zero.`;
  crypto.randomBytes(8, (err,buf) => {
    if(err) console.error(err);
    let bigNum = parseInt(buf.toString('hex'),16);
    let randomNum = bigNum%max + min;
    send(randomNum,msg);
  });
  return `Generating...`;
}
const rUni = (msg,min=0,max=1) => {
  if(min >= max  || max <= 0 || min < 0) return `A few requirements: 'min' must be less than 'max,' and both 'min' and 'max' must not be negative.  Max cannot be zero. Default: min = 0, max = 1.`;
  crypto.randomBytes(8, (err,buf) => {
    if(err) console.error(err);
    let bigNum = parseInt(buf.toString('hex'),16)/281474976710655;
    let randomNum = bigNum%max + min;
    send(randomNum,msg);
  });
  return `Generating...`;
}
const rExp = (msg,lambda) => {
  crypto.randomBytes(8, (err,buf) => {
    if(err) console.error(err);
    let randDeci = parseInt(buf.toString('hex'),16)/18446744073709551615;
    let randomExp = Math.log(1-randDeci)/(-1*lambda);
    send(randomExp,msg);
  });
  return `Generating...`;
}
const rNorm = (msg,mu=0,sigma=1) => {
  crypto.randomBytes(8, (err,buf) => {
    if(err) console.error(err);
    let randDeci1 = parseInt(buf.toString('hex'),16)/18446744073709551615;
    crypto.randomBytes(8,(err2,buf2) => {
      if(err2) console.error(err2);
      let randDeci2 = parseInt(buf2.toString('hex'),16)/18446744073709551615;
      let randomExp = Math.sqrt(-2*Math.log(randDeci1))*Math.cos(2*Math.PI*randDeci2);
      send(randomExp*sigma + mu,msg);
    });
  });
  return `Generating...`;
}
// The index object stores functions,
// their permission levels,
// descriptions,
// and argument lists.
const index = {
  "arb":{
    execute:arb,
    category:"Administration",
    permLvl:10,
    desc:"Used to arbitrarily execute Javascript code.",
    requiresMSG:false,
    maxArgs:1,
    requiredArgs:[1],
    args:[
      {name:"callback",desc:"The code to execute",required:true,type:"function"}
    ]
  },
  "d6":{
    execute:d6,
    category:"Utility",
    permLvl:1,
    desc:"Rolls 'Num' number of d6",
    requiresMSG:false,
    maxArgs:1,
    requiredArgs:[0],
    args:[
      {name:"Num?",desc:"The number of d6 to roll",required:false,type:"integer,undefined"}
    ]
  },
  "d20":{
    execute:d20,
    category:"Utility",
    permLvl:1,
    desc:"Rolls 'Num' number of d20",
    requiresMSG:false,
    maxArgs:1,
    requiredArgs:[0],
    args:[
      {name:"Num?",desc:"The number of d20 to roll",required:false,type:"integer,undefined"}
    ]
  },
  "define":{
    execute:define,
    category:"Utility",
    permLvl:1,
    desc:"Search Merriam Webster for the specified word.",
    requiresMSG:false,
    maxArgs:1,
    requiredArgs:[1],
    args:[
      {name:"word",desc:"The word to define.",required:true,type:"string"}
    ]
  },
  "time":{
    execute:time,
    category:"Utility",
    permLvl:1,
    desc:"Displays the time in five timezones.",
    requiresMSG:false,
    maxArgs:0,
    requiredArgs:[],
    args:[]
  },
  "help":{
    execute:help,
    category:"Utility",
    permLvl:1,
    desc:"Displays command categories.",
    requiresMSG:false,
    maxArgs:0,
    requiredArgs:[],
    args:[]
  },
  "cmdList":{
    execute:cmdList,
    category:"Utility",
    permLvl:1,
    desc:"Displays all explicit commands in choosen category.",
    requiresMSG:false,
    maxArgs:1,
    requiredArgs:[1],
    args:[
      {name:"#",desc:"The number of the category you wish to view the commands of.",required:true,type:"integer"}
    ]
  },
  "setName":{
    execute:setName,
    category:"Administration",
    permLvl:8,
    desc:"Sets my name and activity in discord.",
    requiresMSG:false,
    maxArgs:2,
    requiredArgs:[1,1],
    args:[
      {name:"Name",desc:"What I'm doing.",required:true,type:"string"},
      {name:"Activity",desc:"'s' for 'Streaming,' 'p' for 'Playing,' 'l' for 'Listening,' or 'w' for 'Watching'.",required:true,type:"string"}
    ]
  },
  "changePerms":{
    execute:changePerms,
    category:"Administration",
    permLvl:10,
    desc:"Changes the internal bot permissions of a fellow discordian.",
    requiresMSG:true,
    maxArgs:3,
    requiredArgs:[1,1,1],
    args:[
      {name:"Username",desc:"The username of the person to change permissions of ",required:true,type:"string"},
      {name:"ID",desc:"Discord's user ID (or discriminator).",required:true,type:"integer"},
      {name:"newPerm",desc:"The internal permissions level to set to.  Must be less than 8.",required:true,type:"integer"}
    ]
  },
  "perms":{
    execute:perms,
    category:"Administration",
    permLvl:1,
    desc:"Views your internal permissions level (or somebody else's if specified).",
    requiresMSG:true,
    maxArgs:2,
    requiredArgs:[0,0],
    args:[
      {name:"Username?",desc:"The username of the person to view the permissions of ",required:false,type:"string,undefined"},
      {name:"ID?",desc:"Discord's user ID (or discriminator).",required:false,type:"integer,undefined"}
    ]
  },
  "addImp":{
    execute:addImp,
    category:"Administration",
    permLvl:8,
    desc:"Adds a new implicit (secret) command.",
    requiresMSG:true,
    maxArgs:2,
    requiredArgs:[1,1],
    args:[
      {name:"CmdName",desc:"'CmdName' is what goes before the '()'. e.g. `CmdName()`",required:true,type:"string"},
      {name:"Output",desc:"What I say once `CmdName()` is called.",required:true,type:"string"}
    ]
  },
  "simpInterest":{
    execute:simpInterest,
    category:"Finance",
    permLvl:1,
    desc:"Calculates the relevant details of a simple interest loan.",
    requiresMSG:false,
    maxArgs:3,
    requiredArgs:[1,1,1],
    args:[
      {name:"Principle",desc:"The starting value of the loan.",required:true,type:"number,integer"},
      {name:"APR",desc:"The amount of interest accumulated over one year (formatted like '5.8' for 5.8%).",required:true,type:"number,integer"},
      {name:"Duration",desc:"The number of years for which the loan has a balance.",required:true,type:"number,integer"}
    ]
  },
  "compInterest":{
    execute:compInterest,
    category:"Finance",
    permLvl:1,
    desc:"Calculates the relevant details of a balance with compounding interest.",
    requiresMSG:false,
    maxArgs:4,
    requiredArgs:[1,1,1,1],
    args:[
      {name:"Principle",desc:"The starting value of the loan.",required:true,type:"number,integer"},
      {name:"APR",desc:"The amount of interest accumulated over one year (formatted like '5.8' for 5.8%).",required:true,type:"number,integer"},
      {name:"Duration",desc:"The number of years for which the loan has a balance.",required:true,type:"number,integer"},
      {name:"Compound Frequency",desc:"The number of times in a year the balance is compounded.",required:true,type:"number,integer"}
    ]
  },
  "roll":{
    execute:roll,
    category:"Utility",
    permLvl:1,
    desc:"Rolls an 'n' sided die. Can also roll multiple dice if specified.",
    requiresMSG:false,
    maxArgs:2,
    requiredArgs:[1,0],
    args:[
      {name:"N",desc:"The number of sides the die has.",required:true,type:"integer"},
      {name:"num",desc:"The number of dice to roll.",required:false,type:"integer,undefined"}
    ]
  },
  "rBytes":{
    execute:rBytes,
    category:"Crypto",
    permLvl:1,
    desc:"Generates 'N' random bytes, formatted in hexadecimal.",
    requiresMSG:true,
    maxArgs:1,
    requiredArgs:[0],
    args:[
      {name:"N?",desc:"The number of bytes to generate. Default: 1.",required:false,type:"integer,undefined"}
    ]
  },
  "rUniInt":{
    execute:rUniInt,
    category:"Crypto",
    permLvl:1,
    desc:"Generates a uniformly distributed random integer between 'min' and 'max.'",
    requiresMSG:true,
    maxArgs:2,
    requiredArgs:[1,1],
    args:[
      {name:"min",desc:"The smallest number the random number could be.",required:true,type:"integer"},
      {name:"max",desc:"The largest number the random number could be.",required:true,type:"integer"}
    ]
  },
  "rUni":{
    execute:rUni,
    category:"Crypto",
    permLvl:1,
    desc:"Generates a uniformly distributed random number between 'min' and 'max.'",
    requiresMSG:true,
    maxArgs:2,
    requiredArgs:[0,0],
    args:[
      {name:"min",desc:"The smallest number the random number could be. Default: 0",required:false,type:"integer,undefined"},
      {name:"max",desc:"The largest number the random number could be.  Default: 1",required:false,type:"integer,undefined"}
    ]
  },
  "rExp":{
    execute:rExp,
    category:"Crypto",
    permLvl:1,
    desc:"Generates an exponentially distributed random number with rate parameter lambda.",
    requiresMSG:true,
    maxArgs:1,
    requiredArgs:[1],
    args:[
      {name:"rate",desc:"The rate of the exponential distribution.",required:true,type:"integer,number"}
    ]
  },
  "rNorm":{
    execute:rExp,
    category:"Crypto",
    permLvl:1,
    desc:"Generates an normally distributed random number with mean mu and standard deviation sigma.",
    requiresMSG:true,
    maxArgs:2,
    requiredArgs:[0,0],
    args:[
      {name:"mu",desc:"The mean of the normal distribution.  Default: 0",required:false,type:"integer,undefined,number"},
      {name:"sigma",desc:"The standard deviation of the normal distribution.  Default: 1",required:false,type:"integer,undefined,number"}
    ]
  },
  "mean":{
    execute:mean,
    category:"Math",
    permLvl:1,
    desc:"Calculates the mean value for the list of numbers (arguments).",
    requiresMSG:false,
    maxArgs:Infinity,
    requiredArgs:[1],
    args:[
      {name:"numList",desc:"The list of numbers to calculate the mean of (seperated by commas).",required:true,type:"integer,number"}
    ]
  },
  "sum":{
    execute:sum,
    category:"Math",
    permLvl:1,
    desc:"Sums the values in the list of numbers (arguments).",
    requiresMSG:false,
    maxArgs:Infinity,
    requiredArgs:[1],
    args:[
      {name:"numList",desc:"The list of numbers to sum (seperated by commas).",required:true,type:"integer,number"}
    ]
  },
  "product":{
    execute:sum,
    category:"Math",
    permLvl:1,
    desc:"Finds the product of the values in the list of numbers (arguments).",
    requiresMSG:false,
    maxArgs:Infinity,
    requiredArgs:[1],
    args:[
      {name:"numList",desc:"The list of numbers to multiply together (seperated by commas).",required:true,type:"integer,number"}
    ]
  },
  "factorial":{
    execute:factorial,
    category:"Math",
    permLvl:1,
    desc:"Calculates the factorial of the specified integer.",
    requiresMSG:false,
    maxArgs:1,
    requiredArgs:[1],
    args:[
      {name:"num",desc:"The number with which to calculate the factorial of.",required:true,type:"integer"}
    ]
  },
  "choose":{
    execute:choose,
    category:"Math",
    permLvl:1,
    desc:"Calculates N choose K.",
    requiresMSG:false,
    maxArgs:2,
    requiredArgs:[1,1],
    args:[
      {name:"N",desc:"The first number in the expression",required:true,type:"integer"},
      {name:"K",desc:"The second number in the expression",required:true,type:"integer"}
    ]
  },
  "pow":{
    execute:pow,
    category:"Math",
    permLvl:1,
    desc:"Raises a to the power of b.",
    requiresMSG:false,
    maxArgs:2,
    requiredArgs:[1,1],
    args:[
      {name:"a",desc:"The base in the exponential expression.",required:true,type:"number,integer"},
      {name:"b",desc:"The power in the exponential expression.",required:true,type:"number,integer"}
    ]
  },
  "sqrt":{
    execute:sqrt,
    category:"Math",
    permLvl:1,
    desc:"Takes the square root of num.",
    requiresMSG:false,
    maxArgs:1,
    requiredArgs:[1],
    args:[
      {name:"num",desc:"The radicand (number under the square root, I'm a mathematician from New Mexico Tech).",required:true,type:"number,integer"}
    ]
  },
  "sin":{
    execute:sin,
    category:"Math",
    permLvl:1,
    desc:"Returns the ratio from the opposite side of the right triangle to its hypotenuse.",
    requiresMSG:false,
    maxArgs:1,
    requiredArgs:[1],
    args:[
      {name:"num",desc:"The angle to calculate (radians).",required:true,type:"number,integer"}
    ]
  },
  "cos":{
    execute:cos,
    category:"Math",
    permLvl:1,
    desc:"Returns the ratio from the adjacent side of the right triangle to its hypotenuse.",
    requiresMSG:false,
    maxArgs:1,
    requiredArgs:[1],
    args:[
      {name:"num",desc:"The angle to calculate (radians).",required:true,type:"number,integer"}
    ]
  },
  "tan":{
    execute:tan,
    category:"Math",
    permLvl:1,
    desc:"Returns the ratio from the opposite side of the right triangle to its adjacent.",
    requiresMSG:false,
    maxArgs:1,
    requiredArgs:[1],
    args:[
      {name:"num",desc:"The angle to calculate (radians).",required:true,type:"number,integer"}
    ]
  },
  "asin":{
    execute:asin,
    category:"Math",
    permLvl:1,
    desc:"Returns the angle of the triangle given the ratio of the opposite side to the hypotenuse.",
    requiresMSG:false,
    maxArgs:1,
    requiredArgs:[1],
    args:[
      {name:"num",desc:"The ratio of the lengths to calculate (returns radians).",required:true,type:"number,integer"}
    ]
  },
  "acos":{
    execute:acos,
    category:"Math",
    permLvl:1,
    desc:"Returns the angle of the triangle given the ratio of the adjacent side to the hypotenuse.",
    requiresMSG:false,
    maxArgs:1,
    requiredArgs:[1],
    args:[
      {name:"num",desc:"The ratio of the lengths to calculate (returns radians).",required:true,type:"number,integer"}
    ]
  },
  "atan":{
    execute:atan,
    category:"Math",
    permLvl:1,
    desc:"Returns the angle of the triangle given the ratio of the opposite side to the adjacent.",
    requiresMSG:false,
    maxArgs:1,
    requiredArgs:[1],
    args:[
      {name:"num",desc:"The ratio of the lengths to calculate (returns radians).",required:true,type:"number,integer"}
    ]
  },
  "pi":{
    execute:pi,
    category:"Math",
    permLvl:1,
    desc:"Prints the values of pi.",
    requiresMSG:false,
    maxArgs:0,
    requiredArgs:[],
    args:[]
  },
  "exp":{
    execute:exp,
    category:"Math",
    permLvl:1,
    desc:"Raises e to the power num.",
    requiresMSG:false,
    maxArgs:1,
    requiredArgs:[1],
    args:[
      {name:"num",desc:"The number with which to calculate the exponential.",required:true,type:"number,integer"}
    ]
  },
  "ln":{
    execute:ln,
    category:"Math",
    permLvl:1,
    desc:"Takes the natural logarithm of num.",
    requiresMSG:false,
    maxArgs:1,
    requiredArgs:[1],
    args:[
      {name:"num",desc:"The number with which to deexponentiate.",required:true,type:"number,integer"}
    ]
  },
}

// ][--- Support Functions ---][
// --- [Validation] ---
// Checks for basic Formatting
const isAFunc = msg => {
  if(msg.content.includes("(") && msg.content.includes(")")){
    if(msg.content.indexOf(")") > msg.content.indexOf("(")){
      if(msg.content.split("(")[0].search(/[^\w_|?|_]/g) == -1){
        if(msg.content.split("(")[0][0].search(/[0-9]/g) == -1){
          return true;
        }else{
          return false;
        }
      }else{
        return false;
      }
    }else{
      return false;
    }
  }else{
    return false;
  }
}
// Checks if function is executed as a help function
const isAHelpFunc = str => {
  if(str.split("(")[0][0] == helpChar) return true;
  else return false;
}
// Checks if function is intended as a private message
const sendToPMFunc = str => {
  if(str.split("(")[0][0] == pmChar) return true;
  else return false;
}
// Checks if the function exists explicitly in the code
const isHardFunc = cmdName => {
  if(index[cmdName] !== undefined) return true;
  else return false;
}
// Checks if all the arguments match
const matchesArgs = (cmdName,args) => {
  let check = true;
  let list = ``;

  if(args.length <= index[cmdName].maxArgs){
    index[cmdName].requiredArgs.forEach((c,i) => {
      if(args[i] !== undefined){
        if(args[i].match(/[A-z]/g) !== null && args[i].match(/['`"]/g) === null){
          args[i] = `\'${args[i]}\'`;
        }
      }
      let inputType;
      try{
        inputType = parseType(args[i]);
      }catch(error420){
        console.error(error420);
      }
      if(!index[cmdName].args[i].type.includes(inputType)){
        check = false;
        list += `**Wrong type for argument ${i+1}** (${index[cmdName].args[i].name}), expected *${index[cmdName].args[i].type}*, but recieved *${inputType}*.\n`;
      }
      if(c == 1 && args[i] === undefined){
        list += `**Missing required argument ${i+1}**, __${index[cmdName].args[i].name}__: ${index[cmdName].args[i].desc}.\n`;
      }
    });
    return [check,list];
  }else{
      return [false,`Too many arguments specified!  Use \`?${cmdName}()\` for the list of arguments :-) I recieved: \`${cmdName}(${args.toString()})\``];
  }
}
// Attempts to parse a string to a type
const parseType = str => {
  // If the string is a string or date or undefined or 'NaN' or 0/0
  if(str === undefined){
    return "undefined";
  }else if(isNaN(str) || str == ""){
    if(str == "") return "undefined";
    else if(str.replace(/ /g,'') == "true" || str.replace(/ /g,'') == "false") return "boolean";
    else if(str.includes("=>") || (str.includes("function") && str.includes("}") && str.includes("{"))) return "function";
    else{
      if((str.includes("[") && str.includes("[")) || (str.includes("{") && str.includes("}"))){
        if(str.includes("[") && str.includes("[")) return "array";
        else if(str.includes("{") && str.includes("}")) return "object";
        else return "string";
      }else return "string";
    }
  }else{
    let number = Number(str);
    if(Number.isInteger(number)) return "integer";
    else if(Number.isFinite(number)) return "number";
    else return "infinity";
  }
}

// --- [MySQL] ---
const impGet = (cmdName,msg,pmOrQ = false) => {
  poolSQL.getConnection((err, connection) => {
    if (err) console.error(err);
    let query = `SELECT \`value\` FROM \`imp_commands\` WHERE \`name\`='${cmdName}'`;
    connection.query(query, function (error, result, fields) {
      if (error) console.error(error);
      if(pmOrQ == "pm"){
        if(result.length != 0) sendPM(result[0].value,msg);
      }else if(pmOrQ == "q"){
        if(result.length != 0) send(`This command comes with no instructions, but it told me to tell you this:\n${result[0].value}`,msg);
      }else{
        if(result.length != 0) send(result[0].value,msg);
      }
      connection.release();
    });
  });
}
const updateUsers = () => {
  poolSQL.getConnection((err, connection) => {
    if (err) console.error(err);
    let query = 'SELECT * FROM `discord_users`';
    connection.query(query, function (error, results, fields) {
      if (error) console.error(error);
      results.forEach(c => {
        if(userCache[`${c.disc_username}#${c.disc_id}`] === undefined){
          userCache[`${c.disc_username}#${c.disc_id}`] = {
            intPermLevel:c.int_perms,
            intNickname:c.int_nickname
          }
        }
      });
      connection.release();
    });
  });
}
const addToDBUser = (user,id,perms,nickname) => {
  poolSQL.getConnection((err, connection) => {
    if (err) console.error(err);
    let query = `INSERT INTO \`discord_users\` (\`int_id\`,\`disc_username\`,\`disc_id\`,\`int_perms\`,\`int_nickname\`) VALUES ('${Object.keys(userCache).length+1}','${user}','${id}','${perms}','${nickname}')`;
    connection.query(query, function (error, result, fields) {
      if (error) console.error(error);
      console.log(result);
      connection.release();
    });
  });
}

// --- [Discord Functions] ---
const send = (str,msg) => {
  if(str != "" && !Array.isArray(str)){
    try{
      msg.channel.send(str);
    }catch(error){
      console.error(`There was a problem sending the following message: ${str}`);
    }
  }else if(Array.isArray(str) && str != ""){
    str.forEach(c => {
      try{
        msg.channel.send(c);
      }catch(err){
        console.error(`There was a problem sending the following message: ${c}`)
      }
    });
  }
}
const sendPM = (str,msg) =>  {
  if(str != "" && !Array.isArray(str)){
    msg.author.createDM().then(channel => {
      try{
        channel.send(str);
      }catch(error){
        console.error(`There was an error sending the following private message: ${str}`);
      }
    });
  }else if(Array.isArray(str) && str != ""){
    str.forEach(c => {
      msg.author.createDM().then(channel => {
        try{
          channel.send(c);
        }catch(error){
          console.error(`There was an error sending the following private message: ${c}`);
        }
      });
    });
  }
}
// --- [Misc] ---
function commas(str) {
  return (str + "").replace(/\b(\d+)((\.\d+)*)\b/g, function(a, b, c) {
    return (b.charAt(0) > 0 && !(c || ".").lastIndexOf(".") ? b.replace(/(\d)(?=(\d{3})+$)/g, "$1,") : b) + c;
  });
}
const rInt = (min = 0, max = 1) => Math.floor(Math.random()*max + min);
const rNum = (min = 0, max = 1) => Math.random()*(max-min) + min;
updateUsers();

jBot.on("message", msg => {
  if(!msg.author.bot){
    let username = msg.author.username;
    let id = msg.author.discriminator;
    let userPerms;
    if(userCache[`${username}#${id}`] === undefined){
      userPerms = 1;
      userCache[`${msg.author.username}#${msg.author.discriminator}`] = {
        intPermLevel:1,
        intNickname:msg.author.username
      }
      addToDBUser(msg.author.username,msg.author.discriminator,1,msg.author.username);
    }else{
      userPerms = userCache[`${msg.author.username}#${msg.author.discriminator}`].intPermLevel;
    }
    if(isAFunc(msg)){
        let fnName = msg.content.split("(")[0].replace("?","").replace("_","");
        let argSlice = msg.content.slice(msg.content.indexOf("(")+1,msg.content.lastIndexOf(")"));
        let arguments;
        if(argSlice != "") arguments = argSlice.split(",");
        else arguments = [];
        // Necessary to handle arrays, need one for objects too technically, but I can avoid that
        if((argSlice.includes(";")) && ((argSlice.includes('[') && argSlice.includes(']')) || (argSlice.includes('{') && argSlice.includes('}')))){
          arguments.forEach((c,i) => {
            if((c.includes('[') && c.includes(']')) || (c.includes('{') && c.includes('}'))){
              arguments[i] = c.replace(/;/g,',');
            }
          });
        }else if((argSlice.includes('[') && argSlice.includes(']')) || (argSlice.includes('{') && argSlice.includes('}'))){
          try{
            send("Unable to parse array. Remember that for technical reasons if using an array as an argument, you must replace the commas (',') with semicolons (';').",msg);
          }catch(err){
              console.error(err);
          }
        }
        // Run help function
        if(isAHelpFunc(msg.content)){
         if(isHardFunc(fnName)){
           let cmdLine = `Proper Usage:\n`;
           cmdLine += '```javascript\n';
           cmdLine += `${fnName}(`
           let argList = ``;
           if(index[fnName].args.length > 0){
             cmdLine += `${index[fnName].args[0].name}`;
           }
           index[fnName].args.forEach((c,i) => {
             if(i>0){
               cmdLine += `, ${c.name}`;
             }
             if(c.required){
               argList += `${i+1}. **(Required)** *[${c.type}]* __${c.name}__: ${c.desc}\n`;
             }else{
               argList += `${i+1}. (Optional) *[${c.type}]* __${c.name}__: ${c.desc}\n`;
             }
           });
           cmdLine += ")\n";
           cmdLine += '```';
           let description = `\n[**${index[fnName].permLvl}**] ${index[fnName].desc}\n`;
           try{
             send(cmdLine + description + argList,msg);
           }catch(err3){
             console.error(err3);
           }
         }else{
           try{
             impGet(fnName,msg,"q");
           }catch(error1){
             try{
               send(`Unable to execute command, there was an error!  I'll paste the error below:\n${error1}`,msg);
             }catch(err2){
               console.error(err2);
             }
           }
         }
        // Send details via private message
        }else if(sendToPMFunc(msg.content)){
          if(isHardFunc(fnName)){
            let [check,error] = matchesArgs(fnName,arguments);
            if(check){
              if(userPerms >= index[fnName].permLvl){
                if(index[fnName].requiresMSG){
                  try{
                    sendPM(eval(`${fnName.split("_")[1]}(${msg},${arguments.toString()});`),msg);
                  }catch(err){
                      console.error(err);
                  }
                }else{
                  try{
                    sendPM(eval(`${fnName}(${arguments.toString()});`),msg);
                  }catch(err){
                      console.error(err);
                  }
                }
              }else{
                try{
                  sendPM(`You do not have the required permissions level to execute that command!  ${fnName} requires permissions level ${index[fnName].permLvl}; you have permissions level ${userPerms}`,msg);
                }catch(err){
                  console.error(err);
                }
              }
            }else{
              try{
                sendPM(error,msg);
              }catch(err){
                console.error(err);
              }
            }
          }else{
            try{
              impGet(fnName,msg,"pm");
            }catch(error1){
              try{
                sendPM(`Unable to execute command, there was an error!  I'll paste the error below:\n${error1}`,msg);
              }catch(err2){
                console.error(err2);
              }
            }
          }
        // Execute command normally
        }else{
          if(isHardFunc(fnName)){
            let [check,error] = matchesArgs(fnName,arguments);
            if(check){
              if(userPerms >= index[fnName].permLvl){
                if(index[fnName].requiresMSG){
                  try{
                    send(eval(`${fnName}(msg,${arguments.toString()});`),msg);
                  }catch(err){
                      console.error(err);
                  }
                }else{
                  try{
                    send(eval(`${fnName}(${arguments.toString()});`),msg);
                  }catch(err){
                      console.error(err);
                  }
                }
              }else{
                try{
                  send(`You do not have the required permissions level to execute that command!  ${fnName} requires permissions level ${index[fnName].permLvl}; you have permissions level ${userPerms}`,msg);
                }catch(err){
                  console.error(err);
                }
              }
            }else{
              try{
                send(error,msg);
              }catch(err){
                console.error(err);
              }
            }
          }else{
            try{
              impGet(fnName,msg);
            }catch(error1){
              try{
                send(`Unable to execute command, there was an error!  I'll paste the error below:\n${error1}`,msg);
              }catch(err2){
                console.error(err2)
              }
            }
          }
        }
    }
  }
});

jBot.on('error', console.error);
jBot.login('--Token-Goes-Here--');
