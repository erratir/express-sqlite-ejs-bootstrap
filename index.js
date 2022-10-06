const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// Creating the Express server
const app = express();

// Server configuration
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));

// Error logger
app.use((err, req, res, next) => {
  console.error(err.message || err.stack)
  next(err)
})
// Error response
app.use((err, req, res, next) => {
  res.status(res.statusCode !== 200 ? res.statusCode : 500).send({ success: false, message: err.message || 'Internal Server Error' })
  next(err)
})

// Connection to the SQlite database
const db_name = path.join(__dirname, "db", "apptest.db");
const db = new sqlite3.Database(db_name, err => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Successful connection to the database 'apptest.db'");
});

// Creating the Books table (Book_ID, Title, Author, Comments)
const sql_create = `CREATE TABLE IF NOT EXISTS Books (
  Book_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  Title VARCHAR(100) NOT NULL,
  Author VARCHAR(100) NOT NULL,
  Comments TEXT
);`;

db.run(sql_create, err => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Successful creation of the 'Books' table");
  // Database seeding
  const sql_insert = `INSERT OR IGNORE INTO Books (Book_ID, Title, Author, Comments) VALUES
  (1, 'Эпоха мертворождённыхe', 'Глеб Бобров', 'Вышедшая еще в 2007 году эта антиутопия луганского писателя Глеба Боброва вдруг через семь лет стала пугающей реальностью. В ней предсказаны разразившиеся бои, они в книге идет ровно в тех местах, где и началась в 2014 году. Предсказано даже убийство руководителя ДНР А. Захарченко (в книге это командующий силами Конфедерации Пётр Скудельников).'),
  (2, 'Некоторые не попадут в ад', 'Захар Прилепин', 'звестный современный писатель Захар Прилепин выпустил в 2019 году роман-фантасмогорию «Некоторые не попадут в ад». Несмотря на причудливое определение жанра, это практически документальная проза, рассказывающая о том, как и зачем автор поехал на эту войну, как и с кем плечом к плечу он там воевал, что он там увидел и пережил. Как поясняет он сам, «кто-то романы сочиняет — а я там живу».'),
  (3, 'Донецко-Криворожская республика: расстрелянная мечта', 'Владимир Корнилов', 'Это добротное историческое исследование рассказывает о такой малоизвестной странице истории — истоках «донбасского сепаратизма» в рамках Украины — Донбасско-Криворожской республике. Она была создана большевиками в 1918 году, чтобы отделиться от Украины, и ликвидирована по настоянию Ленина и Сталина, после чего Донбасс включили в состав советской Украины.');`;

  db.run(sql_insert, err => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Successful creation of a starting list of books");
  });
});

// GET /
app.get("/", (req, res) => {
  res.render("index");
});

// GET /about
app.get("/about", (req, res) => {
  res.render("about");
});

// GET /data
app.get("/data", (req, res) => {
  const test = {
    title: "Test",
    items: ["one", "two", "three"]
  };
  res.render("data", { model: test });
});

// GET /books
app.get("/books", (req, res, next) => {
  const sql = "SELECT * FROM Books ORDER BY Title";
  db.all(sql, [], (err, rows) => {
    if (err) return next(err)
    res.render("books", { model: rows });
  });
});

// GET /create
app.get("/create", (req, res) => {
  res.render("create", { model: {} });
});

// POST /create
app.post("/create", (req, res, next) => {
  const sql = "INSERT INTO Books (Title, Author, Comments) VALUES (?, ?, ?)";
  const book = [req.body.Title, req.body.Author, req.body.Comments];
  db.run(sql, book, err => {
    if (err) return next(err)
    res.redirect("/books");
  });
});

// GET /edit/5
app.get("/edit/:id", (req, res, next) => {
  const id = req.params.id;
  const sql = "SELECT * FROM Books WHERE Book_ID = ?";
  db.get(sql, id, (err, row) => {
    if (err) return next(err)
    res.render("edit", { model: row });
  });
});

// POST /edit/5
app.post("/edit/:id", (req, res, next) => {
  const id = req.params.id;
  const book = [req.body.Title, req.body.Author, req.body.Comments, id];
  const sql = "UPDATE Books SET Title = ?, Author = ?, Comments = ? WHERE (Book_ID = ?)";
  db.run(sql, book, err => {
    if (err) return next(err)
    res.redirect("/books");
  });
});

// GET /delete/5
app.get("/delete/:id", (req, res, next) => {
  const id = req.params.id;
  const sql = "SELECT * FROM Books WHERE Book_ID = ?";
  db.get(sql, id, (err, row) => {
    if (err) return next(err)
    res.render("delete", { model: row });
  });
});

// POST /delete/5
app.post("/delete/:id", (req, res, next) => {
  const id = req.params.id;
  const sql = "DELETE FROM Books WHERE Book_ID = ?";
  db.run(sql, id, err => {
    if (err) return next(err)
    res.redirect("/books");
  });
});

// Starting the server
app.listen(3000, () => {
  console.log("Server started (http://localhost:3000/) !");
});
