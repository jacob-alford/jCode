# jCode
A unique discord bot that acts like MatLab or R with commands like `help()`

![jCode Logo](jCodeLogo.jpg)
## Features
* Custom explicit commands written in Javascript.
* Custom implicit (just text) commands stored in a database.
* Internal permissions structure (stored in a database).
* Automatic explicit command categorization and function-help readouts.
## Executing Functions
Let's suppose you wanted to roll five d6; then you'd use this command: `d6(5)`.
### Help Functions
Let's suppose you wanted to learn how to roll five d6; then you'd use this command: `?d6()`.
And it would explain,
> Proper Usage:
>
> ```d6(Num?)```
>
> [**1**] Rolls 'Num' number of d6
> 1. (Optional) [*integer,undefined*] **Num?**: The number of d6 to roll.
### Direct Message Functions
Let's suppose you wanted to roll five d6; but you wanted it sent as a direct message instead.  Then you'd use this command: `_d6()`.
## Creating 
### Part 1
All you need for this step is to create a regular Javascript function that returns a string.  

If for example, you wanted to create a function `d6(n)` which rolled 'n' number of d6, then you'd write the following code:
```javascript
const d6 = n => {
  if(n < 25 ) return "Too many d6!!!";
  let output = 0;
  for(let i=0 ; i<n; i++){
    output += Math.floor( Math.random()*6 + 1 );
  }
  return output;
}
```
### Part 2
You also need to need to add the function to the index of functions.  The index of functions allows the algorithm to validate incoming requests.

If for example, you wanted to finalize your `d6(n)` function, you could do so with the following code.
```javascript
index["d6"] = {
    category:"Utility",
    permLvl:1,
    desc:"Rolls 'Num' number of d6",
    requiresMSG:false,
    maxArgs:1,
    requiredArgs:[0],
    args:[
      {name:"Num?",desc:"The number of d6 to roll",required:false,type:"integer,undefined"}
    ]
}
```
*Note: the `index["d6"]` declaration must have the same name as the function declared in part 1.*
## Index Parameters
Below is a table of index parameters and their functions.  *Note, all parameters below are required.*

Parameter | Description
------------ | -------------
`category` | Used for constructing the `help()` command.
`permLvl` | The minimum required internal permission level to execute the command.
`desc` | Simple description
`requiresMSG` | This will append the first argument with the message object (discord.js).
`maxArgs` | This restricts someone from including too many arguments when calling functions.
`requiredArgs` | This is an array of 1s and 0s. 1 if the argument is required, 0 if not.  
`args` | This is an array of objects which describe the arguments.  Used in the help command.  See below for the relevant parameters.

The following are the parameters for the array of objects in an indexed function's args property.

Parameter | Description
------------ | -------------
`name` | The name of the argument.
`desc` | The description of the argument.
`required` | Boolean value which indicates if the arument is a required one.  Must correpsond to `requiredArgs` array above.
`type` | Specifies the type expected for the argument.  If an optional argument, then `undefined` must also be specified.  Commas or anything other delimiter are sufficient.  I like commas.

## MySQL
This Discord bot confers with a MySQL server.  And it is required.  My configuration for it is below, though you are free to adapt to your needs.
### User Table
1. Internal ID
1. Discord Username
1. Discord ID
1. Internal Permissions
1. Internal Nickname
1. User JSON

*Note, I haven't used Internal Nickname or User JSON as of beta release.*
### Implicit Commands
Implicit commands are sort of like twitch commands.  Type the command, and the bot will reply with a fixed response.  These can be store, changed, and deleted easily (just in the database).
1. Name
1. Value
1. Author

*Note I think the author category is a good idea.*
