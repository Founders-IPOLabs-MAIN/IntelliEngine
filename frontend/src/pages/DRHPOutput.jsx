import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Save,
  Download,
  FileText,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Undo,
  Redo,
  Type,
  Highlighter,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  Minus,
  Plus,
  ChevronDown,
  FileDown,
  Printer,
  Eye,
  MoreVertical,
  Palette,
  Trash2,
  TableProperties,
  RowsIcon,
  Columns,
  Grid3X3,
  Merge,
  Split,
  Clock,
  Upload,
  FileUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

// Editor Toolbar Component
const EditorToolbar = ({ editor }) => {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  if (!editor) return null;

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  };

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageDialog(false);
    }
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run();
    setShowTableDialog(false);
  };

  const fontSizes = [
    { label: '10', value: '10px' },
    { label: '11', value: '11px' },
    { label: '12', value: '12px' },
    { label: '14', value: '14px' },
    { label: '16', value: '16px' },
    { label: '18', value: '18px' },
    { label: '20', value: '20px' },
    { label: '24', value: '24px' },
    { label: '28', value: '28px' },
    { label: '36', value: '36px' },
  ];

  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'Dark Gray', value: '#4a4a4a' },
    { name: 'Gray', value: '#808080' },
    { name: 'Red', value: '#e53935' },
    { name: 'Orange', value: '#fb8c00' },
    { name: 'Yellow', value: '#fdd835' },
    { name: 'Green', value: '#43a047' },
    { name: 'Blue', value: '#1e88e5' },
    { name: 'Purple', value: '#8e24aa' },
  ];

  const highlightColors = [
    { name: 'Yellow', value: '#fef08a' },
    { name: 'Green', value: '#bbf7d0' },
    { name: 'Blue', value: '#bfdbfe' },
    { name: 'Pink', value: '#fbcfe8' },
    { name: 'Orange', value: '#fed7aa' },
  ];

  return (
    <>
      <div className="border-b border-gray-200 bg-white sticky top-0 z-20">
        {/* Main Toolbar Row */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 flex-wrap">
          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200 mr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="h-8 w-8 p-0"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="h-8 w-8 p-0"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>

          {/* Heading/Paragraph Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 min-w-[100px] justify-between">
                <span className="text-xs">
                  {editor.isActive('heading', { level: 1 }) ? 'Heading 1' :
                   editor.isActive('heading', { level: 2 }) ? 'Heading 2' :
                   editor.isActive('heading', { level: 3 }) ? 'Heading 3' : 'Normal'}
                </span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
                Normal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                <span className="text-2xl font-bold">Heading 1</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <span className="text-xl font-bold">Heading 2</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                <span className="text-lg font-bold">Heading 3</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* Text Formatting */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('strike') ? 'bg-gray-200' : ''}`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* Superscript/Subscript */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('superscript') ? 'bg-gray-200' : ''}`}
            title="Superscript"
          >
            <SuperscriptIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('subscript') ? 'bg-gray-200' : ''}`}
            title="Subscript"
          >
            <SubscriptIcon className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* Text Color */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Text Color">
                <div className="flex flex-col items-center">
                  <Type className="w-4 h-4" />
                  <div className="w-4 h-1 bg-black mt-0.5 rounded" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <div className="grid grid-cols-3 gap-1 p-2">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => editor.chain().focus().setColor(color.value).run()}
                    className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => editor.chain().focus().unsetColor().run()}>
                Remove Color
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Highlight */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Highlight">
                <Highlighter className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <div className="grid grid-cols-3 gap-1 p-2">
                {highlightColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => editor.chain().focus().toggleHighlight({ color: color.value }).run()}
                    className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => editor.chain().focus().unsetHighlight().run()}>
                Remove Highlight
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* Alignment */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}`}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}`}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}`}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200' : ''}`}
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* Lists */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* Quote/Code */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
            title="Block Quote"
          >
            <Quote className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('codeBlock') ? 'bg-gray-200' : ''}`}
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* Link */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLinkDialog(true)}
            className={`h-8 w-8 p-0 ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4" />
          </Button>

          {/* Image */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowImageDialog(true)}
            className="h-8 w-8 p-0"
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>

          {/* Table */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${editor.isActive('table') ? 'bg-gray-200' : ''}`}
                title="Table"
              >
                <TableIcon className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setShowTableDialog(true)}>
                <Grid3X3 className="w-4 h-4 mr-2" /> Insert Table
              </DropdownMenuItem>
              {editor.isActive('table') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}>
                    <Columns className="w-4 h-4 mr-2" /> Add Column Before
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
                    <Columns className="w-4 h-4 mr-2" /> Add Column After
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Column
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}>
                    <RowsIcon className="w-4 h-4 mr-2" /> Add Row Before
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
                    <RowsIcon className="w-4 h-4 mr-2" /> Add Row After
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Row
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => editor.chain().focus().mergeCells().run()}>
                    <Merge className="w-4 h-4 mr-2" /> Merge Cells
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().splitCell().run()}>
                    <Split className="w-4 h-4 mr-2" /> Split Cell
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Table
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* Horizontal Rule */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="h-8 w-8 p-0"
            title="Horizontal Line"
          >
            <Minus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
            <DialogDescription>Enter the URL for the link</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>Cancel</Button>
            <Button onClick={addLink}>Insert Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
            <DialogDescription>Enter the image URL</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDialog(false)}>Cancel</Button>
            <Button onClick={addImage}>Insert Image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Dialog */}
      <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Table</DialogTitle>
            <DialogDescription>Choose table dimensions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="table-rows">Rows</Label>
                <Input
                  id="table-rows"
                  type="number"
                  min="1"
                  max="20"
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="table-cols">Columns</Label>
                <Input
                  id="table-cols"
                  type="number"
                  min="1"
                  max="10"
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTableDialog(false)}>Cancel</Button>
            <Button onClick={addTable}>Insert Table</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Default DRHP Template Content
const getDefaultDRHPContent = (boardType) => {
  if (boardType === 'sme') {
    return `
      <h1 style="text-align: center;">DRAFT RED HERRING PROSPECTUS</h1>
      <p style="text-align: center;"><strong>Dated: [Date]</strong></p>
      <p style="text-align: center;"><em>(The Draft Red Herring Prospectus will be updated upon filing with RoC)</em></p>
      <p style="text-align: center;">Please read Section 26 and 32 of the Companies Act, 2013</p>
      <p style="text-align: center;">100% Book Building Offer</p>
      <hr />
      
      <h2>[COMPANY NAME]</h2>
      <p><em>(Our Company was incorporated as "[Company Name]" under the Companies Act, 2013, pursuant to a certificate of incorporation dated [Date], issued by the Registrar of Companies, [Location]. For details of changes in registered office, see "History and Certain Corporate Matters" on page ___)</em></p>
      
      <p><strong>Registered Office:</strong> [Address]</p>
      <p><strong>Corporate Office:</strong> [Address]</p>
      <p><strong>Contact Person:</strong> [Name], Company Secretary and Compliance Officer</p>
      <p><strong>Telephone:</strong> [Phone]</p>
      <p><strong>E-mail:</strong> [Email]</p>
      <p><strong>Website:</strong> [Website]</p>
      <p><strong>Corporate Identity Number:</strong> [CIN]</p>
      
      <hr />
      
      <h2>PROMOTERS OF OUR COMPANY</h2>
      <p>[List of Promoters]</p>
      
      <hr />
      
      <h2>INITIAL PUBLIC OFFERING OF [NUMBER] EQUITY SHARES</h2>
      <p>Face Value of Rs. [___] each ("Equity Shares") of [Company Name] ("Company" or "Issuer") for cash at a price of Rs. [___] per Equity Share including a securities premium of Rs. [___] per Equity Share ("Offer Price"), aggregating up to Rs. [___] Lakhs* ("Offer").</p>
      
      <p>The Offer comprises:</p>
      <table>
        <thead>
          <tr>
            <th>Particulars</th>
            <th>No. of Equity Shares</th>
            <th>Amount (Rs. in Lakhs)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Fresh Issue</td>
            <td>[Number]</td>
            <td>[Amount]</td>
          </tr>
          <tr>
            <td>Offer for Sale</td>
            <td>[Number]</td>
            <td>[Amount]</td>
          </tr>
          <tr>
            <td><strong>Total Offer</strong></td>
            <td><strong>[Number]</strong></td>
            <td><strong>[Amount]</strong></td>
          </tr>
        </tbody>
      </table>
      
      <p>*The Offer has been authorized by the Board of Directors of our Company at their meeting held on [Date] and by the shareholders of our Company at their Extra-ordinary General Meeting held on [Date].</p>
      
      <hr />
      
      <h2>THE FACE VALUE OF EQUITY SHARES IS RS. [___] EACH</h2>
      <p><strong>THE PRICE BAND AND THE MINIMUM BID LOT WILL BE DECIDED BY OUR COMPANY IN CONSULTATION WITH THE BOOK RUNNING LEAD MANAGER AND WILL BE ADVERTISED IN ALL EDITIONS OF [NEWSPAPER 1] (A WIDELY CIRCULATED ENGLISH DAILY NEWSPAPER) AND ALL EDITIONS OF [NEWSPAPER 2] (A WIDELY CIRCULATED HINDI DAILY NEWSPAPER, HINDI ALSO BEING THE REGIONAL LANGUAGE IN THE PLACE WHERE OUR REGISTERED AND CORPORATE OFFICE IS LOCATED) AT LEAST TWO WORKING DAYS PRIOR TO THE BID/OFFER OPENING DATE AND SHALL BE MADE AVAILABLE TO BSE LIMITED ("BSE") FOR THE PURPOSE OF UPLOADING ON THEIR WEBSITE.</strong></p>
      
      <hr />
      
      <h2>RISK IN RELATION TO THE FIRST OFFER</h2>
      <p>This being the first public issue of Equity Shares of our Company, there has been no formal market for the Equity Shares of our Company. The face value of the Equity Shares is Rs. [___]. The Floor Price is [___] times the face value of the Equity Shares and the Cap Price is [___] times the face value of the Equity Shares. The Offer Price (as determined by our Company, in consultation with the Book Running Lead Manager, on the Pricing Date) should not be taken to be indicative of the market price of the Equity Shares after the Equity Shares are listed. No assurance can be given regarding an active or sustained trading in the Equity Shares nor regarding the price at which the Equity Shares will be traded after listing.</p>
      
      <hr />
      
      <h2>GENERAL RISK</h2>
      <p>Investments in equity and equity-related securities involve a degree of risk and investors should not invest any funds in the Offer unless they can afford to take the risk of losing their entire investment. Investors are advised to read the risk factors carefully before taking an investment decision in the Offer. For taking an investment decision, investors must rely on their own examination of our Company and the Offer, including the risks involved. The Equity Shares in the Offer have not been recommended or approved by the Securities and Exchange Board of India ("SEBI"), nor does SEBI guarantee the accuracy or adequacy of the contents of this Draft Red Herring Prospectus. Specific attention of the investors is invited to "Risk Factors" on page ___ of this Draft Red Herring Prospectus.</p>
      
      <hr />
      
      <h2>ISSUER'S AND SELLING SHAREHOLDERS' ABSOLUTE RESPONSIBILITY</h2>
      <p>Our Company, having made all reasonable inquiries, accepts responsibility for and confirms that this Draft Red Herring Prospectus contains all information with regard to our Company and the Offer, which is material in the context of the Offer, that the information contained in this Draft Red Herring Prospectus is true and correct in all material aspects and is not misleading in any material respect, that the opinions and intentions expressed herein are honestly held and that there are no other facts, the omission of which makes this Draft Red Herring Prospectus as a whole or any of such information or the expression of any such opinions or intentions misleading in any material respect.</p>
    `;
  } else {
    // Mainboard template
    return `
      <h1 style="text-align: center;">DRAFT RED HERRING PROSPECTUS</h1>
      <p style="text-align: center;"><strong>Dated: [Date]</strong></p>
      <p style="text-align: center;"><em>(The Draft Red Herring Prospectus will be updated upon filing with RoC)</em></p>
      <p style="text-align: center;">Please read Section 26 and 32 of the Companies Act, 2013</p>
      <p style="text-align: center;">100% Book Building Offer</p>
      <hr />
      
      <h2>[COMPANY NAME LIMITED]</h2>
      <p><em>(Our Company was originally incorporated as "[Company Name Private Limited]" under the Companies Act, [1956/2013], pursuant to a certificate of incorporation dated [Date], issued by the Registrar of Companies, [Location]. Subsequently, our Company was converted into a public limited company and the name of our Company was changed to "[Company Name Limited]" pursuant to a fresh certificate of incorporation consequent upon conversion to public limited company dated [Date] issued by the Registrar of Companies, [Location].)</em></p>
      
      <p><strong>Registered Office:</strong> [Full Address with PIN]</p>
      <p><strong>Corporate Office:</strong> [Full Address with PIN]</p>
      <p><strong>Contact Person:</strong> [Name], Company Secretary and Compliance Officer</p>
      <p><strong>Telephone:</strong> [Phone with STD Code]</p>
      <p><strong>E-mail:</strong> [Email]</p>
      <p><strong>Website:</strong> [Website URL]</p>
      <p><strong>Corporate Identity Number:</strong> [CIN]</p>
      
      <hr />
      
      <h2>PROMOTERS OF OUR COMPANY</h2>
      <p>[Promoter 1 Name]</p>
      <p>[Promoter 2 Name]</p>
      
      <hr />
      
      <h2>INITIAL PUBLIC OFFERING OF [NUMBER] EQUITY SHARES</h2>
      <p>Face Value of Rs. [___] each ("Equity Shares") of [Company Name Limited] ("Company" or "Issuer") for cash at a price of Rs. [___] per Equity Share (including a share premium of Rs. [___] per Equity Share) ("Offer Price") aggregating up to Rs. [___] Crores* ("Offer").</p>
      
      <p><strong>The Offer comprises of:</strong></p>
      
      <table>
        <thead>
          <tr>
            <th>Particulars</th>
            <th>No. of Equity Shares</th>
            <th>Offer Amount (Rs. in Crores)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Fresh Issue by our Company</td>
            <td>[Number]</td>
            <td>Up to Rs. [___]</td>
          </tr>
          <tr>
            <td>Offer for Sale by the Selling Shareholders</td>
            <td>Up to [Number]</td>
            <td>Up to Rs. [___]</td>
          </tr>
          <tr>
            <td><strong>Total</strong></td>
            <td><strong>Up to [Number]</strong></td>
            <td><strong>Up to Rs. [___]</strong></td>
          </tr>
        </tbody>
      </table>
      
      <p><em>* Subject to finalization of Basis of Allotment</em></p>
      
      <p>The Offer includes a reservation of up to [Number] Equity Shares, aggregating up to Rs. [___] Crores for eligible employees (the "Employee Reservation Portion"). The Offer less the Employee Reservation Portion is referred to as the "Net Offer".</p>
      
      <p>The Offer and the Net Offer will constitute [___]% and [___]% respectively of the post-Offer paid-up Equity Share capital of our Company.</p>
      
      <hr />
      
      <h2>PRICE BAND: Rs. [___] TO Rs. [___] PER EQUITY SHARE</h2>
      
      <p><strong>THE FACE VALUE OF THE EQUITY SHARES IS Rs. [___] EACH. THE FLOOR PRICE IS [___] TIMES THE FACE VALUE AND THE CAP PRICE IS [___] TIMES THE FACE VALUE OF THE EQUITY SHARES.</strong></p>
      
      <p>In terms of Rule 19(2)(b)(i) of the Securities Contracts (Regulation) Rules, 1957 ("SCRR"), this is an Offer for at least 25% of the post-Offer paid-up Equity Share capital of our Company. The Offer is being made through the Book Building Process, in terms of Rule 19(2)(b) of the SCRR read with Regulation 6(1) of the Securities and Exchange Board of India (Issue of Capital and Disclosure Requirements) Regulations, 2018, as amended ("SEBI ICDR Regulations"), wherein not more than 50% of the Net Offer shall be available for allocation on a proportionate basis to Qualified Institutional Buyers ("QIBs") (the "QIB Portion").</p>
      
      <hr />
      
      <h2>RISKS IN RELATION TO THE FIRST ISSUE</h2>
      <p>This being the first public issue of Equity Shares of our Company, there has been no formal market for the Equity Shares of our Company. The face value of the Equity Shares is Rs. [___]. The Floor Price is [___] times the face value and the Cap Price is [___] times the face value of the Equity Shares. The Offer Price (determined by our Company in consultation with the Book Running Lead Managers, on the Pricing Date) should not be taken to be indicative of the market price of the Equity Shares after the Equity Shares are listed. No assurance can be given regarding an active or sustained trading in the Equity Shares nor regarding the price at which the Equity Shares will be traded after listing.</p>
      
      <hr />
      
      <h2>GENERAL RISKS</h2>
      <p>Investments in equity and equity-related securities involve a degree of risk and investors should not invest any funds in the Offer unless they can afford to take the risk of losing their entire investment. Investors are advised to read the risk factors carefully before taking an investment decision in the Offer. For taking an investment decision, investors must rely on their own examination of our Company and the Offer, including the risks involved. The Equity Shares in the Offer have not been recommended or approved by the Securities and Exchange Board of India ("SEBI"), nor does SEBI guarantee the accuracy or adequacy of the contents of this Draft Red Herring Prospectus. Specific attention of the investors is invited to "Risk Factors" on page [___] of this Draft Red Herring Prospectus.</p>
      
      <hr />
      
      <h2>ISSUER'S AND SELLING SHAREHOLDERS' ABSOLUTE RESPONSIBILITY</h2>
      <p>Our Company, having made all reasonable inquiries, accepts responsibility for and confirms that this Draft Red Herring Prospectus contains all information with regard to our Company and the Offer, which is material in the context of the Offer, that the information contained in this Draft Red Herring Prospectus is true and correct in all material aspects and is not misleading in any material respect, that the opinions and intentions expressed herein are honestly held and that there are no other facts, the omission of which makes this Draft Red Herring Prospectus as a whole or any of such information or the expression of any such opinions or intentions misleading in any material respect. Further, each Selling Shareholder accepts responsibility for and confirms that only the statements specifically confirmed or undertaken by such Selling Shareholder in relation to the Offered Shares and itself in this Draft Red Herring Prospectus are true and correct in all material aspects and are not misleading in any material respect.</p>
      
      <hr />
      
      <h2>LISTING</h2>
      <p>The Equity Shares offered through the Red Herring Prospectus are proposed to be listed on BSE Limited ("BSE") and National Stock Exchange of India Limited ("NSE") (together referred to as the "Stock Exchanges"). Our Company has received 'in-principle' approvals from BSE and NSE for the listing of the Equity Shares pursuant to letters dated [Date] and [Date], respectively. For the purposes of the Offer, the Designated Stock Exchange shall be [BSE/NSE].</p>
    `;
  }
};

const DRHPOutput = ({ user, apiClient }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const boardFromUrl = searchParams.get('board');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState(boardFromUrl === 'mainboard' ? 'mainboard' : 'sme');
  const [lastSaved, setLastSaved] = useState(null);
  const [content, setContent] = useState({
    sme: '',
    mainboard: ''
  });
  
  // Import dialog state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useState(null);

  // Initialize TipTap Editor
  const smeEditor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'drhp-table',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start typing your DRHP content here...',
      }),
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Superscript,
      Subscript,
    ],
    content: content.sme || getDefaultDRHPContent('sme'),
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setContent(prev => ({ ...prev, sme: editor.getHTML() }));
    },
  });

  const mainboardEditor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'drhp-table',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start typing your DRHP content here...',
      }),
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Superscript,
      Subscript,
    ],
    content: content.mainboard || getDefaultDRHPContent('mainboard'),
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setContent(prev => ({ ...prev, mainboard: editor.getHTML() }));
    },
  });

  // Fetch project data and saved content
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, contentRes] = await Promise.all([
          apiClient.get(`/projects/${projectId}`),
          apiClient.get(`/projects/${projectId}/drhp-output`).catch(() => ({ data: null }))
        ]);
        
        setProject(projectRes.data);
        
        if (contentRes.data) {
          const savedContent = contentRes.data;
          setContent({
            sme: savedContent.sme_content || getDefaultDRHPContent('sme'),
            mainboard: savedContent.mainboard_content || getDefaultDRHPContent('mainboard')
          });
          setLastSaved(savedContent.updated_at);
          
          // Update editor content
          if (smeEditor && savedContent.sme_content) {
            smeEditor.commands.setContent(savedContent.sme_content);
          }
          if (mainboardEditor && savedContent.mainboard_content) {
            mainboardEditor.commands.setContent(savedContent.mainboard_content);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load DRHP data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [apiClient, projectId]);

  // Update editor content when content state changes (for initial load)
  useEffect(() => {
    if (smeEditor && content.sme && !smeEditor.getHTML().includes(content.sme.substring(0, 50))) {
      smeEditor.commands.setContent(content.sme);
    }
    if (mainboardEditor && content.mainboard && !mainboardEditor.getHTML().includes(content.mainboard.substring(0, 50))) {
      mainboardEditor.commands.setContent(content.mainboard);
    }
  }, [smeEditor, mainboardEditor, content]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const autoSave = setInterval(async () => {
      if (smeEditor || mainboardEditor) {
        try {
          await apiClient.post(`/projects/${projectId}/drhp-output`, {
            sme_content: smeEditor?.getHTML() || content.sme,
            mainboard_content: mainboardEditor?.getHTML() || content.mainboard
          });
          setLastSaved(new Date().toISOString());
        } catch (error) {
          console.error("Auto-save failed:", error);
        }
      }
    }, 30000);

    return () => clearInterval(autoSave);
  }, [smeEditor, mainboardEditor, apiClient, projectId, content]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.post(`/projects/${projectId}/drhp-output`, {
        sme_content: smeEditor?.getHTML() || content.sme,
        mainboard_content: mainboardEditor?.getHTML() || content.mainboard
      });
      setLastSaved(new Date().toISOString());
      toast.success("DRHP document saved successfully!");
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  const handleExportWord = async () => {
    const currentEditor = activeTab === 'sme' ? smeEditor : mainboardEditor;
    if (!currentEditor) return;

    toast.info("Preparing Word document...");
    try {
      const response = await apiClient.post(`/projects/${projectId}/drhp-output/export`, {
        format: 'docx',
        board_type: activeTab,
        content: currentEditor.getHTML()
      }, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DRHP_${activeTab.toUpperCase()}_${project?.company_name || 'Document'}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Word document exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export feature coming soon - Word generation in progress");
    }
  };

  const handleExportPDF = async () => {
    const currentEditor = activeTab === 'sme' ? smeEditor : mainboardEditor;
    if (!currentEditor) return;

    toast.info("Preparing PDF document...");
    try {
      const response = await apiClient.post(`/projects/${projectId}/drhp-output/export`, {
        format: 'pdf',
        board_type: activeTab,
        content: currentEditor.getHTML()
      }, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DRHP_${activeTab.toUpperCase()}_${project?.company_name || 'Document'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("PDF document exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export feature coming soon - PDF generation in progress");
    }
  };

  const handlePrint = () => {
    const currentEditor = activeTab === 'sme' ? smeEditor : mainboardEditor;
    if (!currentEditor) return;

    const printContent = currentEditor.getHTML();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DRHP - ${project?.company_name || 'Document'}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 24px; text-align: center; margin-bottom: 20px; }
            h2 { font-size: 18px; margin-top: 30px; border-bottom: 1px solid #000; padding-bottom: 5px; }
            h3 { font-size: 16px; margin-top: 20px; }
            p { text-align: justify; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #000; padding: 8px 12px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            hr { margin: 30px 0; border: none; border-top: 1px solid #000; }
            @media print {
              body { padding: 0; }
              @page { margin: 2cm; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Handle Word document import
  const handleImportWord = async () => {
    if (!importFile) {
      toast.error("Please select a Word document to import");
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await apiClient.post(
        `/projects/${projectId}/drhp-output/import?board_type=${activeTab}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const result = response.data;
      
      if (result.success) {
        // Update the editor content with the imported HTML
        const currentEditor = activeTab === 'sme' ? smeEditor : mainboardEditor;
        if (currentEditor) {
          currentEditor.commands.setContent(result.html_content);
        }
        
        // Update state
        setContent(prev => ({
          ...prev,
          [activeTab]: result.html_content
        }));
        
        setImportResult({
          success: true,
          filename: result.filename,
          fileSize: result.file_size,
          warnings: result.warnings || [],
          warningsCount: result.warnings_count || 0,
          imagesCount: result.images_count || 0
        });
        
        // Show success message with image count if any
        const imageMsg = result.images_count > 0 ? ` (${result.images_count} images extracted)` : '';
        toast.success(`DRHP document "${result.filename}" imported with full SEBI formatting preserved!${imageMsg}`);
        setLastSaved(new Date().toISOString());
      }
    } catch (error) {
      console.error("Import failed:", error);
      const errorMessage = error.response?.data?.detail || "Failed to import Word document";
      toast.error(errorMessage);
      setImportResult({
        success: false,
        error: errorMessage
      });
    } finally {
      setImporting(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.docx')) {
        toast.error("Please select a .docx file");
        return;
      }
      setImportFile(file);
      setImportResult(null);
    }
  };

  // Direct upload handler - immediately uploads and imports the file
  const handleDirectUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file extension - only .docx allowed
    if (!file.name.toLowerCase().endsWith('.docx')) {
      toast.error("Only Word documents (.docx) are allowed. Please select a valid file.");
      e.target.value = ''; // Reset input
      return;
    }
    
    // Validate file size - max 50MB
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size is 50MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      e.target.value = '';
      return;
    }

    setImporting(true);
    toast.info(`Uploading "${file.name}"... This may take a moment for large documents.`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post(
        `/projects/${projectId}/drhp-output/import?board_type=${activeTab}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const result = response.data;
      
      if (result.success) {
        // Update the editor content with the imported HTML
        const currentEditor = activeTab === 'sme' ? smeEditor : mainboardEditor;
        if (currentEditor) {
          currentEditor.commands.setContent(result.html_content);
        }
        
        // Update state
        setContent(prev => ({
          ...prev,
          [activeTab]: result.html_content
        }));
        
        setLastSaved(new Date().toISOString());
        
        // Show success with image and warning count
        const imageMsg = result.images_count > 0 ? `, ${result.images_count} images` : '';
        const warningMsg = result.warnings_count > 0 ? ` (${result.warnings_count} minor notes)` : '';
        toast.success(`DRHP document imported with full SEBI formatting preserved!${imageMsg}${warningMsg}`);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      const errorMessage = error.response?.data?.detail || "Failed to upload Word document";
      toast.error(errorMessage);
    } finally {
      setImporting(false);
      e.target.value = ''; // Reset input for next upload
    }
  };

  const resetImportDialog = () => {
    setShowImportDialog(false);
    setImportFile(null);
    setImportResult(null);
  };

  const currentEditor = activeTab === 'sme' ? smeEditor : mainboardEditor;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" />
            <p className="text-gray-500 text-sm">Loading DRHP Editor...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100" data-testid="drhp-output-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(`/project/${projectId}/command-center`)} 
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">DRHP Output</h1>
              <p className="text-xs text-gray-500">{project?.company_name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last saved: {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
            
            {/* Direct Upload Button - triggers file input directly */}
            <input
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleDirectUpload}
              className="hidden"
              id="direct-upload-input"
              disabled={importing}
            />
            <Button 
              variant="default"
              size="sm" 
              onClick={() => document.getElementById('direct-upload-input').click()}
              className="gap-2 bg-[#1DA1F2] hover:bg-[#1a8cd8]"
              data-testid="upload-docx-btn"
              disabled={importing}
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <FileUp className="w-4 h-4" />
                  Upload DOCX
                </>
              )}
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportWord}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Export as Word (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Tabs for SME vs Mainboard */}
        <div className="bg-white border-b border-gray-200 px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-12">
              <TabsTrigger value="sme" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                <Badge variant="outline" className="mr-2 bg-emerald-100 text-emerald-700 border-emerald-200">SME</Badge>
                SME Board DRHP
              </TabsTrigger>
              <TabsTrigger value="mainboard" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Badge variant="outline" className="mr-2 bg-blue-100 text-blue-700 border-blue-200">Main</Badge>
                Main Board DRHP
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <EditorToolbar editor={currentEditor} />
          
          {/* Editor Content */}
          <div className="flex-1 overflow-auto bg-gray-200 p-8">
            <div className="max-w-[850px] mx-auto bg-white shadow-lg rounded-sm min-h-[1100px]">
              <style>{`
                .ProseMirror {
                  padding: 60px 80px;
                  min-height: 1100px;
                  outline: none;
                  font-family: 'Times New Roman', Times, serif;
                  font-size: 12pt;
                  line-height: 1.6;
                }
                .ProseMirror h1 {
                  font-size: 18pt;
                  font-weight: bold;
                  margin-bottom: 16px;
                  text-align: center;
                }
                .ProseMirror h2 {
                  font-size: 14pt;
                  font-weight: bold;
                  margin-top: 24px;
                  margin-bottom: 12px;
                  border-bottom: 1px solid #000;
                  padding-bottom: 4px;
                }
                .ProseMirror h3 {
                  font-size: 12pt;
                  font-weight: bold;
                  margin-top: 18px;
                  margin-bottom: 8px;
                }
                .ProseMirror p {
                  margin-bottom: 12px;
                  text-align: justify;
                }
                .ProseMirror ul, .ProseMirror ol {
                  margin-left: 24px;
                  margin-bottom: 12px;
                }
                .ProseMirror li {
                  margin-bottom: 4px;
                }
                .ProseMirror blockquote {
                  border-left: 3px solid #ccc;
                  padding-left: 16px;
                  margin: 16px 0;
                  font-style: italic;
                  color: #555;
                }
                .ProseMirror hr {
                  border: none;
                  border-top: 1px solid #000;
                  margin: 24px 0;
                }
                .ProseMirror table {
                  border-collapse: collapse;
                  width: 100%;
                  margin: 16px 0;
                }
                .ProseMirror th, .ProseMirror td {
                  border: 1px solid #000;
                  padding: 8px 12px;
                  text-align: left;
                }
                .ProseMirror th {
                  background-color: #f5f5f5;
                  font-weight: bold;
                }
                .ProseMirror img {
                  max-width: 100%;
                  height: auto;
                }
                .ProseMirror .is-empty::before {
                  content: attr(data-placeholder);
                  color: #aaa;
                  pointer-events: none;
                  float: left;
                  height: 0;
                }
                .ProseMirror mark {
                  background-color: #fef08a;
                  padding: 0 2px;
                }
                .ProseMirror code {
                  background-color: #f5f5f5;
                  padding: 2px 4px;
                  border-radius: 3px;
                  font-family: monospace;
                  font-size: 11pt;
                }
                .ProseMirror pre {
                  background-color: #f5f5f5;
                  padding: 16px;
                  border-radius: 4px;
                  overflow-x: auto;
                  font-family: monospace;
                  font-size: 10pt;
                }
                .selectedCell {
                  background-color: #e3f2fd;
                }
                /* Enhanced Word document formatting preservation */
                .ProseMirror .document-title {
                  text-align: center;
                  font-size: 18pt;
                  font-weight: bold;
                }
                .ProseMirror .toc-heading {
                  font-size: 14pt;
                  font-weight: bold;
                  margin-top: 20px;
                }
                .ProseMirror .toc-1 {
                  margin-left: 0;
                  font-weight: normal;
                }
                .ProseMirror .toc-2 {
                  margin-left: 20px;
                }
                .ProseMirror .toc-3 {
                  margin-left: 40px;
                }
                .ProseMirror .list-paragraph {
                  margin-left: 36px;
                }
                .ProseMirror em.intense {
                  font-weight: bold;
                  font-style: italic;
                }
                .ProseMirror blockquote.intense {
                  border-left-width: 4px;
                  border-left-color: #1DA1F2;
                  background-color: #f0f9ff;
                }
                .ProseMirror .reference {
                  color: #666;
                  font-size: 10pt;
                }
                .ProseMirror .page-break {
                  border: none;
                  border-top: 2px dashed #ccc;
                  margin: 40px 0;
                  page-break-after: always;
                }
                /* Preserve exact spacing from Word */
                .ProseMirror p + p {
                  margin-top: 0;
                }
                .ProseMirror strong {
                  font-weight: bold;
                }
                .ProseMirror em {
                  font-style: italic;
                }
                .ProseMirror u {
                  text-decoration: underline;
                }
                .ProseMirror s {
                  text-decoration: line-through;
                }
                /* Table styling matching Word defaults */
                .ProseMirror table.drhp-table {
                  border-collapse: collapse;
                  width: 100%;
                  margin: 16px 0;
                  font-size: 11pt;
                }
                .ProseMirror table.drhp-table th,
                .ProseMirror table.drhp-table td {
                  border: 1px solid #000;
                  padding: 6px 10px;
                  vertical-align: top;
                }
                .ProseMirror table.drhp-table th {
                  background-color: #f0f0f0;
                  font-weight: bold;
                  text-align: left;
                }
              `}</style>
              
              {activeTab === 'sme' ? (
                <EditorContent editor={smeEditor} data-testid="sme-editor" />
              ) : (
                <EditorContent editor={mainboardEditor} data-testid="mainboard-editor" />
              )}
            </div>
            
            {/* Submit for Review Button - Bottom of Page */}
            <div className="mt-6 flex justify-center">
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 px-8 py-3 text-base shadow-lg"
                size="lg"
                onClick={handleSave}
                data-testid="submit-for-review-btn"
              >
                <Eye className="w-5 h-5 mr-2" />
                Submit for Review
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Import Word Document Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => !importing && (open ? setShowImportDialog(true) : resetImportDialog())}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="w-5 h-5 text-[#1DA1F2]" />
              Import Word Document
            </DialogTitle>
            <DialogDescription>
              Upload a .docx file to import its content into the {activeTab === 'sme' ? 'SME Board' : 'Main Board'} DRHP editor.
              The document structure, formatting, tables, and images will be preserved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Upload Zone */}
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                importFile 
                  ? 'border-emerald-300 bg-emerald-50' 
                  : 'border-gray-300 hover:border-[#1DA1F2] hover:bg-blue-50'
              }`}
            >
              <input
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileSelect}
                className="hidden"
                id="word-file-input"
                disabled={importing}
              />
              <label 
                htmlFor="word-file-input" 
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                {importFile ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{importFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(importFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <p className="text-xs text-emerald-600">Click to choose a different file</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-500">Word Document (.docx) up to 50MB</p>
                    </div>
                  </>
                )}
              </label>
            </div>

            {/* Import Result */}
            {importResult && (
              <div className={`rounded-lg p-4 ${importResult.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-start gap-3">
                  {importResult.success ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    {importResult.success ? (
                      <>
                        <p className="font-medium text-emerald-800">Import Successful!</p>
                        <p className="text-sm text-emerald-600 mt-1">
                          "{importResult.filename}" has been imported into the editor.
                        </p>
                        {importResult.warningsCount > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-amber-700 font-medium">
                              {importResult.warningsCount} conversion warning(s):
                            </p>
                            <ul className="text-xs text-amber-600 mt-1 list-disc list-inside max-h-20 overflow-auto">
                              {importResult.warnings.slice(0, 5).map((warning, i) => (
                                <li key={i}>{warning}</li>
                              ))}
                              {importResult.warnings.length > 5 && (
                                <li>...and {importResult.warnings.length - 5} more</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-red-800">Import Failed</p>
                        <p className="text-sm text-red-600 mt-1">{importResult.error}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">What gets imported:</p>
                  <ul className="mt-1 space-y-0.5 text-blue-700">
                    <li>• Text formatting (bold, italic, underline)</li>
                    <li>• Headings and paragraph styles</li>
                    <li>• Tables with full structure</li>
                    <li>• Images (embedded as base64)</li>
                    <li>• Lists (bullet and numbered)</li>
                  </ul>
                  <p className="mt-2 text-xs text-blue-600">
                    Note: Complex styling like exact fonts, colors, and page layouts may be simplified.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={resetImportDialog}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImportWord}
              disabled={!importFile || importing}
              className="bg-[#1DA1F2] hover:bg-[#1a8cd8]"
              data-testid="confirm-import-btn"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DRHPOutput;
