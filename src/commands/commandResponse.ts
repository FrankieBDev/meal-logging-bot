export type CommandResponse = {
  status: "ok" | "error";
  message: string;
  data?: Record<string, unknown>;
};