const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;


//middlewares
const corsOptions = {
    origin: ["http://localhost:5173",],
    credentials: true,
    optionSuccessStatus: 200
};

app.use(express.json());
app.use(cors(corsOptions));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qvjjrvn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const userCollections = client.db('shopMaster').collection('users');
const productCollections = client.db('shopMaster').collection('products');

async function run() {
    try {

        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });

        // authentication apis
        app.post('/register', async (req, res) => {
            const user = req.body;
            const query = { email: user?.email }
            const userAlreadyExists = userCollections.find(query);

            if (userAlreadyExists) {
                return res.send({ message: 'user already exist', insertedIn: null })
            }
            const result = await userCollections.insertOne(user);
            return res.send(result);
        });

        // products apis
        app.get('/products', async (req, res) => {
            console.log('products api hit');

            const query = req.query;
            const page = parseFloat(req.query.page);
            const size = parseFloat(req.query.size);
            console.log(query);
            const result = await productCollections.find()
                .skip(page * size)
                .limit(size)
                .toArray();
            const count = await productCollections.estimatedDocumentCount();
            console.log(result);
            console.log(count);

            // const result = await productCollections.find().toArray();
            return res.send({ result, count });
        });

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    return res.send('product management server start');
});

app.listen(port, () => {
    console.log(`server is running on ${port}`);
});