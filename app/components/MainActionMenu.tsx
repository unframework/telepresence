import React from 'react';

import './MainActionMenu.scss';

const indexUrl = chrome.runtime.getURL('index.html');

function MainActionMenu() {
  return (
    <div className="main-action-menu">
      <a
        href="javascript:void(0)"
        onClick={() => chrome.tabs.create({ url: indexUrl })}
      >
        Home
      </a>
    </div>
  );
}

export default MainActionMenu;
