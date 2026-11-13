import { useState, useEffect } from 'react';
import { PromptInput } from './components/PromptInput';
import { ComponentCard } from './components/ComponentCard';
import { useComponentGenerator } from './hooks/useComponentGenerator';
import type { Provider } from './types';
import './App.css';

const PROVIDER_CONFIG = {
  anthropic: { label: 'Anthropic', placeholder: 'sk-ant-...' },
  google: { label: 'Google', placeholder: 'AIza...' },
} as const;

function App() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = useState<Provider>('google');
  const [envKeys, setEnvKeys] = useState<Record<Provider, boolean>>({
    anthropic: false,
    google: false,
  });
  const { components, isLoading, error, generate, removeComponent, clearAll } =
    useComponentGenerator();

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setEnvKeys(data.envKeys))
      .catch(() => {});
  }, []);

  const hasEnvKey = envKeys[provider];

  const handleGenerate = (prompt: string) => {
    if (!apiKey.trim() && !hasEnvKey) {
      alert(`${PROVIDER_CONFIG[provider].label} API 키를 입력하거나 .env에 설정해주세요.`);
      return;
    }
    generate(prompt, apiKey || undefined, provider);
  };

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
    setApiKey('');
  };

  return (
    <div className="app">
      <div className="app-bar">
        <div className="brand"><span aria-hidden="true">▦</span> React Component Generator</div>
        <a href="#runtime" className="settings-link">실행 설정</a>
      </div>

      <main className="main-content">
        <header className="app-header">
          <h1>React 컴포넌트<br />생성기<span aria-hidden="true">.</span></h1>
          <p>만들고 싶은 UI를 설명하세요.<br />생성된 컴포넌트를 실행해 보고 React 코드를 복사할 수 있어요.</p>
        </header>

        <div className="workspace">
          <section className="composer-panel work-window" aria-labelledby="prompt-title">
            <div className="window-bar">
              <span className="window-icon" aria-hidden="true">▤</span>
              <h2 id="prompt-title">프롬프트 편집기</h2>
              <span className="window-grip" aria-hidden="true" />
            </div>
            <PromptInput onGenerate={handleGenerate} isLoading={isLoading} />
          </section>

          <section className="results-section work-window" aria-labelledby="results-title" aria-busy={isLoading}>
            <div className="window-bar window-bar--preview">
              <span className="window-icon" aria-hidden="true">▣</span>
              <h2 id="results-title">생성 결과</h2>
              <span className="window-grip" aria-hidden="true" />
              <span className="result-count">{components.length}개</span>
            </div>

            {error && <p className="error-banner" role="alert">{error}</p>}

            {components.length === 0 && !isLoading && (
              <div className="empty-state">
                <div className="empty-symbol" aria-hidden="true">&lt;/&gt;</div>
                <h3>아직 생성된 컴포넌트가 없어요</h3>
                <p>프롬프트를 입력하거나 예시를 골라 시작하세요.</p>
              </div>
            )}

            {isLoading && (
              <div className="loading-card" role="status">
                <span className="loading-pulse" aria-hidden="true" />
                컴포넌트를 생성하고 있어요…
              </div>
            )}

            {components.length > 0 && (
              <div className="results-toolbar">
                <button className="btn-clear" onClick={clearAll}>전체 삭제</button>
              </div>
            )}

            <div className="results-grid">
              {components.map((component) => (
                <ComponentCard
                  key={component.id}
                  component={component}
                  onRemove={removeComponent}
                  onRegenerate={handleGenerate}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </section>
        </div>

        <section className="settings-panel" id="runtime" aria-labelledby="settings-title">
          <div className="settings-header">
            <h2 id="settings-title">실행 설정</h2>
            <p className={`key-status ${hasEnvKey ? 'key-status--ready' : ''}`}>
              {hasEnvKey ? '.env 키가 연결되어 있습니다.' : 'API 키를 입력하거나 .env에 설정하세요.'}
            </p>
          </div>
          <div className="provider-select">
            <label htmlFor="provider">모델 제공사</label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as Provider)}
            >
              {Object.entries(PROVIDER_CONFIG).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="api-key-input">
            <label htmlFor="api-key">
              API Key
            </label>
            <div className="api-key-field">
              <input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  hasEnvKey
                    ? '서버 키 사용 중'
                    : PROVIDER_CONFIG[provider].placeholder
                }
              />
              <button
                className="btn-toggle-key"
                onClick={() => setShowKey(!showKey)}
                type="button"
              >
                {showKey ? '숨기기' : '보기'}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
