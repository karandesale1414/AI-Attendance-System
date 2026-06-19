import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [employees, setEmployees] = useState([]);
  console.log("EMPLOYEES STATE:", employees);
  const [name, setName] = useState("");
  const [empId, setEmpId] = useState("");
  const [loading, setLoading] = useState(false);

  const [report, setReport] = useState([]);

  const API = "http://localhost:5000";

  // ---------------- FETCH EMPLOYEES ----------------
  const fetchEmployees = async () => {
    console.log("FETCH RESPONSE:", data);
    try {
      setLoading(true);
      const res = await axios.get(`${API}/employees`);
      setEmployees(res.data || []);
    } catch (err) {
      console.log("Fetch Error:", err);
      alert("Error fetching employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // ---------------- ADD EMPLOYEE ----------------
  const addEmployee = async () => {
    if (!name || !empId) {
      return alert("Fill all fields");
    }

    try {
      await axios.post(`${API}/employees`, {
        name,
        id: empId,
      });

      setName("");
      setEmpId("");
      fetchEmployees();
    } catch (err) {
      console.log("Add Error:", err);
      alert("Error adding employee");
    }
  };

  // ---------------- MARK ATTENDANCE ----------------
  const markAttendance = async (emp) => {
    const today = new Date().toISOString().split("T")[0];

    try {
      await axios.post(`${API}/attendance`, {
        employeeId: emp.id,
        name: emp.name,
        date: today,
        status: "Present",
      });

      alert("Attendance Marked ✔");
    } catch (err) {
      console.log("Attendance Error:", err);
      alert("Error marking attendance");
    }
  };

  // ---------------- GET REPORT ----------------
  const getReport = async () => {
    const today = new Date().toISOString().split("T")[0];

    try {
      const res = await axios.get(
        `${API}/attendance-report/${today}`
      );

      setReport(res.data.data || []);
    } catch (err) {
      console.log("Report Error:", err);
    }
  };

  return (
    <div className="App">
      <h1>📊 HRMS System</h1>

      {/* ADD EMPLOYEE */}
      <div style={{ marginBottom: "20px" }}>
        <h2>Add Employee</h2>

        <input
          type="text"
          placeholder="Enter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ margin: "5px", padding: "8px" }}
        />

        <input
          type="number"
          placeholder="Enter ID"
          value={empId}
          onChange={(e) => setEmpId(e.target.value)}
          style={{ margin: "5px", padding: "8px" }}
        />

        <button onClick={addEmployee} style={{ padding: "8px 15px" }}>
          Add Employee
        </button>
      </div>

      {/* EMPLOYEE LIST */}
      <h2>Employees</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        employees.map((emp, index) => (
          <div
            key={emp._id || index}
            style={{
              padding: "10px",
              margin: "10px",
              background: "#eee",
              borderRadius: "5px",
            }}
          >
            {emp.name} - {emp.id}

            <button
              onClick={() => markAttendance(emp)}
              style={{ marginLeft: "10px" }}
            >
              Mark Present
            </button>
          </div>
        ))
      )}

      {/* REPORT */}
      <hr />

      <h2>📅 Today Attendance Report</h2>

      <button onClick={getReport}>
        Get Report
      </button>

      {report.length === 0 ? (
        <p>No report</p>
      ) : (
        report.map((item, i) => (
          <div key={i} style={{ margin: "5px" }}>
            {item.name} - {item.status}
          </div>
        ))
      )}
    </div>
  );
}

export default App;