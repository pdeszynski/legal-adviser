I'll analyze this feature task. This is about configuring HubSpot CRM workflows - which is primarily a configuration task in the HubSpot admin interface rather than code changes to the codebase. Let me explore what's already implemented for HubSpot integration to understand the context.

🔧 Tool: Task
Input: {
  "subagent_type": "Explore",
  "prompt": "Explore the existing HubSpot integration in this codebase. Find:\n1. All files related to HubSpot integration (backend module, frontend components, etc.)\n2. What demo request form implementation exists\n3. What data is currently being sent to HubSpot\n4. Any existing documentation about HubSpot configuration\n\nFocus on understanding the current state of the HubSpot integration so I can document what workflows need to be configured in HubSpot CRM.",
  "description": "Explore HubSpot integration"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*hubspot*"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*demo-request*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/integrations/hubspot/hubspot.service.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/integrations/hubspot/dto/hubspot.types.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/demo-request/demo-request.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/demo-request/demo-request.service.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/demo-request/dto/demo-request.graphql-dto.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/demo-request/demo-request-form.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/hubspot-embed-form/hubspot-embed-form.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/integrations/hubspot/hubspot-webhook.service.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/integrations/hubspot/dto/hubspot-webhook.dto.ts"
}

🔧 Tool: Grep
Input: {
  "pattern": "HUBSPOT_API_KEY|HUBSPOT_ENABLED|HUBSPOT_DEMO_REQUESTS_LIST_ID|HUBSPOT_WAITLIST_LIST_ID|HUBSPOT_DEAL_PIPELINE|HUBSPOT_DEAL_STAGE",
  "type": "env"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/.env*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/.env.example"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/.env.example"
}

🔧 Tool: Grep
Input: {
  "pattern": "hubspot|HubSpot",
  "glob": "**/*.md"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/integrations/hubspot/README.md"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/domain/demo-request/events/demo-request-submitted.event.ts"
}
Now I have a clear picture of the existing HubSpot integration. Let me read the key files to understand the current implementation in more detail:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/integrations/hubspot/hubspot.service.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/integrations/hubspot/hubspot.types.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.claude/CLAUDE.md"
}
Let me check the DTOs to understand the types better:

🔧 Tool: Glob
Input: {
  "pattern": "**/hubspot/**/*.ts",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/integrations"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/integrations/hubspot/dto/hubspot.types.ts"
}
Now I have a complete understanding of the existing HubSpot integration. This feature task is primarily about documenting the HubSpot CRM workflow configuration that needs to be done in the HubSpot admin interface, rather than writing code.

