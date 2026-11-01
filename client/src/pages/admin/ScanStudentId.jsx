import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import { parseIdCardText } from '../../utils/ocrParser';
import libraryService from '../../services/libraryService';
import {
  Camera,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ArrowRight,
  UserPlus,
  BookMarked,
  Sparkles,
  Play,
  Square,
} from 'lucide-react';

const ScanStudentId = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Camera & Capture state
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);

  // OCR Processing state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [rawOcrText, setRawOcrText] = useState('');

  // Editable Student Fields matching Real College ID Card: NAME, COURSE, REG.NO, YEAR
  const [extractedData, setExtractedData] = useState({
    name: '',
    course: '',
    registerNumber: '',
    year: '',
  });

  // Database verification state
  const [verifying, setVerifying] = useState(false);
  const [dbStudent, setDbStudent] = useState(null);
  const [activeBorrowsCount, setActiveBorrowsCount] = useState(0);
  const [searchError, setSearchError] = useState('');
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);

  // New Student Registration in-place state
  const [regForm, setRegForm] = useState({
    email: '',
    phone: '',
    password: 'Student@123',
  });
  const [registering, setRegistering] = useState(false);

  // Enumerate devices on mount
  useEffect(() => {
    const getDevices = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter((device) => device.kind === 'videoinput');
          setCameras(videoDevices);
          if (videoDevices.length > 0) {
            setSelectedCameraId(videoDevices[0].deviceId);
          }
        }
      } catch (err) {
        console.warn('Could not enumerate cameras:', err);
      }
    };
    getDevices();

    return () => {
      stopCamera();
    };
  }, []);

  // When cameraStream updates, attach to videoRef immediately and play
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current
        .play()
        .then(() => {
          setIsCameraActive(true);
        })
        .catch((err) => {
          console.warn('Video element play() was blocked or interrupted:', err);
        });
    }
  }, [cameraStream]);

  // Start Camera with resilient fallbacks
  const startCamera = async (deviceId) => {
    stopCamera();
    setCameraError('');
    setCapturedImage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API (getUserMedia) is not supported in this browser or context.');
      return;
    }

    try {
      let stream = null;

      // 1. Try with selected deviceId if available
      if (deviceId) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceId } },
          });
        } catch (deviceErr) {
          console.warn('Exact deviceId failed, trying default video:', deviceErr);
        }
      }

      // 2. Try with ideal environment facingMode
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        } catch (facingErr) {
          console.warn('Ideal facingMode failed, trying generic video constraint:', facingErr);
        }
      }

      // 3. Fallback to basic { video: true } (works on laptops & webcams)
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      setCameraStream(stream);
      setIsCameraActive(true);

      // Re-enumerate cameras now that user has granted permission (so labels are visible)
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setCameras(videoDevices);
      } catch (enumErr) {
        // ignore
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setIsCameraActive(false);
      setCameraError(
        `Camera could not be opened: ${err.message || 'Permission denied'}. Check browser permissions or upload an image.`
      );
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleCameraChange = (e) => {
    const deviceId = e.target.value;
    setSelectedCameraId(deviceId);
    startCamera(deviceId);
  };

  // Capture frame from video
  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(dataUrl);
    stopCamera();
    processImageWithOcr(dataUrl);
  };

  // Handle uploaded file
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setCapturedImage(dataUrl);
      processImageWithOcr(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Process image with Tesseract.js
  const processImageWithOcr = async (imageSrc) => {
    setOcrLoading(true);
    setOcrProgress(0);
    setDbStudent(null);
    setSearchError('');
    setShowRegisterPrompt(false);

    try {
      const result = await Tesseract.recognize(imageSrc, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      const text = result.data.text;
      setRawOcrText(text);

      const parsed = parseIdCardText(text);
      setExtractedData({
        name: parsed.name,
        course: parsed.course || parsed.department,
        registerNumber: parsed.registerNumber,
        year: parsed.year,
      });

      // Automatically verify in MongoDB if register number was recognized
      if (parsed.registerNumber) {
        verifyInDatabase(parsed.registerNumber);
      }
    } catch (err) {
      console.error('OCR processing error:', err);
      setSearchError('Error processing ID card image with OCR: ' + err.message);
    } finally {
      setOcrLoading(false);
    }
  };

  // Verify Register Number in MongoDB
  const verifyInDatabase = async (regNo) => {
    const numToSearch = regNo || extractedData.registerNumber;
    if (!numToSearch) {
      setSearchError('Please enter or scan a valid Register Number (REG.NO).');
      return;
    }

    setVerifying(true);
    setSearchError('');
    setDbStudent(null);
    setShowRegisterPrompt(false);

    try {
      const res = await libraryService.getStudentByRegNo(numToSearch.trim().toUpperCase());
      if (res.data.success && res.data.data) {
        setDbStudent(res.data.data);
        setActiveBorrowsCount(res.data.activeBorrowsCount || 0);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setShowRegisterPrompt(true);
        setSearchError(`Student with REG.NO "${numToSearch}" is not registered in MongoDB.`);
        setRegForm((prev) => ({
          ...prev,
          email: `${numToSearch.toLowerCase()}@college.edu`,
        }));
      } else {
        setSearchError(err.response?.data?.message || 'Database lookup error.');
      }
    } finally {
      setVerifying(false);
    }
  };

  // Handle registering new student from OCR data
  const handleRegisterFromOcr = async (e) => {
    e.preventDefault();
    setRegistering(true);
    setSearchError('');

    try {
      const res = await libraryService.createStudent({
        name: extractedData.name,
        registerNumber: extractedData.registerNumber.toUpperCase().trim(),
        course: extractedData.course,
        department: extractedData.course,
        year: extractedData.year,
        academicYear: extractedData.year,
        email: regForm.email,
        phone: regForm.phone,
        password: regForm.password,
      });

      if (res.data.success) {
        setDbStudent(res.data.data);
        setActiveBorrowsCount(0);
        setShowRegisterPrompt(false);
      }
    } catch (err) {
      setSearchError(err.response?.data?.message || 'Failed to register student.');
    } finally {
      setRegistering(false);
    }
  };

  // Generator for Test ID Card Canvas matching real format: NAME, COURSE, REG.NO, YEAR
  const handleGenerateSampleId = () => {
    stopCamera();
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');

    // Card background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 360);

    // Header bar
    ctx.fillStyle = '#0f274a';
    ctx.fillRect(0, 0, 600, 65);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('COLLEGE OF ENGINEERING & TECHNOLOGY', 40, 40);

    // Photo box
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(40, 95, 115, 140);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 95, 115, 140);
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('PHOTO', 75, 170);

    // Student Title
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('STUDENT IDENTITY CARD', 185, 115);

    // Exact fields matching requested real ID format:
    // NAME, COURSE, REG.NO, YEAR
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px Arial';

    ctx.fillText('NAME     : Aldrin Deral', 185, 155);
    ctx.fillText('COURSE   : B.E. CSE', 185, 195);
    ctx.fillText('REG.NO   : 721924104026', 185, 235);
    ctx.fillText('YEAR     : 2024–2028', 185, 275);

    // Footer bar
    ctx.fillStyle = '#0f274a';
    ctx.fillRect(0, 335, 600, 25);

    const testDataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(testDataUrl);
    processImageWithOcr(testDataUrl);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Camera className="h-6 w-6 mr-2 text-brand-600" />
            Scan Student ID Card (OCR)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Capture or upload a college ID card. Extracts <strong>NAME</strong>, <strong>COURSE</strong>,{' '}
            <strong>REG.NO</strong>, and <strong>YEAR</strong> via Tesseract OCR and verifies the student in MongoDB.
          </p>
        </div>

        {/* Quick Demo Sample Generator Button */}
        <button
          type="button"
          onClick={handleGenerateSampleId}
          className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 hover:bg-brand-100 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Sparkles className="h-4 w-4 mr-1.5 text-brand-500" />
          Test with Sample Demo ID Card
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera Preview & Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center">
                <span>Camera Stream & Input</span>
                {isCameraActive && (
                  <span className="ml-2 inline-flex items-center text-[11px] font-semibold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
                    Live
                  </span>
                )}
              </h2>

              {cameras.length > 1 && (
                <select
                  value={selectedCameraId}
                  onChange={handleCameraChange}
                  className="text-xs bg-slate-50 border border-slate-300 rounded px-2 py-1 max-w-[150px] truncate"
                >
                  {cameras.map((cam, idx) => (
                    <option key={cam.deviceId || idx} value={cam.deviceId}>
                      {cam.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Video Viewport: Keep video tag ALWAYS mounted */}
            <div className="relative aspect-[4/3] bg-slate-950 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
              {/* Always mounted video element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${capturedImage || !isCameraActive ? 'hidden' : 'block'}`}
              />

              {/* Target Guide Overlay when Camera is Active */}
              {isCameraActive && !capturedImage && (
                <div className="absolute inset-4 border-2 border-brand-400 border-dashed rounded-lg pointer-events-none flex flex-col justify-between p-2">
                  <span className="text-[10px] text-white/90 bg-black/60 px-2 py-0.5 rounded self-center">
                    Align ID card: NAME, COURSE, REG.NO, YEAR
                  </span>
                  <span className="text-[10px] text-white/70 self-center">
                    Keep text clear & well-lit
                  </span>
                </div>
              )}

              {/* Captured Image Display */}
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Captured ID"
                  className="w-full h-full object-contain bg-slate-900"
                />
              )}

              {/* Camera Inactive Placeholder (shown only when camera is stopped and no captured image) */}
              {!isCameraActive && !capturedImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-slate-300">
                  <Camera className="h-12 w-12 text-slate-500 mb-2" />
                  <p className="text-xs text-slate-300">Camera preview is currently closed.</p>
                  <button
                    type="button"
                    onClick={() => startCamera(selectedCameraId)}
                    className="mt-3 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Start Camera</span>
                  </button>
                </div>
              )}

              {/* OCR Loading Overlay */}
              {ocrLoading && (
                <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 z-20">
                  <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-xs font-semibold">Tesseract OCR Processing...</p>
                  <div className="w-48 bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-brand-500 h-full transition-all duration-200"
                      style={{ width: `${ocrProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1">{ocrProgress}%</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              {isCameraActive && !capturedImage ? (
                <>
                  <button
                    type="button"
                    onClick={handleCapture}
                    disabled={ocrLoading}
                    className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 shadow-sm transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Capture Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs rounded-lg flex items-center justify-center"
                    title="Stop Camera"
                  >
                    <Square className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => startCamera(selectedCameraId)}
                  disabled={ocrLoading}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 shadow-sm transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  <span>{capturedImage ? 'Retake with Camera' : 'Start Camera'}</span>
                </button>
              )}

              {/* Upload fallback button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={ocrLoading}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Image</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {cameraError && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          {/* Raw OCR Text Diagnostic Box */}
          {rawOcrText && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
              <span className="font-semibold text-slate-600 block mb-1">
                Raw OCR Text Output:
              </span>
              <pre className="text-[11px] text-slate-500 whitespace-pre-wrap font-mono bg-white p-2 rounded border border-slate-200 max-h-28 overflow-y-auto">
                {rawOcrText}
              </pre>
            </div>
          )}
        </div>

        {/* Right Column: Editable Extracted Fields (NAME, COURSE, REG.NO, YEAR) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-sm font-bold text-slate-800 flex items-center">
                <UserCheck className="h-4 w-4 mr-2 text-brand-600" />
                Extracted ID Card Fields (Editable)
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                Format: NAME &bull; COURSE &bull; REG.NO &bull; YEAR
              </span>
            </div>

            {/* Editable Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. NAME */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NAME (Student Full Name) *
                  </label>
                  <input
                    type="text"
                    value={extractedData.name}
                    onChange={(e) => setExtractedData({ ...extractedData, name: e.target.value })}
                    placeholder="e.g. Aldrin Deral"
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                {/* 2. COURSE */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    COURSE (Course / Branch) *
                  </label>
                  <input
                    type="text"
                    value={extractedData.course}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, course: e.target.value })
                    }
                    placeholder="e.g. B.E. CSE"
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 3. REG.NO */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    REG.NO (Register Number) *
                  </label>
                  <input
                    type="text"
                    value={extractedData.registerNumber}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        registerNumber: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g. 721924104026"
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none uppercase font-mono font-bold text-brand-900"
                  />
                </div>

                {/* 4. YEAR */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    YEAR (Academic Year / Batch) *
                  </label>
                  <input
                    type="text"
                    value={extractedData.year}
                    onChange={(e) => setExtractedData({ ...extractedData, year: e.target.value })}
                    placeholder="e.g. 2024–2028 or IV Year"
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Verify Button */}
              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => verifyInDatabase(extractedData.registerNumber)}
                  disabled={verifying || !extractedData.registerNumber}
                  className="flex-1 bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 shadow-sm"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>{verifying ? 'Verifying with MongoDB...' : 'Verify Student in MongoDB'}</span>
                </button>
              </div>
            </div>

            {/* Error or Warning Notification */}
            {searchError && (
              <div className="mt-4 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Student Record Status</p>
                  <p className="mt-0.5">{searchError}</p>
                </div>
              </div>
            )}

            {/* Verification Success Box (Student Found in MongoDB) */}
            {dbStudent && (
              <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="font-bold text-sm text-emerald-900">
                      Verified Student Record Found in MongoDB
                    </span>
                  </div>
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                      dbStudent.isActive
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-rose-200 text-rose-800'
                    }`}
                  >
                    {dbStudent.isActive ? 'Active Account' : 'Deactivated'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-emerald-200/60">
                  <div>
                    <span className="text-emerald-700">NAME:</span>{' '}
                    <strong className="text-emerald-950">{dbStudent.name}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-700">REG.NO:</span>{' '}
                    <strong className="text-emerald-950 font-mono">{dbStudent.registerNumber}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-700">COURSE:</span>{' '}
                    <strong className="text-emerald-950">
                      {dbStudent.course || dbStudent.department || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-emerald-700">YEAR:</span>{' '}
                    <strong className="text-emerald-950">
                      {dbStudent.academicYear ||
                        (dbStudent.startYear && dbStudent.endYear
                          ? `${dbStudent.startYear}–${dbStudent.endYear}`
                          : 'N/A')}
                    </strong>
                  </div>
                  <div className="col-span-2 pt-1 text-emerald-800">
                    <span>Active Borrowed Books:</span>{' '}
                    <strong>{activeBorrowsCount} of 3 maximum</strong>
                  </div>
                </div>

                {/* Next Step: Proceed to Issue Book */}
                <div className="mt-4 pt-3 border-t border-emerald-200/60 flex items-center justify-between">
                  <span className="text-xs text-emerald-700 font-medium">
                    Student verified. Proceed to scan book copy.
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/admin/issue-book?studentId=${dbStudent._id}&regNo=${dbStudent.registerNumber}`
                      )
                    }
                    className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-colors"
                  >
                    <BookMarked className="h-4 w-4 mr-1.5" />
                    <span>Proceed to Issue Book</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </button>
                </div>
              </div>
            )}

            {/* Quick Register Prompt if Student Not Found */}
            {showRegisterPrompt && (
              <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-2 mb-2">
                  <UserPlus className="h-5 w-5 text-brand-600" />
                  <h3 className="font-bold text-sm text-slate-800">
                    Register Student from ID Card Details
                  </h3>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  This student is not in the system yet. Confirm email & contact below to register and verify immediately.
                </p>

                <form onSubmit={handleRegisterFromOcr} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        College Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={regForm.email}
                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                        placeholder="student@college.edu"
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={regForm.phone}
                        onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={registering}
                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>{registering ? 'Registering...' : 'Register and Verify Student'}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanStudentId;
