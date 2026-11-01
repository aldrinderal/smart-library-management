import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import libraryService from '../../services/libraryService';
import {
  QrCode,
  Search,
  BookOpen,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Camera,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

const ScanBookQr = () => {
  const navigate = useNavigate();
  const [scannerRunning, setScannerRunning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookCopy, setBookCopy] = useState(null);
  const [activeTx, setActiveTx] = useState(null);
  const [error, setError] = useState('');
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setError('');
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader-container');
      }

      let cameraConfig = { facingMode: 'environment' };
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const backCam = cameras.find((c) => /back|rear|environment/i.test(c.label));
          cameraConfig = backCam ? backCam.id : cameras[0].id;
        }
      } catch (e) {
        console.warn('Could not list cameras, using default facingMode', e);
      }

      await html5QrCodeRef.current.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // ignore frame errors while seeking
        }
      );
      setScannerRunning(true);
    } catch (err) {
      console.error('QR scanner error:', err);
      // Fallback try with generic user camera
      try {
        await html5QrCodeRef.current.start(
          { facingMode: 'user' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => handleScanSuccess(decodedText),
          () => {}
        );
        setScannerRunning(true);
        return;
      } catch (fallbackErr) {
        setError('Unable to access camera for QR scanning. You can enter the Copy ID manually below.');
        setScannerRunning(false);
      }
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && scannerRunning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      setScannerRunning(false);
    }
  };

  const handleScanSuccess = async (decodedText) => {
    stopScanner();
    setScanResult(decodedText);
    lookupCopy(decodedText);
  };

  const lookupCopy = async (identifier) => {
    if (!identifier) return;
    setLoading(true);
    setError('');
    setBookCopy(null);
    setActiveTx(null);

    try {
      const res = await libraryService.getBookCopyByIdOrQr(identifier.trim());
      if (res.data.success && res.data.data) {
        setBookCopy(res.data.data);
        setActiveTx(res.data.activeTransaction || null);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || `Unknown or invalid Book QR Code (${identifier}). Copy not found.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      setScanResult(manualInput.trim());
      lookupCopy(manualInput.trim());
    }
  };

  const handleTestSample = (sampleId) => {
    setManualInput(sampleId);
    setScanResult(sampleId);
    lookupCopy(sampleId);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <QrCode className="h-6 w-6 mr-2 text-brand-600" />
            Scan Book QR Code
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Scan physical book copy QR labels with your camera or enter the Book Copy ID to inspect shelf location and issue/return status.
          </p>
        </div>

        {/* Demo Quick Sample Buttons */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 flex items-center">
            <Sparkles className="h-3.5 w-3.5 mr-1 text-brand-500" /> Test Copy:
          </span>
          <button
            onClick={() => handleTestSample('BOOK_COPY:COPY001')}
            className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono font-medium"
          >
            COPY001 (Issued)
          </button>
          <button
            onClick={() => handleTestSample('BOOK_COPY:COPY002')}
            className="px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-mono font-medium"
          >
            COPY002 (Available)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: QR Camera Scanner & Manual Input (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h2 className="text-sm font-semibold text-slate-800 mb-3 flex items-center justify-between">
              <span>Camera QR Reader</span>
              {scannerRunning && (
                <span className="inline-flex items-center text-xs text-emerald-600 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
                  Scanner Active
                </span>
              )}
            </h2>

            {/* Video Viewport for html5-qrcode */}
            <div className="relative aspect-square bg-slate-950 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
              <div id="qr-reader-container" className="w-full h-full"></div>

              {!scannerRunning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 text-slate-300">
                  <Camera className="h-10 w-10 text-slate-400 mb-2" />
                  <p className="text-xs text-slate-300">Camera scanner is currently stopped.</p>
                  <button
                    onClick={startScanner}
                    className="mt-3 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>Start QR Scanner</span>
                  </button>
                </div>
              )}
            </div>

            {scannerRunning && (
              <button
                onClick={stopScanner}
                className="mt-3 w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium text-xs py-2 rounded-lg"
              >
                Stop Camera Scanner
              </button>
            )}

            {/* Fallback Manual Search */}
            <div className="mt-5 pt-4 border-t border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Manual Copy ID / QR Value Fallback
              </label>
              <form onSubmit={handleManualSearch} className="flex space-x-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="e.g. COPY001 or BOOK_COPY:COPY001"
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center space-x-1"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Lookup</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Scanned Book Copy Details & Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-200 mb-4 flex items-center justify-between">
              <span className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-brand-600" />
                Physical Copy Information
              </span>
              {scanResult && (
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {scanResult}
                </span>
              )}
            </h2>

            {loading && (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-xs">Fetching book copy details from MongoDB...</p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5">
                <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">QR Code Lookup Failed</p>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && !bookCopy && (
              <div className="py-16 text-center text-slate-400">
                <QrCode className="h-12 w-12 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                <p className="text-xs">Scan a book copy QR code or enter its Copy ID to inspect details.</p>
              </div>
            )}

            {bookCopy && (
              <div className="space-y-4">
                {/* Book Header Card */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full inline-block mb-1">
                      {bookCopy.book?.category || 'General'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {bookCopy.book?.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">by {bookCopy.book?.author}</p>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">
                      ISBN: {bookCopy.book?.isbn} &bull; Title ID: {bookCopy.book?.bookTitleId}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide flex-shrink-0 ${
                      bookCopy.status === 'Available'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : bookCopy.status === 'Issued'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {bookCopy.status === 'Available' ? 'Available to Issue' : bookCopy.status}
                  </span>
                </div>

                {/* Physical Location Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[11px] text-slate-400 block font-medium">Copy ID</span>
                    <span className="text-sm font-bold text-slate-800 font-mono">
                      {bookCopy.copyId}
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[11px] text-slate-400 block font-medium">Shelf Block</span>
                    <span className="text-sm font-bold text-slate-800">{bookCopy.shelfBlock}</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[11px] text-slate-400 block font-medium">Shelf Number</span>
                    <span className="text-sm font-bold text-slate-800">{bookCopy.shelfNumber}</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[11px] text-slate-400 block font-medium">Rack Number</span>
                    <span className="text-sm font-bold text-slate-800">
                      {bookCopy.rackNumber || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Active Borrower Information if Issued */}
                {activeTx && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <h4 className="text-xs font-bold text-amber-900 mb-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1.5 text-amber-600" />
                      Currently Issued to Student:
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-amber-950">
                      <div>
                        <span className="text-amber-700">Student Name:</span>{' '}
                        <strong>{activeTx.student?.name}</strong>
                      </div>
                      <div>
                        <span className="text-amber-700">Register No:</span>{' '}
                        <strong className="font-mono">{activeTx.student?.registerNumber}</strong>
                      </div>
                      <div>
                        <span className="text-amber-700">Issued On:</span>{' '}
                        {new Date(activeTx.issueDate).toLocaleDateString('en-IN')}
                      </div>
                      <div>
                        <span className="text-amber-700">Due Date:</span>{' '}
                        <strong className="text-rose-700">
                          {new Date(activeTx.dueDate).toLocaleDateString('en-IN')}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Step Workflow Actions */}
                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  {bookCopy.status === 'Available' ? (
                    <>
                      <p className="text-xs text-slate-500">
                        This physical copy is available for lending.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/issue-book?copyId=${bookCopy.copyId}`)}
                        className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-sm transition-colors"
                      >
                        <span>Issue This Copy</span>
                        <ArrowRight className="h-4 w-4 ml-1.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-amber-700 font-medium">
                        This copy is currently in circulation. You can check it back into the library.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/return-book?copyId=${bookCopy.copyId}`)}
                        className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-colors"
                      >
                        <RotateCcw className="h-4 w-4 mr-1.5" />
                        <span>Return This Copy</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanBookQr;

