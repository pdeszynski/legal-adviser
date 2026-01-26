# HubSpot CRM Workflow Configuration Guide

This guide provides step-by-step instructions for configuring HubSpot CRM workflows to handle leads from the demo request form. The backend already implements lead qualification scoring - these workflows leverage that data.

## Prerequisites

Before configuring workflows, ensure the HubSpot integration is properly set up:

1. **Custom Contact Properties** are created in HubSpot:
   - `use_case` (Single-line text)
   - `timeline` (Dropdown: immediate, within_month, within_quarter, exploring)
   - `company_size` (Single-line text)
   - `message` (Multi-line text)

2. **Static Lists** are created:
   - "Demo Requests" list
   - "Waitlist" list

3. **Environment Variables** are configured:
   ```bash
   HUBSPOT_ENABLED=true
   HUBSPOT_API_KEY=your-api-key
   HUBSPOT_DEMO_REQUESTS_LIST_ID=123
   HUBSPOT_WAITLIST_LIST_ID=456
   HUBSPOT_DEAL_PIPELINE=default
   HUBSPOT_DEAL_STAGE=appointmentscheduled
   ```

## Lead Qualification Scoring (Backend Logic)

The backend automatically scores leads on submission. Understanding this helps configure workflows:

| Criteria | Points |
|----------|--------|
| Immediate timeline | +50 |
| Within 1 month timeline | +40 |
| Within 3 months timeline | +20 |
| Enterprise company (500+) | +30 |
| Mid-size company (50-500) | +20 |
| Small company/startup | +10 |
| Detailed use case (>20 chars) | +15 |
| Company name provided | +10 |
| Website provided | +5 |

**Qualified Lead Threshold: 50+ points** (automatically creates a deal in HubSpot)

---

## Workflow 1: Automatic Lead Assignment by Company Size

**Purpose:** Route leads to appropriate sales team members based on company size.

### Setup

1. Navigate to **Automation > Workflows > Create workflow > Contact-based**
2. Set trigger: **Contact property value changes** → `company_size`
3. Add **If/then** branches:

```
IF company_size contains "500+" OR "enterprise"
  THEN Assign to: Enterprise Sales Team
  AND Set owner: [Enterprise Sales Rep]

ELSE IF company_size contains "50-" OR "100-"
  THEN Assign to: Mid-Market Sales Team
  AND Set owner: [Mid-Market Sales Rep]

ELSE
  THEN Assign to: SMB Sales Team
  AND Set owner: [SMB Sales Rep]
```

### Geographic Routing (Optional)

Add additional branches for geography-based routing:

```
IF [Property] country/region equals "Poland"
  THEN Set owner: [PL Sales Rep]
ELSE IF country/region equals "Germany"
  THEN Set owner: [DE Sales Rep]
...
```

---

## Workflow 2: Lead Scoring & Hot Lead Alert

**Purpose:** Identify and alert sales team for high-priority leads.

### Setup

1. Navigate to **Automation > Workflows > Create workflow > Contact-based**
2. Set trigger: **Contact created** with source `demo_request_form`
3. Add **If/then** branch:

```
IF timeline equals "immediate" OR company_size contains "50+"
  THEN
    - Add to "Hot Leads" list
    - Set property `lead_score` = "Hot"
    - Send internal email: "Hot Lead Alert"
    - Create task: "Follow up within 4 hours" (High priority)

ELSE IF timeline equals "within_month" AND company_size contains "10-" OR "50-"
  THEN
    - Set property `lead_score` = "Warm"
    - Create task: "Follow up within 24 hours" (Medium priority)

ELSE
  THEN
    - Set property `lead_score` = "Cold"
    - Create task: "Follow up within 3 days" (Low priority)
```

### Hot Lead Email Template

```
Subject: 🔥 Hot Lead Alert - {{contact.company}} - {{contact.firstname}} {{contact.lastname}}

A new hot lead is available!

Contact: {{contact.firstname}} {{contact.lastname}}
Email: {{contact.email}}
Company: {{contact.company}} ({{contact.company_size}})
Timeline: {{contact.timeline}}
Use Case: {{contact.use_case}}

Lead Score: Hot (50+ points)

View in HubSpot: {{contact.hubspot_owner_url}}
```

---

## Workflow 3: Automated Email Sequences by Lead Segment

**Purpose:** Send targeted email sequences based on lead qualification.

### Setup

1. Navigate to **Automation > Workflows > Create workflow > Contact-based**
2. Set trigger: **Contact created** with source `demo_request_form`

#### Sequence A: Immediate/Hot Leads

```
IF timeline equals "immediate"
  THEN send email sequence:

  Email 1 (Immediate):
    Subject: "Thanks for your interest - Let's schedule your demo"
    Content: Personal confirmation + Calendly link

  Email 2 (1 day later if no meeting booked):
    Subject: "Quick question about your legal workflow"
    Content: Brief follow-up

  Email 3 (3 days later if no engagement):
    Subject: "Still interested?"
    Content: Final attempt before moving to nurture
```

#### Sequence B: Within Month/Warm Leads

```
IF timeline equals "within_month"
  THEN send email sequence:

  Email 1 (Immediate):
    Subject: "Thanks for reaching out - Your AI Legal Assistant awaits"
    Content: Overview + Calendly link

  Email 2 (3 days later):
    Subject: "See how {{competitor}} firms use our platform"
    Content: Case study

  Email 3 (7 days later):
    Subject: "Your personalized demo awaits"
    Content: Reminder
```

