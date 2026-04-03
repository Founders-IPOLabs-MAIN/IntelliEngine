"""
DRHP Document Import Module
Preserves SEBI-specific formatting including:
- Paragraph styles and hierarchies
- Numbered clause structures
- Custom indentation
- Text alignment
- Hyperlinks
- Images (stored as separate files)
"""

import io
import os
import uuid
import re
from typing import Optional, Dict, List, Tuple, Any
from docx import Document
from docx.shared import Pt, Inches, Emu, Twips
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml.ns import qn, nsmap
from docx.oxml import OxmlElement
from docx.table import Table
from docx.text.paragraph import Paragraph
from docx.text.run import Run
import logging

logger = logging.getLogger(__name__)

# SEBI DRHP specific style mappings
SEBI_STYLE_MAP = {
    # Standard headings
    'Title': {'tag': 'h1', 'class': 'drhp-title', 'align': 'center'},
    'Heading 1': {'tag': 'h1', 'class': 'drhp-h1'},
    'Heading 2': {'tag': 'h2', 'class': 'drhp-h2'},
    'Heading 3': {'tag': 'h3', 'class': 'drhp-h3'},
    'Heading 4': {'tag': 'h4', 'class': 'drhp-h4'},
    'Heading 5': {'tag': 'h5', 'class': 'drhp-h5'},
    'Heading 6': {'tag': 'h6', 'class': 'drhp-h6'},
    
    # SEBI specific styles
    'DRHP Section': {'tag': 'h2', 'class': 'drhp-section'},
    'DRHP Subsection': {'tag': 'h3', 'class': 'drhp-subsection'},
    'DRHP Clause': {'tag': 'p', 'class': 'drhp-clause'},
    'DRHP Sub-clause': {'tag': 'p', 'class': 'drhp-sub-clause'},
    'DRHP Para': {'tag': 'p', 'class': 'drhp-para'},
    
    # Table of Contents styles
    'TOC Heading': {'tag': 'h2', 'class': 'drhp-toc-heading'},
    'TOC 1': {'tag': 'p', 'class': 'drhp-toc-1'},
    'TOC 2': {'tag': 'p', 'class': 'drhp-toc-2'},
    'TOC 3': {'tag': 'p', 'class': 'drhp-toc-3'},
    'TOC 4': {'tag': 'p', 'class': 'drhp-toc-4'},
    
    # Legal/Regulatory styles
    'Legal': {'tag': 'p', 'class': 'drhp-legal'},
    'Disclaimer': {'tag': 'p', 'class': 'drhp-disclaimer'},
    'Risk Factor': {'tag': 'p', 'class': 'drhp-risk-factor'},
    'Material Contract': {'tag': 'p', 'class': 'drhp-material-contract'},
    
    # List styles
    'List Paragraph': {'tag': 'p', 'class': 'drhp-list-para'},
    'List Number': {'tag': 'p', 'class': 'drhp-list-number'},
    'List Bullet': {'tag': 'p', 'class': 'drhp-list-bullet'},
    
    # Quote styles
    'Quote': {'tag': 'blockquote', 'class': 'drhp-quote'},
    'Intense Quote': {'tag': 'blockquote', 'class': 'drhp-quote-intense'},
    
    # Table styles
    'Table Paragraph': {'tag': 'p', 'class': 'drhp-table-para'},
    
    # Default
    'Normal': {'tag': 'p', 'class': 'drhp-normal'},
    'Body Text': {'tag': 'p', 'class': 'drhp-body'},
    'Body Text 2': {'tag': 'p', 'class': 'drhp-body-2'},
    'Body Text 3': {'tag': 'p', 'class': 'drhp-body-3'},
}

# Alignment mapping
ALIGNMENT_MAP = {
    None: 'inherit',
    WD_ALIGN_PARAGRAPH.LEFT: 'left',
    WD_ALIGN_PARAGRAPH.CENTER: 'center',
    WD_ALIGN_PARAGRAPH.RIGHT: 'right',
    WD_ALIGN_PARAGRAPH.JUSTIFY: 'justify',
    WD_ALIGN_PARAGRAPH.DISTRIBUTE: 'justify',
}


