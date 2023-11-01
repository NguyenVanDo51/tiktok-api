"use strict";

const express = require("express");
var cors = require("cors");
const uuid = require("uuid");
const multer = require("multer");
const { db } = require("../firebase");
const firebase = require("../firebase");
const { format } = require("util");

const app = express();
app.use(cors());
app.use(
  express.urlencoded({
    extended: false,
    limit: "50mb",
    parameterLimit: 1000000,
  })
);
app.use(express.json({ extended: false, limit: "50mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
});
app.use(upload.single());
const port = 3000;

// [END initialize]
app.post("/api", (req, res) => {
  return res.send(`It's work`);
});

app.post("/api/signup", async (req, res) => {
  const body = req.body ?? {};
  try {
    const result = await db
      .collection("profile")
      .doc(body.email)
      .set({
        createdAt: new Date().valueOf(),
        ...body,
      });

    res.json(result.writeTime);
  } catch (e) {
    res.status(500).json(String(e));
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const email = req.query?.email;

    let posts = db.collection("profile").orderBy("email", "desc");

    if (email?.length) {
      posts = posts
        .where("email", ">=", email)
        .where("email", "<=", email + "\uf8ff");
    }

    const result = await posts.get();

    const total = (await posts.get()).size;

    const data = [];
    result.forEach((doc) => {
      data.push(doc.data());
    });

    res.json({ data, total });
  } catch (e) {
    res.status(500).json(String(e));
  }
});

// app.post("/api/profile", async (req, res) => {
//   const body = req.body ?? {};
//   try {
//     const id = uuid.v4();
//     const result = await db
//       .collection("profile")
//       .doc(id)
//       .set({
//         _id: id,
//         createdAt: new Date().valueOf(),
//         ...body,
//       });

//     res.json(result.writeTime);
//   } catch (e) {
//     res.status(500).json(String(e));
//   }
// });

app.post("/api/upload", (req, res) => {
  if (!req.file) {
    return res.status(400).send("Error: No files found");
  }
  const blob = firebase.bucket.file(req.file.originalname);

  const blobWriter = blob.createWriteStream({
    metadata: {
      contentType: req.file.mimetype,
    },
  });

  blobWriter.on("error", (err) => {
    console.log(err);
  });

  blobWriter.on("finish", async () => {
    const publicUrl = format(
      `https://firebasestorage.googleapis.com/v0/b/${
        firebase.bucket.name
      }/o/${blob.name.replaceAll(" ", "%20")}?alt=media`
    );
    try {
      // Make the file public
      await bucket.file(req.file.originalname).makePublic();
    } catch {
      return res.status(200).send({
        message: `Uploaded the file successfully: ${req.file.originalname}, but public access is denied!`,
        url: publicUrl,
      });
    }

    res.status(200).send({
      message: "Uploaded the file successfully: " + req.file.originalname,
      url: publicUrl,
    });
  });

  blobWriter.end(req.file.buffer);
});

app.post("/api/posts", async (req, res) => {
  const body = req.body ?? {};

  const id = uuid.v4();
  try {
    const result = await db
      .collection("posts")
      .doc(id)
      .set({
        _id: id,
        createdAt: new Date().valueOf(),
        ...body,
      });

    res.json(result.writeTime);
  } catch (e) {
    res.status(500).json(String(e));
  }
});

app.get("/api/posts", async (req, res) => {
  try {
    const page = Number(req.query?.page ?? 0);
    const limit = Number(req.query?.limit ?? 10);
    const username = req.query?.username;

    let posts = db.collection("posts").orderBy("createdAt", "desc");

    if (username?.length) {
      posts = posts.where("author.username", "==", username);
    }

    const result = await posts
      // .startAt(page)
      // .limit(limit)
      .get();

    const total = (await posts.get()).size;

    const data = [];
    result.forEach((doc) => {
      data.push(doc.data());
    });

    res.json({ data, total, page, limit });
  } catch (e) {
    res.status(500).json(String(e));
  }
});

app.get("/api/posts/following", async (req, res) => {
  try {
    const page = Number(req.query?.page ?? 0);
    const limit = Number(req.query?.limit ?? 10);

    let posts = db.collection("posts").orderBy("createdAt", "desc");

    const result = await posts.get();

    const total = (await posts.get()).size;

    const data = [];
    result.forEach((doc) => {
      const post = doc.data();
      post.isFollowing = true;

      data.push(post);
    });

    res.json({ data, total, page, limit });
  } catch (e) {
    res.status(500).json(String(e));
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;