#### Sequence C: Exploring/Cold Leads (Nurture)

```
IF timeline equals "exploring"
  THEN send nurture sequence:

  Email 1 (Immediate):
    Subject: "Welcome! Here's what you need to know"
    Content: Educational content about legal AI

  Email 2 (7 days later):
    Subject: "5 Ways AI Transforming Legal Departments"
    Content: Blog post/whitepaper

  Email 3 (14 days later):
    Subject: "Case Study: How {{law_firm}} saved 20 hours/week"
    Content: Success story

  Email 4 (30 days later):
    Subject: "Ready to explore further?"
    Content: Check-in + demo offer
```

---

## Workflow 4: Task Creation for Sales Follow-up

**Purpose:** Ensure every lead gets timely follow-up with tasks assigned to owners.

### Setup

1. Navigate to **Automation > Workflows > Create workflow > Contact-based**
2. Set trigger: **Contact created** with source `demo_request_form`

```
For all new demo requests:

  Create task: "New Demo Request - Qualification Call"
    - Assigned to: Contact owner
    - Due date: 1 business day
    - Task type: Call
    - Priority: Based on lead_score property
    - Description: "{{contact.firstname}} from {{contact.company}} requested a demo.
                    Timeline: {{contact.timeline}}. Use case: {{contact.use_case}}.
                    Reach out within 24 hours to qualify and schedule demo."

  IF timeline equals "immediate"
    THEN Create additional task: "Hot Lead - Immediate Follow-up Required"
      - Due date: 4 hours
      - Priority: High
```

---

## Workflow 5: Lead Nurturing for Not-Ready Prospects

**Purpose:** Keep leads engaged who aren't ready to buy yet.

### Setup

1. Navigate to **Automation > Workflows > Create workflow > Contact-based**
2. Set trigger: **Deal stage** = "Closed Lost" OR **Timeline** = "exploring"

```
Long-term nurture (90 days):

  Day 1: Welcome to nurture track email
  Day 7: Educational content (blog post)
  Day 14: Case study: similar company success
  Day 30: Product update/new feature announcement
  Day 45: Industry insights whitepaper
  Day 60: "Still interested?" check-in
  Day 90: Final re-engagement attempt

  IF engagement detected (email click, form submission, website visit)
    THEN Move to "Re-engaged" list
    AND Notify sales rep
```

---

## Workflow 6: Demo Scheduling Integration

**Purpose:** Integrate with Calendly/HubSpot Meetings for seamless demo booking.

### Setup

#### Option A: Using HubSpot Meetings (Recommended)

1. **Create Meeting Link**:
   - Go to **Sales > Meetings**
   - Create meeting types for different segments:
     - "Enterprise Demo" (45 min)
     - "Standard Demo" (30 min)
     - "Discovery Call" (20 min)

2. **Update Email Templates**:
   - Insert meeting link in email sequences:
     `{{ meetings_link }}`

3. **Round-Robin Assignment** (Optional):
   - Go to **Settings > Objects > Activities > Meetings**
   - Set up round-robin for team members

#### Option B: Calendly Integration

1. **Install Calendly Integration** in HubSpot Marketplace
2. **Map Event Types** to HubSpot meeting types
3. **Configure Routing** based on form fields:
   - Enterprise → Senior sales rep
   - Mid-market → Mid-market rep
4. **Workflow Trigger**:
   ```
   IF demo request submitted
   THEN send email with personalized Calendly link based on segment
   ```

---

## Workflow 7: Lead to Customer Handoff

**Purpose:** Smooth transition from sales to customer success.

### Setup

1. Navigate to **Automation > Workflows > Create workflow > Deal-based**
2. Set trigger: **Deal stage** = "Closed Won"

```
When deal is won:

  1. Create "Customer" contact property = true
  2. Add to "Customers" list
  3. Send internal notification to CS team
  4. Remove from "Prospects" lists
  5. Trigger CS onboarding sequence:
     - Day 1: Welcome email
     - Day 3: Account setup check
     - Day 7: First value realization email
  6. Create CS task: "Onboarding call scheduled"
```

---

## Monitoring & Optimization

### Key Metrics to Track

| Metric | Description | Target |
|--------|-------------|--------|
| Lead Response Time | Time from submission to first contact | <4 hours (hot), <24h (all) |
| Demo Booking Rate | % of leads that book demos | >30% |
| Lead-to-Customer Rate | Conversion from demo request | >15% |
| Email Open Rate | Engagement with nurture emails | >25% |
| Deal Cycle Time | Average days to close | <30 days |

### A/B Testing Ideas

- Email subject lines
- Call-to-action placement
- Follow-up timing (same day vs next day)
- Demo length (30 vs 45 minutes)

---

## Troubleshooting

### Leads Not Being Assigned

1. Check if `company_size` property is being populated
2. Verify workflow is active and trigger conditions match
3. Check HubSpot user/team assignments

### Tasks Not Being Created

1. Verify task creation permissions for workflow user
2. Check if contact owner is set
3. Review workflow history for errors

### Emails Not Sending

1. Check email sending limits
2. Verify contacts are not marked as bounced/unsubscribed
3. Check workflow enrollment status

---

## Additional Resources

- [HubSpot Workflow Documentation](https://knowledge.hubspot.com/workflows)
- [Lead Scoring Best Practices](https://blog.hubspot.com/marketing/lead-scoring)
- [Sales Email Templates](https://blog.hubspot.com/sales/sales-email-templates)
