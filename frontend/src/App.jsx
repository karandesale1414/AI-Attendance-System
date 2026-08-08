import * as faceapi from "face-api.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Webcam from "react-webcam";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Edit,
  Eye,
  FileSpreadsheet,
  FileText,
  LogOut,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
  UserX,
  Wallet,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API = import.meta.env.VITE_API_URL || "/api";

const emptyEmployeeForm = {
  name: "",
  email: "",
  department: "",
  role: "",
  salary: "",
  photo: "",
};

const emptyLeaveForm = {
  employeeId: "",
  type: "Casual",
  fromDate: new Date().toISOString().slice(0, 10),
  toDate: new Date().toISOString().slice(0, 10),
  reason: "",
};

const faceDetectionOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 416,
  scoreThreshold: 0.35,
});

function App() {
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [activePage, setActivePage] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "admin", password: "admin1234" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "HR Admin",
  });

  const [employees, setEmployees] = useState([]);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [leaveForm, setLeaveForm] = useState(emptyLeaveForm);
  const [monthlyReport, setMonthlyReport] = useState([]);
  const [payroll, setPayroll] = useState(null);
  const [profile, setProfile] = useState(null);
  const [dashboard, setDashboard] = useState({
    totalEmployees: 0,
    present: 0,
    absent: 0,
    late: 0,
    leaves: 0,
  });

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyEmployeeForm);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [manualEmployeeId, setManualEmployeeId] = useState("");
  const [manualStatus, setManualStatus] = useState("Present");
  const [attendanceDate, setAttendanceDate] = useState(today);
  const [reportMonth, setReportMonth] = useState(thisMonth);
  const [payrollEmployeeId, setPayrollEmployeeId] = useState("");
  const [loadingFace, setLoadingFace] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [autoFaceEnabled, setAutoFaceEnabled] = useState(false);
  const [faceStatus, setFaceStatus] = useState("Loading face recognition models...");
  const [faceFeedback, setFaceFeedback] = useState({
    tone: "neutral",
    label: "Initializing camera",
    detail: "Keep your face centered inside the alignment guide.",
    brightness: 0,
    confidence: 0,
    faceCoverage: 0,
  });
  const [lastFaceMatch, setLastFaceMatch] = useState(null);
  const [toast, setToast] = useState(null);
  const webcamRef = useRef(null);
  const autoScanningRef = useRef(false);
  const lastMarkedRef = useRef({});

  const canWrite = admin?.role !== "Viewer";

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  };

  const chartData = useMemo(
    () => [
      { name: "Present", count: dashboard.present },
      { name: "Absent", count: dashboard.absent },
      { name: "Late", count: dashboard.late },
      { name: "Leave", count: dashboard.leaves },
    ],
    [dashboard]
  );

  const navItems = [
    ["dashboard", BarChart3, "Dashboard"],
    ["employees", Users, "Employees"],
    ["attendance", UserCheck, "Attendance"],
    ["leaves", CalendarDays, "Leave"],
    ["reports", FileSpreadsheet, "Reports"],
    ["payroll", Wallet, "Payroll"],
    ["analytics", TrendingUp, "Analytics"],
  ];

  const filteredEmployees = employees.filter((employee) => {
    const query = search.toLowerCase();
    return (
      (employee.name || "").toLowerCase().includes(query) ||
      (employee.email || "").toLowerCase().includes(query)
    );
  });

  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("admin");
    setIsLoggedIn(false);
    setAdmin(null);
    setEmployees([]);
    setAttendanceLogs([]);
    setLeaves([]);
    setMonthlyReport([]);
    setPayroll(null);
    setProfile(null);
  };

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const storedAdmin = localStorage.getItem("admin");
    if (accessToken && storedAdmin) {
      try {
        setIsLoggedIn(true);
        setAdmin(JSON.parse(storedAdmin));
      } catch (error) {
        clearSession();
      }
    } else {
      clearSession();
    }
  }, []);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const modelUrl = "/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
        await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
        await faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl);
        setModelsReady(true);
        setFaceStatus("Face recognition ready");
      } catch (error) {
        setFaceStatus("Face models could not be loaded. Please verify the public models directory.");
      }
    };

    loadModels();
  }, []);

  // Refreshes the access token using the stored refresh token. Returns the new
  // access token on success, or null if the refresh token is missing/expired.
  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${API}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.access) return null;
      localStorage.setItem("accessToken", data.access);
      if (data.refresh) {
        localStorage.setItem("refreshToken", data.refresh);
      }
      return data.access;
    } catch {
      return null;
    }
  };

  const parseErrorDetail = (data) => {
    if (!data || typeof data !== "object") return "Request failed";
    return (
      data.message ||
      data.detail ||
      Object.entries(data)
        .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(", ") : value}`)
        .join("\n") ||
      "Request failed"
    );
  };

  const fetchJson = async (url, options, isRetry = false) => {
    const token = localStorage.getItem("accessToken");
    const headers = {
      ...(options?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    let res;
    try {
      res = await fetch(url, { ...options, headers });
    } catch (error) {
      throw new Error("Network error. Please check your connection and that the backend is reachable.");
    }

    if (res.status === 401 && !isRetry) {
      // Access token expired mid-session - try a silent refresh before giving up.
      const newToken = await refreshAccessToken();
      if (newToken) {
        return fetchJson(url, options, true);
      }
      clearSession();
      throw new Error("Session expired. Please login again.");
    }

    let data = {};
    try {
      data = await res.json();
    } catch {
      // Non-JSON response (e.g. a 502/504 HTML error page from a cold-starting host)
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}. The backend may be starting up - please try again in a few seconds.`);
      }
    }

    if (!res.ok) {
      if (res.status === 401) {
        clearSession();
        throw new Error("Session expired. Please login again.");
      }
      throw new Error(parseErrorDetail(data));
    }
    return data;
  };

  const fetchEmployees = useCallback(async () => {
    const data = await fetchJson(`${API}/employees`);
    setEmployees(Array.isArray(data) ? data : data.data || []);
  }, []);

  const fetchAttendance = useCallback(async (date = attendanceDate) => {
    const data = await fetchJson(`${API}/attendance?date=${date}`);
    setAttendanceLogs(data.data || []);
  }, [attendanceDate]);

  const fetchDashboard = useCallback(async (date = attendanceDate) => {
    const data = await fetchJson(`${API}/dashboard?date=${date}`);
    setDashboard(prev => data.data || prev);
  }, [attendanceDate]);

  const fetchLeaves = useCallback(async () => {
    const data = await fetchJson(`${API}/leaves`);
    setLeaves(data.data || []);
  }, []);

  const fetchMonthlyReport = useCallback(async (month = reportMonth) => {
    const data = await fetchJson(`${API}/reports/monthly?month=${month}`);
    setMonthlyReport(data.data || []);
  }, [reportMonth]);

  const refreshData = useCallback(async () => {
    setDataLoading(true);
    try {
      await Promise.all([
        fetchEmployees(),
        fetchAttendance(),
        fetchDashboard(),
        fetchLeaves(),
        fetchMonthlyReport(),
      ]);
    } catch (error) {
      showToast(error.message || "Unable to refresh application data", "error");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) refreshData();
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchAttendance(attendanceDate);
      fetchDashboard(attendanceDate);
    }
  }, [attendanceDate]);

  useEffect(() => {
    if (isLoggedIn) fetchMonthlyReport(reportMonth);
  }, [reportMonth]);

  const updateEmployeeForm = (field, value) => {
    setEmployeeForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateEditForm = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const readPhoto = (file, setter) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter("photo", reader.result);
    reader.readAsDataURL(file);
  };

  const selectedManualEmployee = employees.find(
    (employee) => (employee.id || employee._id) === manualEmployeeId
  );

  const selectedLeaveEmployee = employees.find(
    (employee) => (employee.id || employee._id) === leaveForm.employeeId
  );

  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginForm.email,
          password: loginForm.password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.detail || "Login failed");
      }
      
      const accessToken = data.access || data.accessToken || data.token;
      const refreshToken = data.refresh || data.refreshToken;
      const adminData = data.user || data.admin || {
        _id: data.id || data.user_id,
        name: data.name || data.username,
        email: data.email || loginForm.email,
        role: data.role || "ADMIN",
      };
      
      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      localStorage.setItem("admin", JSON.stringify(adminData));
      
      setAdmin(adminData);
      setIsLoggedIn(true);
      showToast("Welcome back. Your workspace is ready.");
    } catch (error) {
      showToast(error.message || "Login failed. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      showToast("Please complete all required fields", "error");
      return;
    }

    try {
      const data = await fetchJson(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      });
      showToast("Administrator account created successfully. Please sign in.");
      setAuthMode("login");
      setLoginForm({ email: registerForm.email, password: "" });
      setRegisterForm({ name: "", email: "", password: "", role: "HR Admin" });
    } catch (error) {
      showToast(error.message || "Registration failed. Please try again.", "error");
    }
  };

  const logout = () => {
    clearSession();
  };

  const addEmployee = async () => {
    if (!canWrite) return showToast("Viewer role can only view data", "error");
    if (!employeeForm.name || !employeeForm.email) return showToast("Employee name and email are required", "error");

    try {
      await fetchJson(`${API}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeeForm),
      });
      setEmployeeForm(emptyEmployeeForm);
      await refreshData();
      showToast("Employee profile created successfully.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const startEdit = (employee) => {
    setEditingId(employee._id);
    setEditForm({
      name: employee.name || "",
      email: employee.email || "",
      department: employee.department || "",
      role: employee.role || "",
      salary: employee.salary || "",
      photo: employee.photo || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyEmployeeForm);
  };

  const saveEdit = async (id) => {
    if (!canWrite) return showToast("Viewer role can only view data", "error");
    try {
      await fetchJson(`${API}/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      cancelEdit();
      await refreshData();
      showToast("Employee profile updated.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const deleteEmployee = async (id) => {
    if (!canWrite) return showToast("Viewer role can only view data", "error");
    if (!window.confirm("Delete this employee profile?")) return;
    try {
      await fetchJson(`${API}/employees/${id}`, { method: "DELETE" });
      await refreshData();
      showToast("Employee profile deleted.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const markAttendance = async (employee, status, source = "Manual") => {
    if (!canWrite) return showToast("Viewer role can only view data", "error");
    if (!employee) return showToast("Please select an employee", "error");

    const employeeId = employee.id || employee._id;
    try {
      const data = await fetchJson(`${API}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          name: employee.name,
          email: employee.email,
          department: employee.department,
          role: employee.role,
          date: attendanceDate,
          status,
          source,
        }),
      });
      await refreshData();
      showToast(`Attendance marked as ${status} for ${employee.name}`);
      return data;
    } catch (error) {
      showToast(error.message || "Failed to mark attendance", "error");
      return null;
    }
  };

  const enhanceCameraFrame = async (imageSrc) => {
    const img = await faceapi.fetchImage(imageSrc);
    const canvas = document.createElement("canvas");
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);

    const frame = ctx.getImageData(0, 0, width, height);
    const pixels = frame.data;
    let luminanceTotal = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      luminanceTotal += 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
    }

    const averageBrightness = luminanceTotal / (pixels.length / 4);
    
    // Enhanced low light handling with adaptive adjustments
    let brightnessLift = 0;
    let contrast = 1.0;
    let saturation = 1.0;
    
    if (averageBrightness < 60) {
      brightnessLift = 50;
      contrast = 1.35;
      saturation = 1.15;
    } else if (averageBrightness < 90) {
      brightnessLift = 30;
      contrast = 1.25;
      saturation = 1.08;
    } else if (averageBrightness < 120) {
      brightnessLift = 15;
      contrast = 1.15;
      saturation = 1.05;
    }

    for (let i = 0; i < pixels.length; i += 4) {
      // Apply contrast
      let r = (pixels[i] - 128) * contrast + 128;
      let g = (pixels[i + 1] - 128) * contrast + 128;
      let b = (pixels[i + 2] - 128) * contrast + 128;
      
      // Apply brightness
      r += brightnessLift;
      g += brightnessLift;
      b += brightnessLift;
      
      // Apply saturation
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
      r = gray + saturation * (r - gray);
      g = gray + saturation * (g - gray);
      b = gray + saturation * (b - gray);
      
      pixels[i] = Math.max(0, Math.min(255, r));
      pixels[i + 1] = Math.max(0, Math.min(255, g));
      pixels[i + 2] = Math.max(0, Math.min(255, b));
    }

    ctx.putImageData(frame, 0, 0);
    return {
      image: await faceapi.fetchImage(canvas.toDataURL("image/jpeg", 0.95)),
      metrics: {
        brightness: Math.round(averageBrightness),
        enhanced: brightnessLift > 0,
      },
    };
  };

  const getFaceGuidance = (detection, metrics) => {
    if (!detection) {
      return {
        tone: metrics.brightness < 75 ? "warning" : "error",
        label: metrics.brightness < 75 ? "Improve lighting" : "Face not detected",
        detail:
          metrics.brightness < 75
            ? "Move toward a brighter area or face a light source."
            : "Center your face inside the frame and look toward the camera.",
        brightness: metrics.brightness,
        confidence: 0,
        faceCoverage: 0,
      };
    }

    const { box, score } = detection.detection;
    const imageWidth = detection.detection.imageWidth || 1;
    const imageHeight = detection.detection.imageHeight || 1;
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const offsetX = Math.abs(centerX - imageWidth / 2) / imageWidth;
    const offsetY = Math.abs(centerY - imageHeight / 2) / imageHeight;
    const faceCoverage = Math.round((box.width / imageWidth) * 100);

    if (metrics.brightness < 65) {
      return {
        tone: "warning",
        label: "Low light detected",
        detail: "Automatic enhancement is active, but more front light will improve matching.",
        brightness: metrics.brightness,
        confidence: Math.round(score * 100),
        faceCoverage,
      };
    }

    if (faceCoverage < 18) {
      return {
        tone: "warning",
        label: "Move closer to the camera",
        detail: "Your face should fill more of the alignment guide for accurate recognition.",
        brightness: metrics.brightness,
        confidence: Math.round(score * 100),
        faceCoverage,
      };
    }

    if (offsetX > 0.18 || offsetY > 0.2) {
      return {
        tone: "warning",
        label: "Center your face",
        detail: "Align your face with the guide and keep your head steady.",
        brightness: metrics.brightness,
        confidence: Math.round(score * 100),
        faceCoverage,
      };
    }

    return {
      tone: "success",
      label: "Face aligned",
      detail: metrics.enhanced
        ? "Frame enhanced for low-light recognition."
        : "Lighting and position are suitable for recognition.",
      brightness: metrics.brightness,
      confidence: Math.round(score * 100),
      faceCoverage,
    };
  };

  const getFaceDescriptor = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) throw new Error("Camera error");

    const { image, metrics } = await enhanceCameraFrame(imageSrc);
    const detection = await faceapi
      .detectSingleFace(image, faceDetectionOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();

    const guidance = getFaceGuidance(detection, metrics);
    setFaceFeedback(guidance);
    if (!detection) throw new Error(guidance.label);
    return detection.descriptor;
  };

  const findMatchedEmployee = (descriptor) => {
    for (const employee of employees) {
      const employeeId = employee.id || employee._id;
      const savedFace = localStorage.getItem(`face-${employeeId}`);
      if (!savedFace) continue;

      const matcher = new faceapi.FaceMatcher(
        [
          new faceapi.LabeledFaceDescriptors(employee.name, [
            new Float32Array(JSON.parse(savedFace)),
          ]),
        ],
        0.5
      );
      const result = matcher.findBestMatch(descriptor);
      if (result.label !== "unknown") {
        return { employee, distance: result.distance };
      }
    }

    return null;
  };

  const registerFace = async () => {
    if (!canWrite) return showToast("Viewer role can only view data", "error");
    if (!selectedEmployee) return showToast("Select an employee before registering a face", "error");
    if (!modelsReady) return showToast("Face models are loading. Please wait.", "error");
    setLoadingFace(true);

    try {
      const descriptor = await getFaceDescriptor();
      localStorage.setItem(`face-${selectedEmployee}`, JSON.stringify(Array.from(descriptor)));
      await refreshData();
      setFaceStatus("Face registered. Auto attendance ready.");
      showToast("Face template registered successfully.");
    } catch (error) {
      showToast(error.message || "Face registration failed", "error");
    } finally {
      setLoadingFace(false);
    }
  };

  const scanFace = async (options = {}) => {
    const silent = options?.silent === true;
    if (!canWrite) return showToast("Viewer role can only view data", "error");
    if (!modelsReady) {
      if (!silent) showToast("Face models are still loading. Please wait.", "error");
      return null;
    }

    if (!silent) setLoadingFace(true);
    setFaceStatus(silent ? "Watching for registered faces..." : "Scanning face...");
    setFaceFeedback((prev) => ({
      ...prev,
      tone: "neutral",
      label: silent ? "Live detection active" : "Scanning face",
      detail: "Keep your face centered and hold steady for a moment.",
    }));

    try {
      const descriptor = await getFaceDescriptor();
      const match = findMatchedEmployee(descriptor);

      if (!match) {
        setLastFaceMatch(null);
        setFaceStatus("Face not matched");
        setFaceFeedback((prev) => ({
          ...prev,
          tone: "error",
          label: "Face not recognized",
          detail: "Register this employee face template or improve lighting and try again.",
        }));
        if (!silent) showToast("Face not matched with any registered employee", "error");
        return null;
      }

      const matchedEmployee = match.employee;
      const employeeId = matchedEmployee.id || matchedEmployee._id;
      const alreadyMarked = attendanceLogs.some(
        (log) => log.employeeId === employeeId && log.date === attendanceDate
      );
      const markKey = `${attendanceDate}-${employeeId}`;
      setLastFaceMatch({ name: matchedEmployee.name, distance: match.distance });

      if (alreadyMarked || lastMarkedRef.current[markKey]) {
        setFaceStatus(`${matchedEmployee.name} already has attendance recorded for this date.`);
        setFaceFeedback((prev) => ({
          ...prev,
          tone: "success",
          label: "Already recorded",
          detail: `${matchedEmployee.name} has already been verified for ${attendanceDate}.`,
        }));
        return null;
      }

      const data = await markAttendance(matchedEmployee, "Present", "Face");
      lastMarkedRef.current[markKey] = Date.now();
      setFaceStatus(`Attendance marked: ${matchedEmployee.name}`);
      setFaceFeedback((prev) => ({
        ...prev,
        tone: "success",
        label: "Face recognized successfully",
        detail: `Attendance marked for ${matchedEmployee.name}.`,
      }));
      if (!silent) {
        showToast(
          data.email?.sent
            ? `Attendance marked for ${matchedEmployee.name}. Email sent.`
            : `Attendance marked for ${matchedEmployee.name}. Email not sent: ${data.email?.reason || "SMTP not configured"}`
        );
      }
      return data;
    } catch (error) {
      setFaceStatus(error.message || "Face scan error");
      if (!silent) showToast(error.message || "Face scan failed", "error");
      return null;
    } finally {
      if (!silent) setLoadingFace(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !autoFaceEnabled || !modelsReady || !["dashboard", "attendance"].includes(activePage)) return;

    const runAutoScan = async () => {
      if (autoScanningRef.current) return;
      autoScanningRef.current = true;
      try {
        await scanFace({ silent: true });
      } finally {
        autoScanningRef.current = false;
      }
    };

    setFaceStatus("Live auto attendance on");
    runAutoScan();
    const timer = window.setInterval(runAutoScan, 2500);
    return () => window.clearInterval(timer);
  }, [isLoggedIn, autoFaceEnabled, modelsReady, activePage, employees, attendanceLogs, attendanceDate]);

  const applyLeave = async () => {
    if (!canWrite) return showToast("Viewer role can only view data", "error");
    if (!selectedLeaveEmployee) return showToast("Please select an employee", "error");

    try {
      await fetchJson(`${API}/leaves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...leaveForm,
          name: selectedLeaveEmployee.name,
          email: selectedLeaveEmployee.email,
        }),
      });
      setLeaveForm(emptyLeaveForm);
      await refreshData();
      showToast("Leave request submitted.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const updateLeaveStatus = async (id, status) => {
    if (!canWrite) return showToast("Viewer role can only view data", "error");
    try {
      await fetchJson(`${API}/leaves/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await refreshData();
      showToast(`Leave request ${status.toLowerCase()}.`);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const openProfile = async (employee) => {
    try {
      const data = await fetchJson(`${API}/employees/${employee._id}/profile`);
      setProfile(data.data);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const fetchPayroll = async () => {
    if (!payrollEmployeeId) return showToast("Please select an employee", "error");
    try {
      const data = await fetchJson(`${API}/payroll/employee/${payrollEmployeeId}?month=${reportMonth}`);
      setPayroll(data.data);
      showToast("Payroll preview generated.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const download = (path) => {
    window.open(`${API}/${path}`, "_blank");
  };

  if (!isLoggedIn) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-6 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(99,102,241,0.35),transparent_32rem),radial-gradient(circle_at_85%_10%,rgba(6,182,212,0.25),transparent_28rem),radial-gradient(circle_at_50%_90%,rgba(168,85,247,0.2),transparent_30rem)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="floating-orb pointer-events-none absolute left-[10%] top-[20%] h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="floating-orb pointer-events-none absolute right-[8%] bottom-[15%] h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" style={{ animationDelay: "-4s" }} />

        <div className="relative w-full max-w-[420px] app-fade-in">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 shadow-2xl shadow-indigo-500/40">
              <Sparkles size={28} className="text-white" />
            </div>
            <h1 className="bg-gradient-to-r from-white via-indigo-100 to-cyan-200 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
              Attend AI
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-400">Enterprise Neural Attendance Platform</p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-8 shadow-2xl shadow-indigo-950/50 backdrop-blur-2xl">
            <div className="mb-6 flex rounded-xl border border-white/8 bg-white/[0.04] p-1">
              <button
                onClick={() => setAuthMode("login")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${authMode === "login" ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode("register")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${authMode === "register" ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
              >
                Register
              </button>
            </div>

            {authMode === "register" && (
              <>
                <AuthInput label="Admin Name" value={registerForm.name} onChange={(value) => setRegisterForm({ ...registerForm, name: value })} />
                <select
                  value={registerForm.role}
                  onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
                  className="soft-input mb-4 w-full rounded-xl p-3.5 outline-none"
                >
                  <option>Super Admin</option>
                  <option>HR Admin</option>
                  <option>Viewer</option>
                </select>
              </>
            )}

            <AuthInput
              label="Email"
              type="email"
              value={authMode === "login" ? loginForm.email : registerForm.email}
              onChange={(value) =>
                authMode === "login"
                  ? setLoginForm({ ...loginForm, email: value })
                  : setRegisterForm({ ...registerForm, email: value })
              }
            />
            <AuthInput
              label="Password"
              type="password"
              value={authMode === "login" ? loginForm.password : registerForm.password}
              onChange={(value) =>
                authMode === "login"
                  ? setLoginForm({ ...loginForm, password: value })
                  : setRegisterForm({ ...registerForm, password: value })
              }
            />

            <button
              onClick={authMode === "login" ? handleLogin : handleRegister}
              disabled={isLoading}
              className="btn-primary mt-2 w-full rounded-xl py-3.5 text-sm font-extrabold tracking-wide transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? "Processing..." : (authMode === "login" ? "Access Dashboard" : "Create Administrator")}
            </button>

            <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3">
              <ShieldCheck size={16} className="text-emerald-400" />
              <p className="text-xs font-medium text-emerald-300/90">Demo: admin / admin1234</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712] text-slate-100 lg:flex">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(99,102,241,0.3),transparent_32rem),radial-gradient(circle_at_88%_5%,rgba(6,182,212,0.22),transparent_28rem),radial-gradient(circle_at_50%_95%,rgba(168,85,247,0.18),transparent_36rem)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:56px_56px]" />

      <aside className="relative z-20 hidden min-h-screen w-[280px] flex-col p-4 lg:flex">
        <div className="flex min-h-[calc(100vh-2rem)] flex-col rounded-[24px] border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-indigo-950/40 backdrop-blur-2xl">
          <div className="flex items-center gap-3 px-1 py-2">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/30">
              <Building2 size={22} />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-white">Attend AI</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300/70">Neural HRMS</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-indigo-500/20 bg-indigo-500/8 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <p className="text-xs font-semibold text-emerald-300">AI Engine Online</p>
            </div>
          </div>

          <nav className="mt-6 flex-1 space-y-1">
            {navItems.map(([page, Icon, label]) => (
              <button
                key={page}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActivePage(page);
                }}
                className={`nav-item group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold cursor-pointer transition-all duration-200 ${
                  activePage === page
                    ? "nav-item-active text-white"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-white hover:translate-x-1"
                }`}
              >
                <Icon size={18} className={activePage === page ? "text-cyan-300" : "text-slate-500 group-hover:text-indigo-300 transition-colors duration-200"} />
                {label}
              </button>
            ))}
          </nav>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-white shadow-md">
                <UserRound size={18} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{admin?.name || "Administrator"}</p>
                <p className="truncate text-xs text-slate-400">{admin?.role || "Admin"}</p>
              </div>
            </div>
            <button onClick={logout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-300 transition-all duration-200 hover:bg-rose-500/20 hover:scale-[1.02]">
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="sticky top-0 z-30 border-b border-white/8 bg-slate-950/60 px-4 py-4 backdrop-blur-2xl md:px-8">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-400/80">AI Workforce Intelligence</p>
              <h2 className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent md:text-3xl">
                {navItems.find(([page]) => page === activePage)?.[2] || "Dashboard"}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300">
                <ShieldCheck size={14} />
                Secure Session
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-500/10 px-3.5 py-2 text-xs font-bold text-indigo-200">
                <Clock3 size={14} />
                {attendanceDate}
              </span>
              <button onClick={refreshData} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white">
                <RefreshCw size={14} />
                Sync
              </button>
            </div>
          </div>
          <MobileNav activePage={activePage} setActivePage={setActivePage} navItems={navItems} />
        </div>

        <div className="page-enter mx-auto w-full max-w-[1520px] p-4 md:p-8 xl:p-10">

        {activePage === "dashboard" && (
          <>
            <PageTitle title="Executive Dashboard" subtitle={`Real-time workforce intelligence · ${attendanceDate}`} />
            <DateRefresh date={attendanceDate} setDate={setAttendanceDate} refresh={refreshData} />
            {dataLoading ? (
              <LoadingSkeleton />
            ) : (
              <>
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  <StatCard icon={Users} label="Total Employees" value={dashboard.totalEmployees} accent="indigo" className="transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20" />
                  <StatCard icon={UserCheck} label="Present Today" value={dashboard.present} accent="emerald" className="transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20" />
                  <StatCard icon={UserX} label="Absent" value={dashboard.absent} accent="rose" className="transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:shadow-rose-500/20" />
                  <StatCard icon={Clock3} label="Late Arrivals" value={dashboard.late} accent="amber" className="transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20" />
                  <StatCard icon={CalendarDays} label="On Leave" value={dashboard.leaves} accent="violet" className="transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:shadow-violet-500/20" />
                </div>
                <DashboardOverview
                  chartData={chartData}
                  attendanceLogs={attendanceLogs}
                  employees={employees}
                  dashboard={dashboard}
                  modelsReady={modelsReady}
                  autoFaceEnabled={autoFaceEnabled}
                />
                <FacePanel
                  employees={employees}
                  webcamRef={webcamRef}
                  selectedEmployee={selectedEmployee}
                  setSelectedEmployee={setSelectedEmployee}
                  registerFace={registerFace}
                  scanFace={scanFace}
                  loadingFace={loadingFace}
                  modelsReady={modelsReady}
                  autoFaceEnabled={autoFaceEnabled}
                  setAutoFaceEnabled={setAutoFaceEnabled}
                  faceStatus={faceStatus}
                  faceFeedback={faceFeedback}
                  lastFaceMatch={lastFaceMatch}
                  featured
                />
              </>
            )}
          </>
        )}

        {activePage === "employees" && (
          <>
            <PageTitle title="Employees" subtitle="Profiles, face status, salary and details" />
            {canWrite && (
              <EmployeeForm
                employeeForm={employeeForm}
                updateEmployeeForm={updateEmployeeForm}
                readPhoto={readPhoto}
                addEmployee={addEmployee}
              />
            )}
            <SearchBox search={search} setSearch={setSearch} />
            <EmployeeTable
              employees={filteredEmployees}
              editingId={editingId}
              editForm={editForm}
              updateEditForm={updateEditForm}
              readPhoto={readPhoto}
              startEdit={startEdit}
              saveEdit={saveEdit}
              cancelEdit={cancelEdit}
              deleteEmployee={deleteEmployee}
              openProfile={openProfile}
              canWrite={canWrite}
            />
          </>
        )}

        {activePage === "attendance" && (
          <div className="space-y-6">
            <FacePanel
              employees={employees}
              webcamRef={webcamRef}
              selectedEmployee={selectedEmployee}
              setSelectedEmployee={setSelectedEmployee}
              registerFace={registerFace}
              scanFace={scanFace}
              loadingFace={loadingFace}
              modelsReady={modelsReady}
              autoFaceEnabled={autoFaceEnabled}
              setAutoFaceEnabled={setAutoFaceEnabled}
              faceStatus={faceStatus}
              faceFeedback={faceFeedback}
              lastFaceMatch={lastFaceMatch}
              featured
            />
            <AttendancePage
              date={attendanceDate}
              setDate={setAttendanceDate}
              logs={attendanceLogs}
              employees={employees}
              manualEmployeeId={manualEmployeeId}
              setManualEmployeeId={setManualEmployeeId}
              manualStatus={manualStatus}
              setManualStatus={setManualStatus}
              markManual={() => markAttendance(selectedManualEmployee, manualStatus, "Manual")}
              download={download}
              canWrite={canWrite}
            />
          </div>
        )}

        {activePage === "leaves" && (
          <LeavesPage
            employees={employees}
            leaves={leaves}
            leaveForm={leaveForm}
            setLeaveForm={setLeaveForm}
            applyLeave={applyLeave}
            updateLeaveStatus={updateLeaveStatus}
            canWrite={canWrite}
          />
        )}

        {activePage === "reports" && (
          <ReportsPage
            reportMonth={reportMonth}
            setReportMonth={setReportMonth}
            monthlyReport={monthlyReport}
            download={download}
          />
        )}

        {activePage === "payroll" && (
          <PayrollPage
            employees={employees}
            reportMonth={reportMonth}
            setReportMonth={setReportMonth}
            payrollEmployeeId={payrollEmployeeId}
            setPayrollEmployeeId={setPayrollEmployeeId}
            payroll={payroll}
            fetchPayroll={fetchPayroll}
            download={download}
          />
        )}

        {activePage === "analytics" && (
          <AnalyticsPage chartData={chartData} dashboard={dashboard} attendanceLogs={attendanceLogs} />
        )}
        </div>
      </main>

      {profile && <ProfileModal profile={profile} close={() => setProfile(null)} />}
      <Toast toast={toast} />
    </div>
  );
}

function AuthInput({ label, value, onChange, type = "text" }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</label>
      <input
        type={type}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="soft-input w-full rounded-xl p-3.5 outline-none"
      />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/5" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-white/5" />
      <div className="h-96 rounded-2xl bg-white/5" />
    </div>
  );
}

const CHART_COLORS = ["#6366f1", "#f43f5e", "#f59e0b", "#8b5cf6"];
const CHART_GRADIENTS = ["#22d3ee", "#6366f1", "#a855f7", "#f472b6"];

function DashboardOverview({ chartData, attendanceLogs, employees, dashboard, modelsReady, autoFaceEnabled }) {
  const attendanceTotal = dashboard.present + dashboard.absent + dashboard.late + dashboard.leaves;
  const presentRate = attendanceTotal ? Math.round((dashboard.present / attendanceTotal) * 100) : 0;
  const registeredFaces = employees.filter((employee) =>
    localStorage.getItem(`face-${employee.id || employee._id}`)
  ).length;

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-12">
      <section className="surface-card rounded-2xl p-6 xl:col-span-7">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Analytics</p>
            <h3 className="mt-1 text-xl font-extrabold text-white">AI Attendance Overview</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/12 px-3 py-1.5 text-xs font-bold text-emerald-300">
              {presentRate}% present rate
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280} minWidth={300}>
          <BarChart data={chartData} barGap={8}>
            <defs>
              {CHART_GRADIENTS.map((color, i) => (
                <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                </linearGradient>
              ))}
            </defs>
            <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis stroke="#64748b" tickLine={false} axisLine={false} allowDecimals={false} fontSize={12} />
            <Tooltip
              cursor={{ fill: "rgba(99, 102, 241, 0.1)" }}
              contentStyle={{
                borderRadius: 14,
                border: "1px solid rgba(99,102,241,0.3)",
                background: "rgba(8,14,30,0.95)",
                color: "#e0e7ff",
                boxShadow: "0 20px 50px rgba(2,6,23,0.5)",
              }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={`url(#barGrad${i % CHART_GRADIENTS.length})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="surface-card rounded-2xl p-6 xl:col-span-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Distribution</p>
            <h3 className="mt-1 text-xl font-extrabold text-white">Status Breakdown</h3>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180} minWidth={250}>
          <PieChart>
            <Pie
              data={chartData.filter((d) => d.count > 0)}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={4}
              stroke="transparent"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid rgba(99,102,241,0.3)",
                background: "rgba(8,14,30,0.95)",
                color: "#e0e7ff",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {chartData.map((item, i) => (
            <div key={item.name} className="flex items-center gap-2 text-xs">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i] }} />
              <span className="text-slate-400">{item.name}</span>
              <span className="ml-auto font-bold text-white">{item.count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card rounded-2xl p-6 xl:col-span-4">
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">AI Systems</p>
          <h3 className="mt-1 text-xl font-extrabold text-white">Recognition Status</h3>
        </div>
        <div className="space-y-3">
          <AIStatusRow label="Neural Models" status={modelsReady ? "Loaded" : "Loading"} ok={modelsReady} />
          <AIStatusRow label="Auto Detection" status={autoFaceEnabled ? "Active" : "Standby"} ok={autoFaceEnabled} />
          <AIStatusRow label="Face Templates" status={`${registeredFaces} / ${employees.length}`} ok={registeredFaces > 0} />
          <AIStatusRow label="Alert Channels" status="Email / WhatsApp" ok />
        </div>
      </section>

      <section className="surface-card rounded-2xl p-6 xl:col-span-8">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Live Feed</p>
            <h3 className="mt-1 text-xl font-extrabold text-white">Activity Timeline</h3>
          </div>
          <Sparkles className="text-indigo-400" size={20} />
        </div>
        <div className="space-y-1">
          {attendanceLogs.slice(0, 6).map((log) => (
            <div key={log._id} className="timeline-item pb-4">
              <span className="timeline-dot" />
              <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.04] p-3 transition hover:border-indigo-500/25 hover:bg-indigo-500/5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{log.name}</p>
                  <p className="truncate text-xs text-slate-400">
                    {log.source || "Face"} · {log.time || "recorded"}
                  </p>
                </div>
                <StatusBadge status={log.status} />
              </div>
            </div>
          ))}
          {attendanceLogs.length === 0 && (
            <EmptyState icon={Clock3} title="No activity yet" message="Attendance events will stream here in real time as employees are verified." />
          )}
        </div>
      </section>
    </div>
  );
}

function AIStatusRow({ label, status, ok }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <span className="text-sm font-medium text-slate-400">{label}</span>
      <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${ok ? "text-emerald-300" : "text-amber-300"}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" : "bg-amber-400"}`} />
        {status}
      </span>
    </div>
  );
}

function AnalyticsPage({ chartData, dashboard, attendanceLogs }) {
  const total = dashboard.present + dashboard.absent + dashboard.late + dashboard.leaves;
  const trendData = chartData.map((item, i) => ({
    ...item,
    trend: item.count + (i % 2 === 0 ? 2 : 0),
  }));

  return (
    <div className="space-y-6">
      <PageTitle title="Workforce Analytics" subtitle="Deep insights into attendance patterns and AI verification metrics" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InsightCard icon={TrendingUp} label="Recorded Events" value={total} helper="Current selected date" accent="indigo" />
        <InsightCard icon={Bell} label="Alert Queue" value={dashboard.absent + dashboard.late} helper="Absent & late notifications" accent="amber" />
        <InsightCard icon={ShieldCheck} label="AI Verified" value={attendanceLogs.filter((log) => log.source === "Face").length} helper="Face recognition attendance" accent="emerald" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="surface-card rounded-2xl p-6">
          <h3 className="mb-5 text-lg font-extrabold text-white">Attendance Distribution</h3>
          <ResponsiveContainer width="100%" height={320} minWidth={300}>
            <BarChart data={chartData} barGap={6}>
              <defs>
                <linearGradient id="analyticsBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid rgba(99,102,241,0.3)", background: "rgba(8,14,30,0.95)", color: "#e0e7ff" }} />
              <Bar dataKey="count" fill="url(#analyticsBar)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
        <section className="surface-card rounded-2xl p-6">
          <h3 className="mb-5 text-lg font-extrabold text-white">Trend Analysis</h3>
          <ResponsiveContainer width="100%" height={320} minWidth={300}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid rgba(99,102,241,0.3)", background: "rgba(8,14,30,0.95)", color: "#e0e7ff" }} />
              <Area type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2} fill="url(#areaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </section>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-indigo-500/25">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1.5 text-2xl font-extrabold text-white">{value}</p>
    </div>
  );
}

const ACCENT_MAP = {
  indigo: "from-indigo-500/20 to-violet-500/10 text-indigo-300 ring-indigo-400/20",
  emerald: "from-emerald-500/20 to-cyan-500/10 text-emerald-300 ring-emerald-400/20",
  rose: "from-rose-500/20 to-pink-500/10 text-rose-300 ring-rose-400/20",
  amber: "from-amber-500/20 to-orange-500/10 text-amber-300 ring-amber-400/20",
  violet: "from-violet-500/20 to-purple-500/10 text-violet-300 ring-violet-400/20",
};

function InsightCard({ icon: Icon, label, value, helper, accent = "indigo" }) {
  const accentClass = ACCENT_MAP[accent] || ACCENT_MAP.indigo;
  return (
    <div className="glass-card-premium stat-card-glow rounded-2xl p-6">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ${accentClass}`}>
        <Icon size={22} />
      </div>
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-white">{value}</p>
      <p className="mt-2 text-xs font-medium text-slate-500">{helper}</p>
    </div>
  );
}

function PageTitle({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">{title}</h2>
      <p className="mt-1.5 text-sm font-medium text-slate-400">{subtitle}</p>
    </div>
  );
}

function DateRefresh({ date, setDate, refresh }) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <CalendarDays size={18} className="text-indigo-400" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="soft-input rounded-xl p-3" />
      </div>
      <button onClick={refresh} className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold">
        <RefreshCw size={16} />
        Refresh Data
      </button>
    </div>
  );
}

function MobileNav({ activePage, setActivePage, navItems }) {
  return (
    <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
      {navItems.map(([page, Icon, label]) => (
        <button
          key={page}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setActivePage(page);
          }}
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
            activePage === page
              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-900/40"
              : "border border-white/10 bg-white/[0.06] text-slate-400"
          }`}
        >
          <Icon size={15} />
          {label}
        </button>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent = "indigo" }) {
  const accentClass = ACCENT_MAP[accent] || ACCENT_MAP.indigo;
  return (
    <div className="glass-card-premium stat-card-glow rounded-2xl p-5">
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ${accentClass}`}>
            <Icon size={20} />
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Live
          </span>
        </div>
        <h3 className="mt-4 text-3xl font-extrabold tracking-tight text-white">{value}</h3>
        <p className="mt-1 text-sm font-medium text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      className={`fixed right-4 top-4 z-[80] flex max-w-sm items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-semibold shadow-2xl backdrop-blur-xl app-fade-in ${
        isError
          ? "border-rose-400/30 bg-rose-950/90 text-rose-200 shadow-rose-950/40"
          : "border-emerald-400/30 bg-emerald-950/90 text-emerald-200 shadow-emerald-950/40"
      }`}
    >
      {isError ? <UserX size={18} /> : <CheckCircle2 size={18} />}
      <span>{toast.message}</span>
    </div>
  );
}

function StatusBadge({ status = "Active" }) {
  const normalized = status.toLowerCase();
  let style = "badge-neutral";
  if (normalized.includes("present") || normalized.includes("approved") || normalized.includes("active") || normalized.includes("registered")) {
    style = "badge-present";
  } else if (normalized.includes("late") || normalized.includes("pending") || normalized.includes("missing")) {
    style = "badge-late";
  } else if (normalized.includes("absent") || normalized.includes("rejected")) {
    style = "badge-absent";
  }

  return (
    <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${style}`}>
      {status}
    </span>
  );
}

