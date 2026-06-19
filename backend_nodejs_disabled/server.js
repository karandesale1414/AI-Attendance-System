const ExcelJS = require("exceljs");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

mongoose
  .connect("mongodb://127.0.0.1:27017/hrms")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.log("DB Error:", err.message);
  });

const AdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "HR Admin" },
  },
  { timestamps: true }
);

const EmployeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    department: { type: String, default: "" },
    role: { type: String, default: "" },
    salary: { type: Number, default: 0 },
    photo: { type: String, default: "" },
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

const AttendanceSchema = new mongoose.Schema(
  {
    employeeId: String,
    name: String,
    email: String,
    department: String,
    role: String,
    date: String,
    time: String,
    status: String,
    source: { type: String, default: "Face" },
  },
  { timestamps: true }
);

const LeaveSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    name: String,
    email: String,
    type: { type: String, default: "Casual" },
    fromDate: String,
    toDate: String,
    days: { type: Number, default: 1 },
    reason: String,
    status: { type: String, default: "Pending" },
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", AdminSchema);
const Employee = mongoose.model("Employee", EmployeeSchema);
const Attendance = mongoose.model("Attendance", AttendanceSchema);
const Leave = mongoose.model("Leave", LeaveSchema);

const todayDate = () => new Date().toISOString().slice(0, 10);
const currentTime = () => new Date().toLocaleTimeString();
const monthPrefix = (value) => value || todayDate().slice(0, 7);
const daysInMonth = (month) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber, 0).getDate();
};

const emailEnabled =
  Boolean(process.env.SMTP_HOST) &&
  Boolean(process.env.SMTP_USER) &&
  Boolean(process.env.SMTP_PASS);

const mailTransporter = emailEnabled
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const sendAttendanceEmail = async (attendance) => {
  if (!mailTransporter || !attendance.email) {
    return { sent: false, reason: "Email SMTP config missing or employee email missing" };
  }

  await mailTransporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: attendance.email,
    subject: `Attendance marked: ${attendance.status} on ${attendance.date}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Attendance Confirmation</h2>
        <p>Hello ${attendance.name || "Employee"},</p>
        <p>Your attendance has been marked successfully.</p>
        <table cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
          <tr><td><b>Status</b></td><td>${attendance.status}</td></tr>
          <tr><td><b>Date</b></td><td>${attendance.date}</td></tr>
          <tr><td><b>Time</b></td><td>${attendance.time}</td></tr>
          <tr><td><b>Source</b></td><td>${attendance.source || "Face"}</td></tr>
          <tr><td><b>Department</b></td><td>${attendance.department || "-"}</td></tr>
          <tr><td><b>Role</b></td><td>${attendance.role || "-"}</td></tr>
        </table>
        <p>Regards,<br/>AI HRMS</p>
      </div>
    `,
  });

  return { sent: true };
};

