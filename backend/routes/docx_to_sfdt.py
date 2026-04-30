"""Pure-Python .docx -> SFDT converter (replaces the .NET Syncfusion sidecar).

Handles: paragraphs, character/paragraph formatting, headings, tables,
         multiple sections, images (base64-embedded), .txt fallback.
"""
import io
import json
import base64
import zipfile
import xml.etree.ElementTree as ET

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.text.paragraph import Paragraph
from docx.table import Table


def _pt(length_obj):
    try:
        return float(length_obj.pt)
    except Exception:
        return 0.0


def _align(alignment) -> str:
    return {
        WD_ALIGN_PARAGRAPH.LEFT: "Left",
        WD_ALIGN_PARAGRAPH.CENTER: "Center",
        WD_ALIGN_PARAGRAPH.RIGHT: "Right",
        WD_ALIGN_PARAGRAPH.JUSTIFY: "Justify",
        WD_ALIGN_PARAGRAPH.DISTRIBUTE: "Justify",
    }.get(alignment, "Left")


def _extract_images(file_bytes: bytes) -> dict:
    images: dict = {}
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
            rels_name = "word/_rels/document.xml.rels"
            if rels_name not in zf.namelist():
                return images
            root = ET.fromstring(zf.read(rels_name))
            ns = "http://schemas.openxmlformats.org/package/2006/relationships"
            for rel in root.findall(f"{{{ns}}}Relationship"):
                if "image" not in rel.get("Type", ""):
                    continue
                r_id = rel.get("Id")
                target = rel.get("Target", "")
                img_path = f"word/{target}" if not target.startswith("/") else target[1:]
                if img_path in zf.namelist():
                    raw = zf.read(img_path)
                    ext = target.rsplit(".", 1)[-1].lower()
                    mime = {"png": "image/png", "jpg": "image/jpeg",
                            "jpeg": "image/jpeg", "gif": "image/gif",
                            "bmp": "image/bmp"}.get(ext, "image/png")
                    images[r_id] = {
                        "base64": f"data:{mime};base64,{base64.b64encode(raw).decode()}",
                        "width": 100,
                        "height": 100,
                    }
    except Exception:
        pass
    return images


def _get_image_size(drawing_el) -> tuple:
    try:
        ns_wp = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
        extent = drawing_el.find(f"{{{ns_wp}}}inline/{{{ns_wp}}}extent")
        if extent is None:
            extent = drawing_el.find(f"{{{ns_wp}}}anchor/{{{ns_wp}}}extent")
        if extent is not None:
            w = int(extent.get("cx", 0)) / 12700
            h = int(extent.get("cy", 0)) / 12700
            return (round(w, 2), round(h, 2))
    except Exception:
        pass
    return (100.0, 100.0)


def _run_to_inline(run_el, images: dict) -> list:
    cf: dict = {}
    rpr = run_el.find(qn("w:rPr"))
    if rpr is not None:
        if rpr.find(qn("w:b")) is not None:
            cf["bold"] = True
        if rpr.find(qn("w:i")) is not None:
            cf["italic"] = True
        u_el = rpr.find(qn("w:u"))
        if u_el is not None and u_el.get(qn("w:val"), "none") not in ("none", ""):
            cf["underline"] = "Single"
        strike_el = rpr.find(qn("w:strike"))
        if strike_el is not None:
            cf["strikethrough"] = "SingleStrike"
        sz_el = rpr.find(qn("w:sz"))
        if sz_el is not None:
            hp = int(sz_el.get(qn("w:val"), 0))
            if hp:
                pt = hp / 2.0
                cf["fontSize"] = pt
                cf["fontSizeBidi"] = pt
        rfonts = rpr.find(qn("w:rFonts"))
        if rfonts is not None:
            name = (rfonts.get(qn("w:ascii")) or
                    rfonts.get(qn("w:hAnsi")) or
                    rfonts.get(qn("w:cs")))
            if name:
                cf["fontFamily"] = name
                cf["fontFamilyBidi"] = name
        color_el = rpr.find(qn("w:color"))
        if color_el is not None:
            val = color_el.get(qn("w:val"), "")
            if val and val.lower() not in ("auto", ""):
                cf["fontColor"] = f"#{val}ff"
        highlight_el = rpr.find(qn("w:highlight"))
        if highlight_el is not None:
            hval = highlight_el.get(qn("w:val"), "")
            if hval:
                cf["highlightColor"] = hval.capitalize()

    drawing = run_el.find(qn("w:drawing"))
    if drawing is not None:
        ns_a = "http://schemas.openxmlformats.org/drawingml/2006/main"
        ns_r = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
        blip = drawing.find(f".//{{{ns_a}}}blip")
        if blip is not None:
            r_id = blip.get(f"{{{ns_r}}}embed")
            if r_id and r_id in images:
                w, h = _get_image_size(drawing)
                img = images[r_id]
                return [{
                    "characterFormat": cf,
                    "imageString": img["base64"],
                    "width": w,
                    "height": h,
                    "isInlineImage": True,
                }]
        return []

    br_el = run_el.find(qn("w:br"))
    if br_el is not None:
        br_type = br_el.get(qn("w:type"), "")
        if br_type == "page":
            return [{"characterFormat": cf, "text": "\f"}]
        if br_type == "column":
            return [{"characterFormat": cf, "text": "\v"}]
        return [{"characterFormat": cf, "text": "\n"}]

    t_el = run_el.find(qn("w:t"))
    text = t_el.text if t_el is not None and t_el.text else ""
    return [{"characterFormat": cf, "text": text}]


