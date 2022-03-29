const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('Hit the trail Server Running');
});

app.listen(port, () => {
  console.log('Running Server on:', port);
});