function EmptyState({ icon: Icon, title, message }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/15 to-violet-500/10 text-indigo-300 ring-1 ring-indigo-400/20">
        <Icon size={24} />
      </div>
      <h3 className="text-sm font-extrabold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{message}</p>
    </div>
  );
}

function QualityMetric({ label, value, suffix }) {
  const numericValue = Number(value) || 0;
  const cappedValue = Math.min(100, suffix === "/255" ? Math.round((numericValue / 255) * 100) : numericValue);
  const barColor = cappedValue >= 70 ? "from-emerald-400 to-cyan-400" : cappedValue >= 40 ? "from-amber-400 to-orange-400" : "from-rose-400 to-pink-400";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-xs font-extrabold text-white">
          {value}
          {suffix}
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
          style={{ width: `${Math.max(4, cappedValue)}%` }}
        />
      </div>
    </div>
  );
}

function FacePanel({
  employees,
  webcamRef,
  selectedEmployee,
  setSelectedEmployee,
  registerFace,
  scanFace,
  loadingFace,
  modelsReady,
  autoFaceEnabled,
  setAutoFaceEnabled,
  faceStatus,
  faceFeedback,
  lastFaceMatch,
  featured = false,
}) {
  const registeredFaces = employees.filter((employee) =>
    localStorage.getItem(`face-${employee.id || employee._id}`)
  ).length;

  const feedbackStyles = {
    success: "border-emerald-400/40 bg-emerald-950/80 text-emerald-200",
    warning: "border-amber-400/40 bg-amber-950/80 text-amber-200",
    error: "border-rose-400/40 bg-rose-950/80 text-rose-200",
    neutral: "border-indigo-400/40 bg-indigo-950/80 text-indigo-200",
  };

  const guideRing =
    faceFeedback?.tone === "success"
      ? "border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.4)]"
      : faceFeedback?.tone === "warning"
        ? "border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.35)]"
        : faceFeedback?.tone === "error"
          ? "border-rose-400 shadow-[0_0_50px_rgba(244,63,94,0.35)]"
          : "border-cyan-400 shadow-[0_0_50px_rgba(34,211,238,0.35)]";

  return (
    <div className={`surface-card overflow-hidden rounded-2xl ${featured ? "mb-8" : ""}`}>
      <div className="border-b border-white/8 bg-gradient-to-r from-indigo-950/50 via-transparent to-cyan-950/30 px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/30">
              <Camera size={26} className="text-white" />
              {autoFaceEnabled && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-400" />
                </span>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400">Biometric Scanner</p>
              <h3 className="text-xl font-extrabold text-white">AI Face Recognition</h3>
              <p className="text-sm text-slate-400">
                {registeredFaces}/{employees.length} templates enrolled
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold ${modelsReady ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-300" : "border-amber-400/30 bg-amber-500/12 text-amber-300"}`}>
              {modelsReady ? <CheckCircle2 size={14} /> : <div className="loading-spinner" style={{ width: 14, height: 14 }} />}
              {modelsReady ? "Neural Engine Ready" : "Loading Models"}
            </span>
            {loadingFace && (
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/12 px-3.5 py-2 text-xs font-bold text-indigo-200">
                <div className="loading-spinner" style={{ width: 14, height: 14 }} />
                Processing
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className={`scanner-panel relative overflow-hidden rounded-2xl p-3 ${faceFeedback?.tone === "success" ? "biometric-success" : ""}`}>
          <Webcam
            ref={webcamRef}
            audio={false}
            mirrored={true}
            screenshotFormat="image/jpeg"
            videoConstraints={{ width: 720, height: 460, facingMode: "user" }}
            className="aspect-video w-full rounded-xl object-cover brightness-110 contrast-110 saturate-110"
          />

          <div className="scanner-grid pointer-events-none absolute inset-3 rounded-xl opacity-60" />
          <div className="scan-line" />
          <div className="scan-corner scan-corner-tl" />
          <div className="scan-corner scan-corner-tr" />
          <div className="scan-corner scan-corner-bl" />
          <div className="scan-corner scan-corner-br" />
          <div className="scan-ring" style={{ width: "38%", height: "58%" }} />

          <div className={`pointer-events-none absolute left-1/2 top-1/2 h-[58%] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-[46%] border-2 ${guideRing}`} />

          <div className="neural-dot" style={{ top: "15%", left: "20%", animationDelay: "0s" }} />
          <div className="neural-dot" style={{ top: "25%", right: "18%", animationDelay: "0.5s" }} />
          <div className="neural-dot" style={{ bottom: "30%", left: "15%", animationDelay: "1s" }} />
          <div className="neural-dot" style={{ bottom: "20%", right: "22%", animationDelay: "1.5s" }} />

          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md">
            <span className={`h-2 w-2 rounded-full ${autoFaceEnabled ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-slate-400"}`} />
            {autoFaceEnabled ? "LIVE SCAN" : "CAMERA READY"}
          </div>

          <div className="absolute right-4 top-4 rounded-full border border-cyan-400/30 bg-black/60 px-3 py-1.5 text-[11px] font-bold text-cyan-300 backdrop-blur-md">
            {faceFeedback?.confidence || 0}% CONF
          </div>

          <div className={`absolute bottom-4 left-4 right-4 rounded-2xl border px-4 py-3 backdrop-blur-xl ${feedbackStyles[faceFeedback?.tone] || feedbackStyles.neutral}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold">{faceFeedback?.label || "Ready for recognition"}</span>
              {faceFeedback?.tone === "success" ? <CheckCircle2 size={18} /> : <Sparkles size={18} />}
            </div>
            <p className="mt-1 text-xs font-medium opacity-80">{faceFeedback?.detail || "Center your face within the detection frame."}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <QualityMetric label="Lighting" value={faceFeedback?.brightness || 0} suffix="/255" />
            <QualityMetric label="Face Size" value={faceFeedback?.faceCoverage || 0} suffix="%" />
            <QualityMetric label="Confidence" value={faceFeedback?.confidence || 0} suffix="%" />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Enroll Employee</p>
            <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="soft-input w-full rounded-xl p-3">
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee.id || employee._id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <button
              onClick={registerFace}
              disabled={!modelsReady || loadingFace}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-950/30 transition hover:brightness-110 disabled:opacity-50"
            >
              Register Face Template
            </button>
            <button
              onClick={scanFace}
              disabled={!modelsReady || loadingFace}
              className="btn-primary rounded-xl px-5 py-3.5 text-sm font-extrabold disabled:opacity-50"
            >
              Scan Once
            </button>
            <button
              onClick={() => setAutoFaceEnabled(!autoFaceEnabled)}
              disabled={!modelsReady}
              className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-extrabold text-white transition disabled:opacity-50 ${
                autoFaceEnabled
                  ? "bg-gradient-to-r from-rose-600 to-pink-600 shadow-lg shadow-rose-950/30"
                  : "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-950/30"
              }`}
            >
              {autoFaceEnabled ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
              {autoFaceEnabled ? "Stop Auto Scan" : "Start Auto Scan"}
            </button>
          </div>

          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-indigo-950/40 to-slate-950/60 p-4 text-center">
            <p className={`text-sm font-bold ${autoFaceEnabled ? "text-emerald-300" : "text-slate-300"}`}>
              {loadingFace ? (
                <span className="inline-flex items-center gap-2">
                  <span className="loading-spinner" /> AI Processing...
                </span>
              ) : (
                faceStatus
              )}
            </p>
            {lastFaceMatch && (
              <div className="mt-3 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2">
                <p className="text-xs font-bold text-emerald-300">Match Found</p>
                <p className="mt-0.5 text-sm font-extrabold text-white">{lastFaceMatch.name}</p>
                <p className="text-xs text-emerald-400/80">{Math.round((1 - lastFaceMatch.distance) * 100)}% confidence</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployeeInput({ label, value, onChange, type = "text" }) {
  return (
    <input
      type={type}
      placeholder={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="soft-input rounded-xl p-3"
    />
  );
}

function EmployeeForm({ employeeForm, updateEmployeeForm, readPhoto, addEmployee }) {
  return (
    <div className="surface-card mb-6 rounded-2xl p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Directory</p>
          <h3 className="mt-1 flex items-center gap-2 text-xl font-extrabold text-white">
            <UserPlus size={22} className="text-indigo-400" />
            Add New Employee
          </h3>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <EmployeeInput label="Full Name" value={employeeForm.name} onChange={(value) => updateEmployeeForm("name", value)} />
        <EmployeeInput label="Email Address" type="email" value={employeeForm.email} onChange={(value) => updateEmployeeForm("email", value)} />
        <EmployeeInput label="Department" value={employeeForm.department} onChange={(value) => updateEmployeeForm("department", value)} />
        <EmployeeInput label="Job Role" value={employeeForm.role} onChange={(value) => updateEmployeeForm("role", value)} />
        <EmployeeInput label="Salary (INR)" type="number" value={employeeForm.salary} onChange={(value) => updateEmployeeForm("salary", value)} />
        <label className="soft-input flex flex-col rounded-xl p-3 text-sm font-semibold text-slate-400">
          Profile Photo
          <input type="file" accept="image/*" onChange={(e) => readPhoto(e.target.files?.[0], updateEmployeeForm)} className="mt-2 block text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white" />
        </label>
      </div>
      {employeeForm.photo && (
        <div className="mt-4 flex items-center gap-3">
          <img src={employeeForm.photo} alt="Preview" className="h-16 w-16 rounded-xl border border-white/10 object-cover ring-2 ring-indigo-500/30" />
          <p className="text-xs text-slate-500">Photo preview ready</p>
        </div>
      )}
      <button onClick={addEmployee} className="btn-primary mt-5 rounded-xl px-6 py-3 text-sm font-extrabold">
        Create Employee Profile
      </button>
    </div>
  );
}

function SearchBox({ search, setSearch }) {
  return (
    <div className="surface-card mb-6 flex items-center gap-3 rounded-2xl border border-white/10 p-4 transition focus-within:border-indigo-500/40">
      <Search className="shrink-0 text-indigo-400" size={20} />
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
      />
      {search && (
        <button onClick={() => setSearch("")} className="rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-white">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

function EmployeeTable({ employees, editingId, editForm, updateEditForm, readPhoto, startEdit, saveEdit, cancelEdit, deleteEmployee, openProfile, canWrite }) {
  return (
    <div className="surface-card overflow-hidden rounded-2xl">
      <div className="border-b border-white/8 bg-gradient-to-r from-indigo-950/30 to-transparent px-6 py-5">
        <h3 className="text-lg font-extrabold text-white">Employee Records</h3>
        <p className="text-sm text-slate-400">Manage profiles, payroll data, and AI face enrollment.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead className="text-[10px] uppercase tracking-wider text-indigo-300/80">
            <tr>
              <th className="p-4 text-left font-bold">Employee</th>
              <th className="p-4 text-left font-bold">Department</th>
              <th className="p-4 text-left font-bold">Role</th>
              <th className="p-4 text-left font-bold">Salary</th>
              <th className="p-4 text-left font-bold">Face AI</th>
              <th className="p-4 text-left font-bold">Status</th>
              <th className="p-4 text-left font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 && (
              <tr>
                <td colSpan="7" className="p-6">
                  <EmptyState icon={Users} title="No employees found" message="Employee profiles matching your search will appear here." />
                </td>
              </tr>
            )}
            {employees.map((employee) => {
              const employeeKey = employee.id || employee._id;
              const faceRegistered = Boolean(localStorage.getItem(`face-${employeeKey}`));
              return (
                <tr key={employee._id} className="border-t border-white/6 transition hover:bg-indigo-500/[0.04]">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {editingId === employee._id ? (
                        <label className="flex h-12 w-12 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] text-slate-400">
                          {editForm.photo ? <img src={editForm.photo} alt="" className="h-full w-full object-cover" /> : <Camera size={18} />}
                          <input type="file" accept="image/*" onChange={(e) => readPhoto(e.target.files?.[0], updateEditForm)} className="hidden" />
                        </label>
                      ) : employee.photo ? (
                        <img src={employee.photo} alt="" className="h-12 w-12 rounded-xl object-cover ring-2 ring-indigo-500/20" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 text-indigo-300 ring-1 ring-indigo-400/20">
                          <Users size={18} />
                        </div>
                      )}
                      <div>
                        {editingId === employee._id ? (
                          <>
                            <input value={editForm.name} onChange={(e) => updateEditForm("name", e.target.value)} className="soft-input mb-2 block rounded-lg p-2" />
                            <input value={editForm.email} onChange={(e) => updateEditForm("email", e.target.value)} className="soft-input block rounded-lg p-2" />
                          </>
                        ) : (
                          <>
                            <p className="font-bold text-white">{employee.name}</p>
                            <p className="text-sm text-slate-400">{employee.email}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <EditableCell editing={editingId === employee._id} value={editForm.department} display={employee.department || "-"} onChange={(value) => updateEditForm("department", value)} />
                  <EditableCell editing={editingId === employee._id} value={editForm.role} display={employee.role || "-"} onChange={(value) => updateEditForm("role", value)} />
                  <td className="p-4 font-medium text-slate-300">
                    {editingId === employee._id ? (
                      <input type="number" value={editForm.salary} onChange={(e) => updateEditForm("salary", e.target.value)} className="soft-input w-28 rounded-lg p-2" />
                    ) : (
                      `₹${Number(employee.salary || 0).toLocaleString("en-IN")}`
                    )}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={faceRegistered ? "Registered" : "Missing"} />
                  </td>
                  <td className="p-4"><StatusBadge status={employee.status || "Active"} /></td>
                  <td className="p-4">
                    <div className="flex gap-1.5">
                      <ActionBtn icon={Eye} onClick={() => openProfile(employee)} title="View profile" variant="ghost" />
                      {canWrite && editingId === employee._id && (
                        <>
                          <ActionBtn icon={Save} onClick={() => saveEdit(employee._id)} title="Save" variant="success" />
                          <ActionBtn icon={X} onClick={cancelEdit} title="Cancel" variant="ghost" />
                        </>
                      )}
                      {canWrite && editingId !== employee._id && <ActionBtn icon={Edit} onClick={() => startEdit(employee)} title="Edit" variant="warning" />}
                      {canWrite && <ActionBtn icon={Trash2} onClick={() => deleteEmployee(employee._id)} title="Delete" variant="danger" />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, onClick, title, variant = "ghost" }) {
  const styles = {
    ghost: "border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/10 hover:text-white",
    success: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25",
    warning: "border-amber-400/30 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25",
    danger: "border-rose-400/30 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25",
  };
  return (
    <button title={title} onClick={onClick} className={`rounded-lg border p-2 transition ${styles[variant]}`}>
      <Icon size={16} />
    </button>
  );
}

function EditableCell({ editing, value, display, onChange }) {
  return (
    <td className="p-4">
      {editing ? <input value={value} onChange={(e) => onChange(e.target.value)} className="soft-input rounded-lg p-2" /> : <span className="text-slate-700">{display}</span>}
    </td>
  );
}

function AttendancePage({ date, setDate, logs, employees, manualEmployeeId, setManualEmployeeId, manualStatus, setManualStatus, markManual, download, canWrite }) {
  const counts = {
    present: logs.filter((log) => log.status === "Present").length,
    late: logs.filter((log) => log.status === "Late").length,
    absent: logs.filter((log) => log.status === "Absent").length,
  };

  return (
    <div className="surface-card rounded-2xl p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageTitle title="Attendance Operations" subtitle={`Records for ${date}`} />
        <div className="flex flex-wrap gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="soft-input rounded-xl p-3" />
          <button onClick={() => download(`attendance/export/excel?date=${date}`)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/25 transition hover:brightness-110">
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button onClick={() => download(`attendance/export/pdf?date=${date}`)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-950/25 transition hover:brightness-110">
            <FileText size={16} /> PDF
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniMetric label="Present" value={counts.present} />
        <MiniMetric label="Late" value={counts.late} />
        <MiniMetric label="Absent" value={counts.absent} />
      </div>

      {canWrite && (
        <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-4">
          <select value={manualEmployeeId} onChange={(e) => setManualEmployeeId(e.target.value)} className="soft-input rounded-xl p-3">
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee.id || employee._id}>{employee.name}</option>
            ))}
          </select>
          <select value={manualStatus} onChange={(e) => setManualStatus(e.target.value)} className="soft-input rounded-xl p-3">
            <option>Present</option>
            <option>Late</option>
            <option>Absent</option>
          </select>
          <button onClick={markManual} className="btn-primary rounded-xl p-3 text-sm font-extrabold md:col-span-2">
            Mark Attendance
          </button>
        </div>
      )}

      <div className="space-y-3">
        {logs.length === 0 && (
          <EmptyState icon={Clock3} title="No attendance records" message="Records will appear here after manual or AI face marking." />
        )}
        {logs.map((log) => (
          <div key={log._id} className="flex flex-col justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-indigo-500/25 hover:bg-indigo-500/[0.04] sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 text-indigo-300">
                {log.source === "Face" ? <Camera size={18} /> : <UserCheck size={18} />}
              </div>
              <div>
                <h3 className="font-bold text-white">{log.name}</h3>
                <p className="text-sm text-slate-400">{log.email}</p>
                <p className="text-xs text-slate-500">{log.department || "-"} · {log.role || "-"} · {log.source || "Face"}</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <StatusBadge status={log.status} />
              <p className="mt-1 text-sm text-slate-500">{log.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeavesPage({ employees, leaves, leaveForm, setLeaveForm, applyLeave, updateLeaveStatus, canWrite }) {
  return (
    <>
      <PageTitle title="Leave Management" subtitle="Apply, approve, and track employee leave requests" />
      {canWrite && (
        <div className="surface-card mb-6 rounded-2xl p-6">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">New Request</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <select value={leaveForm.employeeId} onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })} className="soft-input rounded-xl p-3">
              <option value="">Employee</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee.id || employee._id}>{employee.name}</option>
              ))}
            </select>
            <select value={leaveForm.type} onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })} className="soft-input rounded-xl p-3">
              <option>Casual</option>
              <option>Sick</option>
              <option>Paid</option>
            </select>
            <input type="date" value={leaveForm.fromDate} onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value })} className="soft-input rounded-xl p-3" />
            <input type="date" value={leaveForm.toDate} onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })} className="soft-input rounded-xl p-3" />
            <button onClick={applyLeave} className="btn-primary rounded-xl p-3 text-sm font-extrabold">Submit Leave</button>
          </div>
          <input value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="Reason or note..." className="soft-input mt-3 w-full rounded-xl p-3" />
        </div>
      )}
      <div className="surface-card overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[850px]">
          <thead className="text-[10px] uppercase tracking-wider text-indigo-300/80">
            <tr>
              <th className="p-4 text-left font-bold">Employee</th>
              <th className="p-4 text-left font-bold">Type</th>
              <th className="p-4 text-left font-bold">Dates</th>
              <th className="p-4 text-left font-bold">Reason</th>
              <th className="p-4 text-left font-bold">Status</th>
              <th className="p-4 text-left font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {leaves.length === 0 && (
              <tr>
                <td colSpan="6" className="p-6">
                  <EmptyState icon={CalendarDays} title="No leave requests" message="Submitted leave requests will appear here for review." />
                </td>
              </tr>
            )}
            {leaves.map((leave) => (
              <tr key={leave._id} className="border-t border-white/6 transition hover:bg-indigo-500/[0.04]">
                <td className="p-4 font-bold text-white">
                  {leave.name}
                  <p className="text-sm font-normal text-slate-400">{leave.email}</p>
                </td>
                <td className="p-4 text-slate-300">{leave.type}</td>
                <td className="p-4 text-slate-300">
                  {leave.fromDate} → {leave.toDate}
                  <p className="text-sm text-slate-500">{leave.days} day(s)</p>
                </td>
                <td className="p-4 text-slate-400">{leave.reason || "-"}</td>
                <td className="p-4"><StatusBadge status={leave.status} /></td>
                <td className="p-4">
                  {canWrite && leave.status === "Pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => updateLeaveStatus(leave._id, "Approved")} className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-xs font-bold text-white">Approve</button>
                      <button onClick={() => updateLeaveStatus(leave._id, "Rejected")} className="rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 px-3 py-2 text-xs font-bold text-white">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ReportsPage({ reportMonth, setReportMonth, monthlyReport, download }) {
  const chartData = monthlyReport.slice(0, 8).map((row) => ({
    name: row.name?.split(" ")[0] || "Emp",
    present: row.present,
    absent: row.absent,
    late: row.late,
  }));

  return (
    <>
      <PageTitle title="Monthly Reports" subtitle="Employee-wise attendance analytics and export" />
      <div className="mb-6 flex flex-wrap gap-3">
        <input type="month" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} className="soft-input rounded-xl p-3" />
        <button onClick={() => download(`reports/monthly/export/excel?month=${reportMonth}`)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-bold text-white">
          <FileSpreadsheet size={16} /> Excel
        </button>
        <button onClick={() => download(`reports/monthly/export/pdf?month=${reportMonth}`)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-4 py-3 text-sm font-bold text-white">
          <FileText size={16} /> PDF
        </button>
      </div>

      {chartData.length > 0 && (
        <section className="surface-card mb-6 rounded-2xl p-6">
          <h3 className="mb-5 text-lg font-extrabold text-white">Attendance Visualization</h3>
          <ResponsiveContainer width="100%" height={300} minWidth={300}>
            <BarChart data={chartData} barGap={2}>
              <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} allowDecimals={false} fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid rgba(99,102,241,0.3)", background: "rgba(8,14,30,0.95)", color: "#e0e7ff" }} />
              <Bar dataKey="present" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      <div className="surface-card overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[850px]">
          <thead className="text-[10px] uppercase tracking-wider text-indigo-300/80">
            <tr>
              <th className="p-4 text-left font-bold">Employee</th>
              <th className="p-4 text-left font-bold">Department</th>
              <th className="p-4 text-left font-bold">Present</th>
              <th className="p-4 text-left font-bold">Late</th>
              <th className="p-4 text-left font-bold">Leave</th>
              <th className="p-4 text-left font-bold">Absent</th>
            </tr>
          </thead>
          <tbody>
            {monthlyReport.length === 0 && (
              <tr>
                <td colSpan="6" className="p-6">
                  <EmptyState icon={FileSpreadsheet} title="No report data" message="Monthly analytics will appear here once records are available." />
                </td>
              </tr>
            )}
            {monthlyReport.map((row) => (
              <tr key={row.employeeId} className="border-t border-white/6 transition hover:bg-indigo-500/[0.04]">
                <td className="p-4 font-bold text-white">
                  {row.name}
                  <p className="text-sm font-normal text-slate-400">{row.email}</p>
                </td>
                <td className="p-4 text-slate-300">{row.department || "-"}</td>
                <td className="p-4"><span className="font-bold text-indigo-300">{row.present}</span></td>
                <td className="p-4"><span className="font-bold text-amber-300">{row.late}</span></td>
                <td className="p-4"><span className="font-bold text-violet-300">{row.leaveDays}</span></td>
                <td className="p-4"><span className="font-bold text-rose-300">{row.absent}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PayrollPage({ employees, reportMonth, setReportMonth, payrollEmployeeId, setPayrollEmployeeId, payroll, fetchPayroll, download }) {
  return (
    <>
      <PageTitle title="Payroll" subtitle="Generate salary slips from monthly attendance data" />
      <div className="surface-card mb-6 rounded-2xl p-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input type="month" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} className="soft-input rounded-xl p-3" />
          <select value={payrollEmployeeId} onChange={(e) => setPayrollEmployeeId(e.target.value)} className="soft-input rounded-xl p-3">
            <option value="">Select Employee</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>{employee.name}</option>
            ))}
          </select>
          <button onClick={fetchPayroll} className="btn-primary rounded-xl p-3 text-sm font-extrabold">Generate Payroll</button>
          <button disabled={!payrollEmployeeId} onClick={() => download(`payroll/employee/${payrollEmployeeId}/export/pdf?month=${reportMonth}`)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 p-3 text-sm font-bold text-white disabled:opacity-50">
            <FileText size={16} /> Payslip PDF
          </button>
        </div>
      </div>
      {payroll && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Wallet} label="Base Salary" value={`₹${payroll.payroll.baseSalary.toLocaleString("en-IN")}`} accent="indigo" />
          <StatCard icon={CalendarDays} label="Paid Days" value={`${payroll.payroll.paidDays}/${payroll.payroll.monthDays}`} accent="emerald" />
          <StatCard icon={UserX} label="Deduction" value={`₹${payroll.payroll.deduction.toLocaleString("en-IN")}`} accent="rose" />
          <StatCard icon={UserCheck} label="Net Salary" value={`₹${payroll.payroll.netSalary.toLocaleString("en-IN")}`} accent="violet" />
        </div>
      )}
    </>
  );
}

function ProfileModal({ profile, close }) {
  const employee = profile.employee;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="app-fade-in w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-indigo-950/50">
        <div className="mb-6 flex justify-between gap-4">
          <div className="flex gap-4">
            {employee.photo ? (
              <img src={employee.photo} alt="" className="h-20 w-20 rounded-2xl object-cover ring-2 ring-indigo-500/30" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/30 to-violet-500/20 text-indigo-300">
                <UserRound size={32} />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-extrabold text-white">{employee.name}</h2>
              <p className="text-slate-400">{employee.email}</p>
              <p className="text-sm text-slate-500">{employee.department || "-"} · {employee.role || "-"}</p>
            </div>
          </div>
          <button onClick={close} className="h-10 rounded-xl border border-white/10 bg-white/[0.06] p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="mb-4 flex items-center gap-2 font-extrabold text-white">
              <Clock3 size={18} className="text-indigo-400" />
              Attendance History
            </h3>
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {profile.attendance.map((item) => (
                <div key={item._id} className="flex items-center justify-between rounded-lg border border-white/6 bg-white/[0.02] px-3 py-2 text-sm">
                  <span className="text-slate-300">{item.date}</span>
                  <StatusBadge status={item.status} />
                  <span className="text-xs text-slate-500">{item.time}</span>
                </div>
              ))}
              {profile.attendance.length === 0 && <p className="text-sm text-slate-500">No records available</p>}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="mb-4 flex items-center gap-2 font-extrabold text-white">
              <CalendarDays size={18} className="text-violet-400" />
              Leave History
            </h3>
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {profile.leaves.map((item) => (
                <div key={item._id} className="flex items-center justify-between rounded-lg border border-white/6 bg-white/[0.02] px-3 py-2 text-sm">
                  <span className="text-slate-300">{item.fromDate} → {item.toDate}</span>
                  <StatusBadge status={item.status} />
                </div>
              ))}
              {profile.leaves.length === 0 && <p className="text-sm text-slate-500">No records available</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
