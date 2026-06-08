import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useForm, required, minLength, isEmail, hasUpperCase, pipe } from "../useForm";
import type { FormFields } from "../useForm";

describe("useForm", () => {
  type V = string;

  it("initializes with default values", () => {
    const fields: FormFields<V> = {
      name: { initial: "", rules: [required("Trop court")] },
      email: { initial: "", rules: [{ validate: (v: V) => v.includes("@") ? null : "", message: "Email invalide" }] },
    };
    const { result } = renderHook(() => useForm(fields));
    expect(result.current.state.values.name).toBe("");
    expect(result.current.state.values.email).toBe("");
  });

  it("validates all fields", () => {
    const fields: FormFields<V> = {
      name: { initial: "", rules: [required("Trop court")] },
      email: { initial: "", rules: [{ validate: (v: V) => v.includes("@") ? null : "", message: "Email invalide" }] },
    };
    const { result } = renderHook(() => useForm(fields));
    let isValid = false;
    act(() => { isValid = result.current.validate(); });
    expect(isValid).toBe(false);
    expect(result.current.state.errors.name).toBeDefined();
    expect(result.current.state.errors.email).toBeDefined();
  });

  it("returns valid=true when all fields pass", () => {
    const fields: FormFields<V> = {
      name: { initial: "Jean", rules: [required()] },
      email: { initial: "jean@test.com", rules: [{ validate: (v: V) => v.includes("@") ? null : "", message: "" }] },
    };
    const { result } = renderHook(() => useForm(fields));
    let isValid = false;
    act(() => { isValid = result.current.validate(); });
    expect(isValid).toBe(true);
  });

  it("tracks dirty state after field change", () => {
    const fields: FormFields<V> = {
      name: { initial: "", rules: [] },
    };
    const { result } = renderHook(() => useForm(fields));
    expect(result.current.state.dirty.name).toBeFalsy();
    act(() => result.current.setValue("name", "Jean"));
    expect(result.current.state.dirty.name).toBe(true);
  });

  it("resets form to initial values", () => {
    const fields: FormFields<V> = {
      name: { initial: "", rules: [] },
    };
    const { result } = renderHook(() => useForm(fields));
    act(() => result.current.setValue("name", "Jean"));
    act(() => result.current.reset());
    expect(result.current.state.values.name).toBe("");
  });

  it("returns touched state", () => {
    const fields: FormFields<V> = {
      name: { initial: "", rules: [] },
    };
    const { result } = renderHook(() => useForm(fields));
    expect(result.current.state.touched.name).toBeFalsy();
    act(() => result.current.touch("name"));
    expect(result.current.state.touched.name).toBe(true);
  });

  it("supports async rules", async () => {
    const fields: FormFields<V> = {
      email: {
        initial: "",
        rules: [],
        asyncRules: [{
          validate: async (v: V) => v.includes("@") ? null : "",
          message: "Email invalide",
          debounceMs: 1,
        }],
      },
    };
    const { result } = renderHook(() => useForm(fields));
    act(() => result.current.setValue("email", "bad"));
    await act(async () => { await result.current.validateAsync(); });
    expect(result.current.state.asyncErrors.email).toBe("Email invalide");
  });

  it("supports piped validators", () => {
    const fields: FormFields<V> = {
      password: {
        initial: "",
        rules: [minLength(8, "Trop court")],
        piped: pipe([hasUpperCase(1, "Majuscule requise")], "Échec"),
      },
    };
    const { result } = renderHook(() => useForm(fields));
    act(() => result.current.setValue("password", "abc"));
    act(() => result.current.validate());
    expect(result.current.state.errors.password).toBe("Trop court");
    act(() => result.current.setValue("password", "abcdefgh"));
    act(() => result.current.validate());
    expect(result.current.state.errors.password).toBe("Majuscule requise");
  });
});
