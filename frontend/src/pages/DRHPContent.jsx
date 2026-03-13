import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import DocumentUploader from "@/components/DocumentUploader";
import { DRHP_CHAPTERS, SUBMODULE_FIELDS } from "@/config/drhpChapters";
import {
  ChevronRight,
  Loader2,
  ArrowLeft,
  Save,
  Eye,
  Download,
  Plus,
  Trash2,
  Upload,
  FileText,
  Table,
  CheckCircle2
} from "lucide-react";

const DRHPContent = ({ user, apiClient }) => {
  const { projectId, sectionId, subModuleId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState(null);
  const [content, setContent] = useState({});
  const [tables, setTables] = useState({});
  
  // Find the chapter and sub-module
  const chapter = DRHP_CHAPTERS.find(c => c.id === sectionId);
  const subModule = subModuleId 
    ? chapter?.subModules?.find(sm => sm.id === subModuleId)
    : chapter; // For chapters without sub-modules
  
  // Get field definitions
  const fieldConfig = SUBMODULE_FIELDS[subModuleId || sectionId] || { fields: [], tables: [] };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, contentRes] = await Promise.all([
          apiClient.get(`/projects/${projectId}`),
          apiClient.get(`/projects/${projectId}/drhp-content/${sectionId}/${subModuleId || ''}`).catch(() => ({ data: { content: {}, tables: {} } }))
        ]);
        setProject(projectRes.data);
        setContent(contentRes.data?.content || {});
        
        // Initialize tables with default rows if available
        const initialTables = contentRes.data?.tables || {};
        fieldConfig.tables?.forEach(tableDef => {
          if (!initialTables[tableDef.id]) {
            initialTables[tableDef.id] = tableDef.defaultRows || [Array(tableDef.columns.length).fill("")];
          }
        });
        setTables(initialTables);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load content");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [apiClient, projectId, sectionId, subModuleId]);

  const handleFieldChange = (fieldId, value) => {
    setContent(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleTableChange = (tableId, rowIndex, colIndex, value) => {
    setTables(prev => {
      const newTables = { ...prev };
      if (!newTables[tableId]) {
        newTables[tableId] = [];
      }
      if (!newTables[tableId][rowIndex]) {
        newTables[tableId][rowIndex] = [];
      }
      newTables[tableId][rowIndex][colIndex] = value;
      return newTables;
    });
  };

  const addTableRow = (tableId, columns) => {
    setTables(prev => ({
      ...prev,
      [tableId]: [...(prev[tableId] || []), Array(columns.length).fill("")]
    }));
  };

  const removeTableRow = (tableId, rowIndex) => {
    setTables(prev => ({
      ...prev,
      [tableId]: prev[tableId]?.filter((_, i) => i !== rowIndex) || []
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.post(`/projects/${projectId}/drhp-content/${sectionId}/${subModuleId || ''}`, {
        content,
        tables
      });
      toast.success("Content saved successfully!");
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  const handleReview = () => {
    navigate(`/project/${projectId}/drhp-review/${sectionId}/${subModuleId || ''}`);
  };

  const handleSubmit = async () => {
    toast.info("Preparing document for export...");
    try {
      const response = await apiClient.post(`/projects/${projectId}/drhp-export/${sectionId}/${subModuleId || ''}`, {}, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${subModule?.title || chapter?.title || 'content'}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Document exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export feature coming soon!");
    }
  };

  const handleDataExtracted = (extractedData) => {
    if (!extractedData) return;
    
    // Map extracted data to content fields
    const newContent = { ...content };
    Object.entries(extractedData).forEach(([key, value]) => {
      if (value) {
        // Try to match with existing fields
        fieldConfig.fields?.forEach(field => {
          if (field.id.toLowerCase().includes(key.toLowerCase()) || 
              key.toLowerCase().includes(field.id.toLowerCase())) {
            newContent[field.id] = value;
          }
        });
      }
    });
    setContent(newContent);
    toast.success("Data extracted and populated!");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" />
        </main>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">Content not found</p>
            <Button onClick={() => navigate(`/project/${projectId}/command-center`)} className="mt-4">
              Back to Command Center
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const breadcrumbTitle = subModule?.title || chapter?.title;
  const backPath = subModuleId 
    ? `/project/${projectId}/drhp-section/${sectionId}`
    : `/project/${projectId}/command-center`;

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="drhp-content-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Header with Review/Submit Buttons */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(backPath)} 
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Section {chapter.number} {subModuleId ? `/ ${subModule?.title}` : ''}</p>
                <h1 className="text-lg font-semibold text-gray-900">{breadcrumbTitle}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2" onClick={handleReview}>
                <Eye className="w-4 h-4" />
                Review
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </Button>
              <Button className="bg-[#1DA1F2] hover:bg-[#1a8cd8] gap-2" onClick={handleSubmit}>
                <Download className="w-4 h-4" />
                Submit
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Upload Section */}
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                  <Upload className="w-6 h-6 text-[#1DA1F2]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Upload Documents with OCR</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Upload relevant documents (PDF, Word, Excel, Images) and we'll auto-extract data using OCR.
                  </p>
                  <DocumentUploader
                    apiClient={apiClient}
                    projectId={projectId}
                    moduleName={`drhp_${sectionId}_${subModuleId || ''}`}
                    onDataExtracted={handleDataExtracted}
                    compact={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Fields */}
          {fieldConfig.fields && fieldConfig.fields.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#1DA1F2]" />
                  Content Fields
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {fieldConfig.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id} className="text-sm font-medium">
                      {field.label}
                    </Label>
                    {field.type === "textarea" || field.type === "richtext" ? (
                      <Textarea
                        id={field.id}
                        value={content[field.id] || field.defaultValue || ""}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        rows={field.type === "richtext" ? 8 : 4}
                        className="resize-none"
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    ) : (
                      <Input
                        id={field.id}
                        value={content[field.id] || ""}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tables */}
          {fieldConfig.tables && fieldConfig.tables.map((tableDef) => (
            <Card key={tableDef.id} className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Table className="w-5 h-5 text-[#1DA1F2]" />
                      {tableDef.title}
                    </CardTitle>
                    {tableDef.description && (
                      <p className="text-sm text-gray-500 mt-1">{tableDef.description}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addTableRow(tableDef.id, tableDef.columns)}
                    className="gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Row
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        {tableDef.columns.map((col, colIndex) => (
                          <th 
                            key={colIndex} 
                            className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700"
                          >
                            {col}
                          </th>
                        ))}
                        <th className="border border-gray-200 px-3 py-2 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(tables[tableDef.id] || []).map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                          {tableDef.columns.map((_, colIndex) => (
                            <td key={colIndex} className="border border-gray-200 p-0">
                              <Input
                                value={row[colIndex] || ""}
                                onChange={(e) => handleTableChange(tableDef.id, rowIndex, colIndex, e.target.value)}
                                className="border-0 rounded-none h-10 text-sm"
                                placeholder="..."
                              />
                            </td>
                          ))}
                          <td className="border border-gray-200 px-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTableRow(tableDef.id, rowIndex)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {(!tables[tableDef.id] || tables[tableDef.id].length === 0) && (
                        <tr>
                          <td 
                            colSpan={tableDef.columns.length + 1} 
                            className="border border-gray-200 px-4 py-8 text-center text-gray-500 text-sm"
                          >
                            No data yet. Click "Add Row" to start entering data.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* If no fields or tables defined, show a generic editor */}
          {(!fieldConfig.fields || fieldConfig.fields.length === 0) && 
           (!fieldConfig.tables || fieldConfig.tables.length === 0) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#1DA1F2]" />
                  Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={content.main_content || ""}
                  onChange={(e) => handleFieldChange("main_content", e.target.value)}
                  rows={15}
                  className="resize-none font-mono text-sm"
                  placeholder="Enter content for this section..."
                />
              </CardContent>
            </Card>
          )}

          {/* Bottom Action Buttons */}
          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <Button variant="outline" onClick={() => navigate(backPath)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2" onClick={handleReview}>
                <Eye className="w-4 h-4" />
                Review
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </Button>
              <Button className="bg-[#1DA1F2] hover:bg-[#1a8cd8] gap-2" onClick={handleSubmit}>
                <Download className="w-4 h-4" />
                Submit
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DRHPContent;