class DRHPDocumentParser:
    """
    Parser for DRHP Word documents that preserves SEBI-specific formatting.
    """
    
    def __init__(self, file_content: bytes, project_id: str, board_type: str = 'sme'):
        self.file_content = file_content
        self.project_id = project_id
        self.board_type = board_type
        self.doc = None
        self.images: List[Dict] = []  # Store extracted images
        self.hyperlinks: Dict[str, str] = {}  # rId -> URL mapping
        self.numbering_state: Dict[int, int] = {}  # numId -> current count
        self.list_stack: List[Dict] = []  # Track nested lists
        self.warnings: List[str] = []
        
    def parse(self) -> Tuple[str, List[Dict], List[str]]:
        """
        Parse the document and return HTML content, images list, and warnings.
        """
        try:
            docx_buffer = io.BytesIO(self.file_content)
            self.doc = Document(docx_buffer)
            
            # Extract hyperlinks from relationships
            self._extract_hyperlinks()
            
            # Build HTML content
            html_parts = [self._get_css_styles()]
            html_parts.append('<div class="drhp-document">')
            
            # Process document body
            for element in self.doc.element.body:
                html = self._process_element(element)
                if html:
                    html_parts.append(html)
            
            # Close any open lists
            html_parts.extend(self._close_all_lists())
            
            html_parts.append('</div>')
            
            html_content = '\n'.join(html_parts)
            
            return html_content, self.images, self.warnings
            
        except Exception as e:
            logger.error(f"Error parsing DRHP document: {str(e)}")
            raise
    
    def _get_css_styles(self) -> str:
        """Return CSS styles for DRHP document formatting."""
        return '''<style>
/* DRHP Document Container - Legal Size (8.5 x 14 in) */
.drhp-document {
    font-family: 'Times New Roman', Times, serif;
    font-size: 10pt;
    line-height: 1.4;
    color: #000;
    max-width: 100%;
    overflow-x: hidden;
    word-wrap: break-word;
}

/* Title and Headings - SEBI Standard 10pt Bold */
.drhp-title {
    font-size: 12pt;
    font-weight: bold;
    text-align: center;
    margin: 16px 0 12px 0;
    text-transform: uppercase;
}
.drhp-h1, .drhp-section {
    font-size: 10pt;
    font-weight: bold;
    margin: 14px 0 8px 0;
    page-break-after: avoid;
}
.drhp-h2, .drhp-subsection {
    font-size: 10pt;
    font-weight: bold;
    margin: 12px 0 6px 0;
    page-break-after: avoid;
}
.drhp-h3 { 
    font-size: 10pt; 
    font-weight: bold; 
    font-style: italic;
    margin: 10px 0 6px 0; 
}
.drhp-h4 { font-size: 10pt; font-weight: bold; margin: 8px 0 4px 0; }
.drhp-h5 { font-size: 10pt; font-weight: bold; margin: 6px 0 4px 0; }
.drhp-h6 { font-size: 10pt; font-weight: bold; margin: 6px 0 4px 0; }

/* SEBI Specific Clause Styles */
.drhp-clause {
    margin: 6px 0;
    text-align: justify;
}
.drhp-sub-clause {
    margin: 4px 0 4px 24px;
    text-align: justify;
}
.drhp-para {
    margin: 6px 0;
    text-align: justify;
}

/* Legal and Risk Styles */
.drhp-legal {
    font-style: italic;
    margin: 8px 0;
    padding: 8px;
    border-left: 2px solid #333;
    background: #f9f9f9;
}
.drhp-disclaimer {
    font-size: 9pt;
    color: #444;
    margin: 8px 0;
    padding: 6px;
    border: 1px solid #ccc;
    background: #fafafa;
}
.drhp-risk-factor {
    margin: 8px 0 8px 16px;
    padding-left: 8px;
    border-left: 2px solid #d00;
}
.drhp-material-contract {
    margin: 6px 0;
    padding: 6px;
    background: #f5f5f5;
}

/* TOC Styles */
.drhp-toc-heading {
    font-size: 10pt;
    font-weight: bold;
    margin: 14px 0 8px 0;
    text-transform: uppercase;
}
.drhp-toc-1 { margin: 3px 0 3px 0; }
.drhp-toc-2 { margin: 2px 0 2px 18px; }
.drhp-toc-3 { margin: 2px 0 2px 36px; }
.drhp-toc-4 { margin: 2px 0 2px 54px; }

/* List Styles - SEBI DRHP Standard */
.drhp-list-para { 
    margin: 4px 0 4px 54px;
    text-indent: -18px;
}
.drhp-list-number { margin: 4px 0; }
.drhp-list-bullet { margin: 4px 0; }

/* Quote Styles */
.drhp-quote {
    margin: 12px 30px;
    padding: 8px 16px;
    border-left: 3px solid #666;
    font-style: italic;
    background: #f9f9f9;
}
.drhp-quote-intense {
    margin: 12px 30px;
    padding: 8px 16px;
    border-left: 3px solid #1DA1F2;
    font-style: italic;
    background: #f0f9ff;
    font-weight: 500;
}

/* Body Text - SEBI Standard */
.drhp-normal, .drhp-body {
    margin: 6px 0;
    text-align: justify;
    font-size: 10pt;
}
.drhp-body-2 { margin: 4px 0 4px 18px; }
.drhp-body-3 { margin: 4px 0 4px 36px; }

/* Table Paragraph Style */
.drhp-table-para {
    margin: 2px 0;
    text-align: center;
    font-size: 9pt;
}

/* Table Styles - CONSTRAINED TO PAGE WIDTH */
.drhp-table {
    width: 100% !important;
    max-width: 100% !important;
    table-layout: fixed;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 9pt;
    overflow: hidden;
    word-wrap: break-word;
}
.drhp-table th, .drhp-table td {
    border: 1px solid #000;
    padding: 4px 6px;
    vertical-align: top;
    text-align: left;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 200px;
}
.drhp-table th {
    background-color: #f0f0f0;
    font-weight: bold;
    text-align: center;
}
.drhp-table tr:nth-child(even) td {
    background-color: #fafafa;
}

/* Numbered Lists - SEBI Format */
.drhp-numbered-list {
    list-style: none;
    padding-left: 0;
    margin: 6px 0;
    counter-reset: item;
}
.drhp-numbered-list > li {
    counter-increment: item;
    margin: 4px 0;
    padding-left: 30px;
    position: relative;
}
.drhp-numbered-list > li::before {
    content: counter(item) ".";
    position: absolute;
    left: 0;
    font-weight: normal;
}
.drhp-numbered-list.level-2 > li::before { content: "(" counter(item, lower-alpha) ")"; }
.drhp-numbered-list.level-3 > li::before { content: "(" counter(item, lower-roman) ")"; }
.drhp-numbered-list.level-4 > li::before { content: counter(item, upper-alpha) "."; }

/* Bullet Lists */
.drhp-bullet-list {
    list-style: disc;
    margin: 6px 0 6px 30px;
}
.drhp-bullet-list.level-2 { list-style: circle; margin-left: 45px; }
.drhp-bullet-list.level-3 { list-style: square; margin-left: 60px; }

/* Image Styles - CONSTRAINED */
.drhp-image {
    max-width: 100%;
    height: auto;
    margin: 8px 0;
    display: block;
}
.drhp-image-center { margin-left: auto; margin-right: auto; }
.drhp-image-caption {
    font-size: 10pt;
    text-align: center;
    color: #666;
    margin-top: 4px;
}

/* Hyperlink Styles */
.drhp-link {
    color: #1DA1F2;
    text-decoration: underline;
}
.drhp-bookmark {
    color: inherit;
    text-decoration: none;
}

/* Page Break */
.drhp-page-break {
    page-break-before: always;
    border-top: 2px dashed #ccc;
    margin: 30px 0;
    height: 0;
}

/* Spacing Preservation */
.drhp-space-before { margin-top: var(--space-before, 0); }
.drhp-space-after { margin-bottom: var(--space-after, 0); }
</style>'''
    
    def _extract_hyperlinks(self):
        """Extract hyperlinks from document relationships."""
        try:
            # Get the main document part
            main_part = self.doc.part
            
            # Extract external hyperlinks
            for rel in main_part.rels.values():
                if "hyperlink" in rel.reltype:
                    self.hyperlinks[rel.rId] = rel.target_ref
        except Exception as e:
            self.warnings.append(f"Could not extract hyperlinks: {str(e)}")
    
    def _process_element(self, element) -> str:
        """Process a document element and return HTML."""
        tag = element.tag
        
        if tag.endswith('}p'):
            return self._process_paragraph(element)
        elif tag.endswith('}tbl'):
            return self._process_table(element)
        elif tag.endswith('}sectPr'):
            # Section properties - check for page break
            return self._process_section_break(element)
        
        return ''
    
    def _process_paragraph(self, p_element) -> str:
        """Process a paragraph element with full formatting preservation."""
        # Find the corresponding Paragraph object
        para = None
        for p in self.doc.paragraphs:
            if p._element is p_element:
                para = p
                break
        
        if para is None:
            # Try to create a Paragraph from the element directly
            para = Paragraph(p_element, self.doc)
        
        # Check for page break
        if self._has_page_break(p_element):
            return '<hr class="drhp-page-break">'
        
        # Get style information
        style_name = para.style.name if para.style else 'Normal'
        style_info = SEBI_STYLE_MAP.get(style_name, SEBI_STYLE_MAP.get('Normal'))
        
        # Get paragraph formatting
        p_format = para.paragraph_format
        
        # Build inline styles
        inline_styles = []
        
        # Text alignment
        alignment = self._get_alignment(p_format.alignment, para.style)
        if alignment and alignment != 'inherit':
            inline_styles.append(f'text-align: {alignment}')
        
        # Indentation
        left_indent = self._get_indent_value(p_format.left_indent, para.style, 'left_indent')
        if left_indent:
            inline_styles.append(f'margin-left: {left_indent}px')
        
        right_indent = self._get_indent_value(p_format.right_indent, para.style, 'right_indent')
        if right_indent:
            inline_styles.append(f'margin-right: {right_indent}px')
        
        first_line = self._get_indent_value(p_format.first_line_indent, para.style, 'first_line_indent')
        if first_line:
            inline_styles.append(f'text-indent: {first_line}px')
        
        # Spacing
        space_before = self._get_spacing_value(p_format.space_before, para.style, 'space_before')
        if space_before:
            inline_styles.append(f'margin-top: {space_before}px')
        
        space_after = self._get_spacing_value(p_format.space_after, para.style, 'space_after')
        if space_after:
            inline_styles.append(f'margin-bottom: {space_after}px')
        
        # Line spacing
        line_spacing = self._get_line_spacing(p_format, para.style)
        if line_spacing:
            inline_styles.append(f'line-height: {line_spacing}')
        
        # Check for numbering
        numbering_info = self._get_numbering_info(p_element)
        
        # Process runs (text with formatting)
        content_html = self._process_runs(para)
        
        # Handle empty paragraphs
        if not content_html.strip():
            content_html = '&nbsp;'
        
        # Build the HTML element
        tag = style_info['tag']
        css_class = style_info['class']
        
        # Handle numbered/bulleted lists
        if numbering_info:
            return self._process_list_item(content_html, numbering_info, inline_styles, css_class)
        
        # Close any open lists if we're not in a list
        list_close_html = self._close_lists_if_needed(None)
        
        style_attr = f' style="{"; ".join(inline_styles)}"' if inline_styles else ''
        class_attr = f' class="{css_class}"' if css_class else ''
        
        return f'{list_close_html}<{tag}{class_attr}{style_attr}>{content_html}</{tag}>'
    
    def _process_runs(self, para: Paragraph) -> str:
        """Process all runs and hyperlinks in a paragraph preserving character formatting."""
        html_parts = []
        p_element = para._element
        
        # Iterate over all children in order (runs and hyperlinks)
        for child in p_element:
            tag_name = child.tag.split('}')[-1] if '}' in child.tag else child.tag
            
            if tag_name == 'r':  # Regular run
                run_html = self._process_run_element(child)
                if run_html:
                    html_parts.append(run_html)
            elif tag_name == 'hyperlink':  # Hyperlink
                link_html = self._process_hyperlink_element(child)
                if link_html:
                    html_parts.append(link_html)
        
        return ''.join(html_parts)
    
    def _process_run_element(self, r_element) -> str:
        """Process a single run element."""
        # Get text from all w:t elements
        text_parts = []
        for t in r_element.findall('.//' + qn('w:t')):
            if t.text:
                text_parts.append(t.text)
        
        text = ''.join(text_parts)
        if not text:
            return ''
        
        text = self._escape_html(text)
        
        # Get run properties
        rPr = r_element.find(qn('w:rPr'))
        
        # Build formatting tags
        tags_open = []
        tags_close = []
        run_styles = []
        
        if rPr is not None:
            # Bold
            bold = rPr.find(qn('w:b'))
            if bold is not None and bold.get(qn('w:val'), 'true') != 'false':
                tags_open.append('<strong>')
                tags_close.insert(0, '</strong>')
            
            # Italic
            italic = rPr.find(qn('w:i'))
            if italic is not None and italic.get(qn('w:val'), 'true') != 'false':
                tags_open.append('<em>')
                tags_close.insert(0, '</em>')
            
            # Underline
            underline = rPr.find(qn('w:u'))
            if underline is not None:
                u_val = underline.get(qn('w:val'), 'single')
                if u_val != 'none':
                    tags_open.append('<u>')
                    tags_close.insert(0, '</u>')
            
            # Strikethrough
            strike = rPr.find(qn('w:strike'))
            if strike is not None and strike.get(qn('w:val'), 'true') != 'false':
                tags_open.append('<s>')
                tags_close.insert(0, '</s>')
            
            # Superscript
            vert_align = rPr.find(qn('w:vertAlign'))
            if vert_align is not None:
                va_val = vert_align.get(qn('w:val'))
                if va_val == 'superscript':
                    tags_open.append('<sup>')
                    tags_close.insert(0, '</sup>')
                elif va_val == 'subscript':
                    tags_open.append('<sub>')
                    tags_close.insert(0, '</sub>')
            
            # Font size
            sz = rPr.find(qn('w:sz'))
            if sz is not None:
                size_val = sz.get(qn('w:val'))
                if size_val:
                    size_pt = int(size_val) / 2  # Half-points to points
                    run_styles.append(f'font-size: {size_pt}pt')
            
            # Font color
            color = rPr.find(qn('w:color'))
            if color is not None:
                color_val = color.get(qn('w:val'))
                if color_val and color_val != 'auto':
                    run_styles.append(f'color: #{color_val}')
            
            # Highlight
            highlight = rPr.find(qn('w:highlight'))
            if highlight is not None:
                hl_val = highlight.get(qn('w:val'))
                highlight_colors = {
                    'yellow': '#ffff00', 'green': '#00ff00', 'cyan': '#00ffff',
                    'magenta': '#ff00ff', 'blue': '#0000ff', 'red': '#ff0000',
                    'darkBlue': '#000080', 'darkCyan': '#008080', 'darkGreen': '#008000',
                    'darkMagenta': '#800080', 'darkRed': '#800000', 'darkYellow': '#808000',
                    'lightGray': '#c0c0c0', 'darkGray': '#808080', 'black': '#000000'
                }
                if hl_val in highlight_colors:
                    run_styles.append(f'background-color: {highlight_colors[hl_val]}')
        
        # Build HTML
        style_attr = f' style="{"; ".join(run_styles)}"' if run_styles else ''
        
        if style_attr:
            return f'{"".join(tags_open)}<span{style_attr}>{text}</span>{"".join(tags_close)}'
        else:
            return f'{"".join(tags_open)}{text}{"".join(tags_close)}'
    
    def _process_hyperlink_element(self, hl_element) -> str:
        """Process a hyperlink element."""
        r_id = hl_element.get(qn('r:id'))
        anchor = hl_element.get(qn('w:anchor'))
        
        # Get the text and formatting from runs inside the hyperlink
        content_parts = []
        for r in hl_element.findall('.//' + qn('w:r')):
            run_html = self._process_run_element(r)
            if run_html:
                content_parts.append(run_html)
        
        content = ''.join(content_parts)
        if not content:
            return ''
        
        # Build the link
        if r_id and r_id in self.hyperlinks:
            url = self.hyperlinks[r_id]
            return f'<a href="{self._escape_html(url)}" class="drhp-link" target="_blank">{content}</a>'
        elif anchor:
            return f'<a href="#{self._escape_html(anchor)}" class="drhp-bookmark">{content}</a>'
        else:
            return content
    
    def _process_hyperlinks_in_paragraph(self, para: Paragraph, current_html: str) -> str:
        """Process hyperlinks within a paragraph - DEPRECATED, handled in _process_runs."""
        # This method is no longer used since hyperlinks are processed inline
        return current_html
    
    def _get_numbering_info(self, p_element) -> Optional[Dict]:
        """Extract numbering information from paragraph XML."""
        try:
            pPr = p_element.find(qn('w:pPr'))
            if pPr is None:
                return None
            
            numPr = pPr.find(qn('w:numPr'))
            if numPr is None:
                return None
            
            ilvl_elem = numPr.find(qn('w:ilvl'))
            numId_elem = numPr.find(qn('w:numId'))
            
            if ilvl_elem is None or numId_elem is None:
                return None
            
            level = int(ilvl_elem.get(qn('w:val'), 0))
            num_id = int(numId_elem.get(qn('w:val'), 0))
            
            # Determine if it's a bullet or numbered list
            is_bullet = self._is_bullet_list(num_id)
            
            return {
                'level': level,
                'numId': num_id,
                'is_bullet': is_bullet
            }
        except Exception as e:
            self.warnings.append(f"Error getting numbering info: {str(e)}")
            return None
    
    def _is_bullet_list(self, num_id: int) -> bool:
        """Determine if a numbering ID represents a bullet list."""
        try:
            # Check the numbering definitions in the document
            numbering_part = self.doc.part.numbering_part
            if numbering_part is None:
                return False
            
            # This is a simplified check - in reality, you'd need to
            # look at the abstractNum definition
            # For now, assume even numIds are numbered, odd are bullets
            return num_id % 2 == 1
        except Exception:
            return False
    
    def _process_list_item(self, content: str, numbering_info: Dict, 
                          inline_styles: List[str], css_class: str) -> str:
        """Process a list item with proper nesting."""
        level = numbering_info['level']
        is_bullet = numbering_info['is_bullet']
        num_id = numbering_info['numId']
        
        html_parts = []
        
        # Determine if we need to open/close lists
        current_level = len(self.list_stack)
        
        # Close lists if we're going up levels
        while current_level > level + 1:
            closed = self.list_stack.pop()
            html_parts.append(f'</li></{closed["tag"]}>')
            current_level -= 1
        
        # Open new lists if we're going down levels
        while current_level <= level:
            list_type = 'ul' if is_bullet else 'ol'
            list_class = f'drhp-{"bullet" if is_bullet else "numbered"}-list'
            if current_level > 0:
                list_class += f' level-{current_level + 1}'
            
            self.list_stack.append({
                'tag': list_type,
                'level': current_level,
                'numId': num_id
            })
            
            html_parts.append(f'<{list_type} class="{list_class}">')
            current_level += 1
        
        # Close previous list item if at same level
        if self.list_stack and len(self.list_stack) == level + 1:
            # Check if we're continuing same list or starting new
            if self.list_stack[-1].get('has_item'):
                html_parts.append('</li>')
        
        # Mark that this list level has an item
        if self.list_stack:
            self.list_stack[-1]['has_item'] = True
        
        # Add the list item
        style_attr = f' style="{"; ".join(inline_styles)}"' if inline_styles else ''
        html_parts.append(f'<li{style_attr}>{content}')
        
        return ''.join(html_parts)
    
    def _close_lists_if_needed(self, target_level: Optional[int]) -> str:
        """Close lists down to a target level."""
        html_parts = []
        target = target_level if target_level is not None else -1
        
        while len(self.list_stack) > target + 1:
            closed = self.list_stack.pop()
            if closed.get('has_item'):
                html_parts.append('</li>')
            html_parts.append(f'</{closed["tag"]}>')
        
        return ''.join(html_parts)
    
    def _close_all_lists(self) -> List[str]:
        """Close all open lists."""
        html_parts = []
        while self.list_stack:
            closed = self.list_stack.pop()
            if closed.get('has_item'):
                html_parts.append('</li>')
            html_parts.append(f'</{closed["tag"]}>')
        return html_parts
    
    def _process_table(self, tbl_element) -> str:
        """Process a table element."""
        html_parts = ['<table class="drhp-table">']
        
        # Find all rows
        rows = tbl_element.findall('.//' + qn('w:tr'))
        
        for row_idx, row in enumerate(rows):
            html_parts.append('<tr>')
            
            # Find all cells in the row
            cells = row.findall('.//' + qn('w:tc'))
            
            for cell in cells:
                # Determine if header cell (first row typically)
                tag = 'th' if row_idx == 0 else 'td'
                
                # Get cell content
                cell_content = []
                for p in cell.findall('.//' + qn('w:p')):
                    para = Paragraph(p, self.doc)
                    cell_content.append(self._process_runs(para))
                
                # Get cell properties for colspan/rowspan
                tc_pr = cell.find(qn('w:tcPr'))
                attrs = ''
                
                if tc_pr is not None:
                    # Column span
                    grid_span = tc_pr.find(qn('w:gridSpan'))
                    if grid_span is not None:
                        colspan = grid_span.get(qn('w:val'))
                        if colspan and int(colspan) > 1:
                            attrs += f' colspan="{colspan}"'
                    
                    # Row span (vertical merge)
                    v_merge = tc_pr.find(qn('w:vMerge'))
                    if v_merge is not None:
                        merge_val = v_merge.get(qn('w:val'))
                        if merge_val == 'restart':
                            # Count merged cells
                            pass  # Complex - would need to count ahead
                
                content = '<br>'.join(cell_content) if cell_content else '&nbsp;'
                html_parts.append(f'<{tag}{attrs}>{content}</{tag}>')
            
            html_parts.append('</tr>')
        
        html_parts.append('</table>')
        return '\n'.join(html_parts)
    
    def _process_section_break(self, sect_pr) -> str:
        """Process section properties for page breaks."""
        # Check for page break type
        type_elem = sect_pr.find(qn('w:type'))
        if type_elem is not None:
            break_type = type_elem.get(qn('w:val'))
            if break_type in ('nextPage', 'oddPage', 'evenPage'):
                return '<hr class="drhp-page-break">'
        return ''
    
    def _has_page_break(self, p_element) -> bool:
        """Check if paragraph has a page break."""
        try:
            # Check for page break in runs
            for br in p_element.findall('.//' + qn('w:br')):
                break_type = br.get(qn('w:type'))
                if break_type == 'page':
                    return True
            
            # Check paragraph properties
            pPr = p_element.find(qn('w:pPr'))
            if pPr is not None:
                page_break_before = pPr.find(qn('w:pageBreakBefore'))
                if page_break_before is not None:
                    return True
        except Exception:
            pass
        return False
    
    def _get_alignment(self, alignment, style) -> str:
        """Get text alignment, falling back to style default."""
        if alignment is not None:
            return ALIGNMENT_MAP.get(alignment, 'inherit')
        
        # Try to get from style
        if style and style.paragraph_format:
            style_align = style.paragraph_format.alignment
            if style_align is not None:
                return ALIGNMENT_MAP.get(style_align, 'inherit')
        
        return 'inherit'
    
    def _get_indent_value(self, indent, style, attr_name: str) -> Optional[float]:
        """Get indentation value in pixels."""
        if indent is not None:
            return self._emu_to_px(indent)
        
        # Try to get from style
        if style and style.paragraph_format:
            style_indent = getattr(style.paragraph_format, attr_name, None)
            if style_indent is not None:
                return self._emu_to_px(style_indent)
        
        return None
    
    def _get_spacing_value(self, spacing, style, attr_name: str) -> Optional[float]:
        """Get spacing value in pixels."""
        if spacing is not None:
            return self._emu_to_px(spacing)
        
        # Try to get from style
        if style and style.paragraph_format:
            style_spacing = getattr(style.paragraph_format, attr_name, None)
            if style_spacing is not None:
                return self._emu_to_px(style_spacing)
        
        return None
    
    def _get_line_spacing(self, p_format, style) -> Optional[str]:
        """Get line spacing value."""
        line_spacing = p_format.line_spacing
        line_spacing_rule = p_format.line_spacing_rule
        
        if line_spacing is None and style and style.paragraph_format:
            line_spacing = style.paragraph_format.line_spacing
            line_spacing_rule = style.paragraph_format.line_spacing_rule
        
        if line_spacing is None:
            return None
        
        if line_spacing_rule == WD_LINE_SPACING.SINGLE:
            return '1'
        elif line_spacing_rule == WD_LINE_SPACING.ONE_POINT_FIVE:
            return '1.5'
        elif line_spacing_rule == WD_LINE_SPACING.DOUBLE:
            return '2'
        elif line_spacing_rule == WD_LINE_SPACING.EXACTLY:
            return f'{self._emu_to_px(line_spacing)}px'
        elif line_spacing_rule == WD_LINE_SPACING.MULTIPLE:
            return str(line_spacing)
        
        return None
    
    def _emu_to_px(self, value) -> float:
        """Convert EMU/Twips/Pt to pixels."""
        if value is None:
            return 0
        
        # python-docx returns values as Emu, Pt, or similar objects
        try:
            if hasattr(value, 'pt'):
                return value.pt * 1.333  # pt to px
            elif hasattr(value, 'inches'):
                return value.inches * 96  # inches to px at 96 DPI
            elif hasattr(value, 'emu'):
                return value.emu / 914400 * 96  # EMU to px
            elif isinstance(value, (int, float)):
                # Assume it's in EMUs
                return value / 914400 * 96
        except Exception:
            pass
        return 0
    
    def _escape_html(self, text: str) -> str:
        """Escape HTML special characters."""
        if not text:
            return ''
        return (text
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;')
            .replace("'", '&#39;'))


