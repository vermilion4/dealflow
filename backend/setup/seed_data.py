"""Seed data for the DealFlow product catalog.

This generates markdown files that should be uploaded to Airia Data Store
for RAG-based retrieval by the FitAnalyzer pipeline.
"""

PRODUCT_OVERVIEW = """# FlowStack — Unified Workflow Automation Platform

## Overview
FlowStack is an enterprise workflow automation platform that helps mid-market and enterprise
companies eliminate manual processes, reduce operational costs, and accelerate revenue operations.

## Core Products

### FlowStack Automate
- Visual workflow builder with 200+ pre-built connectors
- AI-powered process mining to discover automation opportunities
- Human-in-the-loop approval workflows
- Enterprise-grade security (SOC 2 Type II, HIPAA, GDPR)

### FlowStack Integrate
- Universal API connector platform
- Real-time data sync across CRM, ERP, HRIS, and marketing systems
- Custom connector SDK for proprietary systems
- Event-driven architecture with guaranteed delivery

### FlowStack Insights
- Operational analytics dashboard
- Process efficiency scoring and bottleneck detection
- ROI calculator for automated workflows
- Predictive analytics for process optimization

## Pricing
- Starter: $499/mo (up to 10 users, 50 workflows)
- Professional: $1,499/mo (up to 50 users, unlimited workflows)
- Enterprise: Custom pricing (unlimited users, dedicated support, SLA)

## Ideal Customer Profile
- Company size: 100-10,000 employees
- Industries: SaaS, Financial Services, Healthcare, Manufacturing, Professional Services
- Roles: VP/Director of Operations, CTO, Head of RevOps, IT Director
- Triggers: Manual processes causing errors, scaling pains, system sprawl, compliance needs
"""


CASE_STUDIES = """# FlowStack Case Studies

## 1. TechVault (SaaS, 500 employees)
**Challenge:** Manual onboarding process taking 3 weeks per customer, causing churn.
**Solution:** FlowStack Automate streamlined onboarding with automated provisioning,
welcome sequences, and training scheduling.
**Results:** Onboarding time reduced from 3 weeks to 2 days. Customer churn decreased 34%.
Revenue retention improved by $2.1M annually.

## 2. MeridianBank (Financial Services, 2,000 employees)
**Challenge:** Compliance reporting required 40+ hours/week of manual data aggregation.
**Solution:** FlowStack Integrate connected 12 banking systems for real-time compliance data
flow. FlowStack Automate generated reports automatically.
**Results:** Compliance reporting time reduced by 92%. Zero audit findings in subsequent review.
Saved $800K in annual compliance labor costs.

## 3. HealthBridge Clinics (Healthcare, 800 employees)
**Challenge:** Patient intake across 15 locations was paper-based, causing data entry errors
and HIPAA compliance risks.
**Solution:** FlowStack Automate digitized intake with HIPAA-compliant workflows.
FlowStack Integrate synced with Epic EHR in real-time.
**Results:** Data entry errors reduced 97%. Patient wait times decreased 12 minutes on average.
Staff reallocated 2,000 hours/year to patient care.

## 4. PrecisionMfg (Manufacturing, 3,000 employees)
**Challenge:** Supply chain disruptions due to manual purchase order processing and
vendor communication delays.
**Solution:** FlowStack Automate created event-driven PO workflows with auto-approval
thresholds. FlowStack Integrate connected ERP to vendor portals.
**Results:** PO processing time reduced from 5 days to 4 hours. Stockout incidents
decreased 67%. $3.2M saved in expedited shipping costs.

## 5. Apex Consulting (Professional Services, 300 employees)
**Challenge:** Project staffing and resource allocation was done in spreadsheets,
causing utilization to stagnate at 62%.
**Solution:** FlowStack Automate matched consultant skills to project requirements.
FlowStack Insights provided real-time utilization dashboards.
**Results:** Utilization increased from 62% to 78%. Revenue per consultant increased 26%.
Time-to-staff reduced from 1 week to same-day.

## 6. RetailNova (E-commerce, 1,200 employees)
**Challenge:** Order fulfillment errors running at 8% due to disconnected warehouse
and shipping systems.
**Solution:** FlowStack Integrate created real-time sync between Shopify, warehouse WMS,
and shipping carriers. FlowStack Automate handled exception routing.
**Results:** Fulfillment errors reduced to 0.3%. Customer satisfaction score increased
from 3.8 to 4.7/5. Returns processing time cut by 75%.
"""


