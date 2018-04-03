'use strict';

const express = require('express');
let app = express();

app.get('/api/sayHello', (req, res) => {
  const response = `This is service2. \n Running in host: ${process.env.HOSTNAME}`;
  console.log(response);
  return res.send(response);
})

app.listen(3000, '0.0.0.0');