import { useState, useCallback, useRef, useEffect, type ChangeEvent, type FormEvent } from "react";

export type ValidationRule<V> = {
  validate: (value: V, allValues: Record<string, V>) => string | null;
  message: string;
};

export type AsyncValidationRule<V> = {
  validate: (value: V, allValues: Record<string, V>) => Promise<string | null>;
  message: string;
  debounceMs?: number;
};

export type PipedValidator<V> = {
  pipe: ValidationRule<V>[];
  message?: string;
};

type ResolvedFieldConfig<V> = {
  initial: V;
  rules?: ValidationRule<V>[];
  asyncRules?: AsyncValidationRule<V>[];
  piped?: PipedValidator<V>;
};

export type FormFields<V> = Record<string, ResolvedFieldConfig<V>>;

export type FormState<V> = {
  values: Record<string, V>;
  errors: Record<string, string | null>;
  asyncErrors: Record<string, string | null>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  isSubmitting: boolean;
  isValidating: Record<string, boolean>;
  isValid: boolean;
  submitCount: number;
};

export type UseFormReturn<V> = {
  state: FormState<V>;
  bind: (name: string) => {
    value: V;
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onBlur: () => void;
    error: string | null;
    touched: boolean;
    dirty: boolean;
    isValidating: boolean;
  };
  setValue: (name: string, value: V) => void;
  setError: (name: string, message: string | null) => void;
  touch: (...names: string[]) => void;
  reset: (nextValues?: Record<string, V>) => void;
  handleSubmit: (onSubmit: (values: Record<string, V>) => Promise<void> | void) => (e: FormEvent) => void;
  validate: () => boolean;
  validateAsync: () => Promise<boolean>;
  getFieldState: (name: string) => { error: string | null; touched: boolean; dirty: boolean; isValidating: boolean };
};

