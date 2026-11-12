import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
import os

def generate_review3():
    # Load base template to preserve header structure and geometry
    doc = Document('C:/Users/HP/Desktop/dhruv/ASTID_v2/docs/reviews/Review_2_Form_Fraud_Detection_Group1.docx')
    
    section = doc.sections[0]
    section.page_width = Inches(8.27)
    section.page_height = Inches(11.69)
    section.top_margin = Inches(0.65)
    section.bottom_margin = Inches(0.35)
    section.left_margin = Inches(0.7)
    section.right_margin = Inches(0.55)
    
    body = doc.element.body
    sectPr = body.xpath('w:sectPr')
    sectPr = sectPr[0] if sectPr else None
    
    for child in list(body):
        if child != sectPr:
            body.remove(child)
            
    def add_p(text, font_size=11, bold=False, align=WD_ALIGN_PARAGRAPH.LEFT, line_spacing=1.15, space_before=0, space_after=0):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.line_spacing = line_spacing
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        if text:
            run = p.add_run(text)
            run.font.name = 'Calibri'
            run.font.size = Pt(font_size)
            run.font.bold = bold
            run.font.color.rgb = RGBColor(0, 0, 0)
        return p

    def add_bullet_p(bold_prefix, rest_text, font_size=11, line_spacing=1.15, space_after=0.5):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.line_spacing = line_spacing
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.left_indent = Inches(0.18)
        
        r_bullet = p.add_run('•  ')
        r_bullet.font.name = 'Calibri'
        r_bullet.font.size = Pt(font_size)
        r_bullet.font.bold = True
        
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Calibri'
        r_pre.font.size = Pt(font_size)
        r_pre.font.bold = True
        
        r_rest = p.add_run(rest_text)
        r_rest.font.name = 'Calibri'
        r_rest.font.size = Pt(font_size)
        r_rest.font.bold = False
        return p

    # ================= PAGE 1 (FRONT SIDE) =================
    add_p('Review-III (A.Y.-2026-27)', font_size=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, line_spacing=1.15, space_before=6, space_after=2)
    add_p('Project-I, PROJ-CSD782 | Program: B.Tech. CSE-DS [Batch: 2023-27]', font_size=12, bold=False, align=WD_ALIGN_PARAGRAPH.CENTER, line_spacing=1.15, space_before=0, space_after=6)
    
    tbl1 = doc.add_table(rows=7, cols=5)
    tbl1.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl1.autofit = False
    
    col_widths = [Inches(0.6), Inches(1.5), Inches(1.5), Inches(2.1), Inches(1.3)]
    headers = ['S.N.', 'Roll No.', 'Student Code', 'Student Name', 'Signature']
    students = [
        ('1', 'BWU/BTD/23/015', 'BWU/BTD/23/015', 'Dhrubojyoti Hazra', ''),
        ('2', 'BWU/BTD/23/042', 'BWU/BTD/23/042', 'Isheeka Mukhopadhyay', ''),
        ('3', 'BWU/BTD/23/056', 'BWU/BTD/23/056', 'Samprikta Dey', ''),
        ('4', 'BWU/BTD/23/009', 'BWU/BTD/23/009', 'Adhiraj Das', ''),
        ('5', 'BWU/BTD/23/025', 'BWU/BTD/23/025', 'Tiyasha Baidya', ''),
        ('', '', '', '', '')
    ]
    
    hdr_cells = tbl1.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.0
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        run = p.runs[0]
        run.font.name = 'Calibri'
        run.font.size = Pt(10)
        run.font.bold = True
        
    for r_idx, row_data in enumerate(students):
        row_cells = tbl1.rows[r_idx + 1].cells
        for c_idx, val in enumerate(row_data):
            row_cells[c_idx].text = val
            p = row_cells[c_idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx in [0, 1, 2, 4] else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.0
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            if p.runs:
                run = p.runs[0]
                run.font.name = 'Calibri'
                run.font.size = Pt(9.5)
                
    for row in tbl1.rows:
        for idx, cell in enumerate(row.cells):
            cell.width = col_widths[idx]
            tcPr = cell._tc.get_or_add_tcPr()
            tcBorders = parse_xml(
                f'<w:tcBorders {nsdecls("w")}>\n'
                f'  <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>\n'
                f'  <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>\n'
                f'  <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>\n'
                f'  <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>\n'
                f'</w:tcBorders>'
            )
            tcPr.append(tcBorders)

    add_p('', font_size=4, space_before=0, space_after=2)
    
    p_title = add_p('Project Title: ', font_size=11, bold=False, line_spacing=1.15, space_before=2, space_after=3)
    r_bold = p_title.add_run('Fraud Detection in Digital Payment Systems Using Machine Learning')
    r_bold.font.name = 'Calibri'
    r_bold.font.size = Pt(11)
    r_bold.font.bold = True
    
    add_p('Build a fraud detection framework capable of analyzing large volumes of digital transaction data stored in a data warehouse. Machine learning and anomaly detection techniques identify suspicious transactions in real time. The system generates risk scores and alerts to help financial institutions prevent fraudulent activities.', font_size=10, bold=False, line_spacing=1.15, space_before=0, space_after=6)
    
    add_p('', font_size=4, space_before=0, space_after=2)
    
    tbl2 = doc.add_table(rows=1, cols=3)
    tbl2.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl2.autofit = False
    tbl2_widths = [Inches(3.3), Inches(0.4), Inches(3.3)]
    
    c0 = tbl2.rows[0].cells[0]
    c0.text = "Name & Signature of Project Supervisor\nProf. Rudranath Mitra"
    p0 = c0.paragraphs[0]
    p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p0.paragraph_format.line_spacing = 1.15
    for r in p0.runs:
        r.font.name = 'Calibri'
        r.font.size = Pt(10)
        
    c1 = tbl2.rows[0].cells[1]
    c1.text = ""
    
    c2 = tbl2.rows[0].cells[2]
    c2.text = "Dr. Ranadip Kundu\nProject Coordinator CSE – CS & DS"
    p2 = c2.paragraphs[0]
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.paragraph_format.line_spacing = 1.15
    for r in p2.runs:
        r.font.name = 'Calibri'
        r.font.size = Pt(10)
        
    for row in tbl2.rows:
        for idx, cell in enumerate(row.cells):
            cell.width = tbl2_widths[idx]
            tcPr = cell._tc.get_or_add_tcPr()
            tcBorders = parse_xml(
                f'<w:tcBorders {nsdecls("w")}>\n'
                f'  <w:top w:val="none"/>\n'
                f'  <w:left w:val="none"/>\n'
                f'  <w:bottom w:val="none"/>\n'
                f'  <w:right w:val="none"/>\n'
                f'</w:tcBorders>'
            )
            tcPr.append(tcBorders)

    add_p('', font_size=4, space_before=0, space_after=3)
    add_p('Project Progress (Progress up to Review 3):', font_size=11, bold=True, line_spacing=1.15, space_before=3, space_after=0)
    
    # Page Break to Back Side
    p_break = doc.add_paragraph()
    p_break.paragraph_format.space_before = Pt(0)
    p_break.paragraph_format.space_after = Pt(0)
    p_break.paragraph_format.line_spacing = 1.0
    run_break = p_break.add_run()
    run_break.add_break(docx.enum.text.WD_BREAK.PAGE)

    # ================= PAGE 2 (BACK SIDE - RESTRUCTURED FOR CLOUD DEPLOYMENT) =================
    # Section 1: End-to-End System Architecture & Cloud Deployment
    add_p('1. End-to-End System Architecture and Cloud Deployment', font_size=11, bold=True, line_spacing=1.15, space_before=1, space_after=1)
    add_p('The team successfully engineered and deployed a production-grade multi-tier digital payment fraud detection platform across modern cloud infrastructure:\n•  Frontend Client (Vercel): Deployed an interactive Next.js 14 console featuring Branch Analyst Workbench, Senior Escalation Queue with 15-minute countdown SLA watchdogs, and Team Lead Executive View.\n•  Backend Scoring Service (Render): Deployed an asynchronous FastAPI microservice with atomic Redis idempotency achieving 11.57ms mean scoring latency, hosting calibrated XGBoost, PyTorch Autoencoder, and TreeSHAP explainability.\n•  Operational Database (Supabase Cloud): Configured hosted PostgreSQL with real-time WebSocket subscriptions and strict 3-tier Row-Level Security (RLS) enforced via SECURITY DEFINER functions across 5 Indian banking hubs.\n•  Columnar Warehouse (DuckDB): Integrated an in-process OLAP engine directly aggregating 6,362,620 transactions (Rs 1.14 Trillion turnover, 8,213 frauds) in sub-120ms without external server overhead.', font_size=11, line_spacing=1.15, space_before=0, space_after=2)

    # Section 2: Technical Innovations & Synthetic Leakage Remediation
    add_p('2. Technical Innovations and Synthetic Leakage Remediation', font_size=11, bold=True, line_spacing=1.15, space_before=2, space_after=1)
    add_p('Building on mid-term guidance from Prof. Rudranath Mitra, two core scientific breakthroughs were implemented:\n•  Leakage-Free Feature Engineering: Eliminated PaySim simulator balance leakage (raw balance deltas causing artificial 1.00 PR-AUC) by engineering pure behavioral signals (balance_drain_ratio, 1h/24h velocity, and transfer-to-cashout flags), achieving a robust, defensible PR-AUC of 0.884 and 94.21% fraud recall.\n•  Disjunctive Override Decision Gating: Formulated a non-linear aggregation engine where high-confidence XGBoost fraud (P_XGB >= 0.90) or severe Autoencoder novelty spikes (S_AE >= 0.95) immediately bypass linear averages directly into ESCALATE.\n•  Whitebox Explainability & Graph Intelligence: Integrated sub-12ms TreeSHAP attributions and 1-hop "Igor" mule ring ego-graphs for regulatory compliance (RBI guidelines / GDPR).', font_size=11, line_spacing=1.15, space_before=0, space_after=2)

    # Section 3: Empirical Validation & Module Demonstrations
    add_p('3. Empirical Validation and Working Module Demonstrations', font_size=11, bold=True, line_spacing=1.15, space_before=2, space_after=1)
    add_p('All core software modules have been fully verified across 12/12 stress test scenarios in the test suite:\n•  Attack Simulation Sandbox: Live injection of Legitimate, Account Takeover, Zero-Day Outlier, and Blacklisted Mule vectors demonstrating real-time WebSocket triage and triage actions (APPROVE, FLAG, ESCALATE, BLOCK).\n•  Dual-Model Performance: Supervised XGBoost captures high-velocity drainage patterns, while the unsupervised Autoencoder isolates unlabelled zero-day anomalies by reconstruction error (MSE > tau).\n•  Delayed Feedback Protection: Implemented a 60-day observation blackout window in model fine-tuning to prevent premature retraining on unconfirmed chargeback labels.', font_size=11, line_spacing=1.15, space_before=0, space_after=2)

    # Section 4: Team Allocation, Project Deliverables, and Viva Preparedness
    add_p('4. Team Allocation, Project Deliverables, and Viva Preparedness', font_size=11, bold=True, line_spacing=1.15, space_before=2, space_after=1)
    add_p('•  Team Allocation: Dhrubojyoti Hazra (Lead, Architecture & Vercel UI), Isheeka Mukhopadhyay (ML Pipeline & Leakage Auditing), Samprikta Dey (FastAPI Backend & Rules Aggregator), Adhiraj Das (Explainable AI & Live Simulator), Tiyasha Baidya (DuckDB Warehouse & Supabase Database Security).\n•  Comprehensive Deliverables: 42-page technical report, reproducible Google Colab benchmark notebook, cloud-deployed web application, and full GitHub codebase (github.com/dhrubojyotihazra/ASTID).\n•  Viva Voce Defense Protocol: Structured defense protocol rehearsed covering PR-AUC trade-offs, concept drift detection (PSI < 0.10), delayed feedback protection, and cost-sensitive Bayes decision boundaries.', font_size=11, line_spacing=1.15, space_before=0, space_after=0)

    doc_path = 'C:/Users/HP/Desktop/dhruv/ASTID_v2/docs/reviews/Review_3_Form_Fraud_Detection_Group1.docx'
    doc.save(doc_path)
    print(f'Successfully saved {doc_path}!')

if __name__ == '__main__':
    generate_review3()
