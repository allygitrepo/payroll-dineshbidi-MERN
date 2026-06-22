const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const routes = require("./routes.index");

const app = express();

app.use(helmet());
app.use(cors());
app.use((req, res, next) => {
    console.log(`[DEBUG] Incoming Request: ${req.method} ${req.originalUrl || req.url}`);
    next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/payroll", routes);

module.exports = app;