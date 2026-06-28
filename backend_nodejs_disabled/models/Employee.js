const mongoose = require("mongoose");


const EmployeeSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },


  id: {
    type: String,
    required: true
  },


  email: {
    type: String,
    required: true
  },


  status: {
    type: String,
    default: "Active"
  }


});


module.exports = mongoose.model("Employee", EmployeeSchema);