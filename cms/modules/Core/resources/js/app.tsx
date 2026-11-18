import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import { Provider } from 'react-redux';
import { doohTheme } from './configs/theme';
import { store } from './store/store';
import { AppRouter } from './routes/AppRouter';

const App: React.FC = () => (
  <Provider store={store}>
    <ConfigProvider theme={doohTheme}>
      <AppRouter />
    </ConfigProvider>
  </Provider>
);

interface MountableElement extends HTMLElement {
  __reactRoot?: Root;
}

function mount(): void {
  const container = (document.getElementById('app') ||
    document.getElementById('root')) as MountableElement | null;
  if (container && !container.__reactRoot) {
    const root = createRoot(container);
    container.__reactRoot = root;
    root.render(<App />);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    setTimeout(mount, 0);
  }
}

export default App;