export function useForm<V>(fields: FormFields<V>): UseFormReturn<V> {
  const initialValues = Object.fromEntries(
    Object.entries(fields).map(([k, c]) => [k, c.initial])
  ) as Record<string, V>;

  const [state, setState] = useState<FormState<V>>({
    values: { ...initialValues },
    errors: {},
    asyncErrors: {},
    touched: {},
    dirty: {},
    isSubmitting: false,
    isValidating: {},
    isValid: true,
    submitCount: 0,
  });

  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const runValidation = useCallback((values: Record<string, V>): Record<string, string | null> => {
    const errs: Record<string, string | null> = {};
    for (const [name, cfg] of Object.entries(fieldsRef.current)) {
      const rule = cfg.rules?.find((r) => r.validate(values[name], values) !== null);
      errs[name] = rule ? rule.message : null;

      if (!errs[name] && cfg.piped) {
        const pipeRule = cfg.piped.pipe.find((r) => r.validate(values[name], values) !== null);
        if (pipeRule) errs[name] = pipeRule.message;
      }
    }
    return errs;
  }, []);

  const runAsyncRule = useCallback(async (name: string, value: V, allValues: Record<string, V>, config: ResolvedFieldConfig<V>): Promise<string | null> => {
    if (!config.asyncRules?.length) return null;
    for (const rule of config.asyncRules) {
      const err = await rule.validate(value, allValues);
      if (err !== null) return rule.message;
    }
    return null;
  }, []);

  const debouncedAsyncValidate = useCallback((name: string, value: V, allValues: Record<string, V>) => {
    const cfg = fieldsRef.current[name];
    if (!cfg?.asyncRules?.length) return;

    if (debounceTimers.current[name]) {
      clearTimeout(debounceTimers.current[name]);
    }

    const maxDebounce = Math.max(...cfg.asyncRules.map((r) => r.debounceMs || 300), 300);

    debounceTimers.current[name] = setTimeout(async () => {
      setState((prev) => ({
        ...prev,
        isValidating: { ...prev.isValidating, [name]: true },
      }));
      const err = await runAsyncRule(name, value, allValues, cfg);
      setState((prev) => ({
        ...prev,
        asyncErrors: { ...prev.asyncErrors, [name]: err },
        isValidating: { ...prev.isValidating, [name]: false },
      }));
    }, maxDebounce);
  }, [runAsyncRule]);

  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  const validateAll = useCallback((): boolean => {
    const errs = runValidation(state.values);
    const hasErrors = Object.values(errs).some(Boolean);
    setState((prev) => ({
      ...prev, errors: errs,
      touched: Object.fromEntries(Object.keys(prev.values).map((k) => [k, true])),
    }));
    return !hasErrors;
  }, [runValidation, state.values]);

  const validateAsync = useCallback(async (): Promise<boolean> => {
    const syncErrs = runValidation(state.values);
    const asyncErrs: Record<string, string | null> = {};
    const validKeys: Record<string, boolean> = {};

    for (const [name, cfg] of Object.entries(fieldsRef.current)) {
      if (cfg.asyncRules?.length) {
        validKeys[name] = true;
      }
    }

    setState((prev) => ({
      ...prev, errors: syncErrs,
      isValidating: { ...prev.isValidating, ...Object.fromEntries(Object.keys(validKeys).map((k) => [k, true])) },
      touched: Object.fromEntries(Object.keys(prev.values).map((k) => [k, true])),
    }));

    for (const [name, cfg] of Object.entries(fieldsRef.current)) {
      if (cfg.asyncRules?.length) {
        asyncErrs[name] = await runAsyncRule(name, state.values[name], state.values, cfg);
      }
    }

    const hasAsyncErrors = Object.values(asyncErrs).some(Boolean);
    const hasSyncErrors = Object.values(syncErrs).some(Boolean);

    setState((prev) => ({
      ...prev,
      asyncErrors: asyncErrs,
      isValidating: Object.fromEntries(Object.keys(validKeys).map((k) => [k, false])),
    }));

    return !hasSyncErrors && !hasAsyncErrors;
  }, [runValidation, runAsyncRule, state.values]);

  const setValue = useCallback((name: string, value: V) => {
    setState((prev) => {
      const next = { ...prev.values, [name]: value };
      const errs = runValidation(next);
      const allErrs = { ...errs };
      return {
        ...prev,
        values: next,
        errors: errs,
        dirty: { ...prev.dirty, [name]: true },
        isValid: !Object.values(allErrs).some(Boolean),
      };
    });
    debouncedAsyncValidate(name, value, { ...state.values, [name]: value });
  }, [runValidation, debouncedAsyncValidate, state.values]);

  const setError = useCallback((name: string, message: string | null) => {
    setState((prev) => ({ ...prev, errors: { ...prev.errors, [name]: message } }));
  }, []);

  const touch = useCallback((...names: string[]) => {
    setState((prev) => ({
      ...prev,
      touched: { ...prev.touched, ...Object.fromEntries(names.map((n) => [n, true])) },
    }));
  }, []);

  const reset = useCallback((nextValues?: Record<string, V>) => {
    setState({
      values: nextValues || { ...initialValues },
      errors: {},
      asyncErrors: {},
      touched: {},
      dirty: {},
      isSubmitting: false,
      isValidating: {},
      isValid: true,
      submitCount: 0,
    });
  }, []);

  const bind = useCallback((name: string) => ({
    value: state.values[name],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = (e.target as HTMLInputElement).type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
      setValue(name, val as unknown as V);
    },
    onBlur: () => touch(name),
    error: state.errors[name] ?? state.asyncErrors[name] ?? null,
    touched: state.touched[name] ?? false,
    dirty: state.dirty[name] ?? false,
    isValidating: state.isValidating[name] ?? false,
  }), [state.values, state.errors, state.asyncErrors, state.touched, state.dirty, state.isValidating, setValue, touch]);

  const handleSubmit = useCallback(
    (onSubmit: (values: Record<string, V>) => Promise<void> | void) =>
      async (e: FormEvent) => {
        e.preventDefault();
        const syncOk = validateAll();
        if (!syncOk) {
          const firstError = Object.entries(state.errors).find(([, v]) => v !== null);
          if (firstError) {
            const el = document.querySelector(`[name="${firstError[0]}"], #input-${firstError[0]}`);
            (el as HTMLElement)?.focus();
          }
          return;
        }
        setState((prev) => ({ ...prev, isSubmitting: true, submitCount: prev.submitCount + 1 }));
        try {
          await onSubmit(state.values);
        } finally {
          setState((prev) => ({ ...prev, isSubmitting: false }));
        }
      },
    [state.values, state.errors, validateAll]
  );

  const getFieldState = useCallback((name: string) => ({
    error: state.errors[name] ?? state.asyncErrors[name] ?? null,
    touched: state.touched[name] ?? false,
    dirty: state.dirty[name] ?? false,
    isValidating: state.isValidating[name] ?? false,
  }), [state.errors, state.asyncErrors, state.touched, state.dirty, state.isValidating]);

  return {
    state, bind, setValue, setError, touch, reset,
    handleSubmit, validate: validateAll, validateAsync,
    getFieldState,
  };
}

