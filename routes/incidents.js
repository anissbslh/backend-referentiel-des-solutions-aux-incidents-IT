const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");

module.exports = function (connection) {

    router.get("/incidents", (req, res) => {
      connection.query("SELECT * FROM (incident i JOIN equipe e ON i.id_equipe = e.id_equipe) JOIN application a ON i.id_application = a.id_application;",(err, result) => {
          if (err) throw err;
          res.send(result);
        }
      );
    })

    router.post("/addIncident", (req, res) => {
        const { titre, description, equipe, application, mots_cles, date_creation } = req.body;
        connection.query(
          "INSERT INTO incident (titre, description, equipe, application, mots_cles, date_creation) VALUES (?, ?,?,?,?,?)",
          [titre, description, equipe, application, mots_cles, date_creation],
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

    router.get("/incidents/:id",(req,res)=>{
        const ID = req.params.id;
        connection.query(`SELECT * FROM ((incident i JOIN equipe e ON i.id_equipe = e.id_equipe) JOIN application a ON i.id_application = a.id_application) JOIN solution s ON i.id_incident=s.id_incident where i.id_incident = ${ID} `,(err,result)=>{
            if (err) throw err;
            res.send(result[0]);
        })
    })

    return router;
};