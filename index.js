const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;


//middlewares
const corsOptions = {
    origin: ["http://localhost:5173", 'https://shopmaster-ea00f.web.app'],
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
const brand_category_Collections = client.db('shopMaster').collection('brand_category');

async function run() {
    try {

        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });

        // authentication apis
        app.post('/register', async (req, res) => {
            const user = req.body;
            const result = await userCollections.insertOne(user);
            return res.send(result);
        });
        // login api
        app.post('/login', async (req, res) => {
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
            return res.send({ result, count });
        });

        // get products by search api 
        app.get('/queries', async (req, res) => {
            const search = req.query.search || "";
            let query = {
                product_name: {
                    $regex: search, $options: 'i'
                }
            }
            const result = await productCollections.find(query).toArray();
            res.send(result);
        });

        // get brands and categories api
        app.get('/brands_category', async (req, res) => {
            const result = await brand_category_Collections.find().toArray();
            return res.send(result);
        });

        // categorization api
        app.get('/categorization', async (req, res) => {
            try {
                const { category, brand } = req.query;
                let filter = {};
                if (category) {
                    filter.product_category = category;
                    const products = await productCollections.find(filter).toArray();
                    return res.send(products);
                }
                if (brand) {
                    filter.brand_name = brand;
                    const products = await productCollections.find(filter).toArray();
                    return res.send(products);
                }
                const products = await productCollections.find(filter).toArray();
                return res.send(products);
            } catch (err) {
                res.json({
                    success: false,
                    error: 'something went wrong in the server',
                    status: 500,
                })
            }
        });
        // sort by minPrice maxPrice 
        app.get('/price', async (req, res) => {
            const { minPrice, maxPrice } = req.query;
            // Build the filter object
            let priceFilter = {};
            // Apply minimum price filter
            if (minPrice !== undefined) {
                priceFilter.$gte = parseFloat(minPrice);
            }
            // Apply maximum price filter
            if (maxPrice !== undefined) {
                priceFilter.$lte = parseFloat(maxPrice);
            }
            // If priceFilter is not empty, add it to the main filter object
            let filter = {};
            if (Object.keys(priceFilter).length > 0) {
                filter.product_price = priceFilter;
            }
            try {
                // Find products based on the filter
                const result = await Product.find(filter).toArray();

                // Send the filtered products back to the client
                console.log(result);
                return res.send(result);
            } catch (error) {
                return res.status(500).json({ message: error.message });
            }

            // const parseMinPrice = parseFloat(req.query.minPrice);
            // const parseMaxPrice = parseFloat(req.query.maxPrice);
            // if (parseMaxPrice && parseMinPrice) {
            //     const result = await productCollections.find({
            //         product_price: {
            //             $gte: parseMinPrice,
            //             $lte: parseMaxPrice,
            //         }
            //     });
            //     return res.send(result);
            // }
            // const result = await productCollections.find({ product_price: { $gte: parseMinPrice } }).toArray();
            // return res.send(result);
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