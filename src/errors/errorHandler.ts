import type { ErrorRequestHandler } from "express";
import { logger } from "../logger.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  logger.error("Unhandled application error", {
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : "Unknown error",
  });

  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};
