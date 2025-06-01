const express =require('express')
const cors =require('cors')
const app = express()
const jwt =require('jsonwebtoken')
const cookieParser =require('cookie-parser')
const port =process.env.PORT || 3000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

app.use(cors({
  origin:['http://localhost:5173'],
  credentials:true
}))
app.use(express.json())
app.use(cookieParser())

const logger =(req,res,next)=>{
  console.log('inside logger')
  next()
}

const verifyToken =(req,res,next)=>{
  const token =req?.cookies?.token
  console.log('cookie' ,token)


  //check tocken
  if(!token){
    return res.status(401).send({message: 'unauthorized'})
  }
//verify token
jwt.verify(token, process.env.JWT_SECRET, (err,decoded)=>{
  if(err){
    return res.status(401).send({message: 'unauthorized token'})
  }
  req.decoded =decoded;
   next()
})


 
}


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
    const applicationsCollection =client.db('JobPortal').collection('application');

    //jwt token related api
    app.post('/jwt',async(req,res)=>{
      const userData =req.body;
      const token =jwt.sign(userData, process.env.JWT_SECRET,
        {  expiresIn: '1d'})

        //set token in the cookie
        res.cookie('token',token,{
          httpOnly:true,
          secure:false
        })

        res.send({success: true})
    })

    
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

    app.get('/application', logger,verifyToken, async(req,res)=>{
        const email =req.query.email;

        // console.log('inside',req.cookies)
        if(email !== req.decoded.email){
          return res.status(403).send({message: 'forbiden access'})
        }

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