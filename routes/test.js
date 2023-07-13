const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");

module.exports = function (connection) {

    router.get("/test", (req, res) => {
      connection.query("SELECT * FROM TABLE",(err, result) => {
          if (err) throw err;
          res.send(result);
        }
      );
    })

    router.post("/testAdd", (req, res) => {
        const { Id, Idd } = req.body;
        connection.query(
          "INSERT INTO TABLE (id, id) VALUES (?, ?)",
          [Id, Idd],
          (err) => {
            if (err) {
              console.error(err);
              res.json({
                error: "Erreur",
              });
            } else {
              res.json({ success: true });
            }
          }
        );
      });

    router.get("/test/:id",(req,res)=>{
        const ID = req.params.id;
        connection.query(`SELECT * FROM TABLE where id = ${ID}`,(err,result)=>{
            if (err) throw err;
            res.send(result[0]);
        })
    })

    return router;
};