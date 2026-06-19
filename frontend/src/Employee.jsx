import { useEffect, useState } from "react";

export default function Employee() {

  const [employees, setEmployees] = useState([]);
  const [name, setName] = useState("");
  const [empEmail, setEmpEmail] = useState("");


  // GET EMPLOYEES

  const fetchEmployees = async () => {

    try {

      const res = await fetch(
        "http://localhost:5000/employees"
      );

      const data = await res.json();

      console.log("GET:", data);

      setEmployees(data);


    } catch(err) {

      console.log("Fetch Error:", err);

    }

  };


  useEffect(()=>{

    fetchEmployees();

  },[]);



  // ADD EMPLOYEE

  const addEmployee = async()=>{


    if(!name || !empEmail){

      alert("Fill all fields");
      return;

    }


    try{


      const res = await fetch(

        "http://localhost:5000/employees",

        {

          method:"POST",

          headers:{

            "Content-Type":"application/json"

          },


          body:JSON.stringify({

            name:name,

            email:empEmail,

            status:"Active"

          })


        }

      );


      const result = await res.json();

      console.log("ADD RESULT:",result);


      setName("");
      setEmpEmail("");


      fetchEmployees();



    }catch(err){

      console.log("ADD ERROR:",err);

    }


  };





  // DELETE EMPLOYEE


  const deleteEmployee = async(id)=>{


    try{


      await fetch(

        `http://localhost:5000/employees/${id}`,

        {

          method:"DELETE"

        }

      );


      fetchEmployees();


    }catch(err){

      console.log(err);

    }


  };





return (

<div

style={{

padding:"20px",

color:"white"

}}

>


<h2>Employees</h2>


<table style={{width:"100%", marginTop:"20px"}}>


<thead>

<tr>

<th>Name</th>

<th>Email</th>

<th>Status</th>

<th>Actions</th>


</tr>

</thead>



<tbody>


{

employees.length === 0 ? (

<tr>

<td colSpan="4">

No Employee Found

</td>

</tr>


) : (


employees.map((emp)=>(


<tr key={emp._id}>


<td>

{emp.name}

</td>



<td>

{emp.email}

</td>



<td>

{emp.status}

</td>



<td>


<button

onClick={()=>deleteEmployee(emp._id)}

>

Delete

</button>


</td>



</tr>


))


)


}


</tbody>


</table>





<h3>Add Employee</h3>



<input


placeholder="Employee Name"


value={name}


onChange={(e)=>setName(e.target.value)}


/>




<input


placeholder="Employee Email"


value={empEmail}


onChange={(e)=>setEmpEmail(e.target.value)}


/>



<button

onClick={addEmployee}

>

Add Employee

</button>



</div>


);


}