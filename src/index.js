const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

const app = express();
app.use(cors());
// const PORT = process.env.PORT || 5000;

const jsonData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf-8'));

//aws config
const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

console.log(process.env.AWS_ACCESS_KEY_ID)

const s3 = new AWS.S3();
const bucketName = 'starlightimages';

app.get('/test', (req, res) => {
  res.send('hello word');
});

// Endpoint 1: Returns a list of all beauties
app.get('/api/beauties', (req, res) => {
  res.json(jsonData.beauties);
});

// Endpoint 2: Returns a list of active beauties
app.get('/api/active-beauties', (req, res) => {
  const activeBeauties = jsonData.beauties.filter(beauty => beauty.isActive);
  res.json(activeBeauties);
});

// Endpoint 3: Returns a beauty given id
app.get('/api/beauties/:id', (req, res) => {
  const beautyId = parseInt(req.params.id);
  const beauty = jsonData.beauties.find(beauty => beauty.id === beautyId);

  if (!beauty) {
    return res.status(404).json({ error: 'Beauty not found' });
  }

  const params = {
    Bucket: bucketName,
    Prefix: `beauties/${req.params.id}`,
  };

  s3.listObjects(params,(err, data) => {
    if (err) {
      return res.status(404).json({ error: 'Error fetching from S3 bucket' });
    }
    const imageUrls = data.Contents.map((object) => object.Key)
    .filter((key) => !key.endsWith('/')) // Exclude directories
    .filter((key) => !key.endsWith('0.jpg')) // Exclude specific files
    const updatedBeauty = {
      ...beauty,
      imgUrl: imageUrls, 
    };
    res.json(updatedBeauty);
  });
});

// Endpoint 4: Returns a list of products
app.get('/api/products', (req, res) => {
  res.json(jsonData.products);
});

// Endpoint 5: Returns a product given id
app.get('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = jsonData.products.find(product => product.id === productId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const params = {
    Bucket: bucketName,
    Prefix: `products/${req.params.id}`,
  };

  s3.listObjects(params,(err, data) => {
    if (err) {
      return res.status(404).json({ error: 'Error fetching from S3 bucket' });
    }
    const imageUrls = data.Contents.map((object) => object.Key)
    .filter((key) => !key.endsWith('/')) // Exclude directories
    .filter((key) => !key.endsWith('0.jpg')) // Exclude specific files
    const updatedProduct = {
      ...product,
      imgUrl: imageUrls, 
    };
    res.json(updatedProduct);
  });
});

// Start the server
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });
module.exports.handler = serverless(app);