def _para_format(p_el) -> dict:
    pf: dict = {"listFormat": {}}
    ppr = p_el.find(qn("w:pPr"))
    if ppr is None:
        return pf

    jc = ppr.find(qn("w:jc"))
    if jc is not None:
        val = jc.get(qn("w:val"), "left").lower()
        pf["textAlignment"] = {
            "left": "Left", "center": "Center",
            "right": "Right", "both": "Justify",
            "distribute": "Justify",
        }.get(val, "Left")

    ind = ppr.find(qn("w:ind"))
    if ind is not None:
        def tw(attr):
            v = ind.get(qn(attr))
            return round(int(v) / 20.0, 2) if v else 0
        left = tw("w:left")
        right = tw("w:right")
        first = tw("w:firstLine")
        hanging = tw("w:hanging")
        if left:
            pf["leftIndent"] = left
        if right:
            pf["rightIndent"] = right
        if first:
            pf["firstLineIndent"] = first
        elif hanging:
            pf["firstLineIndent"] = -hanging

    spacing = ppr.find(qn("w:spacing"))
    if spacing is not None:
        def sp(attr):
            v = spacing.get(qn(attr))
            return round(int(v) / 20.0, 2) if v else None
        before = sp("w:before")
        after = sp("w:after")
        line = spacing.get(qn("w:line"))
        line_rule = spacing.get(qn("w:lineRule"), "auto")
        if before is not None:
            pf["beforeSpacing"] = before
        if after is not None:
            pf["afterSpacing"] = after
        if line:
            line_val = int(line)
            if line_rule == "exact":
                pf["lineSpacing"] = round(line_val / 20.0, 4)
                pf["lineSpacingType"] = "Exactly"
            elif line_rule == "atLeast":
                pf["lineSpacing"] = round(line_val / 20.0, 4)
                pf["lineSpacingType"] = "AtLeast"
            else:
                pf["lineSpacing"] = round(line_val / 240.0, 4)
                pf["lineSpacingType"] = "Multiple"

    shd = ppr.find(qn("w:shd"))
    if shd is not None:
        fill = shd.get(qn("w:fill"), "")
        if fill and fill.lower() not in ("auto", "ffffff", ""):
            pf["backgroundColor"] = f"#{fill}ff"

    return pf


def _style_name(p_el) -> str:
    ppr = p_el.find(qn("w:pPr"))
    if ppr is not None:
        pstyle = ppr.find(qn("w:pStyle"))
        if pstyle is not None:
            raw = pstyle.get(qn("w:val"), "Normal")
            _map = {
                "Heading1": "Heading 1", "Heading2": "Heading 2",
                "Heading3": "Heading 3", "Heading4": "Heading 4",
                "Heading5": "Heading 5", "Heading6": "Heading 6",
                "BodyText": "Body Text", "ListParagraph": "List Paragraph",
                "TableParagraph": "Normal",
            }
            return _map.get(raw, raw)
    return "Normal"


