const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

require("dotenv").config();

const Employee = require("./models/Employee");

const app = express();


app.use(cors());

app.use(express.json());



// MongoDB Connect

mongoose.connect(process.env.MONGO_URI)

.then(()=>{

    console.log("MongoDB Connected");

})

.catch((err)=>{

    console.log(err);

});




// GET ALL EMPLOYEES

app.get("/employees", async (req,res)=>{


    try{


        const employees = await Employee.find();


        res.json(employees);



    }catch(error){


        res.status(500).json({

            message:error.message

        });


    }


});






// ADD EMPLOYEE

app.post("/employees", async (req, res) => {
  try {

    console.log("BODY RECEIVED:", req.body); // 🔥 IMPORTANT DEBUG

    const { name, email, status } = req.body;

    const employee = new Employee({
      name,
      email,
      id: Date.now().toString(),
      status: status || "Active"
    });

    await employee.save();

    res.json({
      success: true,
      employee
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// EDIT EMPLOYEE


app.post("/employees", async(req,res)=>{

try{

const employee = new Employee({

name:req.body.name,

email:req.body.email,

id:Date.now().toString(),

status:"Active"

});


await employee.save();


res.json({

message:"Employee Added",

employee

});


}catch(error){

console.log(error);


res.status(500).json({


});

}

});







// DELETE EMPLOYEE


app.delete("/employees/:id", async(req,res)=>{


    try{


        await Employee.findByIdAndDelete(req.params.id);


        res.json({

            message:"Deleted"

        });



    }catch(error){


        res.status(500).json({

            message:error.message

        });


    }


});






app.listen(5000,()=>{


    console.log("Server Running On Port 5000");


});