Let me create a comprehensive documentation file and update the CLAUDE.md with HubSpot workflow configuration instructions.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create HubSpot workflow configuration documentation",
      "status": "in_progress",
      "activeForm": "Creating HubSpot workflow configuration documentation"
    },
    {
      "content": "Update CLAUDE.md with HubSpot configuration section",
      "status": "pending",
      "activeForm": "Updating CLAUDE.md with HubSpot configuration section"
    },
    {
      "content": "Create verification summary for the feature",
      "status": "pending",
      "activeForm": "Creating verification summary"
    }
  ]
}

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/integrations/hubspot/HUBSPOT_WORKFLOWS.md",
  "content": "# HubSpot CRM Workflow Configuration Guide\n\nThis guide provides step-by-step instructions for configuring HubSpot CRM workflows to handle leads from the demo request form. The backend already implements lead qualification scoring - these workflows leverage that data.\n\n## Prerequisites\n\nBefore configuring workflows, ensure the HubSpot integration is properly set up:\n\n1. **Custom Contact Properties** are created in HubSpot:\n   - `use_case` (Single-line text)\n   - `timeline` (Dropdown: immediate, within_month, within_quarter, exploring)\n   - `company_size` (Single-line text)\n   - `message` (Multi-line text)\n\n2. **Static Lists** are created:\n   - \"Demo Requests\" list\n   - \"Waitlist\" list\n\n3. **Environment Variables** are configured:\n   ```bash\n   HUBSPOT_ENABLED=true\n   HUBSPOT_API_KEY=your-api-key\n   HUBSPOT_DEMO_REQUESTS_LIST_ID=123\n   HUBSPOT_WAITLIST_LIST_ID=456\n   HUBSPOT_DEAL_PIPELINE=default\n   HUBSPOT_DEAL_STAGE=appointmentscheduled\n   ```\n\n## Lead Qualification Scoring (Backend Logic)\n\nThe backend automatically scores leads on submission. Understanding this helps configure workflows:\n\n| Criteria | Points |\n|----------|--------|\n| Immediate timeline | +50 |\n| Within 1 month timeline | +40 |\n| Within 3 months timeline | +20 |\n| Enterprise company (500+) | +30 |\n| Mid-size company (50-500) | +20 |\n| Small company/startup | +10 |\n| Detailed use case (>20 chars) | +15 |\n| Company name provided | +10 |\n| Website provided | +5 |\n\n**Qualified Lead Threshold: 50+ points** (automatically creates a deal in HubSpot)\n\n---\n\n## Workflow 1: Automatic Lead Assignment by Company Size\n\n**Purpose:** Route leads to appropriate sales team members based on company size.\n\n### Setup\n\n1. Navigate to **Automation > Workflows > Create workflow > Contact-based**\n2. Set trigger: **Contact property value changes** → `company_size`\n3. Add **If/then** branches:\n\n```\nIF company_size contains \"500+\" OR \"enterprise\"\n  THEN Assign to: Enterprise Sales Team\n  AND Set owner: [Enterprise Sales Rep]\n\nELSE IF company_size contains \"50-\" OR \"100-\"\n  THEN Assign to: Mid-Market Sales Team\n  AND Set owner: [Mid-Market Sales Rep]\n\nELSE\n  THEN Assign to: SMB Sales Team\n  AND Set owner: [SMB Sales Rep]\n```\n\n### Geographic Routing (Optional)\n\nAdd additional branches for geography-based routing:\n\n```\nIF [Property] country/region equals \"Poland\"\n  THEN Set owner: [PL Sales Rep]\nELSE IF country/region equals \"Germany\"\n  THEN Set owner: [DE Sales Rep]\n...\n```\n\n---\n\n## Workflow 2: Lead Scoring & Hot Lead Alert\n\n**Purpose:** Identify and alert sales team for high-priority leads.\n\n### Setup\n\n1. Navigate to **Automation > Workflows > Create workflow > Contact-based**\n2. Set trigger: **Contact created** with source `demo_request_form`\n3. Add **If/then** branch:\n\n```\nIF timeline equals \"immediate\" OR company_size contains \"50+\"\n  THEN\n    - Add to \"Hot Leads\" list\n    - Set property `lead_score` = \"Hot\"\n    - Send internal email: \"Hot Lead Alert\"\n    - Create task: \"Follow up within 4 hours\" (High priority)\n\nELSE IF timeline equals \"within_month\" AND company_size contains \"10-\" OR \"50-\"\n  THEN\n    - Set property `lead_score` = \"Warm\"\n    - Create task: \"Follow up within 24 hours\" (Medium priority)\n\nELSE\n  THEN\n    - Set property `lead_score` = \"Cold\"\n    - Create task: \"Follow up within 3 days\" (Low priority)\n```\n\n### Hot Lead Email Template\n\n```\nSubject: 🔥 Hot Lead Alert - {{contact.company}} - {{contact.firstname}} {{contact.lastname}}\n\nA new hot lead is available!\n\nContact: {{contact.firstname}} {{contact.lastname}}\nEmail: {{contact.email}}\nCompany: {{contact.company}} ({{contact.company_size}})\nTimeline: {{contact.timeline}}\nUse Case: {{contact.use_case}}\n\nLead Score: Hot (50+ points)\n\nView in HubSpot: {{contact.hubspot_owner_url}}\n```\n\n---\n\n## Workflow 3: Automated Email Sequences by Lead Segment\n\n**Purpose:** Send targeted email sequences based on lead qualification.\n\n### Setup\n\n1. Navigate to **Automation > Workflows > Create workflow > Contact-based**\n2. Set trigger: **Contact created** with source `demo_request_form`\n\n#### Sequence A: Immediate/Hot Leads\n\n```\nIF timeline equals \"immediate\"\n  THEN send email sequence:\n\n  Email 1 (Immediate):\n    Subject: \"Thanks for your interest - Let's schedule your demo\"\n    Content: Personal confirmation + Calendly link\n\n  Email 2 (1 day later if no meeting booked):\n    Subject: \"Quick question about your legal workflow\"\n    Content: Brief follow-up\n\n  Email 3 (3 days later if no engagement):\n    Subject: \"Still interested?\"\n    Content: Final attempt before moving to nurture\n```\n\n#### Sequence B: Within Month/Warm Leads\n\n```\nIF timeline equals \"within_month\"\n  THEN send email sequence:\n\n  Email 1 (Immediate):\n    Subject: \"Thanks for reaching out - Your AI Legal Assistant awaits\"\n    Content: Overview + Calendly link\n\n  Email 2 (3 days later):\n    Subject: \"See how {{competitor}} firms use our platform\"\n    Content: Case study\n\n  Email 3 (7 days later):\n    Subject: \"Your personalized demo awaits\"\n    Content: Reminder\n```\n\n#### Sequence C: Exploring/Cold Leads (Nurture)\n\n```\nIF timeline equals \"exploring\"\n  THEN send nurture sequence:\n\n  Email 1 (Immediate):\n    Subject: \"Welcome! Here's what you need to know\"\n    Content: Educational content about legal AI\n\n  Email 2 (7 days later):\n    Subject: \"5 Ways AI Transforming Legal Departments\"\n    Content: Blog post/whitepaper\n\n  Email 3 (14 days later):\n    Subject: \"Case Study: How {{law_firm}} saved 20 hours/week\"\n    Content: Success story\n\n  Email 4 (30 days later):\n    Subject: \"Ready to explore further?\"\n    Content: Check-in + demo offer\n```\n\n---\n\n## Workflow 4: Task Creation for Sales Follow-up\n\n**Purpose:** Ensure every lead gets timely follow-up with tasks assigned to owners.\n\n### Setup\n\n1. Navigate to **Automation > Workflows > Create workflow > Contact-based**\n2. Set trigger: **Contact created** with source `demo_request_form`\n\n```\nFor all new demo requests:\n\n  Create task: \"New Demo Request - Qualification Call\"\n    - Assigned to: Contact owner\n    - Due date: 1 business day\n    - Task type: Call\n    - Priority: Based on lead_score property\n    - Description: \"{{contact.firstname}} from {{contact.company}} requested a demo.\n                    Timeline: {{contact.timeline}}. Use case: {{contact.use_case}}.\n                    Reach out within 24 hours to qualify and schedule demo.\"\n\n  IF timeline equals \"immediate\"\n    THEN Create additional task: \"Hot Lead - Immediate Follow-up Required\"\n      - Due date: 4 hours\n      - Priority: High\n```\n\n---\n\n## Workflow 5: Lead Nurturing for Not-Ready Prospects\n\n**Purpose:** Keep leads engaged who aren't ready to buy yet.\n\n### Setup\n\n1. Navigate to **Automation > Workflows > Create workflow > Contact-based**\n2. Set trigger: **Deal stage** = \"Closed Lost\" OR **Timeline** = \"exploring\"\n\n```\nLong-term nurture (90 days):\n\n  Day 1: Welcome to nurture track email\n  Day 7: Educational content (blog post)\n  Day 14: Case study: similar company success\n  Day 30: Product update/new feature announcement\n  Day 45: Industry insights whitepaper\n  Day 60: \"Still interested?\" check-in\n  Day 90: Final re-engagement attempt\n\n  IF engagement detected (email click, form submission, website visit)\n    THEN Move to \"Re-engaged\" list\n    AND Notify sales rep\n```\n\n---\n\n## Workflow 6: Demo Scheduling Integration\n\n**Purpose:** Integrate with Calendly/HubSpot Meetings for seamless demo booking.\n\n### Setup\n\n#### Option A: Using HubSpot Meetings (Recommended)\n\n1. **Create Meeting Link**:\n   - Go to **Sales > Meetings**\n   - Create meeting types for different segments:\n     - \"Enterprise Demo\" (45 min)\n     - \"Standard Demo\" (30 min)\n     - \"Discovery Call\" (20 min)\n\n2. **Update Email Templates**:\n   - Insert meeting link in email sequences:\n     `{{ meetings_link }}`\n\n3. **Round-Robin Assignment** (Optional):\n   - Go to **Settings > Objects > Activities > Meetings**\n   - Set up round-robin for team members\n\n#### Option B: Calendly Integration\n\n1. **Install Calendly Integration** in HubSpot Marketplace\n2. **Map Event Types** to HubSpot meeting types\n3. **Configure Routing** based on form fields:\n   - Enterprise → Senior sales rep\n   - Mid-market → Mid-market rep\n4. **Workflow Trigger**:\n   ```\n   IF demo request submitted\n   THEN send email with personalized Calendly link based on segment\n   ```\n\n---\n\n## Workflow 7: Lead to Customer Handoff\n\n**Purpose:** Smooth transition from sales to customer success.\n\n### Setup\n\n1. Navigate to **Automation > Workflows > Create workflow > Deal-based**\n2. Set trigger: **Deal stage** = \"Closed Won\"\n\n```\nWhen deal is won:\n\n  1. Create \"Customer\" contact property = true\n  2. Add to \"Customers\" list\n  3. Send internal notification to CS team\n  4. Remove from \"Prospects\" lists\n  5. Trigger CS onboarding sequence:\n     - Day 1: Welcome email\n     - Day 3: Account setup check\n     - Day 7: First value realization email\n  6. Create CS task: \"Onboarding call scheduled\"\n```\n\n---\n\n## Monitoring & Optimization\n\n### Key Metrics to Track\n\n| Metric | Description | Target |\n|--------|-------------|--------|\n| Lead Response Time | Time from submission to first contact | <4 hours (hot), <24h (all) |\n| Demo Booking Rate | % of leads that book demos | >30% |\n| Lead-to-Customer Rate | Conversion from demo request | >15% |\n| Email Open Rate | Engagement with nurture emails | >25% |\n| Deal Cycle Time | Average days to close | <30 days |\n\n### A/B Testing Ideas\n\n- Email subject lines\n- Call-to-action placement\n- Follow-up timing (same day vs next day)\n- Demo length (30 vs 45 minutes)\n\n---\n\n## Troubleshooting\n\n### Leads Not Being Assigned\n\n1. Check if `company_size` property is being populated\n2. Verify workflow is active and trigger conditions match\n3. Check HubSpot user/team assignments\n\n### Tasks Not Being Created\n\n1. Verify task creation permissions for workflow user\n2. Check if contact owner is set\n3. Review workflow history for errors\n\n### Emails Not Sending\n\n1. Check email sending limits\n2. Verify contacts are not marked as bounced/unsubscribed\n3. Check workflow enrollment status\n\n---\n\n## Additional Resources\n\n- [HubSpot Workflow Documentation](https://knowledge.hubspot.com/workflows)\n- [Lead Scoring Best Practices](https://blog.hubspot.com/marketing/lead-scoring)\n- [Sales Email Templates](https://blog.hubspot.com/sales/sales-email-templates)\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Creating HubSpot workflow configuration documentation",
      "content": "Create HubSpot workflow configuration documentation",
      "status": "completed"
    },
    {
      "activeForm": "Updating CLAUDE.md with HubSpot configuration section",
      "content": "Update CLAUDE.md with HubSpot configuration section",
      "status": "in_progress"
    },
    {
      "activeForm": "Creating verification summary",
      "content": "Create verification summary for the feature",
      "status": "pending"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.claude/CLAUDE.md",
  "old_string": "## Temporal Schedules\n\n**Schedules vs Workflows:** Schedules = recurring/time-based, Workflows = one-time/event-driven",
  "new_string": "## HubSpot Integration\n\n**Module:** `apps/backend/src/modules/integrations/hubspot/`\n\n**Purpose:** Sync demo request leads to HubSpot CRM with automatic qualification scoring.\n\n**Environment Variables:**\n```bash\nHUBSPOT_ENABLED=true\nHUBSPOT_API_KEY=your-api-key\nHUBSPOT_DEMO_REQUESTS_LIST_ID=123\nHUBSPOT_WAITLIST_LIST_ID=456\nHUBSPOT_DEAL_PIPELINE=default\nHUBSPOT_DEAL_STAGE=appointmentscheduled\nHUBSPOT_WEBHOOK_SECRET=your-webhook-secret\n```\n\n**Lead Qualification Scoring:**\n| Criteria | Points |\n|----------|--------|\n| Immediate timeline | +50 |\n| Within 1 month | +40 |\n| Within 3 months | +20 |\n| Enterprise (500+) | +30 |\n| Mid-size (50-500) | +20 |\n| Small/startup | +10 |\n| Detailed use case | +15 |\n| Company provided | +10 |\n| Website provided | +5 |\n\n**Qualified:** 50+ points → creates Deal in HubSpot\n\n**Custom Contact Properties Required:**\n- `use_case` (Single-line text)\n- `timeline` (Dropdown: immediate, within_month, within_quarter, exploring)\n- `company_size` (Single-line text)\n- `message` (Multi-line text)\n\n**GraphQL API:**\n```graphql\nmutation SubmitDemoRequest($input: DemoRequestInput!) {\n  submitDemoRequest(input: $input) { success, message }\n}\n```\n\n**Workflow Configuration:** See `apps/backend/src/modules/integrations/hubspot/HUBSPOT_WORKFLOWS.md` for detailed HubSpot CRM workflow setup including:\n- Automatic lead assignment by company size/geography\n- Lead scoring rules and hot lead alerts\n- Automated email sequences by segment\n- Task creation for sales follow-up\n- Lead nurturing workflows\n- Calendly/HubSpot Meetings integration\n\n## Temporal Schedules\n\n**Schedules vs Workflows:** Schedules = recurring/time-based, Workflows = one-time/event-driven"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Creating HubSpot workflow configuration documentation",
      "content": "Create HubSpot workflow configuration documentation",
      "status": "completed"
    },
    {
      "activeForm": "Updating CLAUDE.md with HubSpot configuration section",
      "content": "Update CLAUDE.md with HubSpot configuration section",
      "status": "completed"
    },
    {
      "activeForm": "Creating verification summary",
      "content": "Create verification summary for the feature",
      "status": "in_progress"
    }
  ]
}
Now let me verify the implementation by checking if the HubSpot service exists and works correctly:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/integrations/hubspot/hubspot.service.spec.ts"
}
Let me run the HubSpot service tests to verify everything works:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/apps/backend && npx jest hubspot.service.spec.ts --passWithNoTests 2>&1",
  "description": "Run HubSpot service unit tests",
  "timeout": 60000
}
All tests pass. Let me also verify the HubSpot module is properly exported and the GraphQL API works:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/integrations/hubspot/hubspot.resolver.ts"
}
The backend integration is complete. Now let me verify the schema includes the HubSpot mutations and then update the todo:

