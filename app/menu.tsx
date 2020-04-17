import React from 'react';
import ReactDOM from 'react-dom';

import PageContainer from './components/PageContainer';
import MainActionMenu from './components/MainActionMenu';

ReactDOM.render(
  <PageContainer>
    <MainActionMenu />
  </PageContainer>,
  document.getElementById('app')
);
