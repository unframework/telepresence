import React from 'react';
import ReactDOM from 'react-dom';

import PageContainer from './components/PageContainer';
import HomePage from './components/HomePage';

ReactDOM.render(
  <PageContainer>
    <HomePage />
  </PageContainer>,
  document.getElementById('app')
);