def _convert_paragraph(p_el, images: dict) -> dict:
    style = _style_name(p_el)
    pf = _para_format(p_el)
    pf["styleName"] = style

    ppr = p_el.find(qn("w:pPr"))
    if ppr is not None:
        numpr = ppr.find(qn("w:numPr"))
        if numpr is not None:
            num_id_el = numpr.find(qn("w:numId"))
            ilvl_el = numpr.find(qn("w:ilvl"))
            if num_id_el is not None:
                num_id = int(num_id_el.get(qn("w:val"), 0))
                ilvl = int(ilvl_el.get(qn("w:val"), 0)) if ilvl_el is not None else 0
                if num_id > 0:
                    pf["listFormat"] = {"listId": num_id - 1, "listLevelNumber": ilvl}
                    if style == "Normal":
                        pf["styleName"] = "List Paragraph"

    inlines = []
    for child in p_el:
        tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
        if tag == "r":
            inlines.extend(_run_to_inline(child, images))
        elif tag == "hyperlink":
            for run_el in child.findall(qn("w:r")):
                inl_list = _run_to_inline(run_el, images)
                for inl in inl_list:
                    if "text" in inl:
                        cf = dict(inl.get("characterFormat", {}))
                        cf.setdefault("fontColor", "#0563C1ff")
                        cf.setdefault("underline", "Single")
                        inl["characterFormat"] = cf
                inlines.extend(inl_list)
        elif tag == "ins":
            for run_el in child.findall(qn("w:r")):
                inlines.extend(_run_to_inline(run_el, images))

    if not inlines:
        inlines = [{"characterFormat": {}, "text": ""}]

    return {
        "paragraphFormat": pf,
        "characterFormat": {},
        "inlines": inlines,
    }


def _convert_table(tbl_el, images: dict) -> dict:
    rows = []
    for tr_el in tbl_el.findall(qn("w:tr")):
        cells = []
        for tc_el in tr_el.findall(qn("w:tc")):
            cell_blocks = []
            for child in tc_el:
                tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
                if tag == "p":
                    cell_blocks.append(_convert_paragraph(child, images))
                elif tag == "tbl":
                    cell_blocks.append(_convert_table(child, images))
            if not cell_blocks:
                cell_blocks = [{"paragraphFormat": {"styleName": "Normal", "listFormat": {}},
                                "characterFormat": {}, "inlines": [{"characterFormat": {}, "text": ""}]}]

            tc_pr = tc_el.find(qn("w:tcPr"))
            col_span = 1
            bg_color = None
            v_merge_continue = False
            if tc_pr is not None:
                grid_span = tc_pr.find(qn("w:gridSpan"))
                if grid_span is not None:
                    col_span = int(grid_span.get(qn("w:val"), 1))
                v_merge = tc_pr.find(qn("w:vMerge"))
                if v_merge is not None and v_merge.get(qn("w:val"), "") == "":
                    v_merge_continue = True
                shd = tc_pr.find(qn("w:shd"))
                if shd is not None:
                    fill = shd.get(qn("w:fill"), "")
                    if fill and fill.lower() not in ("auto", "ffffff", ""):
                        bg_color = f"#{fill}ff"

            cell_fmt = {
                "columnSpan": col_span,
                "rowSpan": 1,
                "preferredWidth": 0,
                "preferredWidthType": "Auto",
                "verticalAlignment": "Top",
                "isSamePaddingAsTable": True,
            }
            if bg_color:
                cell_fmt["backgroundColor"] = bg_color
            if v_merge_continue:
                cell_fmt["rowSpan"] = 0

            cells.append({"blocks": cell_blocks, "cellFormat": cell_fmt, "columnIndex": 0})

        tr_pr = tr_el.find(qn("w:trPr"))
        is_header = False
        row_height = 0.0
        if tr_pr is not None:
            is_header = tr_pr.find(qn("w:tblHeader")) is not None
            trh = tr_pr.find(qn("w:trHeight"))
            if trh is not None:
                try:
                    row_height = round(int(trh.get(qn("w:val"), 0)) / 20.0, 2)
                except Exception:
                    pass

        rows.append({
            "rowFormat": {"allowBreakAcrossPages": True, "isHeader": is_header,
                          "height": row_height, "heightType": "AtLeast"},
            "cells": cells,
        })

    tbl_pr = tbl_el.find(qn("w:tblPr"))
    tbl_width = 0.0
    tbl_align = "Left"
    if tbl_pr is not None:
        tw = tbl_pr.find(qn("w:tblW"))
        if tw is not None:
            try:
                if tw.get(qn("w:type"), "auto") == "dxa":
                    tbl_width = round(int(tw.get(qn("w:val"), 0)) / 20.0, 2)
            except Exception:
                pass
        jc = tbl_pr.find(qn("w:jc"))
        if jc is not None:
            tbl_align = {"left": "Left", "center": "Center", "right": "Right"}.get(
                jc.get(qn("w:val"), "left").lower(), "Left")

    return {
        "rows": rows,
        "tableFormat": {
            "leftIndent": 0, "tableAlignment": tbl_align,
            "topMargin": 0, "rightMargin": 5.4, "leftMargin": 5.4, "bottomMargin": 0,
            "preferredWidth": tbl_width,
            "preferredWidthType": "Point" if tbl_width else "Auto",
            "allowAutoFit": True, "bidi": False,
        },
    }


