const express =require('express')
const cors =require('cors')
const app = express()
const port =process.env.PORT || 3000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pqt6h0w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const jobsCollection =client.db('JobPortal').collection('Job');
    const applicationsCollection =client.db('JobPortal').collection('application')

    //jobs app

    app.get('/Job',async(req,res)=>{
        const cursor =jobsCollection.find()
        const result =await cursor.toArray()
        res.send(result)
    });

    app.get('/Job/:id', async(req,res)=>{
        const id= req.params.id;
        const query ={_id: new ObjectId(id)}
        const result = await jobsCollection.findOne(query)
        res.send(result)

    });

    app.get('/application', async(req,res)=>{
        const email =req.query.email;

        const query ={
            applicant: email
        }
        const result =await applicationsCollection.find(query).toArray();
        for(const app of result){
            const jobId =app.jobId;
            const jobQuery = {_id: new ObjectId(jobId)}
            const job =await jobsCollection.findOne(jobQuery);
            app.company =job.company
            app.title =job.title;
            app.company_logo =job.company_logo
        }
        res.send(result)
    })

    // job application api
    app.post('/application',async(req,res)=>{
        const application =req.body;
        console.log(application)
        const result =await applicationsCollection.insertOne(application);
        res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res)=>{
    res.send('Job portal')
})

app.listen(port, ()=>{
    console.log(`Job portal server ${port}`)
})