ICP_DOCUMENT = """# FlowStack Ideal Customer Profile (ICP)

## Firmographics
- **Company Size:** 100-10,000 employees (sweet spot: 200-3,000)
- **Annual Revenue:** $10M-$2B
- **Industries (Tier 1):** SaaS/Technology, Financial Services, Healthcare
- **Industries (Tier 2):** Manufacturing, Professional Services, E-commerce/Retail
- **Industries (Tier 3):** Education, Non-profit, Government (longer sales cycles)
- **Geography:** North America, Western Europe, ANZ

## Technographics
- Uses 5+ business systems (CRM, ERP, HRIS, etc.)
- Has some technical staff but not a large engineering team
- Currently using basic automation (Zapier, Power Automate) or none
- Cloud-first or hybrid infrastructure
- Active Salesforce, HubSpot, or Microsoft Dynamics users

## Pain Point Indicators
- Manual data entry between systems
- Compliance/audit preparation taking significant time
- Customer onboarding taking too long
- Revenue leakage from process inefficiencies
- Scaling challenges due to manual processes
- Recent rapid growth or M&A activity

## Buying Signals
- Job postings for "Operations Manager," "Process Improvement," "RevOps"
- Recent funding round (Series B+ for growth-stage)
- New CTO/COO/VP Ops hire
- Mentions of "digital transformation" in press releases
- Evaluating or recently adopted new CRM/ERP
- Compliance deadline approaching

## Disqualifiers
- Under 50 employees (too small for ROI)
- No technical staff at all
- Fully custom-built internal tooling (build vs. buy preference)
- Government/regulated with 2+ year procurement cycles
- Already using enterprise automation (ServiceNow, UiPath at scale)
"""


def _markdown_to_pdf(content: str, output_path: str):
    """Convert markdown content to a simple PDF."""
    from fpdf import FPDF

    # Replace unicode chars unsupported by Helvetica
    for old, new in [
        ("\u2014", "--"), ("\u2013", "-"), ("\u2018", "'"), ("\u2019", "'"),
        ("\u201c", '"'), ("\u201d", '"'), ("\u2022", "*"), ("\u2026", "..."),
    ]:
        content = content.replace(old, new)

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_margins(15, 15, 15)
    pdf.add_page()

    for line in content.strip().split("\n"):
        stripped = line.strip()
        if not stripped:
            pdf.ln(4)
            continue

        if stripped.startswith("### "):
            pdf.set_font("Helvetica", "B", 12)
            pdf.cell(w=0, h=6, text=stripped[4:], new_x="LMARGIN", new_y="NEXT")
            pdf.ln(2)
        elif stripped.startswith("## "):
            pdf.set_font("Helvetica", "B", 14)
            pdf.cell(w=0, h=7, text=stripped[3:], new_x="LMARGIN", new_y="NEXT")
            pdf.ln(3)
        elif stripped.startswith("# "):
            pdf.set_font("Helvetica", "B", 18)
            pdf.cell(w=0, h=9, text=stripped[2:], new_x="LMARGIN", new_y="NEXT")
            pdf.ln(4)
        else:
            pdf.set_font("Helvetica", "", 10)
            clean = stripped.replace("**", "")
            if clean.startswith("- "):
                clean = "  * " + clean[2:]
            pdf.cell(w=0, h=5, text=clean, new_x="LMARGIN", new_y="NEXT")

    pdf.output(output_path)


def generate_seed_files(output_dir: str = "./seed_output"):
    """Generate seed data as PDFs for upload to Airia Data Store."""
    import os
    os.makedirs(output_dir, exist_ok=True)

    files = {
        "product_overview.pdf": PRODUCT_OVERVIEW,
        "case_studies.pdf": CASE_STUDIES,
        "icp_document.pdf": ICP_DOCUMENT,
    }

    for filename, content in files.items():
        path = os.path.join(output_dir, filename)
        _markdown_to_pdf(content, path)
        print(f"Created: {path}")

    print(f"\nUpload these {len(files)} PDF files to your Airia Data Store for RAG.")


if __name__ == "__main__":
    generate_seed_files()
