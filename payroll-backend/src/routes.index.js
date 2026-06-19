const express = require("express");
const router = express.Router();

router.get("/v1/test", (req, res) => {
    res.json({
        server: "Payroll",
        message: "Connected Successfully",
        status: true,
        code: "SUCCESS",
    });
});

module.exports = router;
