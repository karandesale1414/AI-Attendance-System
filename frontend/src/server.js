const ExcelJS = require("exceljs");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware (IMPORTANT)
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

/* ------------------- MONGODB CONNECT ------------------- */
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected 🚀"))
  .catch((err) => console.log("DB Error:", err));

/* ------------------- MODEL ------------------- */
const EmployeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    department: { type: String, required: true },
  },
  { timestamps: true }
);

const Employee = mongoose.model("Employee", EmployeeSchema);
/* ------------------- ROUTES ------------------- */

// Root check
app.get("/", (req, res) => {
  res.send("SERVER WORKING 🚀");
});

// ---------------- EMPLOYEES ----------------

// GET all employees
app.get("/employees", async (req, res) => {
  try {
    const data = await Employee.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching employees" });
  }
});

// ADD employee
app.post("/employees", async (req, res) => {
  try {
    const emp = new Employee(req.body);
    await emp.save();
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: "Error adding employee" });
  }
});

// DELETE employee
app.delete("/employees/:id", async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete error" });
  }
});

// UPDATE employee
app.put("/employees/:id", async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Update error" });
  }
});

/* ------------------- ATTENDANCE ------------------- */

// GET Attendance
app.get("/attendance", async (req, res) => {
  try {
    const data = await Attendance.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching attendance" });
  }
});

// ADD Attendance
app.post("/attendance", async (req, res) => {
  try {
    const attendance = new Attendance(req.body);
    await attendance.save();
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: "Error saving attendance" });
  }
});

/* ------------------- EXPORT EXCEL ------------------- */

app.get("/export-attendance", async (req, res) => {
  try {
    const attendance = await Attendance.find();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance");

    worksheet.columns = [
      { header: "Employee ID", key: "employeeId", width: 20 },
      { header: "Name", key: "name", width: 25 },
      { header: "Date", key: "date", width: 20 },
      { header: "Status", key: "status", width: 15 },
    ];

    attendance.forEach((item) => {
      worksheet.addRow({
        employeeId: item.employeeId,
        name: item.name,
        date: item.date,
        status: item.status,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=attendance.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
/* ------------------- SERVER START ------------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});