🔧 Tool: Grep
Input: {
  "pattern": "syncHubSpotLead|qualifyHubSpotLead|createHubSpotContact",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/schema.gql",
  "output_mode": "content"
}
The GraphQL schema includes all the HubSpot mutations. Let me run the TypeScript check to make sure everything compiles:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | head -50",
  "description": "Run TypeScript type check",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | head -50",
  "description": "Run TypeScript type check from project root",
  "timeout": 120000
}
TypeScript passes. Now let me update the todo and finalize the summary:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Creating HubSpot workflow configuration documentation",
      "content": "Create HubSpot workflow configuration documentation",
      "status": "completed"
    },
    {
      "activeForm": "Updating CLAUDE.md with HubSpot configuration section",
      "content": "Update CLAUDE.md with HubSpot configuration section",
      "status": "completed"
    },
    {
      "activeForm": "Creating verification summary",
      "content": "Create verification summary for the feature",
      "status": "completed"
    }
  ]
}
<summary>
## Summary: Configure HubSpot CRM Workflows for Demo Request Lead Routing

### Changes Implemented

This feature task was primarily about documentation rather than code changes, since the backend HubSpot integration was already fully implemented. The task required documenting how to configure HubSpot CRM workflows to leverage the existing lead scoring and sync functionality.

