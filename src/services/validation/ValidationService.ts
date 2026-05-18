import { NormalizedPayrollData } from '@/types/payroll'
import { ValidationResult, ValidationError } from '@/types/payroll'

export class ValidationService {
  validate(data: NormalizedPayrollData[]): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    data.forEach((entry, index) => {
      // Check for duplicate workers
      const duplicates = data.filter(
        (e, i) => i !== index && e.workerName === entry.workerName && e.payrollWeek === entry.payrollWeek
      )
      if (duplicates.length > 0) {
        errors.push({
          type: 'DUPLICATE_WORKER',
          message: `Duplicate entry for worker: ${entry.workerName}`,
          fieldName: 'workerName',
          rowIndex: index,
          severity: 'ERROR'
        })
      }

      // Check for missing required fields
      if (!entry.workerName || entry.workerName.trim() === '') {
        errors.push({
          type: 'MISSING_FIELD',
          message: 'Worker name is required',
          fieldName: 'workerName',
          rowIndex: index,
          severity: 'ERROR'
        })
      }

      if (!entry.companyName || entry.companyName.trim() === '') {
        errors.push({
          type: 'MISSING_FIELD',
          message: 'Company name is required',
          fieldName: 'companyName',
          rowIndex: index,
          severity: 'ERROR'
        })
      }

      if (!entry.payrollWeek || entry.payrollWeek.trim() === '') {
        errors.push({
          type: 'MISSING_FIELD',
          message: 'Payroll week is required',
          fieldName: 'payrollWeek',
          rowIndex: index,
          severity: 'ERROR'
        })
      }

      // Check for missing rates
      if (entry.hourlyRate === 0 || entry.hourlyRate < 0) {
        errors.push({
          type: 'INVALID_RATE',
          message: 'Hourly rate must be greater than 0',
          fieldName: 'hourlyRate',
          rowIndex: index,
          severity: 'ERROR'
        })
      }

      // Check for abnormal hours
      if (entry.hoursWorked < 0) {
        errors.push({
          type: 'INVALID_HOURS',
          message: 'Hours worked cannot be negative',
          fieldName: 'hoursWorked',
          rowIndex: index,
          severity: 'ERROR'
        })
      }

      if (entry.hoursWorked > 168) {
        warnings.push({
          type: 'ABNORMAL_HOURS',
          message: 'Hours worked exceeds 168 (hours in a week)',
          fieldName: 'hoursWorked',
          rowIndex: index,
          severity: 'WARNING'
        })
      }

      if (entry.hoursWorked > 80) {
        warnings.push({
          type: 'HIGH_HOURS',
          message: 'Hours worked is unusually high',
          fieldName: 'hoursWorked',
          rowIndex: index,
          severity: 'WARNING'
        })
      }

      // Check for invalid totals
      const calculatedGross = entry.hoursWorked * entry.hourlyRate
      const difference = Math.abs(calculatedGross - entry.grossPay)
      const tolerance = 0.02 // 2 pence tolerance

      if (difference > tolerance && entry.grossPay > 0) {
        warnings.push({
          type: 'GROSS_PAY_MISMATCH',
          message: `Gross pay (£${entry.grossPay}) doesn't match calculated value (£${calculatedGross.toFixed(2)})`,
          fieldName: 'grossPay',
          rowIndex: index,
          severity: 'WARNING'
        })
      }

      // Check for invalid gross pay
      if (entry.grossPay < 0) {
        errors.push({
          type: 'INVALID_GROSS_PAY',
          message: 'Gross pay cannot be negative',
          fieldName: 'grossPay',
          rowIndex: index,
          severity: 'ERROR'
        })
      }

      // Check for minimum wage (UK National Living Wage as of 2024)
      const minimumWage = 11.44
      if (entry.hourlyRate > 0 && entry.hourlyRate < minimumWage) {
        warnings.push({
          type: 'BELOW_MINIMUM_WAGE',
          message: `Hourly rate (£${entry.hourlyRate}) is below UK National Living Wage (£${minimumWage})`,
          fieldName: 'hourlyRate',
          rowIndex: index,
          severity: 'WARNING'
        })
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  async validatePayrollSubmission(payrollSubmissionId: string): Promise<ValidationResult> {
    // TODO: Load payroll entries from database and validate
    // This is a placeholder for the database integration
    return {
      isValid: true,
      errors: [],
      warnings: []
    }
  }
}

// Singleton instance
let validationService: ValidationService | null = null

export function getValidationService(): ValidationService {
  if (!validationService) {
    validationService = new ValidationService()
  }
  return validationService
}
