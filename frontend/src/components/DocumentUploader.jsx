import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  Ban
} from "lucide-react";

// File type icons mapping
const FILE_ICONS = {
  "application/pdf": FileText,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": FileText,
  "application/msword": FileText,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": FileSpreadsheet,
  "application/vnd.ms-excel": FileSpreadsheet,
  "image/jpeg": FileImage,
  "image/png": FileImage,
  "image/webp": FileImage,
};

// Supported file types
const SUPPORTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "image/jpeg",
  "image/png",
  "image/webp"
];

// Blocked file types
const BLOCKED_EXTENSIONS = [".zip", ".rar", ".7z", ".exe", ".dll", ".bat", ".sh", ".jar", ".msi"];

const ACCEPTED_EXTENSIONS = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp";

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const DocumentUploader = ({ 
  onDataExtracted, 
  apiClient, 
  projectId, 
  moduleName,
  compact = false 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) validateAndUpload(file);
  };

  const validateAndUpload = (file) => {
    // Check for blocked extensions
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      toast.error(
        <div className="flex items-start gap-2">
          <Ban className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">File type blocked</p>
            <p className="text-sm text-gray-600">ZIP, executable, and archive files are not allowed for security reasons.</p>
          </div>
        </div>,
        { duration: 5000 }
      );
      return;
    }

    // Check file type
    if (!SUPPORTED_TYPES.includes(file.type)) {
      toast.error(
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unsupported file type</p>
            <p className="text-sm text-gray-600">Please upload PDF, Word, Excel, or Image files only.</p>
          </div>
        </div>,
        { duration: 4000 }
      );
      return;
    }

    // Check file size (max 5MB)
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      toast.error(
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">File too large ({sizeMB}MB)</p>
            <p className="text-sm text-gray-600">Maximum file size is 5MB. Please compress or reduce the file size.</p>
          </div>
        </div>,
        { duration: 5000 }
      );
      return;
    }

    // Warning for files approaching limit (>4MB)
    if (file.size > 4 * 1024 * 1024) {
      toast.warning("Large file detected. Upload may take longer.", { duration: 3000 });
    }

    // Show content moderation notice for images
    if (file.type.startsWith("image/")) {
      toast.info(
        <div className="flex items-start gap-2">
          <ShieldAlert className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Content Moderation</p>
            <p className="text-sm text-gray-600">Images are scanned for inappropriate content. Violations may result in account suspension.</p>
          </div>
        </div>,
        { duration: 4000 }
      );
    }

    setUploadedFile(file);
    processFile(file);
  };

  const processFile = async (file) => {
    setProcessing(true);
    setProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("module_name", moduleName);

      // Upload and process with OCR
      const response = await apiClient.post(
        `/projects/${projectId}/upload-document-ocr`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      clearInterval(progressInterval);
      setProgress(100);

      // Show warnings if any
      if (response.data.warnings && response.data.warnings.length > 0) {
        response.data.warnings.forEach(warning => {
          toast.info(warning, { duration: 5000 });
        });
      }

      if (response.data.extracted_data) {
        setExtractedData(response.data.extracted_data);
        onDataExtracted?.(response.data.extracted_data);
        toast.success("Document processed successfully! Data extracted and ready to populate.");
      } else {
        toast.info("Document uploaded. Manual data entry may be required.");
      }
    } catch (error) {
      // Handle specific error messages from server
      const errorMessage = error.response?.data?.detail || "Failed to process document. Please try again.";
      
      if (errorMessage.includes("inappropriate") || errorMessage.includes("explicit")) {
        toast.error(
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Content Policy Violation</p>
              <p className="text-sm text-gray-600">{errorMessage}</p>
            </div>
          </div>,
          { duration: 6000 }
        );
      } else if (errorMessage.includes("size") || errorMessage.includes("5MB")) {
        toast.error(
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">File Size Error</p>
              <p className="text-sm text-gray-600">{errorMessage}</p>
            </div>
          </div>,
          { duration: 5000 }
        );
      } else if (errorMessage.includes("type") || errorMessage.includes("blocked")) {
        toast.error(
          <div className="flex items-start gap-2">
            <Ban className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">File Type Error</p>
              <p className="text-sm text-gray-600">{errorMessage}</p>
            </div>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.error(errorMessage);
      }
      
      clearFile();
    } finally {
      setProcessing(false);
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setExtractedData(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = (type) => {
    const Icon = FILE_ICONS[type] || File;
    return <Icon className="w-5 h-5" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer ${
            isDragging 
              ? "border-[#1DA1F2] bg-blue-50" 
              : "border-gray-300 hover:border-[#1DA1F2] hover:bg-gray-50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {processing ? (
            <div className="space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#1DA1F2] mx-auto" />
              <p className="text-sm text-gray-600">Processing with OCR...</p>
              <Progress value={progress} className="h-1.5 w-32 mx-auto" />
            </div>
          ) : uploadedFile ? (
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">{uploadedFile.name}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                className="h-7 px-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                Drop file or <span className="text-[#1DA1F2] font-medium">browse</span>
              </span>
              <Badge variant="outline" className="text-[10px] ml-2">OCR Enabled</Badge>
            </div>
          )}
        </div>
        
        <p className="text-xs text-gray-500 text-center">
          Supports PDF, Word, Excel, JPEG, PNG (Max 5MB) • ZIP files blocked
        </p>
      </div>
    );
  }

  return (
    <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white">
      <CardContent className="p-6">
        <div
          className={`rounded-xl p-6 text-center transition-all cursor-pointer ${
            isDragging 
              ? "bg-blue-50 border-2 border-[#1DA1F2]" 
              : "hover:bg-gray-50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !processing && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {processing ? (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Processing Document</h4>
                <p className="text-sm text-gray-500 mt-1">Extracting data with OCR technology...</p>
              </div>
              <Progress value={progress} className="h-2 w-48 mx-auto" />
              <p className="text-xs text-gray-400">{progress}% complete</p>
            </div>
          ) : uploadedFile ? (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Document Uploaded</h4>
                <div className="flex items-center justify-center gap-2 mt-2">
                  {getFileIcon(uploadedFile.type)}
                  <span className="text-sm text-gray-600">{uploadedFile.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {formatFileSize(uploadedFile.size)}
                  </Badge>
                </div>
              </div>
              {extractedData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                  <div className="flex items-center gap-2 text-green-700 text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium">Data extracted successfully!</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    {Object.keys(extractedData).length} fields populated automatically
                  </p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                className="mt-2"
              >
                <X className="w-4 h-4 mr-2" />
                Remove & Upload Different File
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-[#1DA1F2]" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Upload Document</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Drag & drop or click to browse
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="bg-white">
                  <Sparkles className="w-3 h-3 mr-1 text-purple-500" />
                  OCR Enabled
                </Badge>
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
                <span className="px-2 py-1 bg-gray-100 rounded">PDF</span>
                <span className="px-2 py-1 bg-gray-100 rounded">Word</span>
                <span className="px-2 py-1 bg-gray-100 rounded">Excel</span>
                <span className="px-2 py-1 bg-gray-100 rounded">JPEG/PNG</span>
              </div>
              <p className="text-xs text-gray-400">Maximum file size: 5MB • ZIP files blocked</p>
              <p className="text-xs text-amber-500 mt-1 flex items-center justify-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                Images scanned for inappropriate content
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUploader;
