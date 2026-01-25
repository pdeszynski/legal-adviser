# HubSpot Integration

HubSpot CRM integration for lead synchronization and management.

## Overview

This module provides seamless integration with HubSpot CRM for managing leads from demo requests and waitlist signups. It handles contact creation, deal creation for qualified leads, and list assignments for segmentation.

## Features

- **Contact Creation**: Create and update HubSpot contacts from form submissions
- **Lead Qualification**: Automatic scoring based on timeline, company size, and completeness
- **Deal Creation**: Automatically create deals for qualified leads
- **List Assignment**: Add contacts to HubSpot static lists for segmentation
- **Retry Logic**: Exponential backoff for failed API calls (3 retries)
- **Graceful Degradation**: Operations fail silently when HubSpot is disabled

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# Enable/disable HubSpot integration
HUBSPOT_ENABLED=true

# HubSpot API key (from HubSpot Settings > Integrations > API Key)
HUBSPOT_API_KEY=your-api-key-here

# Static list IDs for segmentation (optional)
HUBSPOT_DEMO_REQUESTS_LIST_ID=123
HUBSPOT_WAITLIST_LIST_ID=456

# Deal configuration (optional)
HUBSPOT_DEAL_PIPELINE=default
HUBSPOT_DEAL_STAGE=appointmentscheduled
```

### HubSpot Property Setup

To use custom properties in HubSpot, create the following contact properties:

#### Standard Contact Properties

| Property   | HubSpot Field | Description              |
| ---------- | ------------- | ------------------------ |
| First Name | `firstname`   | Contact first name       |
| Last Name  | `lastname`    | Contact last name        |
| Email      | `email`       | Contact email (required) |
| Company    | `company`     | Company name             |
| Website    | `website`     | Company website URL      |
| Phone      | `phone`       | Contact phone number     |

#### Custom Contact Properties

Create these custom properties in HubSpot (Settings > Data Management > Properties > Create property):

| Internal Name    | Label        | Field Type       | Description                                                                  |
| ---------------- | ------------ | ---------------- | ---------------------------------------------------------------------------- |
| `use_case`       | Use Case     | Single-line text | Describes the intended use case                                              |
| `timeline`       | Timeline     | Dropdown         | Implementation timeline (immediate, within_month, within_quarter, exploring) |
| `company_size`   | Company Size | Single-line text | Company size description                                                     |
| `message`        | Message      | Multi-line text  | Additional message from lead                                                 |
| `hs_lead_source` | Lead Source  | Single-line text | Source of the lead (using HubSpot default)                                   |

**Timeline Dropdown Options:**

- `immediate` - Immediate implementation planned
- `within_month` - Within 1 month
- `within_quarter` - Within 3 months
- `exploring` - Just exploring, no timeline yet

### Creating Static Lists

To segment leads, create static lists in HubSpot:

1. Go to Contacts > Lists
2. Click "Create list" > "Static list"
3. Name it appropriately (e.g., "Demo Requests", "Waitlist")
4. After creation, note the list ID from the URL: `https://app.hubspot.com/contacts/{portal}/lists/{listId}`

## Usage

### GraphQL Mutations

#### Create Contact

```graphql
mutation CreateHubSpotContact($input: CreateHubSpotContactInput!) {
  createHubSpotContact(input: $input) {
    id
    email
    createdAt
  }
}
```

#### Sync Lead with Qualification

```graphql
mutation SyncHubSpotLead($input: CreateHubSpotContactInput!) {
  syncHubSpotLead(input: $input, listType: "demo") {
    qualified
    reason
    score
  }
}
```

#### Check Qualification Only

```graphql
mutation QualifyHubSpotLead($input: CreateHubSpotContactInput!) {
  qualifyHubSpotLead(input: $input) {
    qualified
    reason
    score
  }
}
```

### Service Usage (NestJS)

```typescript
import { HubSpotService } from '@/modules/integrations/hubspot';

constructor(private readonly hubspotService: HubSpotService) {}

// Sync a demo request lead
const result = await this.hubspotService.syncLead({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  company: 'Acme Inc',
  useCase: 'Need legal document automation',
  timeline: LeadTimeline.IMMEDIATE,
  companySize: '50-100 employees',
}, 'demo');

if (result.qualification.qualified) {
  console.log('Lead qualified for deal creation');
}
```

## Lead Qualification Logic

Leads are automatically qualified based on a scoring system:

| Criteria                       | Points |
| ------------------------------ | ------ |
| Immediate timeline             | +50    |
| Within 1 month timeline        | +40    |
| Within 3 months timeline       | +20    |
| Enterprise company size (500+) | +30    |
| Mid-size company (50-500)      | +20    |
| Small company/startup          | +10    |
| Detailed use case (>20 chars)  | +15    |
| Company provided               | +10    |
| Website provided               | +5     |

**Qualification Threshold**: 50 points

## Error Handling

The service implements:

1. **Automatic Retry**: Failed API calls are retried up to 3 times with exponential backoff
2. **Graceful Degradation**: When HubSpot is disabled or API key is missing, operations return null
3. **Conflict Resolution**: Duplicate contacts are handled by finding the existing contact
4. **Comprehensive Logging**: All operations are logged for debugging

## API Limitations

- **List Membership**: Requires HubSpot Marketing Hub Professional tier or higher
- **Custom Properties**: Must be created manually in HubSpot before use
- **Rate Limits**: HubSpot has API rate limits; the retry logic helps handle throttling

## Testing

```typescript
import { HubSpotService } from '@/modules/integrations/hubspot';

// Mock or disable HubSpot for tests
HUBSPOT_ENABLED = false;
```

## Troubleshooting

### "HubSpot API connection failed"

- Verify API key is correct and active
- Check that the API key has the required permissions (contacts, deals)
- Ensure HUBSPOT_ENABLED is set to true

### "Could not add contact to list"

- Requires Marketing Hub Professional or higher
- Verify the list ID is correct
- Check that the list is a static list (not active list)

### Contacts not being created

- Check logs for detailed error messages
- Verify email is not already in HubSpot (service handles this)
- Ensure required properties are provided
