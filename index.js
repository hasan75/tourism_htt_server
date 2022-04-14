const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;
const stripe = require('stripe')(process.env.STRIPE_SECRET);

const app = express();
const port = process.env.PORT || 5001;

//MIDDLEWARE
app.use(cors());
app.use(express.json());

//connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4dxux.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db('touriusm_htt');
    const user_collection = database.collection('users');
    const product_collection = database.collection('services');
    const order_collection = database.collection('orders');
    const review_collection = database.collection('reviews');
    const blog_collection = database.collection('blogs');

    //adding USER by POST
    app.post('/users', async (req, res) => {
      const result = await user_collection.insertOne(req.body);
      res.json(result);
    });

    //get users by GET
    app.get('/users', async (req, res) => {
      const result = await user_collection.find({}).toArray();
      res.json(result);
    });

    //adding USER by POST
    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const result = await user_collection.findOne({ email: email });
      res.json(result);
    });

    // get blog by get
    app.get('/blogs', async (req, res) => {
      const result = await blog_collection.find({}).toArray();
      res.json(result);
    });

    //adding blogs by admin
    app.post('/addBlog', async (req, res) => {
      const result = await blog_collection.insertOne(req.body);
      res.json(result);
    });

    //ADDING NEW ADMIN by POST
    app.put('/addAdmin', async (req, res) => {
      const email = req.body.email;
      const result = await user_collection.updateOne(
        { email },
        {
          $set: { role: 'admin' },
        }
      );
      res.json(result);
    });

    //Product load by GET
    app.get('/products', async (req, res) => {
      const cursor = product_collection.find({});
      const page = req.query.page;
      const size = parseInt(req.query.size);
      let products;
      const count = await cursor.count();
      if (page) {
        products = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        products = await cursor.toArray();
      }
      res.json({ count, products });
    });

    //single product load by GET
    app.get('/products/:id', async (req, res) => {
      const result = await product_collection.findOne({
        _id: ObjectId(req.params.id),
      });
      res.json(result);
    });

    //SIngleProduct Load by GET
    app.get('/placeorder/:id', async (req, res) => {
      const result = await product_collection.findOne({
        _id: ObjectId(req.params.id),
      });
      res.json(result);
    });

    //ORDER PLACE by POST
    app.post('/placeorder', async (req, res) => {
      const order = req.body;
      order.status = 'Pending';
      delete order._id;
      const result = await order_collection.insertOne(order);
      res.json(result);
    });

    //LOAD ALL ORDERS by GET
    app.get('/orders', async (req, res) => {
      const email = req.query.email;
      let result;
      if (email) {
        result = await order_collection.find({ email }).toArray();
      } else {
        result = await order_collection.find({}).toArray();
      }
      res.json(result);
    });

    //get orders for payment
    app.get('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await order_collection.findOne(query);
      res.json(result);
    });

    //update single orders for payment
    app.put('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          payment: payment,
        },
      };
      const result = await order_collection.updateOne(filter, updateDoc);
      res.json(result);
    });

    //CHANGE ORDER STATUS (UPDATE) by PUT
    app.put('/updateOrderStatus', async (req, res) => {
      const id = req.body.id;
      const status = req.body.status;
      const result = await order_collection.updateOne(
        { _id: ObjectId(id) },
        {
          $set: { status: status },
        }
      );
      res.json(result.modifiedCount);
    });

    //UPDATE A PRODUCT by PUT
    app.put('/updateProduct', async (req, res) => {
      const id = req.query.id;
      const product = req.body;
      const result = await product_collection.updateOne(
        { _id: ObjectId(id) },
        {
          $set: product,
        }
      );
      res.json(result);
    });

    //DELETE AN Order by DELETE
    app.delete('/placeorder/:id', async (req, res) => {
      const result = await order_collection.deleteOne({
        _id: ObjectId(req.params.id),
      });
      res.json(result);
    });

    //ADD A NEW Product by POST
    app.post('/addProduct', async (req, res) => {
      const result = await product_collection.insertOne(req.body);
      res.json(result);
    });

    //REVIEW ADDING by POST
    app.post('/addReview', async (req, res) => {
      const result = await review_collection.insertOne(req.body);
      res.json(result);
    });

    //LOADING ALL REVIEWS by get
    app.get('/reviews', async (req, res) => {
      const result = await review_collection.find({}).toArray();
      res.json(result);
    });

    //DELETE A PRODUCT by DELETE
    app.delete('/deleteProduct/:id', async (req, res) => {
      const result = await product_collection.deleteOne({
        _id: ObjectId(req.params.id),
      });
      res.json(result);
    });

    //SINGLE ORDER LOAD by GET
    app.get('/updateOne/:id', async (req, res) => {
      const result = await product_collection.findOne({
        _id: ObjectId(req.params.id),
      });
      res.json(result);
    });

    //payment intent
    app.post('/create-payment-intent', async (req, res) => {
      const paymentInfo = req.body;
      const amount = paymentInfo.thePrice * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        currency: 'usd',
        amount: amount,
        payment_method_types: ['card'],
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    });
  } finally {
    // await client.close()
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hit the trail Server Running');
});

app.listen(port, () => {
  console.log('Running Server on:', port);
});
