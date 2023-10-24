'use strict';

const express = require('express')
const uuid = require('uuid')
const multer = require('multer');
const { db } = require('./firebase');
const firebase = require('./firebase');
const { format } = require('util');

const app = express()
app.use(express.urlencoded({extended: false}))
app.use(express.json({ extended: false }))

const upload = multer({
  storage: multer.memoryStorage()
})
app.use(upload.single())
const port = 3000


// [END initialize]


app.post('/api/upload', (req, res) => {
  if(!req.file) {
      return res.status(400).send("Error: No files found")
  } 
  const blob = firebase.bucket.file(req.file.originalname)
  
  const blobWriter = blob.createWriteStream({
      metadata: {
          contentType: req.file.mimetype
    },
  })
  
  blobWriter.on('error', (err) => {
      console.log(err)
  })
  
  blobWriter.on('finish', async () => {
    const publicUrl = format(
      `https://firebasestorage.googleapis.com/v0/b/${firebase.bucket.name}/o/${blob.name.replaceAll(' ', '%20')}?alt=media`
    );
    try {
      // Make the file public
      await bucket.file(req.file.originalname).makePublic();
    } catch {
      return res.status(500).send({
        message:
          `Uploaded the file successfully: ${req.file.originalname}, but public access is denied!`,
        url: publicUrl,
      });
    }

    res.status(200).send({
      message: "Uploaded the file successfully: " + req.file.originalname,
      url: publicUrl,
    });
  })
  
  blobWriter.end(req.file.buffer)
})

app.post('/api/posts', async (req, res) => {
  const body = req.body ?? {}
  try {
    const id = uuid.v4()
    const result = await db.collection('posts').doc(id).set({
      _id: id,
      ...body
    })

    res.json(result.writeTime)
  } catch (e) {
    res.status(500).json(e)
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

module.exports = app;