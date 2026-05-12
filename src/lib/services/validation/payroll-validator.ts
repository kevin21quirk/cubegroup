import { PayrollEntryData, ValidationResult, ValidationError, PayrollValidationRules } from '@/types'

export class PayrollValidator {
  private rules: PayrollValidationRules

  constructor(rules?: PayrollValidationRules) {
    this.rules = {
      maxHoursPerWeek: rules?.maxHoursPerWeek || 168,
      minHourlyRate: rules?.minHourlyRate || 10.42,
      maxHourlyRate: rules?.maxHourlyRate || 1000,
      requireUmbrellaCompany: rules?.requireUmbrellaCompany ?? true,
      requireDepartment: rules?.requireDepartment ?? false,
      allowDuplicateWorkers: rules?.allowDuplicateWorkers ?? false,
    }
  }

  validate(entries: PayrollEntryData[]): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const prefix = `Entry ${i + 1} (${entry.workerName})`

      if (!entry.workerName || entry.workerName.trim().length === 0) {
        errors.push({
          field: 'workerName',
          message: `${prefix}: Worker name is required`,
          severity: 'error',
        })
      }

      if (entry.hoursWorked <= 0) {
        errors.push({
          field: 'hoursWorked',
          message: `${prefix}: Hours worked must be greater than 0`,
          severity: 'error',
          value: entry.hoursWorked,
        })
      }

      if (entry.hoursWorked > this.rules.maxHoursPerWeek!) {
        warnings.push({
          field: 'hoursWorked',
          message: `${prefix}: Hours worked (${entry.hoursWorked}) exceeds maximum (${this.rules.maxHoursPerWeek})`,
          severity: 'warning',
          value: entry.hoursWorked,
        })
      }

      if (entry.hourlyRate < this.rules.minHourlyRate!) {
        warnings.push({
          field: 'hourlyRate',
          message: `${prefix}: Hourly rate (£${entry.hourlyRate}) is below minimum wage (£${this.rules.minHourlyRate})`,
          severity: 'warning',
          value: entry.hourlyRate,
        })
      }

      if (entry.hourlyRate > this.rules.maxHourlyRate!) {
        warnings.push({
          field: 'hourlyRate',
          message: `${prefix}: Hourly rate (£${entry.hourlyRate}) seems unusually high`,
          severity: 'warning',
          value: entry.hourlyRate,
        })
      }

      const calculatedGross = entry.hoursWorked * entry.hourlyRate
      const difference = Math.abs(calculatedGross - entry.grossPay)
      
      if (difference > 0.01) {
        errors.push({
          field: 'grossPay',
          message: `${prefix}: Gross pay (£${entry.grossPay}) doesn't match hours × rate (£${calculatedGross.toFixed(2)})`,
          severity: 'error',
          value: entry.grossPay,
        })
      }

      if (this.rules.requireUmbrellaCompany && !entry.umbrellaCompany) {
        errors.push({
          field: 'umbrellaCompany',
          message: `${prefix}: Umbrella company is required`,
          severity: 'error',
        })
      }

      if (this.rules.requireDepartment && !entry.department) {
        warnings.push({
          field: 'department',
          message: `${prefix}: Department is missing`,
          severity: 'warning',
        })
      }
    }

    if (!this.rules.allowDuplicateWorkers) {
      const workerNames = entries.map(e => e.workerName.toLowerCase().trim())
      const duplicates = workerNames.filter((name, index) => workerNames.indexOf(name) !== index)
      
      if (duplicates.length > 0) {
        warnings.push({
          field: 'workerName',
          message: `Duplicate workers found: ${[...new Set(duplicates)].join(', ')}`,
          severity: 'warning',
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  validateSingle(entry: PayrollEntryData): ValidationResult {
    return this.validate([entry])
  }
}
