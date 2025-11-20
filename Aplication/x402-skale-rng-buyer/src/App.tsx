import { useState, type ChangeEvent, type FormEvent } from "react";
import "./index.css";

type FieldConfig = {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  min?: number;
  max?: number;
};

type FunctionConfig = {
  key: string;
  title: string;
  endpoint: string;
  description: string;
  fields: FieldConfig[];
  valueLabel?: string;
};

const FUNCTION_CONFIGS: FunctionConfig[] = [
  {
    key: "random-word",
    title: "Get Random Word",
    endpoint: "/api/random-word",
    description: "Fetches a random word of the desired length using the SKALE RNG-powered contract.",
    valueLabel: "Random Word",
    fields: [
      {
        name: "wordLength",
        label: "Word Length",
        placeholder: "5",
        defaultValue: "5",
        required: true,
        min: 3,
        max: 8,
      },
    ],
  },
];

export function App() {
  return (
    <div className="page">
      <header className="header">
        <p className="eyebrow">SKALE RNG Playground</p>
        <h1>Paid randomness endpoints, simplified</h1>
        <p className="subheading">
          Trigger live paid requests against the seller service. Provide any required parameters,
          review the responses, and experiment with different inputs without leaving the browser.
        </p>
      </header>

      <section className="card-grid">
        {FUNCTION_CONFIGS.map(config => (
          <FunctionCard key={config.key} config={config} />
        ))}
      </section>
    </div>
  );
}

type FunctionCardProps = {
  config: FunctionConfig;
};

function FunctionCard({ config }: FunctionCardProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    return config.fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.name] = field.defaultValue ?? "";
      return acc;
    }, {});
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [randomValue, setRandomValue] = useState<string | null>(null);

  const hasFields = config.fields.length > 0;

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult("");
    setRandomValue(null);

    for (const field of config.fields) {
      if (field.required) {
        const value = values[field.name]?.trim();
        if (!value) {
          setError(`${field.label} is required`);
          return;
        }

        if (field.name === "wordLength") {
          const parsed = Number(value);
          if (!Number.isInteger(parsed) || parsed < 3 || parsed > 8) {
            setError("Word Length must be an integer between 3 and 8");
            return;
          }
        }
      }
    }

    setLoading(true);

    try {
      const payloadEntries = config.fields.map(field => {
        const value = values[field.name]?.trim();
        return [field.name, value];
      });
      const payload = Object.fromEntries(payloadEntries.filter(([, value]) => value !== "" && value !== undefined));
      const body = hasFields ? JSON.stringify(payload) : undefined;

      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      const raw = await response.text();
      let parsed: unknown = null;

      if (raw) {
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = raw;
        }
      }

      if (!response.ok) {
        const message =
          (parsed && typeof parsed === "object" && "error" in parsed && typeof (parsed as any).error === "string"
            ? (parsed as any).error
            : typeof parsed === "string"
              ? parsed
              : `Request failed with status ${response.status}`);
        setError(message);
        setRandomValue(null);
        return;
      }

      if (parsed && typeof parsed === "object" && "randomValue" in parsed) {
        const value = (parsed as Record<string, unknown>).randomValue;
        if (typeof value === "string" && value.trim().length > 0) {
          setRandomValue(value);
        } else if (typeof value === "number" || typeof value === "bigint") {
          setRandomValue(String(value));
        }
      }

      const formatted =
        typeof parsed === "string"
          ? parsed
          : JSON.stringify(parsed ?? { message: "No content" }, null, 2);
      setResult(formatted);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
      setRandomValue(null);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setValues(() =>
      config.fields.reduce<Record<string, string>>((acc, field) => {
        acc[field.name] = field.defaultValue ?? "";
        return acc;
      }, {})
    );
    setError(null);
    setResult("");
    setRandomValue(null);
  };

  const infoId = `${config.key}-info`;

  return (
    <article className="function-card">
      <div className="card-head">
        <h2>{config.title}</h2>
        <div className="info-tooltip" aria-labelledby={infoId}>
          <span className="info-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
              <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2" fill="none" />
              <line x1="12" y1="10" x2="12" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="7" r="1.5" fill="currentColor" />
            </svg>
          </span>
          <span className="info-text" role="tooltip" id={infoId}>
            {config.description}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="function-form" noValidate>
        {config.fields.length > 0 && (
          <div className="field-grid">
            {config.fields.map(field => (
              <label key={field.name} className="input-group">
                <span>{field.label}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={field.min ?? 0}
                  max={field.max ?? undefined}
                  step="1"
                  name={field.name}
                  value={values[field.name] ?? ""}
                  onChange={onInputChange}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              </label>
            ))}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? (
              <span className="spinner" aria-hidden="true" />
            ) : (
              "Run"
            )}
          </button>
          <button type="button" className="ghost-button" onClick={resetForm} disabled={loading}>
            Reset
          </button>
        </div>
      </form>

      <div className="value-panel" aria-live="polite">
        <span className="value-label">{config.valueLabel ?? "Random Value"}</span>
        {randomValue ? (
          <p className="value-number">{randomValue}</p>
        ) : (
          <p className="value-placeholder">Run the request to view the latest value.</p>
        )}
      </div>

      <div className="result-panel" aria-live="polite">
        {error ? (
          <p className="error-text">{error}</p>
        ) : result ? (
          <pre>{result}</pre>
        ) : (
          <p className="placeholder">Submit the form to view the response.</p>
        )}
      </div>
    </article>
  );
}

export default App;