def _section_format(sect_pr) -> dict:
    fmt = {
        "pageWidth": 612.0, "pageHeight": 792.0,
        "leftMargin": 72.0, "rightMargin": 72.0,
        "topMargin": 72.0, "bottomMargin": 72.0,
        "differentFirstPage": False, "differentOddAndEvenPages": False,
        "headerDistance": 36.0, "footerDistance": 36.0, "bidi": False,
    }
    if sect_pr is None:
        return fmt
    pg_sz = sect_pr.find(qn("w:pgSz"))
    if pg_sz is not None:
        w = pg_sz.get(qn("w:w"))
        h = pg_sz.get(qn("w:h"))
        if w:
            fmt["pageWidth"] = round(int(w) / 20.0, 2)
        if h:
            fmt["pageHeight"] = round(int(h) / 20.0, 2)
    pg_mar = sect_pr.find(qn("w:pgMar"))
    if pg_mar is not None:
        for attr, key in [("w:left", "leftMargin"), ("w:right", "rightMargin"),
                          ("w:top", "topMargin"), ("w:bottom", "bottomMargin"),
                          ("w:header", "headerDistance"), ("w:footer", "footerDistance")]:
            v = pg_mar.get(qn(attr))
            if v:
                try:
                    fmt[key] = round(int(v) / 20.0, 2)
                except Exception:
                    pass
    if sect_pr.find(qn("w:titlePg")) is not None:
        fmt["differentFirstPage"] = True
    return fmt


def _default_styles() -> list:
    return [
        {"name": "Normal", "type": "Paragraph",
         "paragraphFormat": {"lineSpacing": 1.0791666507720947, "lineSpacingType": "Multiple", "listFormat": {}},
         "characterFormat": {"fontSize": 11.0, "fontFamily": "Calibri", "fontSizeBidi": 11.0, "fontFamilyBidi": "Calibri"},
         "next": "Normal"},
        {"name": "Body Text", "type": "Paragraph",
         "paragraphFormat": {"lineSpacing": 1.0791666507720947, "lineSpacingType": "Multiple", "listFormat": {}},
         "characterFormat": {"fontSize": 11.0, "fontFamily": "Calibri", "fontSizeBidi": 11.0},
         "basedOn": "Normal", "next": "Body Text"},
        {"name": "Heading 1", "type": "Paragraph",
         "paragraphFormat": {"beforeSpacing": 12.0, "afterSpacing": 0.0, "outlineLevel": "Level1", "listFormat": {}},
         "characterFormat": {"fontSize": 16.0, "fontFamily": "Calibri Light", "fontColor": "#2F5496ff", "fontSizeBidi": 16.0},
         "basedOn": "Normal", "next": "Normal"},
        {"name": "Heading 2", "type": "Paragraph",
         "paragraphFormat": {"beforeSpacing": 2.0, "afterSpacing": 0.0, "outlineLevel": "Level2", "listFormat": {}},
         "characterFormat": {"fontSize": 13.0, "fontFamily": "Calibri Light", "fontColor": "#2F5496ff", "fontSizeBidi": 13.0},
         "basedOn": "Normal", "next": "Normal"},
        {"name": "Heading 3", "type": "Paragraph",
         "paragraphFormat": {"beforeSpacing": 2.0, "afterSpacing": 0.0, "outlineLevel": "Level3", "listFormat": {}},
         "characterFormat": {"fontSize": 12.0, "fontFamily": "Calibri Light", "fontColor": "#1F3864ff", "fontSizeBidi": 12.0},
         "basedOn": "Normal", "next": "Normal"},
        {"name": "Heading 4", "type": "Paragraph",
         "paragraphFormat": {"beforeSpacing": 2.0, "afterSpacing": 0.0, "outlineLevel": "Level4", "listFormat": {}},
         "characterFormat": {"fontSize": 11.0, "italic": True, "fontColor": "#2F5496ff", "fontSizeBidi": 11.0},
         "basedOn": "Normal", "next": "Normal"},
        {"name": "List Paragraph", "type": "Paragraph",
         "paragraphFormat": {"leftIndent": 36.0, "listFormat": {}},
         "characterFormat": {}, "basedOn": "Normal", "next": "List Paragraph"},
        {"name": "Table Paragraph", "type": "Paragraph",
         "paragraphFormat": {"listFormat": {}},
         "characterFormat": {}, "basedOn": "Normal", "next": "Table Paragraph"},
    ]


