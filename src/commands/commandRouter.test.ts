import { describe, expect, it } from "vitest";

import { routeCommandText } from "./commandRouter";

describe("routeCommandText", () => {
  it("returns help text for /help", () => {
    const response = routeCommandText("/help");

    expect(response.status).toBe("ok");
    expect(response.message).toContain("Meal Logging Bot help");
    expect(response.message).toContain("/addInventory");
    expect(response.message).toContain("/logMeal");
  });

  it("returns an error response for non-command text", () => {
    const response = routeCommandText("hello bot");

    expect(response.status).toBe("error");
    expect(response.data?.code).toBe("not_a_command");
  });

  it("returns an error response for unknown commands", () => {
    const response = routeCommandText("/dance");

    expect(response.status).toBe("error");
    expect(response.data?.code).toBe("unknown_command");
  });

  it("returns placeholder response for recognised but unimplemented commands", () => {
    const response = routeCommandText(
      '/addInventory item_name="red lentils" quantity=500 unit=g'
    );

    expect(response.status).toBe("ok");
    expect(response.message).toContain("recognised but not implemented yet");
    expect(response.data?.command).toBe("addInventory");
    expect(response.data?.implemented).toBe(false);
  });
});