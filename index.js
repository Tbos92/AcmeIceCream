const pg = require("pg");
const express = require("express");
const app = express();
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://bosma:3892@localhost/acme_icecream_db"
);

app.use(require("morgan")("dev"));
app.use(express.json());

// Return all flavors
app.get("/api/icecreams", async (req, res, next) => {
  try {
    const SQL = /* sql */ `SELECT * from icecreams ORDER BY created_at DESC`;

    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// Return single flavor by id
app.get("/api/icecreams/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const SQL = /* sql */ `SELECT * from icecreams WHERE id = $1`;

    const response = await client.query(SQL, [id]);

    if (response.rows.length === 0) {
      return res.status(404).send({ message: "Ice cream flavor not found" });
    }

    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Return new created flavor
app.post("/api/icecreams", async (req, res, next) => {
  try {
    const SQL = /* sql */ `
    INSERT INTO icecreams(name, is_favorite)
    VALUES($1, $2)
    RETURNING *;
    `;
    const { name } = req.body;
    const is_favorite = req.body.is_favorite ?? false;
    const response = await client.query(SQL, [name, is_favorite]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Return nothing, delete flavor by id
app.delete("/api/icecreams/:id", async (req, res, next) => {
  try {
    const SQL = /* sql */ `
    DELETE from icecreams
    WHERE id = $1
    `;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

// Returns updated flavor
app.put("/api/icecreams/:id", async (req, res, next) => {
  try {
    const SQL = /* sql */ `
        UPDATE icecreams
        SET name=$1, is_favorite=$2, updated_at= now()
        WHERE id=$3 RETURNING *
        `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    error(next);
  }
});

const init = async () => {
  await client.connect();
  console.log("connected to database");
  let SQL = /* sql */ `
    DROP TABLE IF EXISTS icecreams;
    CREATE TABLE icecreams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
    );
`;
  await client.query(SQL);
  console.log("table created");

  SQL = /* sql */ `
INSERT INTO icecreams (name, is_favorite) VALUES ('chocolate fudge', true);
INSERT INTO icecreams (name, is_favorite) VALUES ('vanilla bean', true);
INSERT INTO icecreams (name, is_favorite) VALUES ('strawberry swirl', true);
INSERT INTO icecreams (name, is_favorite) VALUES ('mint chocolate chip', true);
INSERT INTO icecreams (name, is_favorite) VALUES ('cookies and cream', true);
INSERT INTO icecreams (name, is_favorite) VALUES ('rocky road', false);
INSERT INTO icecreams (name, is_favorite) VALUES ('pistachio almond', false);
INSERT INTO icecreams (name, is_favorite) VALUES ('salted caramel', false);
INSERT INTO icecreams (name, is_favorite) VALUES ('butter pecan', false);
INSERT INTO icecreams (name, is_favorite) VALUES ('mocha', false);
INSERT INTO icecreams (name, is_favorite) VALUES ('birthday cake', false);
INSERT INTO icecreams (name, is_favorite) VALUES ('raspberry sorbet', true);
INSERT INTO icecreams (name, is_favorite) VALUES ('peanut butter cup', false);
INSERT INTO icecreams (name, is_favorite) VALUES ('coconut', false);
INSERT INTO icecreams (name, is_favorite) VALUES ('hazelnut praline', false);
INSERT INTO icecreams (name, is_favorite) VALUES ('blackberry cheesecake', false);
`;
  await client.query(SQL);
  console.log("data seeded");

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};
init();
