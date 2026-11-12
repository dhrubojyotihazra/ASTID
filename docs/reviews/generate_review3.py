# -*- coding: utf-8 -*-
import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_margins(cell, top=25, bottom=25, left=40, right=40):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_shading(cell, color_hex):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shd)

def set_table_borders(table, color="CCCCCC"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:right w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def set_signature_borders(table):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        f'<w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        f'<w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        f'<w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        f'<w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        f'<w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def build_review3():
    doc = docx.Document()
    
    # Configure A4 Page Margins
    for sec in doc.sections:
        sec.page_width = Inches(8.27)
        sec.page_height = Inches(11.69)
        sec.top_margin = Inches(0.55)
        sec.bottom_margin = Inches(0.35)
        sec.left_margin = Inches(0.68)
        sec.right_margin = Inches(0.55)
        
    def add_p(text="", bold=False, italic=False, size_pt=11, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, space_after=1.2, line_spacing=1.15):
        p = doc.add_paragraph()
        p.alignment = align
        pf = p.paragraph_format
        pf.space_before = Pt(space_before)
        pf.space_after = Pt(space_after)
        pf.line_spacing = line_spacing
        if text:
            run = p.add_run(text)
            run.font.name = "Calibri"
            run.font.size = Pt(size_pt)
            run.font.bold = bold
            run.font.italic = italic
            run.font.color.rgb = RGBColor(0, 0, 0)
        return p

    def add_bullet(bold_prefix, text, space_after=1.5):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        pf = p.paragraph_format
        pf.left_indent = Inches(0.18)
        pf.first_line_indent = Inches(-0.15)
        pf.space_before = Pt(0)
        pf.space_after = Pt(space_after)
        pf.line_spacing = 1.15
        
        r_bullet = p.add_run("•  ")
        r_bullet.font.name = "Calibri"
        r_bullet.font.size = Pt(11)
        r_bullet.font.bold = True
        
        r_bold = p.add_run(bold_prefix)
        r_bold.font.name = "Calibri"
        r_bold.font.size = Pt(11)
        r_bold.font.bold = True
        
        r_text = p.add_run(text)
        r_text.font.name = "Calibri"
        r_text.font.size = Pt(11)
        return p

    def add_subbullet(bold_prefix, text, space_after=1.0):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        pf = p.paragraph_format
        pf.left_indent = Inches(0.34)
        pf.first_line_indent = Inches(-0.12)
        pf.space_before = Pt(0)
        pf.space_after = Pt(space_after)
        pf.line_spacing = 1.15
        
        r_dash = p.add_run("-  ")
        r_dash.font.name = "Calibri"
        r_dash.font.size = Pt(11)
        
        r_bold = p.add_run(bold_prefix)
        r_bold.font.name = "Calibri"
        r_bold.font.size = Pt(11)
        r_bold.font.bold = True
        
        r_text = p.add_run(text)
        r_text.font.name = "Calibri"
        r_text.font.size = Pt(11)
        return p

    def add_header():
        add_p("BRAINWARE UNIVERSITY", bold=True, size_pt=11, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=0)
        add_p("School of Engineering", bold=False, size_pt=11, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=0)
        add_p("Department of Computer Science & Engineering – Cyber Security & Data Science", bold=False, size_pt=11, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=0)
        add_p("398, Ramkrishnapur Road, Barasat, North 24 Parganas, Kolkata - 700 125", bold=False, size_pt=11, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)

    # ==========================================
    # PAGE 1 (FRONT SIDE)
    # ==========================================
    add_header()
    add_p("Review-III (A.Y.-2026-27)", bold=True, size_pt=11, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=0)
    add_p("Project-I, PROJ-CSD782 | Program: B.Tech. CSE-DS [Batch: 2023-27]", bold=True, size_pt=11, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2.5)

    # Student Table
    table = doc.add_table(rows=7, cols=5)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table, color="999999")

    headers = ["S.N.", "Roll No.", "Student Code", "Student Name", "Signature"]
    col_widths = [Inches(0.45), Inches(1.5), Inches(1.5), Inches(2.0), Inches(1.45)]

    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = h
        set_cell_shading(cell, "F0F0F0")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.runs[0].font.name = "Calibri"
        p.runs[0].font.size = Pt(11)
        p.runs[0].font.bold = True
        set_cell_margins(cell, top=16, bottom=16, left=30, right=30)

    students = [
        ("1", "BWU/BTD/23/015", "BWU/BTD/23/015", "Dhrubojyoti Hazra"),
        ("2", "BWU/BTD/23/042", "BWU/BTD/23/042", "Isheeka Mukhopadhyay"),
        ("3", "BWU/BTD/23/056", "BWU/BTD/23/056", "Samprikta Dey"),
        ("4", "BWU/BTD/23/009", "BWU/BTD/23/009", "Adhiraj Das"),
        ("5", "BWU/BTD/23/025", "BWU/BTD/23/025", "Tiyasha Baidya"),
        ("", "", "", ""),
    ]

    for row_idx, data in enumerate(students, start=1):
        row = table.rows[row_idx]
        for col_idx in range(4):
            cell = row.cells[col_idx]
            cell.text = data[col_idx]
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if col_idx in [0, 1, 2] else WD_ALIGN_PARAGRAPH.LEFT
            if p.runs:
                p.runs[0].font.name = "Calibri"
                p.runs[0].font.size = Pt(11)
            set_cell_margins(cell, top=12, bottom=12, left=30, right=30)
        set_cell_margins(row.cells[4], top=12, bottom=12, left=30, right=30)

    for row in table.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = width

    # Title & Scope
    p_title = add_p(space_before=2.5, space_after=1)
    r1 = p_title.add_run("Project Title: ")
    r1.font.name = "Calibri"
    r1.font.size = Pt(11)
    r1.font.bold = True
    r2 = p_title.add_run("Automated System for Transaction Inspection and Detection (ASTID)")
    r2.font.name = "Calibri"
    r2.font.size = Pt(11)

    p_desc = add_p(space_before=0, space_after=2)
    p_desc.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    r_desc = p_desc.add_run(
        "Build a real-time, explainable fraud inspection and risk intelligence platform capable of analyzing massive "
        "digital payment streams. The system couples supervised gradient boosted trees with unsupervised deep autoencoders "
        "over an analytical data warehouse, surfacing actionable risk scores, feature attributions, and compliance narratives."
    )
    r_desc.font.name = "Calibri"
    r_desc.font.size = Pt(11)

    # Signatures Table on Page 1 (WITH AMPLE PHYSICAL SIGNATURE SPACE!)
    sig_table = doc.add_table(rows=1, cols=3)
    sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_signature_borders(sig_table)
    sig_widths = [Inches(3.3), Inches(0.4), Inches(3.3)]

    c0 = sig_table.rows[0].cells[0]
    p0 = c0.paragraphs[0]
    p0.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p0.paragraph_format.line_spacing = 1.15
    p0.paragraph_format.space_after = Pt(0)
    r0_1 = p0.add_run("Name & Signature of Project Supervisor")
    r0_1.font.name = "Calibri"
    r0_1.font.size = Pt(11)
    
    p0_sig = c0.add_paragraph()
    p0_sig.paragraph_format.space_before = Pt(30) # 30pt blank space for pen signature!
    p0_sig.paragraph_format.space_after = Pt(0)
    r0_2 = p0_sig.add_run("Prof. Rudranath Mitra")
    r0_2.font.name = "Calibri"
    r0_2.font.size = Pt(11)
    r0_2.font.bold = True

    c2 = sig_table.rows[0].cells[2]
    p2 = c2.paragraphs[0]
    p2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p2.paragraph_format.line_spacing = 1.15
    p2.paragraph_format.space_after = Pt(0)
    r2_1 = p2.add_run("Project Coordinator CSE – CS & DS")
    r2_1.font.name = "Calibri"
    r2_1.font.size = Pt(11)

    p2_sig = c2.add_paragraph()
    p2_sig.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p2_sig.paragraph_format.space_before = Pt(30) # 30pt blank space for pen signature!
    p2_sig.paragraph_format.space_after = Pt(0)
    r2_2 = p2_sig.add_run("Dr. Ranadip Kundu")
    r2_2.font.name = "Calibri"
    r2_2.font.size = Pt(11)
    r2_2.font.bold = True

    for idx, width in enumerate(sig_widths):
        sig_table.rows[0].cells[idx].width = width

    # Start Report on Page 1 (STRUCTURED WITH SUB-POINTS)
    add_p("Project Progress (Progress up to Review 3):", bold=True, size_pt=11, space_before=2.5, space_after=1.5)
    add_p("1. Comprehensive Progress and Key Technical Achievements", bold=True, size_pt=11, space_before=1, space_after=1.5)

    add_bullet(
        "Full-Stack System Architecture & Cloud Infrastructure: ",
        "The project successfully transitioned from experimental scripts into an operational, multi-tier fraud inspection "
        "platform. A high-performance Next.js 14 reactive console (deployed on Vercel) connects via REST and WebSockets to an "
        "asynchronous FastAPI scoring microservice (deployed on Render). Data persistence couples hosted Supabase PostgreSQL "
        "(enforcing branch-level Row-Level Security) with an in-process DuckDB columnar OLAP engine for sub-second analytical queries."
    )

    add_bullet(
        "Hybrid Dual-ML Detection Engine & Leakage Resolution: ",
        "The core detection pipeline combines supervised and unsupervised machine learning for dual-layer risk evaluation:"
    )
    add_subbullet(
        "Supervised Layer (XGBoost): ",
        "Trained on genuine transaction dynamics to detect known, high-velocity fraudulent patterns with 94.2% recall and 0.884 PR-AUC."
    )
    add_subbullet(
        "Unsupervised Layer (PyTorch Deep Autoencoder): ",
        "Reconstructs transaction embeddings to isolate novel, zero-day anomalies based on reconstruction loss without requiring historical fraud labels."
    )
    add_subbullet(
        "Simulator Leakage Auditing: ",
        "Identified and eliminated synthetic simulator balance leakage in PaySim (errorBalanceDest), establishing authentic behavioral feature engineering."
    )

    add_bullet(
        "Explainable AI (XAI) & Live Attack Simulation: ",
        "Integrated TreeSHAP for exact local feature contributions paired with Groq LPU automated regulatory compliance narratives. "
        "Engineered a multi-scenario live transaction attack simulator streaming burst fraud patterns over WebSockets at sub-15ms latency."
    )

    # ==========================================
    # PAGE 2 (BACK SIDE)
    # ==========================================
    doc.add_page_break()
    add_header()

    add_p("2. System Validation and Criteria for Project Completion", bold=True, size_pt=11, space_before=1.5, space_after=1.5)

    p_val_intro = add_p(space_before=0, space_after=1.5)
    p_val_intro.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_val_intro.add_run(
        "The completion of this project is substantiated by the end-to-end realization and empirical verification of every objective laid "
        "out in Reviews 1 and 2. The system operates as a unified, production-grade fraud intelligence platform across all architectural stages:"
    ).font.name = "Calibri"

    # Insert Architecture Flowchart Diagram (User requested flowchart / diagram!)
    chart_path = 'docs/reviews/astid_pipeline_flowchart.png'
    if os.path.exists(chart_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(1)
        p_img.paragraph_format.space_after = Pt(1)
        p_img.paragraph_format.line_spacing = 1.0
        r_img = p_img.add_run()
        r_img.add_picture(chart_path, width=Inches(6.8))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(0)
        p_cap.paragraph_format.space_after = Pt(2)
        p_cap.paragraph_format.line_spacing = 1.0
        r_cap = p_cap.add_run("Figure 1: ASTID End-to-End Real-Time Detection, Analytical Warehouse, and Governance Architecture")
        r_cap.font.name = "Calibri"
        r_cap.font.size = Pt(9.5)
        r_cap.font.italic = True

    add_bullet(
        "Quantitative Performance & Latency: ",
        "Rigorous stress testing demonstrates a 100% test pass rate across realistic attack vectors with an average end-to-end scoring "
        "latency of 11.57 ms (p95 latency of 52.8 ms), comfortably meeting commercial real-time banking throughput requirements."
    )

    add_bullet(
        "Warehouse OLAP & Multi-Branch Security: ",
        "The DuckDB columnar warehouse layer aggregates across millions of transactions in under 200 ms, while Supabase PostgreSQL "
        "Row-Level Security (RLS) cryptographically isolates branch data, preventing cross-tenant leakage."
    )

    add_bullet(
        "Dual Deployment Readiness: ",
        "Production cloud deployments are live on Vercel (frontend) and Render (backend), supplemented by an identical, zero-dependency "
        "local offline execution runtime that guarantees total reliability for academic evaluations and viva demonstrations."
    )

    add_p("3. Team Contributions and Specific Module Responsibilities", bold=True, size_pt=11, space_before=2, space_after=1.5)

    p_team_intro = add_p(space_before=0, space_after=1.2)
    p_team_intro.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_team_intro.add_run(
        "Project engineering was distributed across five specialized modules to ensure rigorous execution and balanced ownership:"
    ).font.name = "Calibri"

    add_bullet(
        "Dhrubojyoti Hazra (Lead, Roll: BWU/BTD/23/015): ",
        "Architected the end-to-end full-stack system, designed the Next.js 14 reactive analyst console, integrated the Velto UI design "
        "system with theme animations and dynamic chart visualisations, and coordinated cloud deployment configurations across Vercel and Render."
    )

    add_bullet(
        "Isheeka Mukhopadhyay (ML Pipeline Engineer, Roll: BWU/BTD/23/042): ",
        "Engineered the dual-model machine learning pipeline, trained and tuned the supervised XGBoost and unsupervised PyTorch Autoencoder, "
        "conducted data leakage auditing to eliminate PaySim synthetic artifacts, and benchmarked holdout generalization metrics."
    )

    add_bullet(
        "Samprikta Dey (Backend & Scoring Engineer, Roll: BWU/BTD/23/056): ",
        "Developed the FastAPI asynchronous microservice, implemented deterministic rules for velocity spikes and high-risk merchants, built "
        "the weighted multi-signal scoring aggregator, and managed the automated triage escalation workflows."
    )

    add_bullet(
        "Adhiraj Das (Explainable AI & Live Attack Simulation, Roll: BWU/BTD/23/009): ",
        "Constructed the TreeSHAP local feature attribution pipeline, integrated Groq LPU models for automated compliance narrative "
        "generation, and engineered the multi-scenario live transaction attack simulator streaming over WebSockets."
    )

    add_bullet(
        "Tiyasha Baidya (Data Architecture & Database Security, Roll: BWU/BTD/23/025): ",
        "Designed the in-process DuckDB columnar warehouse layer for high-throughput OLAP aggregations, implemented Supabase PostgreSQL schemas, "
        "enforced branch-level Row-Level Security (RLS) policies, and validated data persistence pipelines."
    )

    out_docx = 'docs/reviews/Review_3_Form_Fraud_Detection_Group1.docx'
    doc.save(out_docx)
    print('Successfully generated', out_docx)

if __name__ == '__main__':
    build_review3()