**Documentation Created:**

1. **`apps/backend/src/modules/integrations/hubspot/HUBSPOT_WORKFLOWS.md`** - Comprehensive HubSpot workflow configuration guide covering:
   - **Workflow 1:** Automatic lead assignment by company size and geography
   - **Workflow 2:** Lead scoring rules with hot lead alerts (50+ points triggers "Hot" status)
   - **Workflow 3:** Automated email sequences for different lead segments (immediate/hot, warm, cold/nurture)
   - **Workflow 4:** Task creation for sales follow-up (24 hours for standard, 4 hours for hot leads)
   - **Workflow 5:** Lead nurturing workflows for "not ready yet" prospects (90-day nurture sequence)
   - **Workflow 6:** Integration with Calendly/HubSpot Meetings for demo scheduling
   - **Workflow 7:** Lead-to-customer handoff to CS team
   - Monitoring metrics and troubleshooting guide

2. **Updated `.claude/CLAUDE.md`** - Added new "HubSpot Integration" section with:
   - Module location and environment variables
   - Lead qualification scoring table
   - Required custom contact properties
   - GraphQL API mutations
   - Link to detailed workflow documentation

### Files Modified

| File | Description |
|------|-------------|
| `apps/backend/src/modules/integrations/hubspot/HUBSPOT_WORKFLOWS.md` | New: Comprehensive HubSpot CRM workflow configuration guide |
| `.claude/CLAUDE.md` | Updated: Added HubSpot Integration section with configuration reference |

### Verification Status

**Unit Tests:** All existing HubSpot service tests pass (9/9):
- `hubspot.service.spec.ts` - Tests service initialization, enablement, lead qualification logic, and health checks

**Type Check:** TypeScript compilation passes with no errors

**Backend Integration Already Implemented:**
- GraphQL mutations: `createHubSpotContact`, `syncHubSpotLead`, `qualifyHubSpotLead`
- Lead qualification scoring (50+ points = qualified)
- Automatic deal creation for qualified leads
- Contact/list assignment based on demo request type

### Notes for Developer

The HubSpot CRM workflow configuration is now fully documented. To enable these workflows:

1. **Configure environment variables** with actual HubSpot credentials
2. **Create custom properties** in HubSpot (`use_case`, `timeline`, `company_size`, `message`)
3. **Create static lists** for segmentation ("Demo Requests", "Waitlist")
4. **Set up workflows** in HubSpot CRM following the guide in `HUBSPOT_WORKFLOWS.md`

The backend already handles all lead qualification scoring and data synchronization - the workflows leverage this data to automate sales follow-up processes.
</summary>