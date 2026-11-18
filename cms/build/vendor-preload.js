'use strict';

// Preload shared vendor libraries into modules/Core/vendor.js so single-module builds
// (e.g. `npm run mix:auth` or `npm run mix:venue`) always produce a complete, identical vendor bundle.
require('react');
require('react-dom');
require('react-dom/client');
require('react-router-dom');
require('@reduxjs/toolkit');
require('react-redux');
require('axios');
require('dayjs');
require('antd');