const escapePdfText = (value = "") =>
  String(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const makePdf = (title, rows) => {
  const lines = [title, `Generated: ${new Date().toLocaleString()}`, "", ...rows];
  const textCommands = lines
    .slice(0, 38)
    .map((line, index) => `1 0 0 1 50 ${760 - index * 18} Tm (${escapePdfText(line)}) Tj`)
    .join("\n");
  const stream = `BT /F1 10 Tf\n${textCommands}\nET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
};

const buildMonthlyReport = async (month) => {
  const employees = await Employee.find().sort({ name: 1 });
  const attendance = await Attendance.find({ date: { $regex: `^${month}` } });
  const leaves = await Leave.find({
    status: "Approved",
    $or: [{ fromDate: { $regex: `^${month}` } }, { toDate: { $regex: `^${month}` } }],
  });

  return employees.map((employee) => {
    const employeeId = employee.id || String(employee._id);
    const employeeAttendance = attendance.filter((item) => item.employeeId === employeeId);
    const approvedLeaves = leaves.filter((item) => item.employeeId === employeeId);
    const present = employeeAttendance.filter((item) => item.status === "Present").length;
    const late = employeeAttendance.filter((item) => item.status === "Late").length;
    const leaveDays = approvedLeaves.reduce((sum, item) => sum + (Number(item.days) || 0), 0);
    const absent = Math.max(daysInMonth(month) - present - late - leaveDays, 0);

    return {
      employeeId,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      role: employee.role,
      salary: employee.salary || 0,
      present,
      late,
      leaveDays,
      absent,
    };
  });
};

const buildPayroll = (employee, reportRow, month) => {
  const baseSalary = Number(employee.salary || 0);
  const monthDays = daysInMonth(month);
  const paidDays = reportRow.present + reportRow.late + reportRow.leaveDays;
  const deduction = Math.round(((reportRow.absent || 0) * baseSalary) / monthDays);
  const netSalary = Math.max(baseSalary - deduction, 0);

  return {
    month,
    monthDays,
    paidDays,
    baseSalary,
    deduction,
    netSalary,
  };
};

app.get("/", (req, res) => {
  res.send("SERVER WORKING");
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Fill all fields" });
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Admin already exists" });
    }

    const admin = await Admin.create({ name, email, password, role: role || "HR Admin" });
    res.json({
      success: true,
      message: "Admin registered",
      data: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const defaultLogin = email === "admin@gmail.com" && password === "1234";
    const admin = await Admin.findOne({ email, password });

    if (!defaultLogin && !admin) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    res.json({
      success: true,
      message: "Login successful",
      admin: admin
        ? { _id: admin._id, name: admin.name, email: admin.email, role: admin.role }
        : { name: "Default Admin", email, role: "Super Admin" },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/employees", async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const employees = await Employee.find(query).sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/employees", async (req, res) => {
  try {
    const { name, email, department, role, salary, photo, status } = req.body || {};
    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email required" });
    }

    const newEmployee = await Employee.create({
      name,
      email,
      department,
      role,
      salary: Number(salary) || 0,
      photo,
      id: Date.now().toString(),
      status: status || "Active",
    });

    res.json({ success: true, message: "Employee saved permanently", data: newEmployee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/employees/:id", async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      { ...req.body, salary: Number(req.body.salary) || 0 },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/employees/:id", async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/attendance", async (req, res) => {
  try {
    const { employeeId, name, email, department, role, date, status, source } = req.body || {};
    const attendanceDate = date || todayDate();
    if (!employeeId) {
      return res.status(400).json({ success: false, message: "Employee missing" });
    }

    const alreadyMarked = await Attendance.findOne({ employeeId, date: attendanceDate });
    if (alreadyMarked) {
      return res.status(400).json({ success: false, message: "Attendance already marked today" });
    }

    const attendance = await Attendance.create({
      employeeId,
      name,
      email,
      department,
      role,
      date: attendanceDate,
      time: currentTime(),
      status: status || "Present",
      source: source || "Face",
    });

    let emailResult = { sent: false };

    try {
      emailResult = await sendAttendanceEmail(attendance);
    } catch (emailError) {
      console.log("Attendance email error:", emailError.message);
      emailResult = { sent: false, reason: emailError.message };
    }

    res.json({
      success: true,
      message: emailResult.sent
        ? "Attendance marked and email sent"
        : "Attendance marked, email not sent",
      data: attendance,
      email: emailResult,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/attendance", async (req, res) => {
  try {
    const date = req.query.date;
    const query = date ? { date } : {};
    const attendance = await Attendance.find(query).sort({ createdAt: -1 });
    res.json({ success: true, total: attendance.length, data: attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/dashboard", async (req, res) => {
  try {
    const date = req.query.date || todayDate();
    const totalEmployees = await Employee.countDocuments();
    const present = await Attendance.countDocuments({ date, status: "Present" });
    const late = await Attendance.countDocuments({ date, status: "Late" });
    const approvedLeaves = await Leave.countDocuments({ status: "Approved", fromDate: { $lte: date }, toDate: { $gte: date } });
    const absent = Math.max(totalEmployees - present - late - approvedLeaves, 0);

    res.json({
      success: true,
      data: { totalEmployees, present, absent, late, leaves: approvedLeaves, date },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/attendance-history/:employeeId", async (req, res) => {
  try {
    const history = await Attendance.find({ employeeId: req.params.employeeId }).sort({ createdAt: -1 });
    res.json({ success: true, total: history.length, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/employees/:id/profile", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    const employeeId = employee.id || String(employee._id);
    const [attendance, leaves] = await Promise.all([
      Attendance.find({ employeeId }).sort({ createdAt: -1 }).limit(20),
      Leave.find({ employeeId }).sort({ createdAt: -1 }).limit(20),
    ]);
    res.json({ success: true, data: { employee, attendance, leaves } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/leaves", async (req, res) => {
  try {
    const leaves = await Leave.find().sort({ createdAt: -1 });
    res.json({ success: true, data: leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/leaves", async (req, res) => {
  try {
    const { employeeId, name, email, type, fromDate, toDate, reason } = req.body || {};
    if (!employeeId || !fromDate || !toDate) {
      return res.status(400).json({ success: false, message: "Employee and dates required" });
    }
    const days = Math.max(
      Math.round((new Date(toDate) - new Date(fromDate)) / 86400000) + 1,
      1
    );
    const leave = await Leave.create({ employeeId, name, email, type, fromDate, toDate, reason, days });
    res.json({ success: true, data: leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/leaves/:id", async (req, res) => {
  try {
    const leave = await Leave.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave not found" });
    }
    res.json({ success: true, data: leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/reports/monthly", async (req, res) => {
  try {
    const month = monthPrefix(req.query.month);
    const report = await buildMonthlyReport(month);
    res.json({ success: true, month, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/reports/monthly/export/excel", async (req, res) => {
  try {
    const month = monthPrefix(req.query.month);
    const report = await buildMonthlyReport(month);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monthly Report");
    worksheet.columns = [
      { header: "Name", key: "name", width: 24 },
      { header: "Email", key: "email", width: 30 },
      { header: "Department", key: "department", width: 20 },
      { header: "Role", key: "role", width: 20 },
      { header: "Present", key: "present", width: 12 },
      { header: "Late", key: "late", width: 12 },
      { header: "Leave", key: "leaveDays", width: 12 },
      { header: "Absent", key: "absent", width: 12 },
    ];
    report.forEach((row) => worksheet.addRow(row));
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=monthly-${month}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/reports/monthly/export/pdf", async (req, res) => {
  try {
    const month = monthPrefix(req.query.month);
    const report = await buildMonthlyReport(month);
    const rows = [
      "Name | Present | Late | Leave | Absent",
      ...report.map((row) => `${row.name} | ${row.present} | ${row.late} | ${row.leaveDays} | ${row.absent}`),
    ];
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=monthly-${month}.pdf`);
    res.send(makePdf(`Monthly Attendance Report - ${month}`, rows));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/payroll/:employeeId", async (req, res) => {
  try {
    const month = monthPrefix(req.query.month);
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    const report = await buildMonthlyReport(month);
    const employeeId = employee.id || String(employee._id);
    const row = report.find((item) => item.employeeId === employeeId) || {
      present: 0,
      late: 0,
      leaveDays: 0,
      absent: daysInMonth(month),
    };
    const payroll = buildPayroll(employee, row, month);
    res.json({ success: true, data: { employee, attendance: row, payroll } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/payroll/:employeeId/export/pdf", async (req, res) => {
  try {
    const month = monthPrefix(req.query.month);
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    const report = await buildMonthlyReport(month);
    const employeeId = employee.id || String(employee._id);
    const row = report.find((item) => item.employeeId === employeeId) || {
      present: 0,
      late: 0,
      leaveDays: 0,
      absent: daysInMonth(month),
    };
    const payroll = buildPayroll(employee, row, month);
    const rows = [
      `Employee: ${employee.name}`,
      `Email: ${employee.email}`,
      `Department: ${employee.department || "-"}`,
      `Role: ${employee.role || "-"}`,
      `Month: ${month}`,
      `Paid Days: ${payroll.paidDays}/${payroll.monthDays}`,
      `Base Salary: ${payroll.baseSalary}`,
      `Deduction: ${payroll.deduction}`,
      `Net Salary: ${payroll.netSalary}`,
    ];
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=payslip-${employee.name}-${month}.pdf`);
    res.send(makePdf("Salary Slip", rows));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/attendance/export/excel", async (req, res) => {
  try {
    const date = req.query.date;
    const rows = await Attendance.find(date ? { date } : {}).sort({ createdAt: -1 });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance");
    worksheet.columns = [
      { header: "Name", key: "name", width: 24 },
      { header: "Email", key: "email", width: 30 },
      { header: "Department", key: "department", width: 20 },
      { header: "Role", key: "role", width: 20 },
      { header: "Date", key: "date", width: 16 },
      { header: "Time", key: "time", width: 16 },
      { header: "Status", key: "status", width: 14 },
      { header: "Source", key: "source", width: 14 },
    ];
    rows.forEach((row) => worksheet.addRow(row.toObject()));
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=attendance.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/attendance/export/pdf", async (req, res) => {
  try {
    const date = req.query.date;
    const rows = await Attendance.find(date ? { date } : {}).sort({ createdAt: -1 });
    const reportRows = [
      "Name | Email | Department | Role | Date | Time | Status",
      ...rows.map((row) => `${row.name || ""} | ${row.email || ""} | ${row.department || ""} | ${row.role || ""} | ${row.date || ""} | ${row.time || ""} | ${row.status || ""}`),
    ];
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=attendance.pdf");
    res.send(makePdf("AI HRMS Attendance Report", reportRows));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`RUNNING on port ${PORT}`);
});
