const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require('multer');
const path = require('path');

const testRoute = require("./routes/incidents");

var { config } = require("dotenv");
const port = process.env.PORT || 3010;

const dev = process.env.NODE_ENV !== "production";
if (dev) {
  config();
}

const app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({
    origin: '*'
}));

var connection = mysql.createConnection({
  host: process.env.HOST,
  port: process.env.PORT_DB,
  user: process.env.USER,
  password: process.env.PW,
  database: process.env.DB,
});
connection.connect(function (err, conn) {
  if (err) console.log(err);
});

app.get("/",(req,res)=>{
    res.send("Backend");
})

app.use("/", testRoute(connection));

app.listen(port, (err) => {
  if (err) throw err;
  console.log("> Ready on http://localhost:" + port);
});
