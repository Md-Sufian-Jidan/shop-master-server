const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;


//middlewares
const corsOptions = {
    origin: ["http://localhost:5173",],
    credentials: true,
    optionSuccessStatus: 200
};

app.use(express.json());
app.use(cors(corsOptions));

const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });

        const userCollections = client.db('shopMaster').collection('users');
        const productCollections = client.db('shopMaster').collection('products');


        // // jwt related api
        // app.post('/jwt', async (req, res) => {
        //     const user = req.body;
        //     const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
        //     res.send({ token });
        // });

        // authentication apis
        app.post('/register', async (req, res) => {
            const user = req.body;
            const userAlreadyExists = await userCollections.find({ email: user?.email });

            if (userAlreadyExists) {
                return res.json({
                    success: false,
                    error: 'User already Exists',
                });
            }
            const result = await userCollections.insertOne(user);
            return res.json({
                success: true,
                message: 'User Created Successfully',
                data: result,
            })
        });

        // products apis
        app.get('/products', async (req, res) => {
            const result = await productCollections.find().toArray();
            return res.send(result);
        });

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    return res.send('product management server start');
});

app.listen(port, () => {
    console.log(`server is running on ${port}`);
});