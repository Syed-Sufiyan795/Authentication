const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const databasePath = path.join(__dirname, "userData.db");
const app = express();
app.use(express.json());

let database = null;

const initializationAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializationAndServer();

const validPassword = (password) => {
  return password.length > 4;
};

app.post("/register", async (req, res) => {
  const { username, name, password, gender, location } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username= '${username}';`;
  const databaseUser = await database.get(selectUserQuery);

  if (databaseUser === undefined) {
    const createUserQuery = `
      INSERT INTO 
      user(username,name,password,gender,location)
      VALUES
      (
          '${username}',
          '${name}',
          '${hashedPassword}',
          '${gender}',
          '${location}'
      );`;
    if (validPassword(password)) {
      await database.run(createUserQuery);
      res.send("User created successfully");
    } else {
      res.status(400);
      res.send("Password is too short");
    }
  } else {
    res.status(400);
    res.send("User already exists");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const selectUserQuery = `SELECT * FROM user WHERE username= '${username}';`;
  const databaseUser = await database.get(selectUserQuery);

  if (databaseUser === undefined) {
    res.status(400);
    res.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      databaseUser.password
    );
    if(isPasswordMatched====true){
        res.send("Login success!");
    }else{
        res.status(400);
        res.send("Invalid password");   
    }
  }
});
app.put("/change-password" , async (req,res)=>{
    const {username,oldPassword,newPassword}=req.body;
    const selectUserQuery=`SELECT * FROM user WHERE username '${username}';`;
    const databaseUser= await database.get(selectUserQuery);
    if (databaseUser=== undefined){
        res.status(400);
        res.send("Invalid user");
    }else{
        const isPasswordMatched= await bcrypt.compare(
            oldPassword,
            databaseUser.password
        );
        if (isPasswordMatched===true) {
            if(validPassword(newPassword)) {
                const hashedPassword= await bcrypt.hash(newPassword,10);
                const updatePasswordQuery= `
                UPDATE 
                user
                SET 
                password= '${hashedPassword}'
                WHERE 
                username= '${username}';`;
                const user= await database.run(updatePasswordQuery);
                res.send("Password updated");
              } else{
                  res.status(400);
                  res.send("Password is too short");
              }
          } else {
             res.status(400);
             res.send("Invalid current password");
        }
  }
});
module.exports=app;
