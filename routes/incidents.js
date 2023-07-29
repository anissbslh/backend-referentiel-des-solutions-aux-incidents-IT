const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");

const mysql = require("mysql");

const fs = require('fs')

const cors = require("cors");
const multer = require('multer');
const path = require('path');

module.exports = function (connection) {

        // Configuration de multer pour gérer les fichiers téléchargés
      const storageIncident = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, 'uploads/incidents');
        },
        filename: function (req, file, cb) {
          cb(null, 'car_temp_' + Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
        }
      });
      const storageSolution = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, 'uploads/solutions');
        },
        filename: function (req, file, cb) {
          cb(null, 'car_temp_' + Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
        }
      });
      const uploadIncident = multer({ storage: storageIncident });
      const uploadSolution = multer({ storage: storageSolution });


    //get all incidents
    router.get("/incidents", (req, res) => {
      const page = parseInt(req.query.page) || 1; 
      const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
    
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
    
      connection.query(
        "SELECT i.id_incident, i.titre, i.description, i.mots_cles, e.designation AS equipe_nom, a.designation AS application_nom, i.date_creation AS date " +
        "FROM incident i " +
        "JOIN equipe e ON i.id_equipe = e.id_equipe " +
        "JOIN application a ON i.id_application = a.id_application " +
        "LIMIT ?, ?;",
        [startIndex, itemsPerPage],
        (err, result) => {
          if (err) throw err;
    
          
          connection.query("SELECT COUNT(*) AS totalIncidents FROM incident;", (err, countResult) => {
            if (err) throw err;
    
            const totalIncidents = countResult[0].totalIncidents;
    
            
            const totalPages = Math.ceil(totalIncidents / itemsPerPage);
    
            res.send({
              data: result,
              currentPage: page,
              totalPages: totalPages
            });
          });
        }
      );
    });
    

    //get the latest version of incidents
    router.get("/incidents/lastVersions", (req, res) => {
      const page = parseInt(req.query.page) || 1; // Numéro de page, valeur par défaut: 1
      const itemsPerPage = parseInt(req.query.itemsPerPage) || 8; // Nombre d'éléments par page, valeur par défaut: 10
    
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
    
      connection.query(
        "SELECT * " +
        "FROM incident i " +
        "JOIN equipe e ON i.id_equipe = e.id_equipe " +
        "JOIN application a ON i.id_application = a.id_application " +
        "JOIN (SELECT id_incident, MAX(date_creation) AS max_date FROM incident GROUP BY id_incident) latest_dates " +
        "ON i.id_incident = latest_dates.id_incident AND i.date_creation = latest_dates.max_date " +
        "LIMIT ?, ?;",
        [startIndex, itemsPerPage],
        (err, result) => {
          if (err) throw err;
    
          // Récupérer le nombre total d'incidents pour la pagination
          connection.query("SELECT COUNT(*) AS totalIncidents FROM incident GROUP BY id_incident ;", (err, countResult) => {
            if (err) throw err;
    
            const totalIncidents = countResult[0].totalIncidents;
    
            // Calculer le nombre total de pages
            const totalPages = Math.ceil(totalIncidents / itemsPerPage);
    
            res.send({
              data: result,
              currentPage: page,
              totalPages: totalPages
            });
          });
        }
      );
    });
    

    //add incident
    router.post("/addIncident", uploadIncident.array('images'), (req, res) => {
        const { titre, description, equipe, application, mots_cles } = req.body;
        const imagePaths = req.files.map(file => file.path);

        const now = new Date();
        const annee = now.getFullYear();
        const mois = String(now.getMonth() + 1).padStart(2, '0');
        const jour = String(now.getDate()).padStart(2, '0');
        const heure = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const secondes = String(now.getSeconds()).padStart(2, '0');

        
        const dateHeureActuelles = `${annee}-${mois}-${jour} ${heure}:${minutes}:${secondes}`;
        connection.query(
          "INSERT INTO incident (titre, description, id_equipe, id_application, mots_cles, date_creation) VALUES (?, ?,?,?,?,?)",
          [titre, description, equipe, application, mots_cles, dateHeureActuelles],
          (err, result) => {
            if (err) {
              console.error(err);
              res.json({
                error: "Erreur",
              });
            } else {
              const ID = result.insertId;

              const Folder = path.join('uploads','incidents', `${ID}-${dateHeureActuelles.replaceAll(':','-')}`);
              fs.mkdirSync(Folder);

              imagePaths.forEach(imagePath => {
                const extension = path.extname(imagePath);
                const newImagePath = path.join(Folder, 'image' + Date.now() + '-' + Math.round(Math.random() * 1e9) + extension);
                fs.renameSync(imagePath, newImagePath);
              });



              res.json({ success: true });
            }
          }
        );
      });

      router.post("/addSolution", uploadSolution.array('images'), (req, res) => {
        const {description, id_incident} = req.body;
        const imagePaths = req.files.map(file => file.path);

        const now = new Date();
        const annee = now.getFullYear();
        const mois = String(now.getMonth() + 1).padStart(2, '0');
        const jour = String(now.getDate()).padStart(2, '0');
        const heure = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const secondes = String(now.getSeconds()).padStart(2, '0');

        
        const dateHeureActuelles = `${annee}-${mois}-${jour} ${heure}:${minutes}:${secondes}`;



        connection.query(
          "INSERT INTO solution (description_solution, id_incident, date_creation) VALUES (?,?,?)",
          [description, id_incident, dateHeureActuelles],
          (err, result) => {
            if (err) {
              console.error(err);
              res.json({
                error: "Erreur",
              });
            } else {
              const ID = result.insertId;

              const Folder = path.join('uploads','solutions', `${ID}-${dateHeureActuelles.replaceAll(':','-')}`);
              fs.mkdirSync(Folder);

              imagePaths.forEach(imagePath => {
                const extension = path.extname(imagePath);
                const newImagePath = path.join(Folder, 'image' + Date.now() + '-' + Math.round(Math.random() * 1e9) + extension);
                fs.renameSync(imagePath, newImagePath);
              });



              res.json({ success: true });
            }
          }
        );
      });


      //update an existing incident
      router.post("/updateIncident/:id", uploadIncident.array('images'), (req, res) => {
        const { titre, description, equipe, application, mots_cles, date_creation } = req.body;
        const imagePaths = req.files.map(file => file.path);
        const ID = req.params.id;
        const now = new Date();
        const annee = now.getFullYear();
        const mois = String(now.getMonth() + 1).padStart(2, '0');
        const jour = String(now.getDate()).padStart(2, '0');
        const heure = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const secondes = String(now.getSeconds()).padStart(2, '0');

        
        const dateHeureActuelles = `${annee}-${mois}-${jour} ${heure}:${minutes}:${secondes}`;

        connection.query(
          "INSERT INTO incident (id_incident, titre, description, id_equipe, id_application, mots_cles, date_creation) VALUES (?,?, ?,?,?,?,?)",
          [ID, titre, description, equipe, application, mots_cles, dateHeureActuelles],
          (err) => {
            if (err) {
              console.error(err);
              res.json({
                error: "Erreur",
              });
            } else {
              const Folder = path.join('uploads','incidents', `${ID}-${dateHeureActuelles.replaceAll(':','-')}`);
              fs.mkdirSync(Folder);

              imagePaths.forEach(imagePath => {
                const extension = path.extname(imagePath);
                const newImagePath = path.join(Folder, 'image' + Date.now() + '-' + Math.round(Math.random() * 1e9) + extension);
                fs.renameSync(imagePath, newImagePath);
              });
              res.json({ success: true });
            }
          }
        );
      });

      //update an existing solution
      router.post("/updateSolution/:id", (req, res) => {
        const {description, id_incident, date_creation } = req.body;
        const ID = req.params.id; //solution id
        const now = new Date();
        const annee = now.getFullYear();
        const mois = String(now.getMonth() + 1).padStart(2, '0');
        const jour = String(now.getDate()).padStart(2, '0');
        const heure = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const secondes = String(now.getSeconds()).padStart(2, '0');

        
        const dateHeureActuelles = `${annee}-${mois}-${jour} ${heure}:${minutes}:${secondes}`;

        connection.query(
          "INSERT INTO solution (id_solution, description_solution, id_incident, date_creation) VALUES (?,?,?,?)",
          [ID,description, id_incident, dateHeureActuelles],
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

    //get solutions by id_incident
    router.get("/solutions/:id",(req,res)=>{
        const ID = req.params.id;
        connection.query(`SELECT * FROM incident i JOIN solution s ON i.id_incident=s.id_incident where i.id_incident = ${ID} `,(err,result)=>{
            if (err) throw err;
            res.send(result);
        })
    })


    //get incident and its lastest solution by id_incident
    router.get("/incidents/lastVersions/:id",(req,res)=>{
      const ID = req.params.id;
      connection.query(` SELECT * FROM incident i JOIN equipe e ON i.id_equipe = e.id_equipe JOIN application a ON i.id_application = a.id_application JOIN (SELECT id_incident, MAX(date_creation) AS max_incident_date FROM incident WHERE id_incident = 3 ) latest_incident_dates ON i.id_incident = latest_incident_dates.id_incident AND i.date_creation = latest_incident_dates.max_incident_date JOIN ( SELECT id_incident, MAX(date_creation) AS max_solution_date FROM solution WHERE id_incident = ${ID} GROUP BY id_incident ) latest_solution_dates ON i.id_incident = latest_solution_dates.id_incident JOIN solution s ON i.id_incident = s.id_incident AND s.date_creation = latest_solution_dates.max_solution_date;`,
      (err,result)=>{
          if (err) throw err;

          const max_incident_date = result[0]?.max_incident_date;
      const max_solution_date = result[0]?.max_solution_date;

      const transforme = (date) => {
        const incObj = new Date(date);

// Fonction pour ajouter un zéro devant les nombres < 10
const addLeadingZero = (num) => (num < 10 ? "0" + num : num);

// Extraire les différentes parties de la date
const year = incObj.getFullYear();
const month = addLeadingZero(incObj.getMonth() + 1); // Les mois vont de 0 à 11, donc on ajoute 1
const day = addLeadingZero(incObj.getDate());
const hours = addLeadingZero(incObj.getHours());
const minutes = addLeadingZero(incObj.getMinutes());
const seconds = addLeadingZero(incObj.getSeconds());

// Formater la date au format souhaité (aaaa-mm-jj hh-mm-ss)
const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

return formattedDate;

      }
      


      

      var images_incident = transforme(max_incident_date);
      var images_solution = transforme(max_solution_date);

      images_incident = `${ID}-${images_incident.replaceAll(':','-')}`
      images_solution= `${ID}-${images_solution.replaceAll(':','-')}`
          
          res.json({
            resultat : result[0],
            images_incident,
            images_solution
          })
      })
  })



    return router;
};