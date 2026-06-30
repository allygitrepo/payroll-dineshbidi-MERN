const db = require("../../../database/models/index");
const { Op } = require("sequelize");

class LeaveValidationService {
    /**
     * Parse date string or object to Date without timezone shifts
     */
    static parseLocalDate(dateStr) {
        const parts = dateStr.split("-");
        if (parts.length === 3) {
            return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        }
        return new Date(dateStr);
    }

    /**
     * Check if a specific date is a holiday or weekly off for a company
     */
    static async isHoliday(companyId, dateStr) {
        const date = this.parseLocalDate(dateStr);
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayName = dayNames[date.getDay()];

        // Check if there is a company holiday or weekly off on this date
        const calRecord = await db.Calender.findOne({
            where: {
                company_id: companyId,
                status: true,
                [Op.or]: [
                    {
                        holiday_type: "COMPANY",
                        holiday_date: dateStr,
                    },
                    {
                        holiday_type: "WEEKLY",
                        week_day: { [Op.like]: dayName },
                    }
                ]
            }
        });

        return !!calRecord;
    }

    /**
     * Calculate leave duration in days, integrating sandwich policy and calendar master
     */
    static async calculateLeaveDays(companyId, fromDateStr, toDateStr, dayType, sandwichPolicyEnabled) {
        if (dayType === "First Half" || dayType === "Second Half") {
            return 0.5;
        }

        const start = this.parseLocalDate(fromDateStr);
        const end = this.parseLocalDate(toDateStr);

        let totalDays = 0;
        let current = new Date(start);

        while (current <= end) {
            const yyyy = current.getFullYear();
            const mm = String(current.getMonth() + 1).padStart(2, "0");
            const dd = String(current.getDate()).padStart(2, "0");
            const currentStr = `${yyyy}-${mm}-${dd}`;

            if (sandwichPolicyEnabled) {
                // All calendar days count
                totalDays += 1;
            } else {
                // Skip holidays/weekly offs
                const holiday = await this.isHoliday(companyId, currentStr);
                if (!holiday) {
                    totalDays += 1;
                }
            }
            current.setDate(current.getDate() + 1);
        }

        return totalDays;
    }

    /**
     * Check if employee has overlapping leave requests
     */
    static async checkOverlap(employeeId, fromDate, toDate, dayType = "Full Day", excludeRequestId = null, transaction = null) {
        const whereClause = {
            employee_id: employeeId,
            status: { [Op.in]: ["Submitted", "Approved"] },
            [Op.and]: [
                { from_date: { [Op.lte]: toDate } },
                { to_date: { [Op.gte]: fromDate } }
            ]
        };

        if (excludeRequestId) {
            whereClause.id = { [Op.ne]: excludeRequestId };
        }

        const overlappingRequests = await db.LeaveRequest.findAll({ where: whereClause, transaction });

        for (const req of overlappingRequests) {
            // Check if there is a real overlap based on day types
            // If they are on the same date and one is First Half and one is Second Half, they don't overlap.
            // If either is a Full Day, they overlap.
            if (req.day_type === "Full Day" || dayType === "Full Day") {
                return true;
            }
            if (req.day_type === dayType) {
                return true;
            }
            // If they overlap on multiple dates, it is a real overlap
            if (req.from_date !== req.to_date || fromDate !== toDate) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get dynamic pending leaves count for an employee, leave type and leave year
     */
    static async getPendingDays(employeeId, leaveTypeId, leaveYear, transaction = null) {
        const pendingRequests = await db.LeaveRequest.findAll({
            where: {
                employee_id: employeeId,
                leave_type_id: leaveTypeId,
                status: "Submitted"
            },
            lock: transaction ? 'SHARE' : false,
            transaction
        });

        let totalPending = 0;
        for (const req of pendingRequests) {
            // Filter by leave year matching request range
            const reqYear = req.from_date.split("-")[0];
            if (reqYear === leaveYear) {
                totalPending += parseFloat(req.number_of_days);
            }
        }
        return totalPending;
    }

    /**
     * Get current remaining balance dynamically
     */
    static async getDynamicRemainingBalance(companyId, employeeId, leaveTypeId, leaveYear, transaction = null) {
        const balance = await db.LeaveBalance.findOne({
            where: {
                company_id: companyId,
                employee_id: employeeId,
                leave_type_id: leaveTypeId,
                leave_year: leaveYear
            },
            lock: transaction ? 'UPDATE' : false,
            transaction
        });

        if (!balance) return 0.00;

        const allocated = parseFloat(balance.allocated) || 0.00;
        const carryForward = parseFloat(balance.carry_forward) || 0.00;
        const used = parseFloat(balance.used) || 0.00;
        const pending = await this.getPendingDays(employeeId, leaveTypeId, leaveYear, transaction);

        return Math.max(0, allocated + carryForward - used - pending);
    }

    /**
     * Full Leave Application Validation
     */
    static async validateApplication(companyId, data, excludeRequestId = null, transaction = null) {
        const { employeeId, leaveTypeId, fromDate, toDate, dayType, attachmentPath } = data;

        // 1. Employee exists and is active
        const employee = await db.Employee.findOne({
            where: { id: employeeId, company_id: companyId, status: true },
            transaction
        });
        if (!employee) {
            throw new Error("Employee not found or is currently inactive.");
        }

        // 2. Leave type is active
        const leaveType = await db.LeaveType.findOne({
            where: { id: leaveTypeId, company_id: companyId, is_active: true },
            transaction
        });
        if (!leaveType) {
            throw new Error("Leave type not found or is currently inactive.");
        }

        // 3. Document attachment check
        if (leaveType.requires_supporting_document && !attachmentPath) {
            throw new Error(`Supporting document is required for applying ${leaveType.name}.`);
        }

        // 4. Overlap check
        const overlap = await this.checkOverlap(employeeId, fromDate, toDate, dayType, excludeRequestId, transaction);
        if (overlap) {
            throw new Error("There is an overlapping leave request already submitted or approved for this date range.");
        }

        // 5. Half-day range validation
        if ((dayType === "First Half" || dayType === "Second Half") && fromDate !== toDate) {
            throw new Error("Half-day leave requests must start and end on the same date.");
        }

        // 6. Sandwich duration & balance calculation
        const company = await db.Company.findByPk(companyId, { transaction });
        const sandwichEnabled = company ? company.sandwich_policy_enabled : false;
        
        const leaveDays = await this.calculateLeaveDays(companyId, fromDate, toDate, dayType, sandwichEnabled);
        if (leaveDays <= 0) {
            throw new Error("No active working days found in the selected date range.");
        }

        // 7. Check balance for Paid leave types
        const leaveYear = fromDate.split("-")[0]; // Use year of leave starting date
        if (leaveType.is_paid) {
            const dynamicRemaining = await this.getDynamicRemainingBalance(companyId, employeeId, leaveTypeId, leaveYear, transaction);
            if (leaveDays > dynamicRemaining) {
                throw new Error(`Insufficient leave balance. Requested: ${leaveDays} days, Available: ${dynamicRemaining} days.`);
            }
        }

        return {
            leaveDays,
            leaveYear,
            leaveType,
            employee
        };
    }
}

module.exports = LeaveValidationService;
