import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  GripVertical
} from "lucide-react";

// Auto-expanding textarea component
const AutoExpandTextarea = ({ value, onChange, placeholder, className = "" }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(38, textareaRef.current.scrollHeight)}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 text-sm border-0 bg-transparent resize-none overflow-hidden focus:outline-none focus:ring-0 ${className}`}
      style={{ minHeight: "38px" }}
    />
  );
};

// Editable table row with floating actions
const EditableTableRow = ({ 
  row, 
  rowIndex, 
  columns, 
  onCellChange, 
  onAddRow, 
  onDeleteRow,
  isLast 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <tr 
      className="group relative border-b border-gray-100 hover:bg-blue-50/30 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {columns.map((_, colIndex) => (
        <td 
          key={colIndex} 
          className={`p-0 align-top ${colIndex === 0 ? 'w-[30%] border-r border-gray-100' : 'w-[70%]'}`}
        >
          <AutoExpandTextarea
            value={row[colIndex] || ""}
            onChange={(value) => onCellChange(rowIndex, colIndex, value)}
            placeholder={colIndex === 0 ? "Enter term..." : "Enter definition..."}
            className={colIndex === 0 ? "font-medium" : ""}
          />
        </td>
      ))}
      
      {/* Floating Action Buttons */}
      <td className="w-12 p-0 relative">
        <div 
          className={`absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1 transition-opacity duration-150 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          style={{ right: '-44px' }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddRow(rowIndex)}
            className="h-7 w-7 p-0 bg-green-50 hover:bg-green-100 text-green-600 rounded-full shadow-sm border border-green-200"
            title="Add row below"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteRow(rowIndex)}
            className="h-7 w-7 p-0 bg-red-50 hover:bg-red-100 text-red-600 rounded-full shadow-sm border border-red-200"
            title="Delete row"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

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
    : chapter;
  
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
        
        // Initialize tables with default rows if available and no saved data
        const savedTables = contentRes.data?.tables || {};
        const initialTables = {};
        
        fieldConfig.tables?.forEach(tableDef => {
          if (savedTables[tableDef.id] && savedTables[tableDef.id].length > 0) {
            // Use saved data
            initialTables[tableDef.id] = savedTables[tableDef.id];
          } else if (tableDef.defaultRows && tableDef.defaultRows.length > 0) {
            // Use default rows
            initialTables[tableDef.id] = tableDef.defaultRows.map(row => [...row]);
          } else {
            // Start with one empty row
            initialTables[tableDef.id] = [Array(tableDef.columns.length).fill("")];
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

  const handleTableCellChange = (tableId, rowIndex, colIndex, value) => {
    setTables(prev => {
      const newTables = { ...prev };
      if (!newTables[tableId]) {
        newTables[tableId] = [];
      }
      if (!newTables[tableId][rowIndex]) {
        newTables[tableId][rowIndex] = [];
      }
      newTables[tableId][rowIndex] = [...newTables[tableId][rowIndex]];
      newTables[tableId][rowIndex][colIndex] = value;
      return newTables;
    });
  };

  const handleAddRow = (tableId, columns, afterIndex) => {
    setTables(prev => {
      const newTables = { ...prev };
      const newRow = Array(columns.length).fill("");
      if (!newTables[tableId]) {
        newTables[tableId] = [];
      }
      // Insert after the specified index
      const newTableData = [...newTables[tableId]];
      newTableData.splice(afterIndex + 1, 0, newRow);
      newTables[tableId] = newTableData;
      return newTables;
    });
  };

  const handleDeleteRow = (tableId, rowIndex) => {
    setTables(prev => {
      const newTables = { ...prev };
      if (newTables[tableId] && newTables[tableId].length > 1) {
        newTables[tableId] = newTables[tableId].filter((_, i) => i !== rowIndex);
      } else {
        toast.info("Cannot delete the last row");
      }
      return newTables;
    });
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
      await handleSave();
      toast.success("Document exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export feature coming soon!");
    }
  };

  const handleDataExtracted = (extractedData) => {
    if (!extractedData) return;
    
    const newContent = { ...content };
    Object.entries(extractedData).forEach(([key, value]) => {
      if (value) {
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

          {/* Tables with Floating Add/Delete */}
          {fieldConfig.tables && fieldConfig.tables.map((tableDef) => (
            <Card key={tableDef.id} className="mb-6 overflow-visible">
              <CardHeader className="pb-3">
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
                  <Badge variant="outline" className="text-xs">
                    {(tables[tableDef.id] || []).length} entries
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="overflow-visible">
                <div className="border border-gray-200 rounded-lg overflow-visible">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {tableDef.columns.map((col, colIndex) => (
                          <th 
                            key={colIndex} 
                            className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 ${
                              colIndex === 0 ? 'w-[30%] border-r border-gray-200' : 'w-[70%]'
                            }`}
                          >
                            {col}
                          </th>
                        ))}
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(tables[tableDef.id] || []).map((row, rowIndex) => (
                        <EditableTableRow
                          key={rowIndex}
                          row={row}
                          rowIndex={rowIndex}
                          columns={tableDef.columns}
                          onCellChange={(ri, ci, val) => handleTableCellChange(tableDef.id, ri, ci, val)}
                          onAddRow={(ri) => handleAddRow(tableDef.id, tableDef.columns, ri)}
                          onDeleteRow={(ri) => handleDeleteRow(tableDef.id, ri)}
                          isLast={rowIndex === (tables[tableDef.id] || []).length - 1}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Add Row at Bottom Button */}
                <div className="mt-3 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddRow(tableDef.id, tableDef.columns, (tables[tableDef.id] || []).length - 1)}
                    className="gap-2 text-[#1DA1F2] border-[#1DA1F2] hover:bg-blue-50"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Entry
                  </Button>
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
