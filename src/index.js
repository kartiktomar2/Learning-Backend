
import { app } from './app.js';
import connectDB from './db/index.js'
import { configDotenv } from 'dotenv';

configDotenv({
    path:'./env'
});
connectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
          console.log(`Server is running on port ${process.env.PORT}`);
          
    })
})
.catch((error)=>{
    console.log(`Mongo DB connection Failed!!!  ${error}`);
    
})