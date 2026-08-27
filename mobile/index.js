if (typeof document !== 'undefined') {
  let viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    document.head.appendChild(viewport);
  }
  viewport.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover');

  const style = document.createElement('style');
  style.setAttribute('data-bragstack-viewport', 'true');
  style.textContent = `
    html, body, #root {
      width: 100%;
      min-width: 0;
      height: 100%;
      min-height: 100%;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
      background: #070B14;
    }
    #root {
      display: flex;
      flex-direction: column;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
  `;
  document.head.appendChild(style);
}

const { registerRootComponent } = require('expo');
const App = require('./App').default;

registerRootComponent(App);
