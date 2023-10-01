import express from "express";
import mysql from "mysql";
import {v4 as uuidv4} from "uuid";
import multer from "multer";
import path from "path";
import dotenv from "dotenv";


dotenv.config();
const app = express();
app.use(express.json());


const auth = (req, res, next) => {
    try {
        if(req.headers.key === process.env.API_KEY) {
          next();
        }
        else {
            res.status(401).json({message: "Unauthorized User"});
        }
    } catch (error) {
        console.log(error);
        res.status(401).json({message: "Unauthorized User"});
    }
}


const storage = multer.diskStorage({
  destination: './src/images/',
  filename:(req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
  }
})
const upload = multer({
  storage: storage
})

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DBNAME,
});



app.get("/details", (req, res) => {
  const q = "SELECT * FROM profile";
  db.query(q, (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }
    return res.json(data);
  });
});

// 1. /details - GET Request
app.get("/details/:id", (req, res) => {
  const userId = req.params.id;
  const q = "SELECT * FROM profile WHERE user_id = ?";
  db.query(q, [userId], (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }
    return res.json(data);
  });
});

// 2. /update - PUT Request
app.put("/update/:id", auth, upload.single('user_image'), (req, res) => {
  const userId = req.params.id;
  const q = "UPDATE profile SET `user_name`= ?, `user_email`= ?, `user_password`= ?, `user_image`= ?, `total_orders`= ? WHERE user_id = ?";
 
  const values = [
    req.body.user_name,
    req.body.user_email,
    req.body.user_password,
    req.file.filename,
    req.body.total_orders
  ];

  db.query(q, [...values,userId], (err, data) => {
    if (err) return res.send("Unauthorized User");
    return res.json("User updated Successfully");
  });
});

// 3. /image - GET Request
app.get("/image/:id", (req, res) => {
  const userId = req.params.id;
  const q = "SELECT user_image FROM profile WHERE user_id = ?";

  db.query(q, [userId], (err, data) => {
    if (err) return res.send(err);
    return res.json(data);
  });
});

// 4. /insert - POST Request
app.post("/insert", auth, upload.single('user_image'), (req, res) => {
  const q = "INSERT INTO profile(`user_id`, `user_name`, `user_email`, `user_password`, `user_image`, `total_orders`, `created_at`, `last_logged_in`) VALUES (?)";


  let date_ob = new Date();
  let date = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  let hours = date_ob.getHours();
  let minutes = date_ob.getMinutes();
  let seconds = date_ob.getSeconds();


  const values = [
    uuidv4(),
    req.body.user_name,
    req.body.user_email,
    req.body.user_password,
    req.file.filename,
    req.body.total_orders,
    year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds,
    year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds
  ];

  db.query(q, [values], (err, data) => {
    if (err) return res.send("Unauthorized User");
    return res.json("Successfully Created User");
  });
});

// 5. /delete - DELETE Request
app.delete("/delete/:id", (req, res) => {
  const userId = req.params.id;
  const q = " DELETE FROM profile WHERE user_id = ? ";

  db.query(q, [userId], (err, data) => {
    if (err) return res.send("Unauthorized User");
    return res.json("User Deleted Successfully");
  });
});

app.listen(5000, () => console.log("Server is Running on 5000"));
