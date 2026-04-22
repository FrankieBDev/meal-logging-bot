import type { ErrorRequestHandler } from "express";
import { logger } from "../logger.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  logger.error("Unhandled application error", {
    error,
  });

  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};