def docx_to_sfdt(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    images = _extract_images(file_bytes)

    sections = []
    current_blocks: list = []
    body_el = doc.element.body
    body_sect_pr = body_el.find(qn("w:sectPr"))

    for child in body_el:
        tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag

        if tag == "p":
            ppr = child.find(qn("w:pPr"))
            inline_sect = None
            if ppr is not None:
                inline_sect = ppr.find(qn("w:sectPr"))
            current_blocks.append(_convert_paragraph(child, images))
            if inline_sect is not None:
                sections.append({"sectionFormat": _section_format(inline_sect), "blocks": current_blocks})
                current_blocks = []
        elif tag == "tbl":
            current_blocks.append(_convert_table(child, images))

    if current_blocks or not sections:
        blocks = current_blocks if current_blocks else [
            {"paragraphFormat": {"styleName": "Normal", "listFormat": {}},
             "characterFormat": {}, "inlines": [{"characterFormat": {}, "text": ""}]}
        ]
        sections.append({"sectionFormat": _section_format(body_sect_pr), "blocks": blocks})

    sfdt = {
        "sections": sections,
        "characterFormat": {
            "bold": False, "italic": False, "fontSize": 11.0, "fontFamily": "Calibri",
            "underline": "None", "strikethrough": "None", "baselineAlignment": "Normal",
            "highlightColor": "NoColor", "fontColor": "#000000ff",
            "fontSizeBidi": 11.0, "fontFamilyBidi": "Calibri",
        },
        "paragraphFormat": {
            "leftIndent": 0, "rightIndent": 0, "firstLineIndent": 0,
            "textAlignment": "Left", "beforeSpacing": 0, "afterSpacing": 8.0,
            "lineSpacing": 1.0791666507720947, "lineSpacingType": "Multiple",
            "listFormat": {}, "bidi": False,
        },
        "defaultTabWidth": 36.0,
        "trackChanges": False, "enforcement": False,
        "hashValue": "", "saltValue": "",
        "formatting": False, "protectionType": "NoProtection",
        "styles": _default_styles(),
        "lists": [], "abstractLists": [],
    }
    return json.dumps(sfdt)


def txt_to_sfdt(text: str) -> str:
    blocks = [
        {"paragraphFormat": {"styleName": "Normal", "listFormat": {}},
         "characterFormat": {}, "inlines": [{"characterFormat": {}, "text": line}]}
        for line in text.splitlines()
    ] or [{"paragraphFormat": {"styleName": "Normal", "listFormat": {}},
           "characterFormat": {}, "inlines": [{"characterFormat": {}, "text": ""}]}]
    sfdt = {
        "sections": [{"sectionFormat": _section_format(None), "blocks": blocks}],
        "characterFormat": {"fontSize": 11.0, "fontFamily": "Calibri"},
        "paragraphFormat": {"textAlignment": "Left", "listFormat": {}},
        "defaultTabWidth": 36.0, "trackChanges": False, "enforcement": False,
        "hashValue": "", "saltValue": "", "formatting": False,
        "protectionType": "NoProtection",
        "styles": _default_styles(), "lists": [], "abstractLists": [],
    }
    return json.dumps(sfdt)