export const required = <V,>(msg?: string): ValidationRule<V> => ({
  validate: (v) => (v === undefined || v === null || v === "" ? "" : null),
  message: msg || "Ce champ est requis",
});

export const minLength = <V,>(min: number, msg?: string): ValidationRule<V> => ({
  validate: (v) => (typeof v === "string" && v.length < min ? "" : null),
  message: msg || `Minimum ${min} caractères`,
});

export const maxLength = <V,>(max: number, msg?: string): ValidationRule<V> => ({
  validate: (v) => (typeof v === "string" && v.length > max ? "" : null),
  message: msg || `Maximum ${max} caractères`,
});

export const isEmail = (msg?: string): ValidationRule<string> => ({
  validate: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : ""),
  message: msg || "Email invalide",
});

export const matchField = (field: string, label?: string): ValidationRule<string> => ({
  validate: (v, all) => (v === all[field] ? null : ""),
  message: label ? `Doit correspondre à ${label}` : "Les champs ne correspondent pas",
});

export const hasUpperCase = (min = 1, msg?: string): ValidationRule<string> => ({
  validate: (v) => (typeof v === "string" && (v.match(/[A-Z]/g) || []).length >= min ? null : ""),
  message: msg || `At least ${min} uppercase letter${min > 1 ? "s" : ""}`,
});

export const hasLowerCase = (min = 1, msg?: string): ValidationRule<string> => ({
  validate: (v) => (typeof v === "string" && (v.match(/[a-z]/g) || []).length >= min ? null : ""),
  message: msg || `At least ${min} lowercase letter${min > 1 ? "s" : ""}`,
});

export const hasDigit = (min = 1, msg?: string): ValidationRule<string> => ({
  validate: (v) => (typeof v === "string" && (v.match(/\d/g) || []).length >= min ? null : ""),
  message: msg || `At least ${min} digit${min > 1 ? "s" : ""}`,
});

export const hasSpecial = (min = 1, msg?: string): ValidationRule<string> => ({
  validate: (v) => (typeof v === "string" && (v.match(/[^a-zA-Z0-9]/g) || []).length >= min ? null : ""),
  message: msg || `At least ${min} special character${min > 1 ? "s" : ""}`,
});

export const pattern = (regex: RegExp, msg?: string): ValidationRule<string> => ({
  validate: (v) => (regex.test(v) ? null : ""),
  message: msg || "Invalid format",
});

export const pipe = <V,>(rules: ValidationRule<V>[], msg?: string): PipedValidator<V> => ({
  pipe: rules,
  message: msg,
});
