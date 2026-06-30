const LEAVE_STATUS = {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled"
};

const TRANSACTION_TYPE = {
    YEARLY_ALLOCATION: "Yearly Allocation",
    MONTHLY_ACCURAL: "Monthly Accrual",
    LEAVE_APPLIED: "Leave Applied",
    LEAVE_APPROVAL: "Leave Approval",
    LEAVE_CANCELLATION: "Leave Cancellation",
    CARRY_FORWARD: "Carry Forward",
    LEAVE_EXPIRY: "Leave Expiry",
    MANUAL_ADJUSTMENT: "Manual Balance Adjustment"
};

const ATTENDANCE_STATUS = {
    PRESENT: "Present",
    PAID_LEAVE: "Paid Leave",
    UNPAID_LEAVE: "Unpaid Leave",
    COMP_OFF: "Comp Off",
    HALF_DAY: "Half Day"
};

const DAY_TYPE = {
    FULL_DAY: "Full Day",
    FIRST_HALF: "First Half",
    SECOND_HALF: "Second Half"
};

const LEAVE_YEAR_TYPE = {
    CALENDAR: "Calendar Year",
    FINANCIAL: "Financial Year",
    ANNIVERSARY: "Joining Anniversary"
};

module.exports = {
    LEAVE_STATUS,
    TRANSACTION_TYPE,
    ATTENDANCE_STATUS,
    DAY_TYPE,
    LEAVE_YEAR_TYPE
};
