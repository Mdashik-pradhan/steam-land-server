const express = require('express')
const app = express()
const admin = require("firebase-admin");
const cors = require('cors');
const { MongoClient } = require('mongodb');
const ObjectId  = require('mongodb').ObjectId;
// const fileUpload = require('express-fileupload');
require('dotenv').config();

const port = process.env.PORT || 5000;

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


app.use(cors());
app.use(express.json());
// app.use(express.static('products'));
// app.use(fileUpload());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hda5d.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        } catch {

        }

    }
    next();
}


async function run(){
    try {
        await client.connect();
        const database = client.db("steamLand");
        const productsCollection = database.collection("products");
        const ordersCollection = database.collection("orders");
        const reviewsCollection = database.collection("reviews");
        const usersCollection = database.collection("users");

        // POST API
        app.post('/products', async (req, res) =>{
            const file = req.files;
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.json(result);
        })

        // USER
        app.post('/users', async (req, res) =>{
            const file = req.files;
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        })

        app.post('/orders', async (req, res) => {
            const order = req.body;
            console.log(order)
            const result = await ordersCollection.insertOne(order);
            res.json(result);
        })

        // Reviews 
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            console.log(review)
            const result = await reviewsCollection.insertOne(review);
            res.json(result);
        })

        // GET API
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.json(products);
        });

        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id)};
            const result = await productsCollection.findOne(query);
            res.json(result);
        })

        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            console.log(email);
            const query = { email: email};
            const cursor = ordersCollection.find(query);
            const orders = await cursor.toArray();
            res.json(orders);
        })

        // Get Reviews
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const reviews = await cursor.toArray();
            res.json(reviews);
        });


        // PUT 
        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'you do not have access to make admin' })
            }

        })

        // DELETE API
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.json(result);
        })

        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.json(result);
        })
        
    }
    catch {

    }
    finally{
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})