class DRHPImageExtractor:
    """
    Extract and store images from DRHP documents as separate files.
    """
    
    def __init__(self, doc: Document, project_id: str, board_type: str, db, fs_bucket):
        self.doc = doc
        self.project_id = project_id
        self.board_type = board_type
        self.db = db
        self.fs_bucket = fs_bucket
        self.extracted_images: List[Dict] = []
    
    async def extract_and_store_images(self) -> List[Dict]:
        """
        Extract all images from the document and store them in GridFS.
        Returns a list of image metadata with URLs.
        """
        try:
            # Get all image parts from the document
            for rel in self.doc.part.rels.values():
                if "image" in rel.reltype:
                    image_part = rel.target_part
                    
                    # Get image data
                    image_data = image_part.blob
                    content_type = image_part.content_type
                    
                    # Generate unique filename
                    ext = self._get_extension(content_type)
                    image_id = str(uuid.uuid4())
                    filename = f"drhp_{self.project_id}_{self.board_type}_{image_id}{ext}"
                    
                    # Store in GridFS
                    file_id = await self.fs_bucket.upload_from_stream(
                        filename,
                        io.BytesIO(image_data),
                        metadata={
                            "project_id": self.project_id,
                            "board_type": self.board_type,
                            "content_type": content_type,
                            "rel_id": rel.rId,
                            "original_name": getattr(image_part, 'partname', filename)
                        }
                    )
                    
                    # Build URL for the image
                    image_url = f"/api/projects/{self.project_id}/drhp-images/{file_id}"
                    
                    self.extracted_images.append({
                        "rel_id": rel.rId,
                        "file_id": str(file_id),
                        "filename": filename,
                        "url": image_url,
                        "content_type": content_type,
                        "size": len(image_data)
                    })
        
        except Exception as e:
            logger.error(f"Error extracting images: {str(e)}")
        
        return self.extracted_images
    
    def _get_extension(self, content_type: str) -> str:
        """Get file extension from content type."""
        ext_map = {
            'image/png': '.png',
            'image/jpeg': '.jpg',
            'image/gif': '.gif',
            'image/bmp': '.bmp',
            'image/tiff': '.tiff',
            'image/webp': '.webp',
            'image/svg+xml': '.svg',
        }
        return ext_map.get(content_type, '.png')


def replace_images_with_urls(html_content: str, images: List[Dict]) -> str:
    """
    Replace base64 image data URIs with actual URLs.
    This is called after images are stored.
    """
    # This function would be used if we were still embedding images as base64
    # With the new approach, images are referenced by URL from the start
    return html_content
