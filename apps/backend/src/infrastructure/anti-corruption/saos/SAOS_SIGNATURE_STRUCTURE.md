# SAOS Signature Structure and Uniqueness

## Overview

This document explains the structure of legal case signatures in the Polish court system (SAOS - System Analizy Orzecznictwa Sądowego) and how uniqueness is handled in the Legal AI Platform.

## Signature Format

Polish court case signatures typically follow this pattern:

```
[Department Roman Numeral] [Case Type Abbreviation] [Number]/[Year]
```

### Examples

| Signature | Department | Case Type | Number | Year |
|-----------|------------|-----------|--------|------|
| `III CZP 8/21` | III | CZP (Civil Chamber of Supreme Court) | 8 | 2021 |
| `I C 697/19` | I | C (Civil) | 697 | 2019 |
| `V Ka 123/22` | V | Ka (Penal) | 123 | 2022 |
| `II UK 45/20` | II | UK (Labor/Social Security) | 45 | 2020 |

### Case Type Abbreviations

| Abbreviation | Meaning (Polish) | Meaning (English) |
|--------------|-----------------|-------------------|
| C | Cywilny | Civil |
| K | Karny | Penal |
| Ka | Karny odwoławczy | Penal Appellate |
| UK | Ubezpieczeń społecznych | Social Security |
| Uz | Ubezpieczeń społecznych odwoławczy | Social Security Appellate |
| P | Pracy | Labor |
| RP | Rodzinny i opiekuńczy | Family and Guardianship |
| W | Wykroczeń | Offenses |
| N | Nieletnich | Juvenile |
| CZP | Izba Cywilna | Civil Chamber (Supreme Court) |
| KK | Izba Karna | Criminal Chamber (Supreme Court) |
| KP | Izba Pracy, Ubezpieczeń Społecznych i Spraw Publicznych | Labor, Social Security and Public Affairs Chamber |

## Uniqueness Problem

**Key Insight:** Signatures are unique **within a single court**, not nationwide.

### Example of the Problem

The signature `I C 697/19` can legally exist in:

- Sąd Rejonowy dla Krakowa-Śródmieścia w Krakowie (District Court Kraków-City)
- Sąd Rejonowy dla Warszawy-Śródmieścia w Warszawie (District Court Warsaw-City)
- Sąd Rejonowy dla Gdańska-Północ w Gdańsku (District Court Gdańsk-North)
- ... and many other regional courts

Each of these courts can independently assign the same signature `I C 697/19` to a different case heard in 2019.

## Database Schema Solution

### Composite Unique Constraint

To handle this correctly, the `legal_rulings` table uses a **composite unique constraint** on three columns:

```sql
CREATE UNIQUE INDEX UIDX_legal_rulings_court_signature_date
ON legal_rulings ("courtName", signature, "rulingDate");
```

This ensures that the combination of `(courtName, signature, rulingDate)` is unique, allowing the same signature to exist in different courts or on different dates.

### Entity Definition

```typescript
@Entity('legal_rulings')
@Index(['courtName', 'signature', 'rulingDate'], { unique: true })
export class LegalRuling {
  @Column({ type: 'varchar', length: 100 })
  signature: string;

  @Column({ type: 'varchar', length: 300 })
  courtName: string;

  @Column({ type: 'date' })
  rulingDate: Date;
  // ...
}
```

## API Usage

### Finding a Ruling (Correct Way)

Use the composite key for reliable lookups:

```typescript
const ruling = await legalRulingService.findByCourtSignatureDate(
  'Sąd Rejonowy dla Krakowa-Śródmieścia w Krakowie',
  'I C 697/19',
  new Date('2019-03-15')
);
```

### Finding a Ruling (Deprecated)

Using only the signature is **not recommended** as it may return the wrong ruling if duplicates exist:

```typescript
// DEPRECATED - May return wrong ruling if signature exists in multiple courts
const ruling = await legalRulingService.findBySignature('I C 697/19');
```

## SAOS Crawler Deduplication

The SAOS crawler uses the composite key for deduplication:

```typescript
const existingRuling =
  await this.legalRulingService.findByCourtSignatureDate(
    ruling.courtName,
    ruling.signature,
    ruling.rulingDate,
  );
```

This ensures that:
1. Valid judgments from different courts with the same signature are all stored
2. Only exact duplicates (same court, signature, and date) are skipped
3. Updates to existing judgments are applied correctly

## Migration Notes

When migrating from the old schema (signature-only unique constraint) to the new schema (composite key):

1. Any existing duplicates (same signature, different courts) will be handled by the migration script
2. The migration appends the court name to the signature for duplicates to maintain uniqueness
3. The old unique index on `signature` is dropped
4. The new composite index is created

See `apps/backend/src/database/constraints/update-legal-ruling-unique-constraint.sql` for the migration script.

## References

- SAOS API: https://www.saos.org.pl/api
- Polish Court System: https://www.gov.pl/web/sadysta
- SAOS Documentation: https://www.saos.org.pl/o-systemie
